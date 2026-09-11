# Multi-stage build for the VeggieBook2 API.
#
# The SDK is only present in the build stage. The final image ships the ASP.NET
# runtime and the compiled output, nothing else, which is why the server never
# needs .NET installed.
#
# This file is the template for FORGED's backend too. Keeping the shape simple
# and the layers well ordered matters more here than shaving a few megabytes.

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the project file alone first, restore, then copy the rest. Docker caches
# each layer, so editing a .cs file does not re-download every NuGet package.
COPY VeggieBook.Api.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app --no-restore

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Where the keys that encrypt session cookies live. docker-compose mounts a
# volume here so the keys survive redeploys; without them every deploy would
# sign everyone out.
#
# The directory is created now, while the build still runs as root, and handed
# to the app user. A new Docker volume copies the ownership of the directory it
# is mounted over, so this is what lets the non-root app write its keys.
RUN mkdir -p /keys && chown $APP_UID /keys

# Run as a non-root user. The aspnet image provides one, and using it means a
# container escape does not land on root. Note this is separate from the docker
# group question on the host.
USER $APP_UID

# Kestrel listens on 8080 inside the container. Nothing publishes it to the
# internet: compose binds it to 127.0.0.1 and nginx proxies /api/ to it.
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app .

ENTRYPOINT ["dotnet", "VeggieBook.Api.dll"]