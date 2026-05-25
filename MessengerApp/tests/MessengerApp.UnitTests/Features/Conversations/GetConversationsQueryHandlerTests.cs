using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Conversations.Queries.GetConversations;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace MessengerApp.UnitTests.Features.Conversations;

public class GetConversationsQueryHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly GetConversationsQueryHandler _handler;

    private readonly Guid _currentUserId = Guid.NewGuid();

    public GetConversationsQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_currentUserId);

        _handler = new GetConversationsQueryHandler(_dbContext, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsConversationsOrderedByLastActivity()
    {
        // Arrange
        var otherUser1 = new User
        {
            Id = Guid.NewGuid(), FirstName = "Alice", LastName = "A",
            Pseudo = "alice", Email = "a@t.com", UserName = "alice", PublicKey = "k1"
        };
        var otherUser2 = new User
        {
            Id = Guid.NewGuid(), FirstName = "Bob", LastName = "B",
            Pseudo = "bob", Email = "b@t.com", UserName = "bob", PublicKey = "k2"
        };
        var currentUser = new User
        {
            Id = _currentUserId, FirstName = "Me", LastName = "M",
            Pseudo = "me", Email = "m@t.com", UserName = "me", PublicKey = "k0"
        };

        _dbContext.Users.AddRange(currentUser, otherUser1, otherUser2);

        var conv1 = new Conversation
        {
            LastMessageAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        conv1.Participants.Add(new ConversationParticipant
        {
            ConversationId = conv1.Id, UserId = _currentUserId
        });
        conv1.Participants.Add(new ConversationParticipant
        {
            ConversationId = conv1.Id, UserId = otherUser1.Id
        });

        var conv2 = new Conversation
        {
            LastMessageAt = DateTimeOffset.UtcNow.AddMinutes(-30)
        };
        conv2.Participants.Add(new ConversationParticipant
        {
            ConversationId = conv2.Id, UserId = _currentUserId
        });
        conv2.Participants.Add(new ConversationParticipant
        {
            ConversationId = conv2.Id, UserId = otherUser2.Id
        });

        _dbContext.Conversations.AddRange(conv1, conv2);

        // Add messages to conversations (required by Messages.Any() filter)
        _dbContext.Messages.Add(new Message
        {
            ConversationId = conv1.Id, SenderId = otherUser1.Id,
            Ciphertext = "c1", EncryptedKey = "ek1", Iv = "iv1"
        });
        _dbContext.Messages.Add(new Message
        {
            ConversationId = conv2.Id, SenderId = otherUser2.Id,
            Ciphertext = "c2", EncryptedKey = "ek2", Iv = "iv2"
        });

        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(new GetConversationsQuery(), CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(2);

        // conv2 is more recent, should be first
        result.Data![0].Id.Should().Be(conv2.Id);
        result.Data[1].Id.Should().Be(conv1.Id);

        // Other participant info is populated
        result.Data[0].OtherParticipant.Pseudo.Should().Be("bob");
        result.Data[1].OtherParticipant.Pseudo.Should().Be("alice");
    }

    [Fact]
    public async Task Handle_NoConversations_ReturnsEmptyList()
    {
        // Arrange - no conversations seeded

        // Act
        var result = await _handler.Handle(new GetConversationsQuery(), CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_IncludesUnreadCount()
    {
        // Arrange
        var otherUser = new User
        {
            Id = Guid.NewGuid(), FirstName = "Alice", LastName = "A",
            Pseudo = "alice", Email = "a@t.com", UserName = "alice", PublicKey = "k1"
        };
        var currentUser = new User
        {
            Id = _currentUserId, FirstName = "Me", LastName = "M",
            Pseudo = "me", Email = "m@t.com", UserName = "me", PublicKey = "k0"
        };
        _dbContext.Users.AddRange(currentUser, otherUser);

        var conv = new Conversation { LastMessageAt = DateTimeOffset.UtcNow };
        conv.Participants.Add(new ConversationParticipant
        {
            ConversationId = conv.Id, UserId = _currentUserId
        });
        conv.Participants.Add(new ConversationParticipant
        {
            ConversationId = conv.Id, UserId = otherUser.Id
        });

        // 3 messages from the other user, 1 read, 2 unread
        conv.Messages.Add(new Message
        {
            ConversationId = conv.Id, SenderId = otherUser.Id,
            Ciphertext = "c1", EncryptedKey = "ek1", Iv = "iv1",
            ReadAt = DateTimeOffset.UtcNow
        });
        conv.Messages.Add(new Message
        {
            ConversationId = conv.Id, SenderId = otherUser.Id,
            Ciphertext = "c2", EncryptedKey = "ek2", Iv = "iv2"
        });
        conv.Messages.Add(new Message
        {
            ConversationId = conv.Id, SenderId = otherUser.Id,
            Ciphertext = "c3", EncryptedKey = "ek3", Iv = "iv3"
        });

        // 1 message from current user (should not count as unread)
        conv.Messages.Add(new Message
        {
            ConversationId = conv.Id, SenderId = _currentUserId,
            Ciphertext = "c4", EncryptedKey = "ek4", Iv = "iv4"
        });

        _dbContext.Conversations.Add(conv);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(new GetConversationsQuery(), CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].UnreadCount.Should().Be(2);
    }

    [Fact]
    public async Task Handle_EmptyConversation_NotReturned()
    {
        // Arrange - create a conversation with NO messages
        var otherUser = new User
        {
            Id = Guid.NewGuid(), FirstName = "Ghost", LastName = "G",
            Pseudo = "ghost", Email = "g@t.com", UserName = "ghost", PublicKey = "kg"
        };
        var currentUser = new User
        {
            Id = _currentUserId, FirstName = "Me", LastName = "M",
            Pseudo = "me", Email = "m@t.com", UserName = "me", PublicKey = "k0"
        };
        _dbContext.Users.AddRange(currentUser, otherUser);

        var emptyConv = new Conversation { CreatedAt = DateTimeOffset.UtcNow };
        emptyConv.Participants.Add(new ConversationParticipant
        {
            ConversationId = emptyConv.Id, UserId = _currentUserId
        });
        emptyConv.Participants.Add(new ConversationParticipant
        {
            ConversationId = emptyConv.Id, UserId = otherUser.Id
        });
        _dbContext.Conversations.Add(emptyConv);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(new GetConversationsQuery(), CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeEmpty(); // Empty conversation should NOT be returned
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
