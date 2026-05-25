using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Auth.Commands.RevokeDevice;

public record RevokeDeviceCommand : IRequest<Result<bool>>
{
    public Guid DeviceId { get; init; }
}
