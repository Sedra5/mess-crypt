using System.Security.Cryptography;
using System.Text;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly UserManager<User> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IApplicationDbContext _dbContext;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        UserManager<User> userManager,
        IJwtService jwtService,
        IApplicationDbContext dbContext,
        ILogger<LoginCommandHandler> logger)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            _logger.LogWarning("Login attempt with unknown email: {Email}", request.Email);
            return Result<AuthResponse>.Fail("Invalid credentials.");
        }

        var isValidPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValidPassword)
        {
            _logger.LogWarning("Login attempt with invalid password for: {Email}", request.Email);
            return Result<AuthResponse>.Fail("Invalid credentials.");
        }

        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshTokenRaw = _jwtService.GenerateRefreshToken();
        var refreshTokenHash = HashToken(refreshTokenRaw);

        var refreshToken = new Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
            DeviceInfo = request.DeviceInfo,
            IpAddress = request.IpAddress
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User logged in: {Pseudo} ({Email})", user.Pseudo, user.Email);

        return Result<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenRaw,
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
        BirthDate = user.BirthDate,
        PublicKey = user.PublicKey,
        EncryptedPrivateKey = user.EncryptedPrivateKey,
        PinEncryptedPrivateKey = user.PinEncryptedPrivateKey
    };
}
