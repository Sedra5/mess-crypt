using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Messages.DTOs;

namespace MessengerApp.Application.Features.Messages.Commands.SendMessage;

public record SendMessageCommand : IRequest<Result<MessageDto>>
{
    public Guid ConversationId { get; init; }
    public string Ciphertext { get; init; } = string.Empty;
    public string EncryptedKey { get; init; } = string.Empty;
    public string EncryptedKeyForSender { get; init; } = string.Empty;
    public string Iv { get; init; } = string.Empty;
}
