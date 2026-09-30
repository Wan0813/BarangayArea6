using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Users;

public class CreateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public int? Age { get; set; }
    public UserRole Role { get; set; } = UserRole.Admin;
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public int? Age { get; set; }
    public string? Position { get; set; }
}

public class UpdateUserStatusRequest
{
    public AccountStatus Status { get; set; }

    /// <summary>Reason shown to the resident when declined/suspended.</summary>
    public string? Remarks { get; set; }

    /// <summary>Optional household to attach the approved resident to.</summary>
    public int? HouseholdId { get; set; }
}

public class UpdateUserRoleRequest
{
    public UserRole Role { get; set; }
    public string? Position { get; set; }
}

public class UpdatePositionRequest
{
    public string Position { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
}

/// <summary>Lightweight option used by "assigned officer/staff" dropdowns.</summary>
public class StaffOptionDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Position { get; set; }
    public UserRole Role { get; set; }
}
