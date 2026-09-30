using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Rosters;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class DutyRosterService : IDutyRosterService
{
    private readonly IApplicationDbContext _db;

    public DutyRosterService(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<DutyRosterDto>> GetPagedAsync(SearchQuery query, DateOnly? date, CancellationToken ct = default)
    {
        var q = _db.DutyRosters.AsNoTracking().AsQueryable();

        if (date is not null)
            q = q.Where(d => d.Date == date);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(d =>
                d.PersonnelName.Contains(s) ||
                d.AssignedDuty.Contains(s) ||
                d.Area.Contains(s) ||
                d.Position.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var onDuty = query.Status.Trim().ToLowerInvariant() switch
            {
                "onduty" or "on-duty" or "active" or "true" => true,
                "offduty" or "off-duty" or "inactive" or "false" => false,
                _ => (bool?)null
            };
            if (onDuty is not null) q = q.Where(d => d.IsOnDuty == onDuty);
        }

        q = q.OrderByDescending(d => d.Date).ThenBy(d => d.Shift).ThenBy(d => d.Id);

        return await q.ToPagedResultAsync(query, d => d.ToDto(), ct);
    }

    public async Task<DutyRosterDto> CreateAsync(SaveDutyRosterRequest request, CancellationToken ct = default)
    {
        var entry = new DutyRoster { CreatedAt = DateTime.UtcNow };
        await ApplyAsync(entry, request, ct);

        _db.Add(entry);
        await _db.SaveChangesAsync(ct);
        return entry.ToDto();
    }

    public async Task<DutyRosterDto> UpdateAsync(int id, SaveDutyRosterRequest request, CancellationToken ct = default)
    {
        var entry = await _db.DutyRosters.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundAppException("Duty roster entry not found.");

        await ApplyAsync(entry, request, ct);
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return entry.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entry = await _db.DutyRosters.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundAppException("Duty roster entry not found.");

        _db.Remove(entry);
        await _db.SaveChangesAsync(ct);
    }

    private async Task ApplyAsync(DutyRoster entry, SaveDutyRosterRequest request, CancellationToken ct)
    {
        entry.Date = request.Date;
        entry.Shift = request.Shift;
        entry.AssignedDuty = Guard.NotEmpty(request.AssignedDuty, "Assigned duty", 150);
        entry.Area = Guard.NotEmpty(request.Area, "Area", 150);
        entry.TimeRange = Guard.Optional(request.TimeRange, "Time range", 60);
        entry.IsOnDuty = request.IsOnDuty;
        entry.UserId = request.UserId;

        var name = Guard.Optional(request.PersonnelName, "Personnel name", 150);
        var position = Guard.Optional(request.Position, "Position", 100);
        var contact = Guard.Optional(request.ContactNumber, "Contact number", 30);

        // When linked to an account, snapshot the account's name/position/contact.
        if (request.UserId is int userId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                ?? throw new ValidationAppException("The selected personnel account does not exist.");

            entry.PersonnelName = name ?? user.FullName;
            entry.Position = position ?? user.Position ?? "Barangay Personnel";
            entry.ContactNumber = contact ?? user.ContactNumber;
        }
        else
        {
            entry.PersonnelName = Guard.NotEmpty(name, "Personnel name", 150);
            entry.Position = Guard.NotEmpty(position, "Position", 100);
            entry.ContactNumber = contact;
        }
    }
}
