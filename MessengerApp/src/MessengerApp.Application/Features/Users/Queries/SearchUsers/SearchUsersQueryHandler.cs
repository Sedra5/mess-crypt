using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;
using MessengerApp.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Features.Users.Queries.SearchUsers;

public class SearchUsersQueryHandler : IRequestHandler<SearchUsersQuery, Result<List<UserDto>>>
{
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserService _currentUser;

    public SearchUsersQueryHandler(
        UserManager<User> userManager,
        ICurrentUserService currentUser)
    {
        _userManager = userManager;
        _currentUser = currentUser;
    }

    public async Task<Result<List<UserDto>>> Handle(
        SearchUsersQuery request,
        CancellationToken cancellationToken)
    {
        var searchTerm = request.SearchTerm.Trim().ToLowerInvariant();

        var users = await _userManager.Users
            .Where(u =>
                u.Id != _currentUser.UserId &&
                (u.Pseudo.ToLower().Contains(searchTerm) ||
                 u.Email!.ToLower().Contains(searchTerm)))
            .Take(20)
            .Select(u => new UserDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Pseudo = u.Pseudo,
                Email = u.Email!,
                BirthDate = u.BirthDate,
                PublicKey = u.PublicKey
            })
            .ToListAsync(cancellationToken);

        return Result<List<UserDto>>.Ok(users);
    }
}
