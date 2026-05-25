using FluentAssertions;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Conversations.Commands.CreateOrGetConversation;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Interfaces;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Conversations;

public class CreateOrGetConversationCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<ILogger<CreateOrGetConversationCommandHandler>> _loggerMock;
    private readonly CreateOrGetConversationCommandHandler _handler;

    private readonly Guid _currentUserId = Guid.NewGuid();
    private readonly Guid _targetUserId = Guid.NewGuid();

    public CreateOrGetConversationCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_currentUserId);

        _loggerMock = new Mock<ILogger<CreateOrGetConversationCommandHandler>>();

        _handler = new CreateOrGetConversationCommandHandler(
            _dbContext,
            _currentUserMock.Object,
            _userManagerMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_NewConversation_CreatesAndReturnsIt()
    {
        // Arrange
        var targetUser = new User
        {
            Id = _targetUserId,
            FirstName = "Alice",
            LastName = "Martin",
            Pseudo = "alice_m",
            Email = "alice@example.com",
            UserName = "alice_m",
            PublicKey = "key-alice"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(_targetUserId.ToString()))
            .ReturnsAsync(targetUser);
        _userManagerMock.Setup(x => x.FindByIdAsync(_currentUserId.ToString()))
            .ReturnsAsync(new User
            {
                Id = _currentUserId,
                FirstName = "Me",
                LastName = "Current",
                Pseudo = "me",
                Email = "me@example.com",
                UserName = "me",
                PublicKey = "key-me"
            });

        // Seed target user into DB for navigation property resolution
        _dbContext.Users.Add(targetUser);
        _dbContext.Users.Add(new User
        {
            Id = _currentUserId,
            FirstName = "Me",
            LastName = "Current",
            Pseudo = "me",
            Email = "me@example.com",
            UserName = "me",
            PublicKey = "key-me"
        });
        await _dbContext.SaveChangesAsync();

        var command = new CreateOrGetConversationCommand { TargetUserId = _targetUserId };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Participants.Should().HaveCount(2);
        result.Data.Participants.Should().Contain(p => p.Id == _currentUserId);
        result.Data.Participants.Should().Contain(p => p.Id == _targetUserId);

        // Verify DB state
        var dbConversation = await _dbContext.Conversations
            .Include(c => c.Participants)
            .FirstAsync();
        dbConversation.Participants.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_ExistingConversation_ReturnsExisting()
    {
        // Arrange - seed an existing conversation
        var currentUser = new User
        {
            Id = _currentUserId, FirstName = "Me", LastName = "C",
            Pseudo = "me", Email = "me@test.com", UserName = "me", PublicKey = "key"
        };
        var targetUser = new User
        {
            Id = _targetUserId, FirstName = "Alice", LastName = "M",
            Pseudo = "alice", Email = "alice@test.com", UserName = "alice", PublicKey = "key2"
        };

        _dbContext.Users.AddRange(currentUser, targetUser);

        var existingConversation = new Conversation();
        existingConversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = existingConversation.Id, UserId = _currentUserId
        });
        existingConversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = existingConversation.Id, UserId = _targetUserId
        });
        _dbContext.Conversations.Add(existingConversation);
        await _dbContext.SaveChangesAsync();

        _userManagerMock.Setup(x => x.FindByIdAsync(_targetUserId.ToString()))
            .ReturnsAsync(targetUser);

        var command = new CreateOrGetConversationCommand { TargetUserId = _targetUserId };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Id.Should().Be(existingConversation.Id);

        // Verify no new conversation was created
        var count = await _dbContext.Conversations.CountAsync();
        count.Should().Be(1);
    }

    [Fact]
    public async Task Handle_SelfConversation_ReturnsFail()
    {
        // Arrange
        var command = new CreateOrGetConversationCommand { TargetUserId = _currentUserId };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("yourself");
    }

    [Fact]
    public async Task Handle_UnknownTargetUser_ThrowsNotFoundException()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var command = new CreateOrGetConversationCommand { TargetUserId = Guid.NewGuid() };

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
