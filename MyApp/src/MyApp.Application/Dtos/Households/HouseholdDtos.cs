namespace MyApp.Application.Dtos.Households;

public class SaveHouseholdRequest
{
    public string HouseholdNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Purok { get; set; }
    public string HeadOfFamily { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SaveHouseholdMemberRequest
{
    public string FullName { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? RelationToHead { get; set; }
    public string? CivilStatus { get; set; }
    public string? Occupation { get; set; }
    public bool IsAppUser { get; set; }
}

public class HouseholdMemberDto
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? RelationToHead { get; set; }
    public string? CivilStatus { get; set; }
    public string? Occupation { get; set; }
    public bool IsAppUser { get; set; }
}

public class HouseholdDto
{
    public int Id { get; set; }
    public string HouseholdNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Purok { get; set; }
    public string HeadOfFamily { get; set; } = string.Empty;
    public string? ContactNumber { get; set; }
    public bool IsActive { get; set; }
    public int ResidentCount { get; set; }
    public List<HouseholdMemberDto> Members { get; set; } = new();
}
