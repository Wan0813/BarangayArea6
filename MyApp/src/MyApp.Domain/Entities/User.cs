using MyApp.Domain.Common;
using MyApp.Shared.Enums;

namespace MyApp.Domain.Entities;

/// <summary>
/// A login account. Residents sign themselves up (status = Pending) and must be
/// approved. Head admins create staff accounts directly (status = Active).
/// </summary>
public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public int? Age { get; set; }

    /// <summary>BCrypt hash - never the plain password.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Resident;
    public AccountStatus Status { get; set; } = AccountStatus.Pending;

    /// <summary>Barangay position, e.g. "Secretary", "Tanod", "Barangay Captain".</summary>
    public string? Position { get; set; }

    /// <summary>Valid ID submitted during sign-up (proof of residency).</summary>
    public string? ValidIdType { get; set; }
    public string? ValidIdImagePath { get; set; }

    /// <summary>Optional profile photo.</summary>
    public string? PhotoPath { get; set; }

    /// <summary>Household this account belongs to (optional).</summary>
    public int? HouseholdId { get; set; }
    public Household? Household { get; set; }

    /// <summary>Why the account was declined / suspended (shown to the resident).</summary>
    public string? StatusRemarks { get; set; }

    public DateTime? LastLoginAt { get; set; }

    // Navigation
    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
    public ICollection<Emergency> Emergencies { get; set; } = new List<Emergency>();
    public ICollection<PasswordResetCode> PasswordResetCodes { get; set; } = new List<PasswordResetCode>();

    public bool IsStaff => Role is UserRole.Admin or UserRole.HeadAdmin;
    public bool IsHeadAdmin => Role == UserRole.HeadAdmin;
}
