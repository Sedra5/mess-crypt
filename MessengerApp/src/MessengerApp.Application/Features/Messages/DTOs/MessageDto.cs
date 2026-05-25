namespace MessengerApp.Application.Features.Messages.DTOs;

public class MessageDto
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderPseudo { get; init; } = string.Empty;
    public string Ciphertext { get; init; } = string.Empty;
    public string EncryptedKey { get; init; } = string.Empty;
    public string EncryptedKeyForSender { get; init; } = string.Empty;
    public string Iv { get; init; } = string.Empty;
    public DateTimeOffset SentAt { get; init; }
    public DateTimeOffset? ReadAt { get; init; }
}
