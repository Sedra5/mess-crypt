namespace MessengerApp.Application.Features.Conversations.DTOs;

public class ConversationListItemDto
{
    public Guid Id { get; init; }
    public ParticipantDto OtherParticipant { get; init; } = null!;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? LastMessageAt { get; init; }

    public int UnreadCount { get; init; }
}
