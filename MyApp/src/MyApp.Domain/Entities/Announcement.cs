using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>Optional image attachment.</summary>
    public string? ImagePath { get; set; }

    /// <summary>When false the post is only visible to admins (draft).</summary>
    public bool IsPublished { get; set; } = true;

    public int CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;
}
