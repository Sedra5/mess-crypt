using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;

namespace MessengerApp.Application.Features.Users.Commands.UpdateProfile;

public record UpdateProfileCommand : IRequest<Result<UserDto>>
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Pseudo { get; init; } = string.Empty;
}
