using MediatR;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Messages.Commands.MarkAsRead;

public class MarkAsReadCommandHandler
    : IRequestHandler<MarkAsReadCommand, Result<bool>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<MarkAsReadCommandHandler> _logger;

    public MarkAsReadCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser,
        ILogger<MarkAsReadCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(
        MarkAsReadCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;

        var message = await _dbContext.Messages
            .FirstOrDefaultAsync(m =>
                m.Id == request.MessageId &&
                m.ConversationId == request.ConversationId,
                cancellationToken);

        if (message is null)
        {
            throw new NotFoundException("Message", request.MessageId);
        }

        // Only the recipient (non-sender) can mark a message as read
        if (message.SenderId == currentUserId)
        {
            return Result<bool>.Fail("Cannot mark your own message as read.");
        }

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

        if (message.ReadAt is not null)
        {
            return Result<bool>.Ok(true); // Already read
        }

        message.ReadAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Message {MessageId} marked as read by {UserId}",
            request.MessageId, currentUserId);

        return Result<bool>.Ok(true);
    }
}
