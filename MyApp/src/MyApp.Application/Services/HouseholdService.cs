using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Households;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class HouseholdService : IHouseholdService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _current;

    public HouseholdService(IApplicationDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PagedResult<HouseholdDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Households
            .Include(h => h.Members)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(h =>
                h.HouseholdNumber.Contains(s) ||
                h.Address.Contains(s) ||
                h.HeadOfFamily.Contains(s) ||
                (h.Purok != null && h.Purok.Contains(s)) ||
                (h.ContactNumber != null && h.ContactNumber.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var active = query.Status.Trim().ToLowerInvariant() switch
            {
                "active" or "true" => true,
                "inactive" or "false" => false,
                _ => (bool?)null
            };
            if (active is not null) q = q.Where(h => h.IsActive == active);
        }

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "number" => query.IsDescending ? q.OrderByDescending(h => h.HouseholdNumber) : q.OrderBy(h => h.HouseholdNumber),
            "head" => query.IsDescending ? q.OrderByDescending(h => h.HeadOfFamily) : q.OrderBy(h => h.HeadOfFamily),
            "address" => query.IsDescending ? q.OrderByDescending(h => h.Address) : q.OrderBy(h => h.Address),
            _ => query.IsDescending ? q.OrderByDescending(h => h.Id) : q.OrderBy(h => h.Id)
        };

        return await q.ToPagedResultAsync(query, h => h.ToDto(), ct);
    }

    public async Task<HouseholdDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var household = await _db.Households
            .Include(h => h.Members)
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == id, ct)
            ?? throw new NotFoundAppException("Household not found.");

        return household.ToDto();
    }

    public async Task<HouseholdDto> CreateAsync(SaveHouseholdRequest request, CancellationToken ct = default)
    {
        var number = Guard.NotEmpty(request.HouseholdNumber, "Household number", 50);

        if (await _db.Households.AnyAsync(h => h.HouseholdNumber == number, ct))
            throw new ConflictAppException("A household with that number already exists.");

        var household = new Household
        {
            HouseholdNumber = number,
            Address = Guard.NotEmpty(request.Address, "Address", 300),
            Purok = Guard.Optional(request.Purok, "Purok / Sitio", 100),
            HeadOfFamily = Guard.NotEmpty(request.HeadOfFamily, "Head of the family", 150),
            ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30),
            IsActive = request.IsActive,
            RegisteredByUserId = _current.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(household);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(household.Id, ct);
    }

    public async Task<HouseholdDto> UpdateAsync(int id, SaveHouseholdRequest request, CancellationToken ct = default)
    {
        var household = await _db.Households.FirstOrDefaultAsync(h => h.Id == id, ct)
            ?? throw new NotFoundAppException("Household not found.");

        var number = Guard.NotEmpty(request.HouseholdNumber, "Household number", 50);

        if (await _db.Households.AnyAsync(h => h.Id != id && h.HouseholdNumber == number, ct))
            throw new ConflictAppException("A household with that number already exists.");

        household.HouseholdNumber = number;
        household.Address = Guard.NotEmpty(request.Address, "Address", 300);
        household.Purok = Guard.Optional(request.Purok, "Purok / Sitio", 100);
        household.HeadOfFamily = Guard.NotEmpty(request.HeadOfFamily, "Head of the family", 150);
        household.ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30);
        household.IsActive = request.IsActive;
        household.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(household.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (!_current.IsHeadAdmin)
            throw new ForbiddenAppException("Only the head admin can delete households.");

        var household = await _db.Households
            .Include(h => h.Members)
            .FirstOrDefaultAsync(h => h.Id == id, ct)
            ?? throw new NotFoundAppException("Household not found.");

        var linkedAccounts = await _db.Users.CountAsync(u => u.HouseholdId == id, ct);
        if (linkedAccounts > 0)
            throw new ConflictAppException(
                "This household is linked to resident accounts. Unlink them first.");

        if (household.Members.Count > 0)
            _db.RemoveRange(household.Members);

        _db.Remove(household);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<HouseholdMemberDto> AddMemberAsync(int householdId, SaveHouseholdMemberRequest request, CancellationToken ct = default)
    {
        var exists = await _db.Households.AnyAsync(h => h.Id == householdId, ct);
        if (!exists) throw new NotFoundAppException("Household not found.");

        var member = new HouseholdMember
        {
            HouseholdId = householdId,
            FullName = Guard.NotEmpty(request.FullName, "Member name", 150),
            Age = request.Age,
            Gender = Guard.Optional(request.Gender, "Gender", 30),
            RelationToHead = Guard.Optional(request.RelationToHead, "Relation to head", 60),
            CivilStatus = Guard.Optional(request.CivilStatus, "Civil status", 40),
            Occupation = Guard.Optional(request.Occupation, "Occupation", 120),
            IsAppUser = request.IsAppUser,
            CreatedAt = DateTime.UtcNow
        };

        Guard.Age(member.Age);
        _db.Add(member);
        await _db.SaveChangesAsync(ct);
        return member.ToDto();
    }

    public async Task<HouseholdMemberDto> UpdateMemberAsync(int memberId, SaveHouseholdMemberRequest request, CancellationToken ct = default)
    {
        var member = await _db.HouseholdMembers.FirstOrDefaultAsync(m => m.Id == memberId, ct)
            ?? throw new NotFoundAppException("Household member not found.");

        member.FullName = Guard.NotEmpty(request.FullName, "Member name", 150);
        member.Age = request.Age;
        member.Gender = Guard.Optional(request.Gender, "Gender", 30);
        member.RelationToHead = Guard.Optional(request.RelationToHead, "Relation to head", 60);
        member.CivilStatus = Guard.Optional(request.CivilStatus, "Civil status", 40);
        member.Occupation = Guard.Optional(request.Occupation, "Occupation", 120);
        member.IsAppUser = request.IsAppUser;
        member.UpdatedAt = DateTime.UtcNow;

        Guard.Age(member.Age);
        await _db.SaveChangesAsync(ct);
        return member.ToDto();
    }

    public async Task DeleteMemberAsync(int memberId, CancellationToken ct = default)
    {
        var member = await _db.HouseholdMembers.FirstOrDefaultAsync(m => m.Id == memberId, ct)
            ?? throw new NotFoundAppException("Household member not found.");

        _db.Remove(member);
        await _db.SaveChangesAsync(ct);
    }
}
