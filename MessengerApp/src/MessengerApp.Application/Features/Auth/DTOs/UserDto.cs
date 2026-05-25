namespace MessengerApp.Application.Features.Auth.DTOs;

public class UserDto
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Pseudo { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public DateOnly BirthDate { get; init; }
    public string PublicKey { get; init; } = string.Empty;
    public string EncryptedPrivateKey { get; init; } = string.Empty;
    public string? PinEncryptedPrivateKey { get; init; }
    public DateTimeOffset? LastSeenAt { get; init; }
}
