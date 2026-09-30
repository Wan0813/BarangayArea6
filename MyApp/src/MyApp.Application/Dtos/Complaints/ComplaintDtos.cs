using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Complaints;

public class CreateComplaintRequest
{
    /// <summary>Selected suggestion or a custom type typed by the resident.</summary>
    public string Type { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    /// <summary>Set by the controller after saving the upload.</summary>
    public string? ImagePath { get; set; }
}

public class UpdateComplaintStatusRequest
{
    public ComplaintStatus Status { get; set; }

    /// <summary>Official barangay response shown to the resident.</summary>
    public string? Response { get; set; }

    /// <summary>Officer/staff handling the complaint.</summary>
    public int? AssignedOfficerId { get; set; }
}

public class AddComplaintCommentRequest
{
    public string Message { get; set; } = string.Empty;

    /// <summary>Optional status change recorded together with the comment.</summary>
    public ComplaintStatus? Status { get; set; }
}

public class ComplaintDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public ComplaintStatus Status { get; set; }
    public string StatusDisplay => Status.ToString();
    public string? Response { get; set; }
    public int? AssignedOfficerId { get; set; }
    public string? AssignedOfficerName { get; set; }
    public int UserId { get; set; }
    public string ReporterUsername { get; set; } = string.Empty;
    public string ReporterFullName { get; set; } = string.Empty;
    public string? ReporterContact { get; set; }
    public string? ReporterAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int CommentCount { get; set; }
}

public class ComplaintCommentDto
{
    public int Id { get; set; }
    public int ComplaintId { get; set; }
    public int UserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public bool IsStaffReply { get; set; }
    public string? StatusAtPost { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>Stats card data for the admin dashboard complaints panel.</summary>
public class ComplaintStatsDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Ongoing { get; set; }
    public int Resolved { get; set; }
    public int Rejected { get; set; }
    public int TodayCount { get; set; }
    public List<ComplaintTypeCountDto> ByType { get; set; } = new();
}

public class ComplaintTypeCountDto
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
}
