using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Emergencies;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Enums;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class EmergencyService : IEmergencyService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _current;

    public EmergencyService(IApplicationDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PagedResult<EmergencyDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Emergencies
            .Include(e => e.User)
            .Include(e => e.AssignedOfficer)
            .AsNoTracking()
            .AsQueryable();

        if (!_current.IsStaff)
        {
            var userId = _current.UserId ?? 0;
            q = q.Where(e => e.UserId == userId);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(e =>
                e.Kind.Contains(s) ||
                e.Location.Contains(s) ||
                e.Description.Contains(s) ||
                e.ContactNumber.Contains(s) ||
                e.User.Username.Contains(s) ||
                e.User.FullName.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.ParseEnumOrNull<EmergencyStatus>();
            if (status is not null) q = q.Where(e => e.Status == status);
        }

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "kind" => query.IsDescending ? q.OrderByDescending(e => e.Kind) : q.OrderBy(e => e.Kind),
            "status" => query.IsDescending ? q.OrderByDescending(e => e.Status) : q.OrderBy(e => e.Status),
            "location" => query.IsDescending ? q.OrderByDescending(e => e.Location) : q.OrderBy(e => e.Location),
            _ => query.IsDescending ? q.OrderByDescending(e => e.Id) : q.OrderBy(e => e.Id)
        };

        return await q.ToPagedResultAsync(query, e => e.ToDto(), ct);
    }

    public async Task<EmergencyDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var emergency = await _db.Emergencies
            .Include(e => e.User)
            .Include(e => e.AssignedOfficer)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new NotFoundAppException("Emergency request not found.");

        if (!_current.IsStaff && emergency.UserId != _current.UserId)
            throw new ForbiddenAppException("You can only view your own emergency requests.");

        return emergency.ToDto();
    }

    public async Task<EmergencyDto> CreateAsync(CreateEmergencyRequest request, int userId, CancellationToken ct = default)
    {
        var emergency = new Emergency
        {
            UserId = userId,
            Kind = Guard.NotEmpty(request.Kind, "Emergency type", 100),
            Location = Guard.NotEmpty(request.Location, "Exact location", 300),
            ContactNumber = Guard.NotEmpty(request.ContactNumber, "Contact number", 30),
            Description = Guard.NotEmpty(request.Description, "What happened", 4000),
            ImagePath = request.ImagePath,
            Status = EmergencyStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(emergency);
        await _db.SaveChangesAsync(ct);

        return await GetByIdAsync(emergency.Id, ct);
    }

    public async Task<EmergencyDto> UpdateStatusAsync(int id, UpdateEmergencyStatusRequest request, CancellationToken ct = default)
    {
        if (!_current.IsStaff)
            throw new ForbiddenAppException("Only barangay admins can update emergency status.");

        var emergency = await _db.Emergencies.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new NotFoundAppException("Emergency request not found.");

        if (request.AssignedOfficerId is int officerId)
        {
            var officerExists = await _db.Users.AnyAsync(u => u.Id == officerId, ct);
            if (!officerExists) throw new ValidationAppException("The selected assigned officer does not exist.");
            emergency.AssignedOfficerId = officerId;
        }

        emergency.Status = request.Status;
        emergency.Response = Guard.Optional(request.Response, "Response", 4000);
        emergency.Eta = Guard.Optional(request.Eta, "Estimated time of arrival", 100);
        emergency.UpdatedAt = DateTime.UtcNow;
        emergency.ResolvedAt = request.Status is EmergencyStatus.Declined ? DateTime.UtcNow : null;

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(emergency.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (!_current.IsHeadAdmin)
            throw new ForbiddenAppException("Only the head admin can delete emergency records.");

        var emergency = await _db.Emergencies.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new NotFoundAppException("Emergency request not found.");

        _db.Remove(emergency);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<EmergencyStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var q = _db.Emergencies.AsNoTracking().AsQueryable();
        if (!_current.IsStaff)
        {
            var userId = _current.UserId ?? 0;
            q = q.Where(e => e.UserId == userId);
        }

        var today = DateTime.UtcNow.Date;

        var byStatus = await q
            .GroupBy(e => e.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var todayCount = await q.CountAsync(e => e.CreatedAt >= today, ct);

        int Count(EmergencyStatus s) => byStatus.FirstOrDefault(x => x.Status == s)?.Count ?? 0;

        return new EmergencyStatsDto
        {
            Total = byStatus.Sum(x => x.Count),
            Pending = Count(EmergencyStatus.Pending),
            Approved = Count(EmergencyStatus.Approved),
            Processing = Count(EmergencyStatus.Processing),
            Declined = Count(EmergencyStatus.Declined),
            TodayCount = todayCount
        };
    }
}
