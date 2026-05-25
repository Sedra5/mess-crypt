using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Conversations.DTOs;

namespace MessengerApp.Application.Features.Conversations.Commands.CreateOrGetConversation;

public record CreateOrGetConversationCommand : IRequest<Result<ConversationDto>>
{
    public Guid TargetUserId { get; init; }
}
