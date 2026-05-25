namespace MessengerApp.Application.Features.Auth.DTOs;

public class AuthResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; init; }
    public UserDto User { get; init; } = null!;
}
