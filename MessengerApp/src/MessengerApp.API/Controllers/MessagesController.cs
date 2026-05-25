using MediatR;
using MessengerApp.Application.Features.Messages.Queries.GetMessages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MessengerApp.API.Controllers;

[ApiController]
[Route("api/conversations/{conversationId:guid}/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMediator _mediator;

    public MessagesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMessages(
        [FromRoute] Guid conversationId,
        [FromQuery] DateTimeOffset? before,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMessagesQuery
        {
            ConversationId = conversationId,
            Before = before,
            Limit = limit
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
