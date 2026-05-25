using FluentAssertions;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Auth.Commands.Register;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Auth;

public class RegisterCommandHandlerTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IApplicationDbContext> _dbContextMock;
    private readonly Mock<ILogger<RegisterCommandHandler>> _loggerMock;
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _jwtServiceMock = new Mock<IJwtService>();
        _dbContextMock = new Mock<IApplicationDbContext>();
        _loggerMock = new Mock<ILogger<RegisterCommandHandler>>();

        // Setup RefreshTokens DbSet mock
        var refreshTokens = new List<RefreshToken>().AsQueryable();
        var mockSet = new Mock<DbSet<RefreshToken>>();
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(mockSet.Object);
        _dbContextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _handler = new RegisterCommandHandler(
            _userManagerMock.Object,
            _jwtServiceMock.Object,
            _dbContextMock.Object,
            _loggerMock.Object);
    }

    private static RegisterCommand CreateValidCommand() => new()
    {
        FirstName = "John",
        LastName = "Doe",
        Pseudo = "johndoe",
        Email = "john@example.com",
        BirthDate = new DateOnly(2000, 1, 1),
        Password = "StrongP@ss1",
        PublicKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."
    };

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessWithTokens()
    {
        // Arrange
        var command = CreateValidCommand();

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync((User?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(command.Pseudo))
            .ReturnsAsync((User?)null);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), command.Password))
            .ReturnsAsync(IdentityResult.Success);

        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>()))
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
        result.Data.User.Should().NotBeNull();
        result.Data.User.Email.Should().Be(command.Email);
        result.Data.User.Pseudo.Should().Be(command.Pseudo);
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ThrowsConflictException()
    {
        // Arrange
        var command = CreateValidCommand();
        var existingUser = new User { Email = command.Email };

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync(existingUser);

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*email*");
    }

    [Fact]
    public async Task Handle_DuplicatePseudo_ThrowsConflictException()
    {
        // Arrange
        var command = CreateValidCommand();
        var existingUser = new User { UserName = command.Pseudo };

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync((User?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(command.Pseudo))
            .ReturnsAsync(existingUser);

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*pseudo*");
    }

    [Fact]
    public async Task Handle_IdentityFailure_ReturnsFailResult()
    {
        // Arrange
        var command = CreateValidCommand();

        _userManagerMock.Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync((User?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(command.Pseudo))
            .ReturnsAsync((User?)null);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), command.Password))
            .ReturnsAsync(IdentityResult.Failed(
                new IdentityError { Description = "Password too weak" }));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Password too weak");
    }
}
