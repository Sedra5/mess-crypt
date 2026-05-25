using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Features.Auth.Commands.RevokeDevice;

public class RevokeDeviceCommandHandler : IRequestHandler<RevokeDeviceCommand, Result<bool>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<RevokeDeviceCommandHandler> _logger;

    public RevokeDeviceCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser,
        ILogger<RevokeDeviceCommandHandler> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(RevokeDeviceCommand request, CancellationToken cancellationToken)
    {
        var token = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Id == request.DeviceId && rt.UserId == _currentUser.UserId, cancellationToken);

        if (token == null)
        {
            return Result<bool>.Fail("Device not found.");
        }

        if (!token.IsRevoked)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Device {DeviceId} revoked by user {UserId}", request.DeviceId, _currentUser.UserId);
        }

        return Result<bool>.Ok(true);
    }
}
