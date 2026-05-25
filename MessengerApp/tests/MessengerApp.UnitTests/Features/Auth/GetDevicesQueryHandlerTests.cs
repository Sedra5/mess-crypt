using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Queries.GetDevices;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Cryptography;
using System.Text;

namespace MessengerApp.UnitTests.Features.Auth;

public class GetDevicesQueryHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly GetDevicesQueryHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();

    public GetDevicesQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_userId);

        _handler = new GetDevicesQueryHandler(_dbContext, _currentUserMock.Object);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    [Fact]
    public async Task Handle_ReturnsActiveDevicesWithIpAndMarksCurrent()
    {
        // Arrange
        var currentTokenRaw = "current-refresh-token";
        var currentTokenHash = HashToken(currentTokenRaw);
        var otherTokenHash = HashToken("other-refresh-token");

        // Current device
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = _userId,
            TokenHash = currentTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
            DeviceInfo = "Chrome / Windows 11",
            IpAddress = "192.168.1.100"
        });

        // Other active device
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = _userId,
            TokenHash = otherTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(3),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-4),
            DeviceInfo = "Safari / iOS",
            IpAddress = "10.0.0.5"
        });

        // Revoked device (should not be returned)
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = _userId,
            TokenHash = HashToken("revoked"),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
            RevokedAt = DateTimeOffset.UtcNow,
            DeviceInfo = "Firefox",
            IpAddress = "1.1.1.1"
        });

        // Expired device (should not be returned)
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = _userId,
            TokenHash = HashToken("expired"),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-10),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-10),
            DeviceInfo = "Edge",
            IpAddress = "8.8.8.8"
        });

        await _dbContext.SaveChangesAsync();

        var query = new GetDevicesQuery { CurrentRefreshToken = currentTokenRaw };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Count.Should().Be(2);

        // Should be ordered by descending CreatedAt
        var currentDevice = result.Data.First();
        currentDevice.DeviceInfo.Should().Be("Chrome / Windows 11");
        currentDevice.IpAddress.Should().Be("192.168.1.100");
        currentDevice.IsCurrentDevice.Should().BeTrue();

        var otherDevice = result.Data.Last();
        otherDevice.DeviceInfo.Should().Be("Safari / iOS");
        otherDevice.IpAddress.Should().Be("10.0.0.5");
        otherDevice.IsCurrentDevice.Should().BeFalse();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
