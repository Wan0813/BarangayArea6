using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>
/// One node of the barangay organizational chart. Self-referencing tree.
/// </summary>
public class OrganizationMember : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }

    /// <summary>Null for top-level (e.g. Barangay Captain).</summary>
    public int? ParentId { get; set; }
    public OrganizationMember? Parent { get; set; }
    public ICollection<OrganizationMember> Children { get; set; } = new List<OrganizationMember>();

    public int SortOrder { get; set; }

    /// <summary>Link to the staff account, when this member is also an app user.</summary>
    public int? UserId { get; set; }
    public User? User { get; set; }
}
