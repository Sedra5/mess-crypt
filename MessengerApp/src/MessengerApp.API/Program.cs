using MessengerApp.API.Extensions;

using Microsoft.EntityFrameworkCore;
using MessengerApp.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.ConfigurePipeline();

// Apply EF Core migrations automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

app.Run();
