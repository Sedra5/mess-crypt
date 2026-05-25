using MediatR;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Conversations.DTOs;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Conversations.Commands.CreateOrGetConversation;

public class CreateOrGetConversationCommandHandler
    : IRequestHandler<CreateOrGetConversationCommand, Result<ConversationDto>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<CreateOrGetConversationCommandHandler> _logger;

    public CreateOrGetConversationCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser,
        UserManager<User> userManager,
        ILogger<CreateOrGetConversationCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<Result<ConversationDto>> Handle(
        CreateOrGetConversationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;

        if (request.TargetUserId == currentUserId)
        {
            return Result<ConversationDto>.Fail("Cannot start a conversation with yourself.");
        }

        // Verify target user exists
        var targetUser = await _userManager.FindByIdAsync(request.TargetUserId.ToString());
        if (targetUser is null)
        {
            throw new NotFoundException(nameof(User), request.TargetUserId);
        }

        // Look for an existing conversation between the two users
        var existingConversation = await _dbContext.Conversations
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Where(c => c.Participants.Count == 2)
            .Where(c => c.Participants.Any(p => p.UserId == currentUserId))
            .Where(c => c.Participants.Any(p => p.UserId == request.TargetUserId))
            .FirstOrDefaultAsync(cancellationToken);

        if (existingConversation is not null)
        {
            _logger.LogInformation(
                "Returning existing conversation {ConversationId} between {User1} and {User2}",
                existingConversation.Id, currentUserId, request.TargetUserId);

            return Result<ConversationDto>.Ok(MapToDto(existingConversation));
        }

        // Create new conversation
        var currentUser = await _userManager.FindByIdAsync(currentUserId.ToString());

        var conversation = new Conversation
        {
            CreatedAt = DateTimeOffset.UtcNow
        };

        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = currentUserId,
            JoinedAt = DateTimeOffset.UtcNow
        });

        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = request.TargetUserId,
            JoinedAt = DateTimeOffset.UtcNow
        });

        _dbContext.Conversations.Add(conversation);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created conversation {ConversationId} between {User1} and {User2}",
            conversation.Id, currentUserId, request.TargetUserId);

        // Reload with navigation properties
        var created = await _dbContext.Conversations
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .FirstAsync(c => c.Id == conversation.Id, cancellationToken);

        return Result<ConversationDto>.Ok(MapToDto(created));
    }

    private static ConversationDto MapToDto(Conversation conversation) => new()
    {
        Id = conversation.Id,
        CreatedAt = conversation.CreatedAt,
        LastMessageAt = conversation.LastMessageAt,
        Participants = conversation.Participants
            .Select(p => new ParticipantDto
            {
                Id = p.User.Id,
                FirstName = p.User.FirstName,
                LastName = p.User.LastName,
                Pseudo = p.User.Pseudo,
                PublicKey = p.User.PublicKey,
                LastSeenAt = p.User.LastSeenAt
            })
            .ToList()
    };
}
