using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.About;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Exceptions;

namespace MyApp.Application.Services;

public class AboutService : IAboutService
{
    private readonly IApplicationDbContext _db;

    public AboutService(IApplicationDbContext db) => _db = db;

    public async Task<AboutBundleDto> GetAsync(CancellationToken ct = default)
        => new()
        {
            About = await GetInfoAsync(ct),
            Hotlines = await GetHotlinesAsync(ct),
            Organization = await GetOrganizationAsync(ct)
        };

    private async Task<AboutInfoDto> GetInfoAsync(CancellationToken ct)
    {
        var info = await _db.AboutInfos.AsNoTracking().FirstOrDefaultAsync(a => a.Id == 1, ct);
        return info?.ToDto() ?? new AboutInfoDto
        {
            BarangayName = "Barangay San Jose Annex Area 6",
            Municipality = "Rodriguez, Rizal",
            Mission = "To deliver fast, fair and caring public service to every resident through transparent governance, peace and order, and prompt emergency response.",
            Vision = "A safe, united, clean and progressive community where every family is heard, protected and empowered."
        };
    }

    public async Task<AboutInfoDto> UpdateAsync(SaveAboutInfoRequest request, CancellationToken ct = default)
    {
        var info = await _db.AboutInfos.FirstOrDefaultAsync(a => a.Id == 1, ct);
        if (info is null)
        {
            info = new AboutInfo { Id = 1, CreatedAt = DateTime.UtcNow };
            _db.Add(info);
        }

        info.BarangayName = Guard.NotEmpty(request.BarangayName, "Barangay name", 200);
        info.Municipality = Guard.NotEmpty(request.Municipality, "Municipality", 200);
        info.Mission = Guard.NotEmpty(request.Mission, "Mission", 4000);
        info.Vision = Guard.NotEmpty(request.Vision, "Vision", 4000);
        info.History = Guard.Optional(request.History, "History", 8000);
        info.ContactEmail = Guard.Optional(request.ContactEmail, "Contact email", 200);
        info.ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30);
        info.OfficeHours = Guard.Optional(request.OfficeHours, "Office hours", 200);
        info.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return info.ToDto();
    }

    public async Task<List<HotlineDto>> GetHotlinesAsync(CancellationToken ct = default)
        => await _db.Hotlines.AsNoTracking()
            .OrderBy(h => h.SortOrder).ThenBy(h => h.Id)
            .Select(h => h.ToDto())
            .ToListAsync(ct);

    public async Task<HotlineDto> CreateHotlineAsync(SaveHotlineRequest request, CancellationToken ct = default)
    {
        var hotline = new Hotline
        {
            Name = Guard.NotEmpty(request.Name, "Hotline name", 150),
            Number = Guard.NotEmpty(request.Number, "Number", 50),
            Description = Guard.Optional(request.Description, "Description", 300),
            SortOrder = request.SortOrder,
            IsEmergency = request.IsEmergency,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(hotline);
        await _db.SaveChangesAsync(ct);
        return hotline.ToDto();
    }

    public async Task<HotlineDto> UpdateHotlineAsync(int id, SaveHotlineRequest request, CancellationToken ct = default)
    {
        var hotline = await _db.Hotlines.FirstOrDefaultAsync(h => h.Id == id, ct)
            ?? throw new NotFoundAppException("Hotline not found.");

        hotline.Name = Guard.NotEmpty(request.Name, "Hotline name", 150);
        hotline.Number = Guard.NotEmpty(request.Number, "Number", 50);
        hotline.Description = Guard.Optional(request.Description, "Description", 300);
        hotline.SortOrder = request.SortOrder;
        hotline.IsEmergency = request.IsEmergency;
        hotline.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return hotline.ToDto();
    }

    public async Task DeleteHotlineAsync(int id, CancellationToken ct = default)
    {
        var hotline = await _db.Hotlines.FirstOrDefaultAsync(h => h.Id == id, ct)
            ?? throw new NotFoundAppException("Hotline not found.");

        _db.Remove(hotline);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<OrganizationMemberDto>> GetOrganizationAsync(CancellationToken ct = default)
    {
        var members = await _db.OrganizationMembers.AsNoTracking()
            .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
            .ToListAsync(ct);

        return members.BuildTree();
    }

    public async Task<OrganizationMemberDto> CreateOrganizationMemberAsync(SaveOrganizationMemberRequest request, CancellationToken ct = default)
    {
        if (request.ParentId is int parentId && !await _db.OrganizationMembers.AnyAsync(m => m.Id == parentId, ct))
            throw new ValidationAppException("The selected parent position does not exist.");

        var member = new OrganizationMember
        {
            Name = Guard.NotEmpty(request.Name, "Name", 150),
            Position = Guard.NotEmpty(request.Position, "Position", 150),
            ParentId = request.ParentId,
            SortOrder = request.SortOrder,
            UserId = request.UserId,
            PhotoPath = request.PhotoPath,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(member);
        await _db.SaveChangesAsync(ct);
        return member.ToDto();
    }

    public async Task<OrganizationMemberDto> UpdateOrganizationMemberAsync(int id, SaveOrganizationMemberRequest request, CancellationToken ct = default)
    {
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.Id == id, ct)
            ?? throw new NotFoundAppException("Organization member not found.");

        // Prevent a member from becoming their own descendant (cycle).
        if (request.ParentId == id)
            throw new ValidationAppException("A member cannot report to themselves.");

        if (request.ParentId is int parentId)
        {
            var descendants = await GetDescendantIdsAsync(id, ct);
            if (descendants.Contains(parentId))
                throw new ValidationAppException("A member cannot report to one of their own subordinates.");

            if (!await _db.OrganizationMembers.AnyAsync(m => m.Id == parentId, ct))
                throw new ValidationAppException("The selected parent position does not exist.");
        }

        member.Name = Guard.NotEmpty(request.Name, "Name", 150);
        member.Position = Guard.NotEmpty(request.Position, "Position", 150);
        member.ParentId = request.ParentId;
        member.SortOrder = request.SortOrder;
        member.UserId = request.UserId;
        if (!string.IsNullOrWhiteSpace(request.PhotoPath)) member.PhotoPath = request.PhotoPath;
        member.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return member.ToDto();
    }

    public async Task DeleteOrganizationMemberAsync(int id, CancellationToken ct = default)
    {
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.Id == id, ct)
            ?? throw new NotFoundAppException("Organization member not found.");

        // Re-parent children so the tree stays connected.
        var children = await _db.OrganizationMembers.Where(m => m.ParentId == id).ToListAsync(ct);
        foreach (var child in children)
            child.ParentId = member.ParentId;

        _db.Remove(member);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<List<int>> GetDescendantIdsAsync(int rootId, CancellationToken ct)
    {
        var all = await _db.OrganizationMembers.AsNoTracking()
            .Select(m => new { m.Id, m.ParentId })
            .ToListAsync(ct);

        var result = new List<int>();
        var queue = new Queue<int>();
        queue.Enqueue(rootId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            foreach (var child in all.Where(m => m.ParentId == current))
            {
                if (result.Contains(child.Id)) continue;
                result.Add(child.Id);
                queue.Enqueue(child.Id);
            }
        }

        return result;
    }
}
