using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Common.Options;
using MyApp.Application.Dtos.About;
using MyApp.Application.Dtos.Announcements;
using MyApp.Application.Dtos.Public;
using MyApp.Domain.Abstractions;
using MyApp.Shared.Enums;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

/// <summary>
/// Read-only endpoints consumed by the promotional website. No authentication,
/// so only published / non-sensitive data is exposed.
/// </summary>
public class PublicService : IPublicService
{
    private readonly IApplicationDbContext _db;
    private readonly DownloadOptions _downloads;

    public PublicService(IApplicationDbContext db, IOptions<DownloadOptions> downloads)
    {
        _db = db;
        _downloads = downloads.Value;
    }

    public async Task<PublicSiteDto> GetSiteAsync(CancellationToken ct = default)
        => new()
        {
            Info = await GetInfoAsync(ct),
            Hotlines = await GetHotlinesAsync(ct),
            Organization = await GetOrganizationAsync(ct),
            Announcements = (await GetAnnouncementsAsync(new SearchQuery { PageSize = 10 }, ct)).Items.ToList(),
            Statistics = await GetStatisticsAsync(ct),
            Downloads = await GetDownloadsAsync(ct)
        };

    public async Task<AboutInfoDto> GetInfoAsync(CancellationToken ct = default)
    {
        var info = await _db.AboutInfos.AsNoTracking().FirstOrDefaultAsync(a => a.Id == 1, ct);
        return info?.ToDto() ?? new AboutInfoDto
        {
            BarangayName = "Barangay San Jose Annex Area 6",
            Municipality = "Rodriguez, Rizal",
            Mission = "To deliver fast, fair and caring public service to every resident through transparent governance, peace and order, and prompt emergency response.",
            Vision = "A safe, united, clean and progressive community where every family is heard, protected and empowered.",
            OfficeHours = "Monday to Friday, 8:00 AM - 5:00 PM"
        };
    }

    public async Task<List<HotlineDto>> GetHotlinesAsync(CancellationToken ct = default)
        => await _db.Hotlines.AsNoTracking()
            .OrderBy(h => h.SortOrder).ThenBy(h => h.Id)
            .Select(h => h.ToDto())
            .ToListAsync(ct);

    public async Task<List<OrganizationMemberDto>> GetOrganizationAsync(CancellationToken ct = default)
    {
        var members = await _db.OrganizationMembers.AsNoTracking()
            .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
            .ToListAsync(ct);

        return members.BuildTree();
    }

    public async Task<PagedResult<AnnouncementDto>> GetAnnouncementsAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Announcements
            .Include(a => a.CreatedBy)
            .AsNoTracking()
            .Where(a => a.IsPublished);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(a => a.Title.Contains(s) || a.Body.Contains(s));
        }

        q = q.OrderByDescending(a => a.Id);

        return await q.ToPagedResultAsync(query, a => a.ToDto(), ct);
    }

    public async Task<PublicStatisticsDto> GetStatisticsAsync(CancellationToken ct = default)
    {
        var resolved = await _db.Complaints.AsNoTracking()
            .CountAsync(c => c.Status == ComplaintStatus.Resolved, ct);

        var responded = await _db.Emergencies.AsNoTracking()
            .CountAsync(e => e.Status == EmergencyStatus.Approved || e.Status == EmergencyStatus.Processing, ct);

        return new PublicStatisticsDto
        {
            TotalResidents = await _db.HouseholdMembers.AsNoTracking().CountAsync(ct),
            TotalHouseholds = await _db.Households.AsNoTracking().CountAsync(h => h.IsActive, ct),
            ComplaintsFiled = await _db.Complaints.AsNoTracking().CountAsync(ct),
            ComplaintsResolved = resolved,
            EmergenciesResponded = responded,
            BarangayPersonnel = await _db.Users.AsNoTracking()
                .CountAsync(u => (u.Role == UserRole.Admin || u.Role == UserRole.HeadAdmin) && u.Status == AccountStatus.Active, ct),
            Announcements = await _db.Announcements.AsNoTracking().CountAsync(a => a.IsPublished, ct)
        };
    }

    public Task<DownloadInfoDto> GetDownloadsAsync(CancellationToken ct = default)
        => Task.FromResult(new DownloadInfoDto
        {
            AndroidUrl = _downloads.AndroidUrl,
            IosUrl = _downloads.IosUrl,
            DirectDownloadUrl = _downloads.DirectDownloadUrl,
            Version = _downloads.Version,
            ReleaseNotes = _downloads.ReleaseNotes,
            FileSize = _downloads.FileSize,
            Requirements = _downloads.Requirements
        });
}
