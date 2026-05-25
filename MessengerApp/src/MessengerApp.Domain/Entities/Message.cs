namespace MessengerApp.Domain.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConversationId { get; set; }

    public Guid SenderId { get; set; }

    public string Ciphertext { get; set; } = string.Empty;

    public string EncryptedKey { get; set; } = string.Empty;

    public string EncryptedKeyForSender { get; set; } = string.Empty;

    public string Iv { get; set; } = string.Empty;

    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ReadAt { get; set; }

    // Navigation
    public Conversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
}
