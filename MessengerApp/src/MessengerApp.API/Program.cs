using MessengerApp.API.Extensions;

using Microsoft.EntityFrameworkCore;
using MessengerApp.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.ConfigurePipeline();

// Apply EF Core migrations ONLY if RUN_MIGRATIONS env var is set
// This prevents multiple pods from concurrently running migrations in a scaled environment.
if (Environment.GetEnvironmentVariable("RUN_MIGRATIONS") == "true")
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            context.Database.Migrate();
            
            // If we are just running the migration init container, exit after success
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while migrating the database.");
            Environment.Exit(1);
        }
    }
}

app.Run();
