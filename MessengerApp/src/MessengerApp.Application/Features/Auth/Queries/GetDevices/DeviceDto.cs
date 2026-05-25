namespace MessengerApp.Application.Features.Auth.Queries.GetDevices;

public class DeviceDto
{
    public Guid Id { get; init; }
    public string? DeviceInfo { get; init; }
    public string? IpAddress { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset ExpiresAt { get; init; }
    public bool IsCurrentDevice { get; set; }
}
