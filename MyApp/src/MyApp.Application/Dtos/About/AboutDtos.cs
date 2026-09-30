namespace MyApp.Application.Dtos.About;

public class AboutInfoDto
{
    public int Id { get; set; }
    public string BarangayName { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string Vision { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactNumber { get; set; }
    public string? OfficeHours { get; set; }
}

public class SaveAboutInfoRequest
{
    public string BarangayName { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string Vision { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactNumber { get; set; }
    public string? OfficeHours { get; set; }
}

public class HotlineDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsEmergency { get; set; }
}

public class SaveHotlineRequest
{
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsEmergency { get; set; } = true;
}

public class OrganizationMemberDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public int? UserId { get; set; }

    /// <summary>Populated for the public tree endpoint.</summary>
    public List<OrganizationMemberDto> Children { get; set; } = new();
}

public class SaveOrganizationMemberRequest
{
    public string Name { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public int? UserId { get; set; }

    /// <summary>Set by the controller after saving the upload.</summary>
    public string? PhotoPath { get; set; }
}

/// <summary>Bundled payload for the About page / website.</summary>
public class AboutBundleDto
{
    public AboutInfoDto About { get; set; } = new();
    public List<HotlineDto> Hotlines { get; set; } = new();
    public List<OrganizationMemberDto> Organization { get; set; } = new();
}
