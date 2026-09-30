using MyApp.Domain.Common;
using MyApp.Shared.Enums;

namespace MyApp.Domain.Entities;

public class Emergency : BaseEntity
{
    /// <summary>Free text emergency type, e.g. "Fire", "Medical Emergency".</summary>
    public string Kind { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImagePath { get; set; }

    public EmergencyStatus Status { get; set; } = EmergencyStatus.Pending;

    /// <summary>Admin comment shown to the resident.</summary>
    public string? Response { get; set; }

    /// <summary>Estimated time of arrival, e.g. "10 minutes".</summary>
    public string? Eta { get; set; }

    /// <summary>Officer/staff dispatched to handle the emergency.</summary>
    public int? AssignedOfficerId { get; set; }
    public User? AssignedOfficer { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
