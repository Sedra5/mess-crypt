using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Commands.RefreshToken;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Auth;

public class RefreshTokenCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<ILogger<RefreshTokenCommandHandler>> _loggerMock;
    private readonly RefreshTokenCommandHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();
    private readonly string _rawRefreshToken = "test-refresh-token-raw";

    public RefreshTokenCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _jwtServiceMock = new Mock<IJwtService>();
        _loggerMock = new Mock<ILogger<RefreshTokenCommandHandler>>();

        _handler = new RefreshTokenCommandHandler(
            _userManagerMock.Object,
            _jwtServiceMock.Object,
            _dbContext,
            _loggerMock.Object);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    [Fact]
    public async Task Handle_ValidRefreshToken_ReturnsNewTokens()
    {
        // Arrange
        var user = new User
        {
            Id = _userId, FirstName = "Test", LastName = "User",
            Pseudo = "test", Email = "test@test.com", UserName = "test",
            PublicKey = "pk"
        };

        var tokenHash = HashToken(_rawRefreshToken);
        _dbContext.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _dbContext.SaveChangesAsync();

        // Setup mocks
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        }));
        _jwtServiceMock.Setup(x => x.ValidateExpiredToken(It.IsAny<string>())).Returns(claims);
        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>())).Returns("new-access-token");
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("new-refresh-token");
        _userManagerMock.Setup(x => x.FindByIdAsync(_userId.ToString())).ReturnsAsync(user);

        var command = new RefreshTokenCommand
        {
            AccessToken = "expired-access-token",
            RefreshToken = _rawRefreshToken
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.AccessToken.Should().Be("new-access-token");
        result.Data.RefreshToken.Should().Be("new-refresh-token");

        // Old token should be revoked
        var oldToken = await _dbContext.RefreshTokens.FirstAsync(t => t.TokenHash == tokenHash);
        oldToken.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_InvalidAccessToken_ReturnsFail()
    {
        // Arrange
        _jwtServiceMock.Setup(x => x.ValidateExpiredToken(It.IsAny<string>()))
            .Returns((ClaimsPrincipal?)null);

        var command = new RefreshTokenCommand
        {
            AccessToken = "garbage-token",
            RefreshToken = "any-refresh"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Invalid access token");
    }

    [Fact]
    public async Task Handle_RevokedRefreshToken_RevokesAllAndReturnsFail()
    {
        // Arrange
        var tokenHash = HashToken(_rawRefreshToken);
        _dbContext.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
            RevokedAt = DateTimeOffset.UtcNow.AddMinutes(-5) // Already revoked
        });
        // Another active token for the same user
        _dbContext.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            UserId = _userId,
            TokenHash = HashToken("another-token"),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _dbContext.SaveChangesAsync();

        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        }));
        _jwtServiceMock.Setup(x => x.ValidateExpiredToken(It.IsAny<string>())).Returns(claims);

        var command = new RefreshTokenCommand
        {
            AccessToken = "expired-access-token",
            RefreshToken = _rawRefreshToken
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("revoked");

        // All tokens for this user should now be revoked
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == _userId && t.RevokedAt == null)
            .CountAsync();
        activeTokens.Should().Be(0);
    }

    [Fact]
    public async Task Handle_RefreshTokenNotFound_ReturnsFail()
    {
        // Arrange
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        }));
        _jwtServiceMock.Setup(x => x.ValidateExpiredToken(It.IsAny<string>())).Returns(claims);

        var command = new RefreshTokenCommand
        {
            AccessToken = "expired-access-token",
            RefreshToken = "nonexistent-token"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Invalid refresh token");
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
