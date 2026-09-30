using MyApp.Application.Common.Extensions;
using MyApp.Application.Dtos.About;
using MyApp.Application.Dtos.Announcements;
using MyApp.Application.Dtos.Auth;
using MyApp.Application.Dtos.Complaints;
using MyApp.Application.Dtos.Emergencies;
using MyApp.Application.Dtos.Households;
using MyApp.Application.Dtos.Operations;
using MyApp.Application.Dtos.Rosters;
using MyApp.Domain.Entities;

namespace MyApp.Application.Common.Mapping;

/// <summary>
/// Hand-written entity to DTO projections. Kept in one place so every endpoint
/// returns exactly the same shape to the admin UI, the mobile app and the site.
/// </summary>
public static class MappingExtensions
{
    public static UserDto ToDto(this User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        FullName = u.FullName,
        Email = u.Email,
        ContactNumber = u.ContactNumber,
        Address = u.Address,
        Age = u.Age,
        Role = u.Role,
        Status = u.Status,
        Position = u.Position,
        ValidIdType = u.ValidIdType,
        ValidIdImageUrl = u.ValidIdImagePath,
        PhotoUrl = u.PhotoPath,
        StatusRemarks = u.StatusRemarks,
        HouseholdId = u.HouseholdId,
        HouseholdNumber = u.Household?.HouseholdNumber,
        CreatedAt = u.CreatedAt,
        LastLoginAt = u.LastLoginAt
    };

    public static ComplaintDto ToDto(this Complaint c) => new()
    {
        Id = c.Id,
        Type = c.Type,
        Subject = c.Subject,
        Description = c.Description,
        Location = c.Location,
        ImageUrl = c.ImagePath,
        Status = c.Status,
        Response = c.Response,
        AssignedOfficerId = c.AssignedOfficerId,
        AssignedOfficerName = c.AssignedOfficer?.FullName,
        UserId = c.UserId,
        ReporterUsername = c.User?.Username ?? string.Empty,
        ReporterFullName = c.User?.FullName ?? string.Empty,
        ReporterContact = c.User?.ContactNumber,
        ReporterAddress = c.User?.Address,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
        ResolvedAt = c.ResolvedAt,
        CommentCount = c.Comments?.Count ?? 0
    };

    public static ComplaintCommentDto ToDto(this ComplaintComment c) => new()
    {
        Id = c.Id,
        ComplaintId = c.ComplaintId,
        UserId = c.UserId,
        AuthorName = c.User?.FullName ?? "Unknown",
        IsStaffReply = c.IsStaffReply,
        StatusAtPost = c.StatusAtPost,
        Message = c.Message,
        CreatedAt = c.CreatedAt
    };

    public static EmergencyDto ToDto(this Emergency e) => new()
    {
        Id = e.Id,
        Kind = e.Kind,
        Location = e.Location,
        ContactNumber = e.ContactNumber,
        Description = e.Description,
        ImageUrl = e.ImagePath,
        Status = e.Status,
        Response = e.Response,
        Eta = e.Eta,
        AssignedOfficerId = e.AssignedOfficerId,
        AssignedOfficerName = e.AssignedOfficer?.FullName,
        UserId = e.UserId,
        ReporterUsername = e.User?.Username ?? string.Empty,
        ReporterFullName = e.User?.FullName ?? string.Empty,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
        ResolvedAt = e.ResolvedAt
    };

    public static OperationDto ToDto(this DailyOperation o) => new()
    {
        Id = o.Id,
        Date = o.Date,
        Title = o.Title,
        Details = o.Details,
        Category = o.Category,
        CategoryDisplay = o.Category.ToDisplayName(),
        ImageUrl = o.ImagePath,
        AssignedOfficerId = o.AssignedOfficerId,
        AssignedOfficerName = o.AssignedOfficer?.FullName,
        AssignedStaffId = o.AssignedStaffId,
        AssignedStaffName = o.AssignedStaff?.FullName,
        PersonnelInvolved = o.PersonnelInvolved,
        IsPublished = o.IsPublished,
        CreatedByUserId = o.CreatedByUserId,
        CreatedByName = o.CreatedBy?.FullName ?? string.Empty,
        CreatedAt = o.CreatedAt
    };

    public static AnnouncementDto ToDto(this Announcement a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Body = a.Body,
        ImageUrl = a.ImagePath,
        IsPublished = a.IsPublished,
        CreatedByUserId = a.CreatedByUserId,
        CreatedByName = a.CreatedBy?.FullName ?? string.Empty,
        CreatedAt = a.CreatedAt
    };

    public static HouseholdMemberDto ToDto(this HouseholdMember m) => new()
    {
        Id = m.Id,
        HouseholdId = m.HouseholdId,
        FullName = m.FullName,
        Age = m.Age,
        Gender = m.Gender,
        RelationToHead = m.RelationToHead,
        CivilStatus = m.CivilStatus,
        Occupation = m.Occupation,
        IsAppUser = m.IsAppUser
    };

    public static HouseholdDto ToDto(this Household h) => new()
    {
        Id = h.Id,
        HouseholdNumber = h.HouseholdNumber,
        Address = h.Address,
        Purok = h.Purok,
        HeadOfFamily = h.HeadOfFamily,
        ContactNumber = h.ContactNumber,
        IsActive = h.IsActive,
        ResidentCount = h.Members?.Count ?? 0,
        Members = h.Members?.Select(m => m.ToDto()).ToList() ?? new()
    };

    public static DutyRosterDto ToDto(this DutyRoster d) => new()
    {
        Id = d.Id,
        Date = d.Date,
        Shift = d.Shift,
        AssignedDuty = d.AssignedDuty,
        Area = d.Area,
        Position = d.Position,
        PersonnelName = d.PersonnelName,
        ContactNumber = d.ContactNumber,
        TimeRange = d.TimeRange,
        IsOnDuty = d.IsOnDuty,
        UserId = d.UserId
    };

    public static HotlineDto ToDto(this Hotline h) => new()
    {
        Id = h.Id,
        Name = h.Name,
        Number = h.Number,
        Description = h.Description,
        SortOrder = h.SortOrder,
        IsEmergency = h.IsEmergency
    };

    public static AboutInfoDto ToDto(this AboutInfo a) => new()
    {
        Id = a.Id,
        BarangayName = a.BarangayName,
        Municipality = a.Municipality,
        Mission = a.Mission,
        Vision = a.Vision,
        History = a.History,
        ContactEmail = a.ContactEmail,
        ContactNumber = a.ContactNumber,
        OfficeHours = a.OfficeHours
    };

    public static OrganizationMemberDto ToDto(this OrganizationMember m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Position = m.Position,
        PhotoUrl = m.PhotoPath,
        ParentId = m.ParentId,
        SortOrder = m.SortOrder,
        UserId = m.UserId
    };

    /// <summary>Builds the nested organization tree from a flat list.</summary>
    public static List<OrganizationMemberDto> BuildTree(this IEnumerable<OrganizationMember> members)
    {
        var all = members
            .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
            .Select(m => m.ToDto())
            .ToList();

        var byId = all.ToDictionary(m => m.Id);
        var roots = new List<OrganizationMemberDto>();

        foreach (var node in all)
        {
            if (node.ParentId is int pid && byId.TryGetValue(pid, out var parent))
                parent.Children.Add(node);
            else
                roots.Add(node);
        }

        return roots;
    }
}
