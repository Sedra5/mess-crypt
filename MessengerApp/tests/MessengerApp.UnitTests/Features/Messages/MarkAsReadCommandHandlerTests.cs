using FluentAssertions;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Messages.Commands.MarkAsRead;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Messages;

public class MarkAsReadCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<ILogger<MarkAsReadCommandHandler>> _loggerMock;
    private readonly MarkAsReadCommandHandler _handler;

    private readonly Guid _currentUserId = Guid.NewGuid();
    private readonly Guid _senderId = Guid.NewGuid();
    private readonly Guid _conversationId = Guid.NewGuid();

    public MarkAsReadCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _currentUserMock = new Mock<ICurrentUserService>();
        _currentUserMock.Setup(x => x.UserId).Returns(_currentUserId);

        _loggerMock = new Mock<ILogger<MarkAsReadCommandHandler>>();

        _handler = new MarkAsReadCommandHandler(
            _dbContext,
            _currentUserMock.Object,
            _loggerMock.Object);
    }

    private async Task<Message> SeedMessageFromOtherUser()
    {
        _dbContext.Users.AddRange(
            new User
            {
                Id = _currentUserId, FirstName = "Me", LastName = "C",
                Pseudo = "me", Email = "me@t.com", UserName = "me", PublicKey = "k0"
            },
            new User
            {
                Id = _senderId, FirstName = "Sender", LastName = "S",
                Pseudo = "sender", Email = "s@t.com", UserName = "sender", PublicKey = "k1"
            });

        var conversation = new Conversation { Id = _conversationId };
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = _currentUserId
        });
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = _senderId
        });

        var message = new Message
        {
            ConversationId = _conversationId,
            SenderId = _senderId,
            Ciphertext = "c", EncryptedKey = "k", Iv = "iv"
        };
        conversation.Messages.Add(message);

        _dbContext.Conversations.Add(conversation);
        await _dbContext.SaveChangesAsync();

        return message;
    }

    [Fact]
    public async Task Handle_ValidRecipient_MarksAsRead()
    {
        // Arrange
        var message = await SeedMessageFromOtherUser();

        var command = new MarkAsReadCommand
        {
            ConversationId = _conversationId,
            MessageId = message.Id
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        var updated = await _dbContext.Messages.FirstAsync(m => m.Id == message.Id);
        updated.ReadAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_SenderTriesToMarkOwnMessage_ReturnsFail()
    {
        // Arrange - current user IS the sender
        _currentUserMock.Setup(x => x.UserId).Returns(_senderId);
        var message = await SeedMessageFromOtherUser();

        var command = new MarkAsReadCommand
        {
            ConversationId = _conversationId,
            MessageId = message.Id
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("own message");
    }

    [Fact]
    public async Task Handle_AlreadyRead_ReturnsOkIdempotent()
    {
        // Arrange
        var message = await SeedMessageFromOtherUser();
        message.ReadAt = DateTimeOffset.UtcNow.AddMinutes(-5);
        await _dbContext.SaveChangesAsync();

        var command = new MarkAsReadCommand
        {
            ConversationId = _conversationId,
            MessageId = message.Id
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_MessageNotFound_ThrowsNotFoundException()
    {
        // Arrange
        await SeedMessageFromOtherUser();

        var command = new MarkAsReadCommand
        {
            ConversationId = _conversationId,
            MessageId = Guid.NewGuid() // non-existent
        };

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
