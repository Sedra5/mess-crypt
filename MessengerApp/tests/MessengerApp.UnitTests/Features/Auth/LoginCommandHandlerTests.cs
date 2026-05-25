using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Commands.Login;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IApplicationDbContext> _dbContextMock;
    private readonly Mock<ILogger<LoginCommandHandler>> _loggerMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _jwtServiceMock = new Mock<IJwtService>();
        _dbContextMock = new Mock<IApplicationDbContext>();
        _loggerMock = new Mock<ILogger<LoginCommandHandler>>();

        var mockSet = new Mock<DbSet<RefreshToken>>();
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(mockSet.Object);
        _dbContextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _handler = new LoginCommandHandler(
            _userManagerMock.Object,
            _jwtServiceMock.Object,
            _dbContextMock.Object,
            _loggerMock.Object);
    }

    private static User CreateTestUser() => new()
    {
        Id = Guid.NewGuid(),
        FirstName = "John",
        LastName = "Doe",
        Pseudo = "johndoe",
        Email = "john@example.com",
        UserName = "johndoe",
        PublicKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."
    };

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsSuccessWithTokens()
    {
        // Arrange
        var user = CreateTestUser();
        var command = new LoginCommand { Email = user.Email!, Password = "StrongP@ss1" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, command.Password))
            .ReturnsAsync(true);
        _jwtServiceMock.Setup(x => x.GenerateAccessToken(user))
            .Returns("test-access-token");
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns("test-refresh-token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("test-access-token");
        result.Data.RefreshToken.Should().Be("test-refresh-token");
        result.Data.User.Id.Should().Be(user.Id);
    }

    [Fact]
    public async Task Handle_UnknownEmail_ReturnsFailResult()
    {
        // Arrange
        var command = new LoginCommand { Email = "unknown@example.com", Password = "test" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Be("Invalid credentials.");
    }

    [Fact]
    public async Task Handle_WrongPassword_ReturnsFailResult()
    {
        // Arrange
        var user = CreateTestUser();
        var command = new LoginCommand { Email = user.Email!, Password = "wrongpassword" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, command.Password))
            .ReturnsAsync(false);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Be("Invalid credentials.");
    }

    [Fact]
    public async Task Handle_WrongPassword_DoesNotLeakUserExistence()
    {
        // Arrange
        var user = CreateTestUser();
        var command = new LoginCommand { Email = user.Email!, Password = "wrongpassword" };
        var unknownCommand = new LoginCommand { Email = "unknown@example.com", Password = "test" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(user.Email!))
            .ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, command.Password))
            .ReturnsAsync(false);
        _userManagerMock.Setup(x => x.FindByEmailAsync(unknownCommand.Email))
            .ReturnsAsync((User?)null);

        // Act
        var wrongPasswordResult = await _handler.Handle(command, CancellationToken.None);
        var unknownEmailResult = await _handler.Handle(unknownCommand, CancellationToken.None);

        // Assert: same error message for both cases (prevents user enumeration)
        wrongPasswordResult.Error.Should().Be(unknownEmailResult.Error);
    }
}
