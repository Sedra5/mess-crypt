using System.Security.Claims;
using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Commands.StorePinBackup;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Auth;

public class StorePinBackupCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<ILogger<StorePinBackupCommandHandler>> _loggerMock;
    private readonly StorePinBackupCommandHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();

    public StorePinBackupCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_userId);

        _loggerMock = new Mock<ILogger<StorePinBackupCommandHandler>>();

        _handler = new StorePinBackupCommandHandler(
            _userManagerMock.Object,
            _currentUserMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_StoresPinBackup()
    {
        // Arrange
        var user = new User
        {
            Id = _userId,
            UserName = "test",
            Email = "test@test.com",
            PinEncryptedPrivateKey = null
        };
        
        _userManagerMock.Setup(x => x.FindByIdAsync(_userId.ToString()))
            .ReturnsAsync(user);
        
        _userManagerMock.Setup(x => x.UpdateAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        var command = new StorePinBackupCommand
        {
            EncryptedPrivateKey = "new-pin-encrypted-key",
            Salt = "salt"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        user.PinEncryptedPrivateKey.Should().Be("new-pin-encrypted-key");
        _userManagerMock.Verify(x => x.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFail()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync(_userId.ToString()))
            .ReturnsAsync((User?)null);

        var command = new StorePinBackupCommand
        {
            EncryptedPrivateKey = "new-pin-encrypted-key",
            Salt = "salt"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Be("User not found.");
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
