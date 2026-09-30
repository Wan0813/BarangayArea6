using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Services;

namespace MyApp.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Registers every application service. Call from the API's Program.cs:
    /// <c>builder.Services.AddApplication();</c>
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IComplaintService, ComplaintService>();
        services.AddScoped<IEmergencyService, EmergencyService>();
        services.AddScoped<IOperationService, OperationService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<IHouseholdService, HouseholdService>();
        services.AddScoped<IDutyRosterService, DutyRosterService>();
        services.AddScoped<IAboutService, AboutService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IPublicService, PublicService>();

        return services;
    }
}
