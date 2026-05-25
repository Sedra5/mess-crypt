using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Conversations.DTOs;
using MessengerApp.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Features.Conversations.Queries.GetConversations;

public class GetConversationsQueryHandler
    : IRequestHandler<GetConversationsQuery, Result<List<ConversationListItemDto>>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public GetConversationsQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<List<ConversationListItemDto>>> Handle(
        GetConversationsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;

        var conversations = await _dbContext.ConversationParticipants
            .Where(cp => cp.UserId == currentUserId)
            .Select(cp => cp.Conversation)
            .Where(c => c.Messages.Any()) // Only show conversations that have at least one message
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .Select(c => new ConversationListItemDto
            {
                Id = c.Id,
                CreatedAt = c.CreatedAt,
                LastMessageAt = c.LastMessageAt,
                OtherParticipant = c.Participants
                    .Where(p => p.UserId != currentUserId)
                    .Select(p => new ParticipantDto
                    {
                        Id = p.User.Id,
                        FirstName = p.User.FirstName,
                        LastName = p.User.LastName,
                        Pseudo = p.User.Pseudo,
                        PublicKey = p.User.PublicKey,
                        LastSeenAt = p.User.LastSeenAt
                    })
                    .First(),
                UnreadCount = c.Messages
                    .Count(m => m.SenderId != currentUserId && m.ReadAt == null)
            })
            .ToListAsync(cancellationToken);

        return Result<List<ConversationListItemDto>>.Ok(conversations);
    }
}
