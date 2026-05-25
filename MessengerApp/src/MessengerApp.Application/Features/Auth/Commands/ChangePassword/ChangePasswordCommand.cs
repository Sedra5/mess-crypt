using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Auth.Commands.ChangePassword;

public record ChangePasswordCommand : IRequest<Result<bool>>
{
    public string CurrentPassword { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}
