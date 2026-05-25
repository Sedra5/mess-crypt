namespace MessengerApp.Application.Features.Conversations.DTOs;

public class ConversationDto
{
    public Guid Id { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? LastMessageAt { get; init; }
    public List<ParticipantDto> Participants { get; init; } = new();
}
