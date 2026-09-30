using MyApp.Application.Dtos.About;
using MyApp.Application.Dtos.Announcements;

namespace MyApp.Application.Dtos.Public;

/// <summary>Counters shown on the promotional website landing page.</summary>
public class PublicStatisticsDto
{
    public int TotalResidents { get; set; }
    public int TotalHouseholds { get; set; }
    public int ComplaintsFiled { get; set; }
    public int ComplaintsResolved { get; set; }
    public int EmergenciesResponded { get; set; }
    public int BarangayPersonnel { get; set; }
    public int Announcements { get; set; }
}

/// <summary>App download information for the website.</summary>
public class DownloadInfoDto
{
    public string AndroidUrl { get; set; } = string.Empty;
    public string IosUrl { get; set; } = string.Empty;
    public string DirectDownloadUrl { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public string ReleaseNotes { get; set; } = string.Empty;
    public string FileSize { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
}

/// <summary>Everything the public website needs in a single call.</summary>
public class PublicSiteDto
{
    public AboutInfoDto Info { get; set; } = new();
    public List<HotlineDto> Hotlines { get; set; } = new();
    public List<OrganizationMemberDto> Organization { get; set; } = new();
    public List<AnnouncementDto> Announcements { get; set; } = new();
    public PublicStatisticsDto Statistics { get; set; } = new();
    public DownloadInfoDto Downloads { get; set; } = new();
}
