namespace MyApp.Application.Dtos.Announcements;

public class CreateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;

    /// <summary>Set by the controller after saving the upload.</summary>
    public string? ImagePath { get; set; }
}

public class UpdateAnnouncementRequest : CreateAnnouncementRequest
{
}

public class AnnouncementDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsPublished { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
