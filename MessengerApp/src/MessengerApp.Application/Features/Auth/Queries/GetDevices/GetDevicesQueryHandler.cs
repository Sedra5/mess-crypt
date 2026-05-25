using System.Security.Cryptography;
using System.Text;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Features.Auth.Queries.GetDevices;

public class GetDevicesQueryHandler : IRequestHandler<GetDevicesQuery, Result<List<DeviceDto>>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public GetDevicesQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<Result<List<DeviceDto>>> Handle(GetDevicesQuery request, CancellationToken cancellationToken)
    {
        var currentTokenHash = string.IsNullOrEmpty(request.CurrentRefreshToken) 
            ? string.Empty 
            : HashToken(request.CurrentRefreshToken);

        var tokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == _currentUser.UserId && rt.RevokedAt == null && rt.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(rt => rt.CreatedAt)
            .Select(rt => new DeviceDto
            {
                Id = rt.Id,
                DeviceInfo = rt.DeviceInfo ?? "Unknown Device",
                IpAddress = rt.IpAddress ?? "Unknown IP",
                CreatedAt = rt.CreatedAt,
                ExpiresAt = rt.ExpiresAt,
                IsCurrentDevice = rt.TokenHash == currentTokenHash
            })
            .ToListAsync(cancellationToken);

        return Result<List<DeviceDto>>.Ok(tokens);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
