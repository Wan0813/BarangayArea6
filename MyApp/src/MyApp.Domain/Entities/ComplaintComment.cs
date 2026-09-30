using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>
/// Discussion thread on a complaint. Both residents and admins can add
/// comments, which is what powers the "detailed response" feature.
/// </summary>
public class ComplaintComment : BaseEntity
{
    public int ComplaintId { get; set; }
    public Complaint Complaint { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Message { get; set; } = string.Empty;

    /// <summary>True when posted by a barangay admin (drives the styling).</summary>
    public bool IsStaffReply { get; set; }

    /// <summary>Optional status change recorded with the comment.</summary>
    public string? StatusAtPost { get; set; }
}
