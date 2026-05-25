using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Auth.Commands.StorePinBackup;

public record StorePinBackupCommand : IRequest<Result<string>>
{
    public string EncryptedPrivateKey { get; init; } = string.Empty;
    public string Salt { get; init; } = string.Empty;
}
