using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;

namespace MessengerApp.Application.Features.Auth.Commands.Register;

public record RegisterCommand : IRequest<Result<AuthResponse>>
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Pseudo { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public DateOnly BirthDate { get; init; }
    public string Password { get; init; } = string.Empty;
    public string PublicKey { get; init; } = string.Empty;
    public string EncryptedPrivateKey { get; init; } = string.Empty;
}
