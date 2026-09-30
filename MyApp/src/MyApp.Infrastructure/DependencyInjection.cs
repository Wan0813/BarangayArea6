using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Interfaces;
using MyApp.Domain.Abstractions;
using MyApp.Infrastructure.Email;
using MyApp.Infrastructure.Identity;
using MyApp.Infrastructure.Persistence;
using MyApp.Infrastructure.Storage;

namespace MyApp.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers the MySQL DbContext and every infrastructure service
    /// (JWT, BCrypt, SHA-256 reset codes, MailKit e-mail, local file storage).
    /// Call from the API's Program.cs: <c>builder.Services.AddInfrastructure(builder.Configuration);</c>
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException(
                "Connection string 'Default' is missing. Set it in appsettings.json (or appsettings.Development.json).");

        var serverVersionRaw = configuration["Database:ServerVersion"];
        var serverVersion = string.IsNullOrWhiteSpace(serverVersionRaw)
            ? ServerVersion.AutoDetect(connectionString)
            : new MySqlServerVersion(Version.Parse(serverVersionRaw));

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseMySql(connectionString, serverVersion, mysql =>
            {
                mysql.EnableRetryOnFailure(3);
                mysql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
            });
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddHttpContextAccessor();
        services.AddSingleton<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IResetCodeService, Sha256ResetCodeService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IEmailSender, MailKitEmailSender>();
        services.AddScoped<IFileStorage, LocalFileStorage>();

        return services;
    }
}
