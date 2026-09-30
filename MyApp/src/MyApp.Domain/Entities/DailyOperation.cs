using MyApp.Domain.Common;
using MyApp.Shared.Enums;

namespace MyApp.Domain.Entities;

/// <summary>
/// A daily operation / activity log. Visible to residents when published.
/// Every entry records the assigned officer and assigned staff.
/// </summary>
public class DailyOperation : BaseEntity
{
    public DateOnly Date { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public OperationCategory Category { get; set; } = OperationCategory.Other;

    public string? ImagePath { get; set; }

    /// <summary>Officer in charge of this activity.</summary>
    public int? AssignedOfficerId { get; set; }
    public User? AssignedOfficer { get; set; }

    /// <summary>Staff member assisting the officer.</summary>
    public int? AssignedStaffId { get; set; }
    public User? AssignedStaff { get; set; }

    /// <summary>Personnel involved (free text, comma separated) for extra names.</summary>
    public string? PersonnelInvolved { get; set; }

    /// <summary>Publish so residents can see the log. Otherwise it stays a draft.</summary>
    public bool IsPublished { get; set; } = true;

    public int CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;
}
