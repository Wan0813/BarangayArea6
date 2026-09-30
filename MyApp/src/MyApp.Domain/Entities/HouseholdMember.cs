using MyApp.Domain.Common;

namespace MyApp.Domain.Entities;

/// <summary>One person living inside a <see cref="Household"/>.</summary>
public class HouseholdMember : BaseEntity
{
    public int HouseholdId { get; set; }
    public Household Household { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Gender { get; set; }

    /// <summary>e.g. "Head", "Spouse", "Child", "Relative", "Boarder".</summary>
    public string? RelationToHead { get; set; }

    /// <summary>True when this person is also a registered app user.</summary>
    public bool IsAppUser { get; set; }

    public string? CivilStatus { get; set; }
    public string? Occupation { get; set; }
}
