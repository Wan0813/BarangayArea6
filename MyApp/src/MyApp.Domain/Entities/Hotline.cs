using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>Emergency hotline shown on the About page / mobile app.</summary>
public class Hotline : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsEmergency { get; set; } = true;
}
