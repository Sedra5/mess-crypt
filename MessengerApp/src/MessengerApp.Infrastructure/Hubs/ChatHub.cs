using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Features.Messages.DTOs;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Infrastructure.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IApplicationDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<ChatHub> _logger;
    private readonly StackExchange.Redis.IDatabase _redisDb;

    public ChatHub(
        IApplicationDbContext dbContext,
        UserManager<User> userManager,
        ILogger<ChatHub> logger,
        IServiceProvider serviceProvider)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
        
        var redis = serviceProvider.GetService<StackExchange.Redis.IConnectionMultiplexer>();
        _redisDb = redis?.GetDatabase() ?? throw new InvalidOperationException("Redis is required for ChatHub to scale out.");
    }

    private Guid GetCurrentUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : throw new HubException("Unauthorized.");
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        var userIdStr = userId.ToString();
        bool isFirstConnection = false;
        
        _logger.LogInformation("User {UserId} connected to ChatHub", userIdStr);

        var conversations = await _dbContext.ConversationParticipants
            .Where(cp => cp.UserId == userId)
            .Select(cp => cp.ConversationId)
            .ToListAsync();

        foreach (var convId in conversations)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, convId.ToString());
        }

        var count = await _redisDb.StringIncrementAsync($"MessengerApp:UserConnections:{userIdStr}");
        isFirstConnection = count == 1;
        if (isFirstConnection)
        {
            await _redisDb.SetAddAsync("MessengerApp:OnlineUsers", userIdStr);
        }

        if (isFirstConnection)
        {
            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user != null)
            {
                user.LastSeenAt = null;
                await _userManager.UpdateAsync(user);
            }

            await Clients.Others.SendAsync("UserOnline", userIdStr);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        var userIdStr = userId.ToString();
        bool isLastConnection = false;
        
        _logger.LogInformation("User {UserId} disconnected from ChatHub", userIdStr);

        var count = await _redisDb.StringDecrementAsync($"MessengerApp:UserConnections:{userIdStr}");
        isLastConnection = count <= 0;
        if (isLastConnection)
        {
            await _redisDb.SetRemoveAsync("MessengerApp:OnlineUsers", userIdStr);
            await _redisDb.KeyDeleteAsync($"MessengerApp:UserConnections:{userIdStr}");
        }

        if (isLastConnection)
        {
            var lastSeenAt = DateTimeOffset.UtcNow;
            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user != null)
            {
                user.LastSeenAt = lastSeenAt;
                await _userManager.UpdateAsync(user);
            }

            await Clients.All.SendAsync("UserOffline", userIdStr, lastSeenAt);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<IEnumerable<object>> GetOnlineUsers()
    {
        var onlineUserIds = await _redisDb.SetMembersAsync("MessengerApp:OnlineUsers");
        return onlineUserIds.Select(id => new { Id = Guid.Parse(id!) });
    }

    public async Task JoinConversation(Guid conversationId)
    {
        var userId = GetCurrentUserId();

        var isParticipant = await _dbContext.ConversationParticipants
            .AnyAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId);

        if (!isParticipant)
        {
            throw new HubException("You are not a participant of this conversation.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId.ToString());

        _logger.LogInformation(
            "User {UserId} joined conversation group {ConversationId}",
            userId, conversationId);
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId.ToString());

        _logger.LogInformation(
            "User {UserId} left conversation group {ConversationId}",
            GetCurrentUserId(), conversationId);
    }

    public async Task<MessageDto> SendMessage(
        Guid conversationId,
        string ciphertext,
        string encryptedKey,
        string encryptedKeyForSender,
        string iv)
    {
        var userId = GetCurrentUserId();

        // Verify participant
        var isParticipant = await _dbContext.ConversationParticipants
            .AnyAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId);

        if (!isParticipant)
        {
            throw new HubException("You are not a participant of this conversation.");
        }

        // Persist encrypted message
        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Ciphertext = ciphertext,
            EncryptedKey = encryptedKey,
            EncryptedKeyForSender = encryptedKeyForSender,
            Iv = iv,
            SentAt = DateTimeOffset.UtcNow
        };

        _dbContext.Messages.Add(message);

        // Update conversation last message timestamp
        var conversation = await _dbContext.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation is not null)
        {
            conversation.LastMessageAt = message.SentAt;
        }

        await _dbContext.SaveChangesAsync();

        // Get sender info
        var sender = await _userManager.FindByIdAsync(userId.ToString());

        var messageDto = new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderPseudo = sender?.Pseudo ?? string.Empty,
            Ciphertext = message.Ciphertext,
            EncryptedKey = message.EncryptedKey,
            EncryptedKeyForSender = message.EncryptedKeyForSender,
            Iv = message.Iv,
            SentAt = message.SentAt,
            ReadAt = null
        };

        var messageCount = await _dbContext.Messages
            .CountAsync(m => m.ConversationId == conversationId);

        if (messageCount == 1)
        {
            // Build conversation info for the recipient(s)
            var participants = await _dbContext.ConversationParticipants
                .Where(cp => cp.ConversationId == conversationId)
                .Include(cp => cp.User)
                .ToListAsync();

            // Send personalized NewConversation to each other participant directly
            foreach (var participant in participants.Where(p => p.UserId != userId))
            {
                var senderParticipant = participants.First(p => p.UserId == userId);
                var conversationInfo = new
                {
                    Id = conversationId,
                    CreatedAt = conversation?.CreatedAt ?? DateTimeOffset.UtcNow,
                    LastMessageAt = message.SentAt,
                    OtherParticipant = new
                    {
                        Id = senderParticipant.User.Id,
                        FirstName = senderParticipant.User.FirstName,
                        LastName = senderParticipant.User.LastName,
                        Pseudo = senderParticipant.User.Pseudo,
                        PublicKey = senderParticipant.User.PublicKey
                    },
                    UnreadCount = 1
                };

                await Clients.User(participant.UserId.ToString())
                    .SendAsync("NewConversation", conversationInfo);
                    
                await Clients.User(participant.UserId.ToString())
                    .SendAsync("ReceiveMessage", messageDto);
            }
        }
        else
        {
            // Broadcast to other group members
            await Clients.OthersInGroup(conversationId.ToString())
                .SendAsync("ReceiveMessage", messageDto);
        }

        _logger.LogInformation(
            "Message {MessageId} relayed in conversation {ConversationId}",
            message.Id, conversationId);

        return messageDto;
    }

    public async Task MarkAsRead(Guid conversationId, Guid messageId)
    {
        var userId = GetCurrentUserId();

        var message = await _dbContext.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ConversationId == conversationId);

        if (message is null)
        {
            throw new HubException("Message not found.");
        }

        if (message.SenderId == userId)
        {
            return; // Cannot mark own message as read
        }

        if (message.ReadAt is null)
        {
            message.ReadAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        // Notify the conversation group about the read receipt
        await Clients.Group(conversationId.ToString())
            .SendAsync("MessageRead", new
            {
                ConversationId = conversationId,
                MessageId = messageId,
                ReadAt = message.ReadAt,
                ReadBy = userId
            });
    }

    public async Task Typing(Guid conversationId)
    {
        var userId = GetCurrentUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());

        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("UserTyping", new
            {
                ConversationId = conversationId,
                UserId = userId,
                Pseudo = user?.Pseudo ?? string.Empty
            });
    }

    public async Task StopTyping(Guid conversationId)
    {
        var userId = GetCurrentUserId();

        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("UserStoppedTyping", new
            {
                ConversationId = conversationId,
                UserId = userId
            });
    }

    }