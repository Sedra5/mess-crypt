using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Auth.Queries.GetDevices;

public record GetDevicesQuery : IRequest<Result<List<DeviceDto>>>
{
    public string CurrentRefreshToken { get; init; } = string.Empty;
}
