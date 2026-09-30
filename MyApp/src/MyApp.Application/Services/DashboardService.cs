using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Dashboard;
using MyApp.Application.Dtos.Households;
using MyApp.Application.Dtos.Rosters;
using MyApp.Domain.Abstractions;
using MyApp.Shared.Enums;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _db;
    private readonly IComplaintService _complaints;
    private readonly IEmergencyService _emergencies;

    public DashboardService(IApplicationDbContext db, IComplaintService complaints, IEmergencyService emergencies)
    {
        _db = db;
        _complaints = complaints;
        _emergencies = emergencies;
    }

    public async Task<DashboardOverviewDto> GetOverviewAsync(CancellationToken ct = default)
    {
        var complaintStats = await _complaints.GetStatsAsync(ct);
        var emergencyStats = await _emergencies.GetStatsAsync(ct);

        var totalResidents = await _db.HouseholdMembers.AsNoTracking().CountAsync(ct);
        var totalHouseholds = await _db.Households.AsNoTracking().CountAsync(h => h.IsActive, ct);
        var totalStaff = await _db.Users.AsNoTracking()
            .CountAsync(u => (u.Role == UserRole.Admin || u.Role == UserRole.HeadAdmin) && u.Status == AccountStatus.Active, ct);

        var pendingSignups = await _db.Users.AsNoTracking()
            .CountAsync(u => u.Status == AccountStatus.Pending, ct);

        var publishedOperations = await _db.DailyOperations.AsNoTracking()
            .CountAsync(o => o.IsPublished, ct);

        return new DashboardOverviewDto
        {
            PendingSignups = pendingSignups,
            PendingComplaints = complaintStats.Pending,
            PendingEmergencies = emergencyStats.Pending,
            TotalResidents = totalResidents,
            TotalHouseholds = totalHouseholds,
            TotalStaff = totalStaff,
            PublishedOperations = publishedOperations,
            TotalComplaints = complaintStats.Total,
            TotalEmergencies = emergencyStats.Total,
            ComplaintStats = complaintStats,
            EmergencyStats = emergencyStats
        };
    }

    /// <summary>Personnel on duty board: name, assigned duty, area and position.</summary>
    public async Task<List<DutyRosterDto>> GetDutyRosterAsync(DateOnly? date, string? search, CancellationToken ct = default)
    {
        var day = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var q = _db.DutyRosters.AsNoTracking().Where(d => d.Date == day);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(d =>
                d.PersonnelName.Contains(s) ||
                d.AssignedDuty.Contains(s) ||
                d.Area.Contains(s) ||
                d.Position.Contains(s));
        }

        return await q
            .OrderBy(d => d.Shift).ThenBy(d => d.AssignedDuty).ThenBy(d => d.PersonnelName)
            .Select(d => d.ToDto())
            .ToListAsync(ct);
    }

    public async Task<PagedResult<HouseholdDto>> GetHouseholdsSummaryAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Households.Include(h => h.Members).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(h => h.HouseholdNumber.Contains(s) || h.Address.Contains(s) || h.HeadOfFamily.Contains(s));
        }

        q = q.OrderByDescending(h => h.Members.Count);

        return await q.ToPagedResultAsync(query, h => h.ToDto(), ct);
    }
}
