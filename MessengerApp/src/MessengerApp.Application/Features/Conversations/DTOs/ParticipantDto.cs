namespace MessengerApp.Application.Features.Conversations.DTOs;

public class ParticipantDto
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Pseudo { get; init; } = string.Empty;
    public string PublicKey { get; init; } = string.Empty;
    public DateTimeOffset? LastSeenAt { get; init; }
}
