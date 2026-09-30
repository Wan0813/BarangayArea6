using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Rosters;

/// <summary>One row of the "personnel on duty" board.</summary>
public class DutyRosterDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public DutyShift Shift { get; set; }
    public string ShiftDisplay => Shift.ToString();
    public string AssignedDuty { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string PersonnelName { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public string? TimeRange { get; set; }
    public bool IsOnDuty { get; set; }
    public int? UserId { get; set; }
}

public class SaveDutyRosterRequest
{
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DutyShift Shift { get; set; } = DutyShift.Day;
    public string AssignedDuty { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;

    /// <summary>Optional: when set, name/position are filled from the account.</summary>
    public int? UserId { get; set; }

    public string PersonnelName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public string? TimeRange { get; set; }
    public bool IsOnDuty { get; set; } = true;
}
