using FluentAssertions;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Messages.Queries.GetMessages;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace MessengerApp.UnitTests.Features.Messages;

public class GetMessagesQueryHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly GetMessagesQueryHandler _handler;

    private readonly Guid _currentUserId = Guid.NewGuid();
    private readonly Guid _conversationId = Guid.NewGuid();

    public GetMessagesQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_currentUserId);

        _handler = new GetMessagesQueryHandler(_dbContext, _currentUserMock.Object);
    }

    private async Task SeedConversationWithMessages(int messageCount)
    {
        var sender = new User
        {
            Id = Guid.NewGuid(), FirstName = "Sender", LastName = "S",
            Pseudo = "sender", Email = "s@t.com", UserName = "sender", PublicKey = "k1"
        };
        var currentUser = new User
        {
            Id = _currentUserId, FirstName = "Me", LastName = "M",
            Pseudo = "me", Email = "m@t.com", UserName = "me", PublicKey = "k0"
        };
        _dbContext.Users.AddRange(currentUser, sender);

        var conversation = new Conversation { Id = _conversationId };
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = _currentUserId
        });
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = sender.Id
        });

        for (int i = 0; i < messageCount; i++)
        {
            conversation.Messages.Add(new Message
            {
                ConversationId = _conversationId,
                SenderId = sender.Id,
                Ciphertext = $"cipher-{i}",
                EncryptedKey = $"key-{i}",
                Iv = $"iv-{i}",
                SentAt = DateTimeOffset.UtcNow.AddMinutes(-messageCount + i)
            });
        }

        _dbContext.Conversations.Add(conversation);
        await _dbContext.SaveChangesAsync();
    }

    [Fact]
    public async Task Handle_ReturnsMessagesInChronologicalOrder()
    {
        // Arrange
        await SeedConversationWithMessages(5);

        var query = new GetMessagesQuery
        {
            ConversationId = _conversationId,
            Limit = 50
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(5);

        // Verify chronological order (oldest first)
        for (int i = 1; i < result.Data!.Count; i++)
        {
            result.Data[i].SentAt.Should().BeOnOrAfter(result.Data[i - 1].SentAt);
        }
    }

    [Fact]
    public async Task Handle_RespectsLimit()
    {
        // Arrange
        await SeedConversationWithMessages(10);

        var query = new GetMessagesQuery
        {
            ConversationId = _conversationId,
            Limit = 3
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Data.Should().HaveCount(3);
    }

    [Fact]
    public async Task Handle_CursorPagination_ReturnsOlderMessages()
    {
        // Arrange
        await SeedConversationWithMessages(10);
        var cursor = DateTimeOffset.UtcNow.AddMinutes(-5);

        var query = new GetMessagesQuery
        {
            ConversationId = _conversationId,
            Before = cursor,
            Limit = 50
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Should().AllSatisfy(m =>
            m.SentAt.Should().BeBefore(cursor));
    }

    [Fact]
    public async Task Handle_NonParticipant_ThrowsForbiddenException()
    {
        // Arrange - conversation exists but user is not a participant
        var otherUser = new User
        {
            Id = Guid.NewGuid(), FirstName = "A", LastName = "B",
            Pseudo = "ab", Email = "ab@t.com", UserName = "ab", PublicKey = "k"
        };
        _dbContext.Users.Add(otherUser);

        var conversation = new Conversation { Id = _conversationId };
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = otherUser.Id
        });
        _dbContext.Conversations.Add(conversation);
        await _dbContext.SaveChangesAsync();

        var query = new GetMessagesQuery
        {
            ConversationId = _conversationId,
            Limit = 50
        };

        // Act & Assert
        await _handler.Invoking(h => h.Handle(query, CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
