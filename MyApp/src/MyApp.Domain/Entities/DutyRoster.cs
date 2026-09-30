using MyApp.Domain.Common;
using MyApp.Shared.Enums;

namespace MyApp.Domain.Entities;

/// <summary>
/// One row of the "personnel on duty" board on the admin dashboard.
/// Shows name, assigned duty, area and position.
/// </summary>
public class DutyRoster : BaseEntity
{
    public DateOnly Date { get; set; }
    public DutyShift Shift { get; set; } = DutyShift.Day;

    /// <summary>Short duty label, e.g. "Patrol", "Barangay Hall Front Desk".</summary>
    public string AssignedDuty { get; set; } = string.Empty;

    /// <summary>Area / purok / post covered by this personnel.</summary>
    public string Area { get; set; } = string.Empty;

    /// <summary>
    /// Linked account when the personnel has an app account. Name and position
    /// are snapshotted so the board still works for non-app personnel.
    /// </summary>
    public int? UserId { get; set; }
    public User? User { get; set; }

    public string PersonnelName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }

    /// <summary>Start/end time of the duty, free text e.g. "08:00 - 17:00".</summary>
    public string? TimeRange { get; set; }

    public bool IsOnDuty { get; set; } = true;
}
