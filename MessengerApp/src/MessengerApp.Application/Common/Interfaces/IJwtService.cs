using System.Security.Claims;
using MessengerApp.Domain.Entities;

namespace MessengerApp.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);

    string GenerateRefreshToken();

    ClaimsPrincipal? ValidateExpiredToken(string token);
}
