using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MyApp.Application.Common.Interfaces;
using MyApp.Shared.Constants;
using MyApp.Shared.Enums;

namespace MyApp.Infrastructure.Identity;

/// <summary>
/// Reads the authenticated user's identity from the current HTTP request's JWT.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public int? UserId
    {
        get
        {
            var raw = Principal?.FindFirst(AppConstants.Claims.UserId)?.Value
                      ?? Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(raw, out var id) ? id : null;
        }
    }

    public string? Username => Principal?.FindFirst(AppConstants.Claims.Username)?.Value;

    public UserRole? Role
    {
        get
        {
            var raw = Principal?.FindFirst(AppConstants.Claims.Role)?.Value
                      ?? Principal?.FindFirst(ClaimTypes.Role)?.Value;
            return Enum.TryParse<UserRole>(raw, ignoreCase: true, out var role) ? role : null;
        }
    }

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public bool IsStaff => Role is UserRole.Admin or UserRole.HeadAdmin;

    public bool IsHeadAdmin => Role == UserRole.HeadAdmin;
}
