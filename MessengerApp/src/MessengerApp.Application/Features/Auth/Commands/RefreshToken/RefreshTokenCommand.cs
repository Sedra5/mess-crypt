using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;

namespace MessengerApp.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand : IRequest<Result<AuthResponse>>
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
}
