using MyApp.Domain.Common;
using MyApp.Shared.Enums;

namespace MyApp.Domain.Entities;

public class Complaint : BaseEntity
{
    /// <summary>Free text so residents can select a suggestion or type their own.</summary>
    public string Type { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Where the incident happened. Searchable by admins.</summary>
    public string Location { get; set; } = string.Empty;

    public string? ImagePath { get; set; }

    public ComplaintStatus Status { get; set; } = ComplaintStatus.Pending;

    /// <summary>Latest official barangay response (quick edit from the list).</summary>
    public string? Response { get; set; }

    /// <summary>Admin/staff currently handling the complaint (assigned officer).</summary>
    public int? AssignedOfficerId { get; set; }
    public User? AssignedOfficer { get; set; }

    public DateTime? ResolvedAt { get; set; }

    /// <summary>Who the complaint is against / the resident who filed it.</summary>
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<ComplaintComment> Comments { get; set; } = new List<ComplaintComment>();
}
