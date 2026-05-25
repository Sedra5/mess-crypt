using System.Security.Cryptography;
using System.Text;
using MediatR;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Auth.DTOs;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly UserManager<User> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IApplicationDbContext _dbContext;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        UserManager<User> userManager,
        IJwtService jwtService,
        IApplicationDbContext dbContext,
        ILogger<RegisterCommandHandler> logger)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        // Check for existing email
        var existingByEmail = await _userManager.FindByEmailAsync(request.Email);
        if (existingByEmail is not null)
        {
            throw new ConflictException("An account with this email already exists.");
        }

        // Check for existing pseudo
        var existingByPseudo = await _userManager.FindByNameAsync(request.Pseudo);
        if (existingByPseudo is not null)
        {
            throw new ConflictException("This pseudo is already taken.");
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Pseudo = request.Pseudo,
            Email = request.Email,
            UserName = request.Pseudo,
            BirthDate = request.BirthDate,
            PublicKey = request.PublicKey,
            EncryptedPrivateKey = request.EncryptedPrivateKey,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("User creation failed for {Email}: {Errors}", request.Email, errors);
            return Result<AuthResponse>.Fail($"Account creation failed: {errors}");
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
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User registered successfully: {Pseudo} ({Email})", user.Pseudo, user.Email);

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
        EncryptedPrivateKey = user.EncryptedPrivateKey
    };
}
