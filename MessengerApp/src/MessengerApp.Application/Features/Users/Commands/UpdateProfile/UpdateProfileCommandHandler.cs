using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;
using MessengerApp.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace MessengerApp.Application.Features.Users.Commands.UpdateProfile;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserDto>>
{
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserService _currentUser;

    public UpdateProfileCommandHandler(
        UserManager<User> userManager,
        ICurrentUserService currentUser)
    {
        _userManager = userManager;
        _currentUser = currentUser;
    }

    public async Task<Result<UserDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(_currentUser.UserId.ToString());
        
        if (user == null)
        {
            return Result<UserDto>.Fail("User not found.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        
        // If pseudo changes, update username as well
        if (user.Pseudo != request.Pseudo)
        {
            // Check if pseudo is already taken
            var existingUser = await _userManager.FindByNameAsync(request.Pseudo);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return Result<UserDto>.Fail("Pseudo is already taken.");
            }
            
            user.Pseudo = request.Pseudo;
            user.UserName = request.Pseudo;
        }

        var updateResult = await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            return Result<UserDto>.Fail($"Failed to update profile: {errors}");
        }

        var dto = new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Pseudo = user.Pseudo,
            Email = user.Email!,
            PublicKey = user.PublicKey,
            EncryptedPrivateKey = user.EncryptedPrivateKey
        };

        return Result<UserDto>.Ok(dto);
    }
}
