using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Operations;

public class CreateOperationRequest
{
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string Title { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public OperationCategory Category { get; set; } = OperationCategory.Other;

    public int? AssignedOfficerId { get; set; }
    public int? AssignedStaffId { get; set; }
    public string? PersonnelInvolved { get; set; }

    public bool IsPublished { get; set; } = true;

    /// <summary>Set by the controller after saving the upload.</summary>
    public string? ImagePath { get; set; }
}

public class UpdateOperationRequest : CreateOperationRequest
{
}

public class PublishRequest
{
    public bool IsPublished { get; set; }
}

public class OperationDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public OperationCategory Category { get; set; }
    public string CategoryDisplay { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? AssignedOfficerId { get; set; }
    public string? AssignedOfficerName { get; set; }
    public int? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public string? PersonnelInvolved { get; set; }
    public bool IsPublished { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
