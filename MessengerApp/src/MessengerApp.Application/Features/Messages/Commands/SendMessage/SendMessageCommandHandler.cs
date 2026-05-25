using MediatR;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Messages.DTOs;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Messages.Commands.SendMessage;

public class SendMessageCommandHandler
    : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<SendMessageCommandHandler> _logger;

    public SendMessageCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser,
        UserManager<User> userManager,
        ILogger<SendMessageCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<Result<MessageDto>> Handle(
        SendMessageCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;

        // Verify the user is a participant of the conversation
        var isParticipant = await _dbContext.ConversationParticipants
            .AnyAsync(cp =>
                cp.ConversationId == request.ConversationId &&
                cp.UserId == currentUserId,
                cancellationToken);

        if (!isParticipant)
        {
            throw new ForbiddenException("You are not a participant of this conversation.");
        }

        var message = new Message
        {
            ConversationId = request.ConversationId,
            SenderId = currentUserId,
            Ciphertext = request.Ciphertext,
            EncryptedKey = request.EncryptedKey,
            EncryptedKeyForSender = request.EncryptedKeyForSender,
            Iv = request.Iv,
            SentAt = DateTimeOffset.UtcNow
        };

        _dbContext.Messages.Add(message);

        // Update conversation's last message timestamp
        var conversation = await _dbContext.Conversations
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId, cancellationToken);

        if (conversation is not null)
        {
            conversation.LastMessageAt = message.SentAt;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Get sender pseudo for the DTO
        var sender = await _userManager.FindByIdAsync(currentUserId.ToString());

        _logger.LogInformation(
            "Message {MessageId} sent in conversation {ConversationId} by {UserId}",
            message.Id, request.ConversationId, currentUserId);

        return Result<MessageDto>.Ok(new MessageDto
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
            ReadAt = message.ReadAt
        });
    }
}
