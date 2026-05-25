using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;

namespace MessengerApp.Application.Features.Users.Queries.SearchUsers;

public record SearchUsersQuery : IRequest<Result<List<UserDto>>>
{
    public string SearchTerm { get; init; } = string.Empty;
}
