using MediatR;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Features.Conversations.DTOs;

namespace MessengerApp.Application.Features.Conversations.Queries.GetConversations;

public record GetConversationsQuery : IRequest<Result<List<ConversationListItemDto>>>;
