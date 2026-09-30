using MyApp.Application.Dtos.Complaints;
using MyApp.Application.Dtos.Emergencies;

namespace MyApp.Application.Dtos.Dashboard;

/// <summary>Everything the admin dashboard overview needs, in one round trip.</summary>
public class DashboardOverviewDto
{
    // Top cards
    public int PendingSignups { get; set; }
    public int PendingComplaints { get; set; }
    public int PendingEmergencies { get; set; }

    /// <summary>Total residents counted per household (household members).</summary>
    public int TotalResidents { get; set; }
    public int TotalHouseholds { get; set; }
    public int TotalStaff { get; set; }
    public int PublishedOperations { get; set; }
    public int TotalComplaints { get; set; }
    public int TotalEmergencies { get; set; }

    public ComplaintStatsDto ComplaintStats { get; set; } = new();
    public EmergencyStatsDto EmergencyStats { get; set; } = new();
}
