using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Users.Queries.SearchUsers;
using MessengerApp.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace MessengerApp.UnitTests.Features.Users;

public class SearchUsersQueryHandlerTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly SearchUsersQueryHandler _handler;
    private readonly Guid _currentUserId = Guid.NewGuid();

    public SearchUsersQueryHandlerTests()
    {
        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_currentUserId);

        _handler = new SearchUsersQueryHandler(
            _userManagerMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_MatchingPseudo_ReturnsUsers()
    {
        // Arrange
        var targetUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Alice",
            LastName = "Martin",
            Pseudo = "alice_m",
            Email = "alice@example.com",
            PublicKey = "key-alice"
        };

        var currentUser = new User
        {
            Id = _currentUserId,
            FirstName = "Me",
            LastName = "Current",
            Pseudo = "me_current",
            Email = "me@example.com",
            PublicKey = "key-me"
        };

        var users = new List<User> { targetUser, currentUser }.AsQueryable();

        _userManagerMock.Setup(x => x.Users)
            .Returns(new TestAsyncEnumerableEfCore<User>(users));

        var query = new SearchUsersQuery { SearchTerm = "alice" };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].Pseudo.Should().Be("alice_m");
    }

    [Fact]
    public async Task Handle_ExcludesCurrentUser()
    {
        // Arrange
        var currentUser = new User
        {
            Id = _currentUserId,
            FirstName = "Me",
            LastName = "Current",
            Pseudo = "testuser",
            Email = "test@example.com",
            PublicKey = "key-me"
        };

        var users = new List<User> { currentUser }.AsQueryable();

        _userManagerMock.Setup(x => x.Users)
            .Returns(new TestAsyncEnumerableEfCore<User>(users));

        var query = new SearchUsersQuery { SearchTerm = "test" };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_MatchingEmail_ReturnsUsers()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Bob",
            LastName = "Smith",
            Pseudo = "bob_s",
            Email = "bob.smith@example.com",
            PublicKey = "key-bob"
        };

        var users = new List<User> { user }.AsQueryable();

        _userManagerMock.Setup(x => x.Users)
            .Returns(new TestAsyncEnumerableEfCore<User>(users));

        var query = new SearchUsersQuery { SearchTerm = "bob.smith" };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].Email.Should().Be("bob.smith@example.com");
    }
}
