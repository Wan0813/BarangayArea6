using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MyApp.API.Middleware;
using MyApp.Application;
using MyApp.Application.Common.Options;
using MyApp.Infrastructure;
using MyApp.Infrastructure.Persistence;
using MyApp.Shared.Constants;
using MyApp.Shared.Enums;

var builder = WebApplication.CreateBuilder(args);

// ------------------------------------------------------------------ Options
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<DownloadOptions>(builder.Configuration.GetSection(DownloadOptions.SectionName));

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.Key))
{
    throw new InvalidOperationException(
        "Jwt:Key is not configured. Set a long random value in appsettings.json (or user secrets).");
}

// ------------------------------------------------------------ App + Infra DI
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ------------------------------------------------------------------- CORS
var corsOrigins = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>()?.AllowedOrigins
                  ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        if (corsOrigins.Length == 0 || corsOrigins.Contains("*"))
        {
            // Development default: any origin (no credentials), so the Vite admin
            // app, the static website and Expo all work without extra setup.
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
    });
});

// ------------------------------------------------------------------- Auth
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppConstants.Policies.StaffOnly, policy =>
        policy.RequireRole(nameof(UserRole.Admin), nameof(UserRole.HeadAdmin)));

    options.AddPolicy(AppConstants.Policies.HeadAdminOnly, policy =>
        policy.RequireRole(nameof(UserRole.HeadAdmin)));

    options.AddPolicy(AppConstants.Policies.ResidentOnly, policy =>
        policy.RequireRole(nameof(UserRole.Resident)));
});

// --------------------------------------------------------------- MVC + JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 20 * 1024 * 1024; // 20 MB uploads
});

// ----------------------------------------------------------------- Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Barangay Management Information System API",
        Version = "v1",
        Description = "Barangay San Jose Annex Area 6 - Rodriguez, Rizal"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT returned by POST /api/auth/login."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// --------------------------------------------------------------- Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Barangay MIS API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseCors("AppCors");

// Serves the uploaded images from wwwroot/uploads/**
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    service = AppConstants.AppName,
    utc = DateTime.UtcNow
})).ExcludeFromDescription();

// ------------------------------------------------------- Migrate + Seed data
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider
            .GetRequiredService<MyApp.Application.Common.Interfaces.IPasswordHasher>();

        await DatabaseSeeder.SeedAsync(db, hasher, app.Configuration, logger);
        logger.LogInformation("Database is ready.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration/seeding failed. The API will still start; " +
                            "fix the MySQL connection string and restart.");
    }
}

app.Run();
