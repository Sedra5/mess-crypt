using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Auth.Commands.Logout;

public record LogoutCommand : IRequest<Result<bool>>
{
    public string RefreshToken { get; init; } = string.Empty;
}
