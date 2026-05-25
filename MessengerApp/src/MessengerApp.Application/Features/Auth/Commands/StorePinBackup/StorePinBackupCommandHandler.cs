using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Auth.Commands.StorePinBackup;

public class StorePinBackupCommandHandler : IRequestHandler<StorePinBackupCommand, Result<string>>
{
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<StorePinBackupCommandHandler> _logger;

    public StorePinBackupCommandHandler(
        UserManager<User> userManager,
        ICurrentUserService currentUser,
        ILogger<StorePinBackupCommandHandler> logger)
    {
        _userManager = userManager;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(StorePinBackupCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId == Guid.Empty)
        {
            return Result<string>.Fail("User not authenticated.");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result<string>.Fail("User not found.");
        }

        // Store the PIN-encrypted private key in a SEPARATE field (not overwriting recovery phrase backup)
        user.PinEncryptedPrivateKey = request.EncryptedPrivateKey;
        
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Failed to store PIN backup for {UserId}: {Errors}", userId, errors);
            return Result<string>.Fail($"Failed to store backup: {errors}");
        }

        _logger.LogInformation("PIN backup stored successfully for user {UserId}", userId);
        return Result<string>.Ok("PIN backup stored successfully.");
    }
}
