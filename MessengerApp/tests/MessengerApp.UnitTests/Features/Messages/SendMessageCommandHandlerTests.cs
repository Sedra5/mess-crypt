using FluentAssertions;
using MessengerApp.Application.Common.Exceptions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Features.Messages.Commands.SendMessage;
using MessengerApp.Domain.Entities;
using MessengerApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace MessengerApp.UnitTests.Features.Messages;

public class SendMessageCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<ILogger<SendMessageCommandHandler>> _loggerMock;
    private readonly SendMessageCommandHandler _handler;

    private readonly Guid _currentUserId = Guid.NewGuid();
    private readonly Guid _conversationId = Guid.NewGuid();

    public SendMessageCommandHandlerTests()
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

        _loggerMock = new Mock<ILogger<SendMessageCommandHandler>>();

        _handler = new SendMessageCommandHandler(
            _dbContext,
            _currentUserMock.Object,
            _userManagerMock.Object,
            _loggerMock.Object);
    }

    private async Task SeedConversationWithParticipant()
    {
        var currentUser = new User
        {
            Id = _currentUserId, FirstName = "Me", LastName = "C",
            Pseudo = "me", Email = "me@t.com", UserName = "me", PublicKey = "k0"
        };
        var otherUser = new User
        {
            Id = Guid.NewGuid(), FirstName = "Other", LastName = "U",
            Pseudo = "other", Email = "o@t.com", UserName = "other", PublicKey = "k1"
        };
        _dbContext.Users.AddRange(currentUser, otherUser);

        var conversation = new Conversation { Id = _conversationId };
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = _currentUserId
        });
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = otherUser.Id
        });
        _dbContext.Conversations.Add(conversation);
        await _dbContext.SaveChangesAsync();

        _userManagerMock.Setup(x => x.FindByIdAsync(_currentUserId.ToString()))
            .ReturnsAsync(currentUser);
    }

    [Fact]
    public async Task Handle_ValidMessage_PersistsAndReturnsDto()
    {
        // Arrange
        await SeedConversationWithParticipant();

        var command = new SendMessageCommand
        {
            ConversationId = _conversationId,
            Ciphertext = "encrypted-content",
            EncryptedKey = "encrypted-aes-key",
            Iv = "init-vector"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.ConversationId.Should().Be(_conversationId);
        result.Data.SenderId.Should().Be(_currentUserId);
        result.Data.Ciphertext.Should().Be("encrypted-content");
        result.Data.SenderPseudo.Should().Be("me");

        // Verify DB
        var messageInDb = await _dbContext.Messages.FirstAsync();
        messageInDb.Ciphertext.Should().Be("encrypted-content");

        // Verify LastMessageAt was updated
        var conversation = await _dbContext.Conversations.FirstAsync(c => c.Id == _conversationId);
        conversation.LastMessageAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_NonParticipant_ThrowsForbiddenException()
    {
        // Arrange - conversation exists but current user is NOT a participant
        var otherUser = new User
        {
            Id = Guid.NewGuid(), FirstName = "Other", LastName = "U",
            Pseudo = "other", Email = "o@t.com", UserName = "other", PublicKey = "k1"
        };
        _dbContext.Users.Add(otherUser);
        var conversation = new Conversation { Id = _conversationId };
        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = _conversationId, UserId = otherUser.Id
        });
        _dbContext.Conversations.Add(conversation);
        await _dbContext.SaveChangesAsync();

        var command = new SendMessageCommand
        {
            ConversationId = _conversationId,
            Ciphertext = "c", EncryptedKey = "k", Iv = "iv"
        };

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
