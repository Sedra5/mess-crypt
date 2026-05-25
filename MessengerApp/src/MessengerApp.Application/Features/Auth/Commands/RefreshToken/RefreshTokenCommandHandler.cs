using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler
    : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly UserManager<User> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IApplicationDbContext _dbContext;
    private readonly ILogger<RefreshTokenCommandHandler> _logger;

    public RefreshTokenCommandHandler(
        UserManager<User> userManager,
        IJwtService jwtService,
        IApplicationDbContext dbContext,
        ILogger<RefreshTokenCommandHandler> logger)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        // Extract user ID from expired access token
        var principal = _jwtService.ValidateExpiredToken(request.AccessToken);
        if (principal is null)
        {
            return Result<AuthResponse>.Fail("Invalid access token.");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Result<AuthResponse>.Fail("Invalid access token claims.");
        }

        // Find the refresh token
        var incomingHash = HashToken(request.RefreshToken);
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(
                t => t.TokenHash == incomingHash && t.UserId == userId,
                cancellationToken);

        if (storedToken is null)
        {
            _logger.LogWarning("Refresh token not found for user {UserId}. Possible token reuse.", userId);
            return Result<AuthResponse>.Fail("Invalid refresh token.");
        }

        if (!storedToken.IsActive)
        {
            // Potential token theft: revoke all tokens for this user
            _logger.LogWarning(
                "Inactive refresh token used for user {UserId}. Revoking all tokens.",
                userId);

            var allTokens = await _dbContext.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in allTokens)
            {
                token.RevokedAt = DateTimeOffset.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result<AuthResponse>.Fail("Token has been revoked. Please log in again.");
        }

        // Rotate: revoke old, issue new
        var newRefreshTokenRaw = _jwtService.GenerateRefreshToken();
        var newRefreshTokenHash = HashToken(newRefreshTokenRaw);

        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        storedToken.ReplacedByTokenHash = newRefreshTokenHash;

        var newRefreshToken = new Domain.Entities.RefreshToken
        {
            UserId = userId,
            TokenHash = newRefreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.RefreshTokens.Add(newRefreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Generate new access token
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result<AuthResponse>.Fail("User not found.");
        }

        var accessToken = _jwtService.GenerateAccessToken(user);

        _logger.LogInformation("Token refreshed for user {Pseudo}", user.Pseudo);

        return Result<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshTokenRaw,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
            User = MapToDto(user)
        });
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Pseudo = user.Pseudo,
        Email = user.Email!,
        PublicKey = user.PublicKey
    };
}
