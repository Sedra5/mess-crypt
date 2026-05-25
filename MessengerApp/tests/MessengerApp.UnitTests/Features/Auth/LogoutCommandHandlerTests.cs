using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Commands.Logout;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Auth;

public class LogoutCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<ILogger<LogoutCommandHandler>> _loggerMock;
    private readonly LogoutCommandHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();

    public LogoutCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_userId);

        _loggerMock = new Mock<ILogger<LogoutCommandHandler>>();

        _handler = new LogoutCommandHandler(
            _dbContext,
            _currentUserMock.Object,
            _loggerMock.Object);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    [Fact]
    public async Task Handle_ValidToken_RevokesRefreshToken()
    {
        // Arrange
        var rawToken = "valid-refresh-token";
        var tokenHash = HashToken(rawToken);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _dbContext.SaveChangesAsync();

        var command = new LogoutCommand { RefreshToken = rawToken };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();

        var revokedToken = await _dbContext.RefreshTokens.FirstAsync(t => t.TokenHash == tokenHash);
        revokedToken.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_NonExistentToken_StillReturnsSuccess()
    {
        // Arrange - no token seeded
        var command = new LogoutCommand { RefreshToken = "nonexistent-token" };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert - logout should always succeed to avoid revealing token existence
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_AlreadyRevokedToken_ReturnsSuccess()
    {
        // Arrange
        var rawToken = "already-revoked-token";
        var tokenHash = HashToken(rawToken);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
            RevokedAt = DateTimeOffset.UtcNow.AddMinutes(-10) // Already revoked
        });
        await _dbContext.SaveChangesAsync();

        var command = new LogoutCommand { RefreshToken = rawToken };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
