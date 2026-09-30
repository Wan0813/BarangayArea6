using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Emergencies;

public class CreateEmergencyRequest
{
    /// <summary>Selected suggestion or a custom type typed by the resident.</summary>
    public string Kind { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Set by the controller after saving the upload.</summary>
    public string? ImagePath { get; set; }
}

public class UpdateEmergencyStatusRequest
{
    public EmergencyStatus Status { get; set; }

    /// <summary>Admin comment shown to the resident.</summary>
    public string? Response { get; set; }

    /// <summary>Estimated time of arrival, e.g. "10 minutes".</summary>
    public string? Eta { get; set; }

    public int? AssignedOfficerId { get; set; }
}

public class EmergencyDto
{
    public int Id { get; set; }
    public string Kind { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public EmergencyStatus Status { get; set; }
    public string StatusDisplay => Status.ToString();
    public string? Response { get; set; }
    public string? Eta { get; set; }
    public int? AssignedOfficerId { get; set; }
    public string? AssignedOfficerName { get; set; }
    public int UserId { get; set; }
    public string ReporterUsername { get; set; } = string.Empty;
    public string ReporterFullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class EmergencyStatsDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int Processing { get; set; }
    public int Declined { get; set; }
    public int TodayCount { get; set; }
}
