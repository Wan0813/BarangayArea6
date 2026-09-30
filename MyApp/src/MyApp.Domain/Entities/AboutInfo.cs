using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>Singleton row (Id = 1) holding the editable "About Us" content.</summary>
public class AboutInfo : BaseEntity
{
    public string BarangayName { get; set; } = "Barangay San Jose Annex Area 6";
    public string Municipality { get; set; } = "Rodriguez, Rizal";
    public string Mission { get; set; } = string.Empty;
    public string Vision { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactNumber { get; set; }
    public string? OfficeHours { get; set; }
}
