using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;

namespace MessengerApp.Application.Features.Auth.Commands.Login;

public record LoginCommand : IRequest<Result<AuthResponse>>
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string? DeviceInfo { get; init; }
    public string? IpAddress { get; init; }
}
