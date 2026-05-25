using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Messages.DTOs;

namespace MessengerApp.Application.Features.Messages.Queries.GetMessages;

public record GetMessagesQuery : IRequest<Result<List<MessageDto>>>
{
    public Guid ConversationId { get; init; }

    public DateTimeOffset? Before { get; init; }

    public int Limit { get; init; } = 50;
}
