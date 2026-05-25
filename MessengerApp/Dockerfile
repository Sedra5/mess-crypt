# ============ STAGE 1: Build ============
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and restore (cache layer)
COPY *.sln .
COPY src/MessengerApp.Domain/*.csproj ./src/MessengerApp.Domain/
COPY src/MessengerApp.Application/*.csproj ./src/MessengerApp.Application/
COPY src/MessengerApp.Infrastructure/*.csproj ./src/MessengerApp.Infrastructure/
COPY src/MessengerApp.API/*.csproj ./src/MessengerApp.API/
COPY tests/MessengerApp.UnitTests/*.csproj ./tests/MessengerApp.UnitTests/
RUN dotnet restore

# Build
COPY . .
RUN dotnet build src/MessengerApp.API/MessengerApp.API.csproj -c Release --no-restore

# Publish
RUN dotnet publish src/MessengerApp.API/MessengerApp.API.csproj \
    -c Release \
    --no-restore \
    -o /app/publish

# ============ STAGE 2: Runtime (image finale) ============
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Créer user non-root
RUN groupadd --gid 1001 dotnet && \
    useradd --uid 1001 --gid dotnet --no-create-home dotnet

# Copier le résultat du publish
COPY --from=build --chown=dotnet:dotnet /app/publish .

# Variables d'environnement par défaut
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

USER dotnet
EXPOSE 8080

# Health check (requires curl/wget, usually in Debian base of aspnet core)
# Note: aspnet core images use Debian by default
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "MessengerApp.API.dll"]
