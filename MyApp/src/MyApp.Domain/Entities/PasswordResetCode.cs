using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>
/// A password reset code. Only the SHA-256 hash of the code is stored, never
/// the code itself.
/// </summary>
public class PasswordResetCode : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>SHA-256 hash (hex, lowercase) of the emailed 6-digit code.</summary>
    public string CodeHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }

    /// <summary>How many times this code was attempted (brute-force guard).</summary>
    public int AttemptCount { get; set; }

    public bool IsUsable(DateTime utcNow) =>
        UsedAt is null && ExpiresAt > utcNow && AttemptCount < 5;
}
