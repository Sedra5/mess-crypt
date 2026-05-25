using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Commands.RevokeDevice;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Auth;

public class RevokeDeviceCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<ILogger<RevokeDeviceCommandHandler>> _loggerMock;
    private readonly RevokeDeviceCommandHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();

    public RevokeDeviceCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_userId);

        _loggerMock = new Mock<ILogger<RevokeDeviceCommandHandler>>();

        _handler = new RevokeDeviceCommandHandler(_dbContext, _currentUserMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidDevice_RevokesDevice()
    {
        // Arrange
        var deviceId = Guid.NewGuid();
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = deviceId,
            UserId = _userId,
            TokenHash = "hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _dbContext.SaveChangesAsync();

        var command = new RevokeDeviceCommand { DeviceId = deviceId };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();

        var revokedDevice = await _dbContext.RefreshTokens.FirstAsync(t => t.Id == deviceId);
        revokedDevice.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_DeviceNotFoundOrNotOwned_ReturnsFail()
    {
        // Arrange
        var otherUserId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = deviceId,
            UserId = otherUserId,
            TokenHash = "hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _dbContext.SaveChangesAsync();

        var command = new RevokeDeviceCommand { DeviceId = deviceId }; // Tries to revoke other user's device

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Be("Device not found.");
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
