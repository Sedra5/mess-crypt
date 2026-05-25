using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Messages.Commands.MarkAsRead;

public record MarkAsReadCommand : IRequest<Result<bool>>
{
    public Guid ConversationId { get; init; }
    public Guid MessageId { get; init; }
}
