using MediatR;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Messages.DTOs;
using MessengerApp.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Features.Messages.Queries.GetMessages;

public class GetMessagesQueryHandler
    : IRequestHandler<GetMessagesQuery, Result<List<MessageDto>>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public GetMessagesQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<List<MessageDto>>> Handle(
        GetMessagesQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;

        // Verify the user is a participant
        var isParticipant = await _dbContext.ConversationParticipants
            .AnyAsync(cp =>
                cp.ConversationId == request.ConversationId &&
                cp.UserId == currentUserId,
                cancellationToken);

        if (!isParticipant)
        {
            throw new ForbiddenException("You are not a participant of this conversation.");
        }

        var limit = Math.Clamp(request.Limit, 1, 100);

        var query = _dbContext.Messages
            .Where(m => m.ConversationId == request.ConversationId);

        if (request.Before.HasValue)
        {
            query = query.Where(m => m.SentAt < request.Before.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(limit)
            .Include(m => m.Sender)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderPseudo = m.Sender.Pseudo,
                Ciphertext = m.Ciphertext,
                EncryptedKey = m.EncryptedKey,
                Iv = m.Iv,
                SentAt = m.SentAt,
                ReadAt = m.ReadAt
            })
            .ToListAsync(cancellationToken);

        // Reverse to chronological order for the client
        messages.Reverse();

        return Result<List<MessageDto>>.Ok(messages);
    }
}
