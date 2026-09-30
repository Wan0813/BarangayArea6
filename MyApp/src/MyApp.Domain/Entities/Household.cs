using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>
/// A household in the barangay. The dashboard reports "total residents per
/// household" by counting the members recorded here.
/// </summary>
public class Household : BaseEntity
{
    /// <summary>Barangay-assigned household number, e.g. "A6-0001".</summary>
    public string HouseholdNumber { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    /// <summary>Purok / Sitio / Area.</summary>
    public string? Purok { get; set; }

    /// <summary>Name of the head of the family.</summary>
    public string HeadOfFamily { get; set; } = string.Empty;

    public string? ContactNumber { get; set; }

    /// <summary>Set when a resident sign-up is approved into this household.</summary>
    public int? RegisteredByUserId { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<HouseholdMember> Members { get; set; } = new List<HouseholdMember>();
    public ICollection<User> Accounts { get; set; } = new List<User>();
}
