using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Auth;

public class LoginRequest
{
    /// <summary>Username or email.</summary>
    public string UsernameOrEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public UserDto User { get; set; } = new();
}

/// <summary>
/// Sign-up payload. The valid ID image arrives separately as IFormFile in the
/// controller, which then maps it onto <see cref="ValidIdImagePath"/>.
/// </summary>
public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }

    /// <summary>"Resident" (default) or "Admin".</summary>
    public string RegisterAs { get; set; } = "Resident";

    public string? ValidIdType { get; set; }

    /// <summary>Set by the controller after saving the upload.</summary>
    public string? ValidIdImagePath { get; set; }
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class VerifyResetCodeRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>Standard user projection returned to every client.</summary>
public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public int? Age { get; set; }
    public UserRole Role { get; set; }
    public string RoleDisplay => Role switch
    {
        UserRole.HeadAdmin => "Head Admin",
        UserRole.Admin => "Admin",
        _ => "Resident"
    };
    public AccountStatus Status { get; set; }
    public string? Position { get; set; }
    public string? ValidIdType { get; set; }
    public string? ValidIdImageUrl { get; set; }
    public string? PhotoUrl { get; set; }
    public string? StatusRemarks { get; set; }
    public int? HouseholdId { get; set; }
    public string? HouseholdNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
