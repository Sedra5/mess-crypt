using Microsoft.AspNetCore.Identity;

namespace MessengerApp.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Pseudo { get; set; } = string.Empty;

    public DateOnly BirthDate { get; set; }

    public string PublicKey { get; set; } = string.Empty;

    public string? RecoveryKeyHash { get; set; }

    public string EncryptedPrivateKey { get; set; } = string.Empty;

    public string? PinEncryptedPrivateKey { get; set; }

    public DateTimeOffset? LastSeenAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
