using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Announcements;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _current;

    public AnnouncementService(IApplicationDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PagedResult<AnnouncementDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Announcements
            .Include(a => a.CreatedBy)
            .AsNoTracking()
            .AsQueryable();

        if (!_current.IsStaff)
            q = q.Where(a => a.IsPublished);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(a => a.Title.Contains(s) || a.Body.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var published = query.Status.Trim().ToLowerInvariant() switch
            {
                "published" or "true" => true,
                "draft" or "unpublished" or "false" => false,
                _ => (bool?)null
            };
            if (published is not null) q = q.Where(a => a.IsPublished == published);
        }

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "title" => query.IsDescending ? q.OrderByDescending(a => a.Title) : q.OrderBy(a => a.Title),
            _ => query.IsDescending ? q.OrderByDescending(a => a.Id) : q.OrderBy(a => a.Id)
        };

        return await q.ToPagedResultAsync(query, a => a.ToDto(), ct);
    }

    public async Task<AnnouncementDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var ann = await _db.Announcements
            .Include(a => a.CreatedBy)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundAppException("Announcement not found.");

        if (!_current.IsStaff && !ann.IsPublished)
            throw new ForbiddenAppException("This announcement is not published.");

        return ann.ToDto();
    }

    public async Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, int userId, CancellationToken ct = default)
    {
        var ann = new Announcement
        {
            Title = Guard.NotEmpty(request.Title, "Title", 200),
            Body = Guard.NotEmpty(request.Body, "Message", 8000),
            IsPublished = request.IsPublished,
            ImagePath = request.ImagePath,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(ann);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(ann.Id, ct);
    }

    public async Task<AnnouncementDto> UpdateAsync(int id, UpdateAnnouncementRequest request, CancellationToken ct = default)
    {
        var ann = await _db.Announcements.FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundAppException("Announcement not found.");

        ann.Title = Guard.NotEmpty(request.Title, "Title", 200);
        ann.Body = Guard.NotEmpty(request.Body, "Message", 8000);
        ann.IsPublished = request.IsPublished;
        if (!string.IsNullOrWhiteSpace(request.ImagePath)) ann.ImagePath = request.ImagePath;
        ann.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(ann.Id, ct);
    }

    public async Task<AnnouncementDto> SetPublishedAsync(int id, bool isPublished, CancellationToken ct = default)
    {
        var ann = await _db.Announcements.FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundAppException("Announcement not found.");

        ann.IsPublished = isPublished;
        ann.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(ann.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (!_current.IsHeadAdmin)
            throw new ForbiddenAppException("Only the head admin can delete announcements.");

        var ann = await _db.Announcements.FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundAppException("Announcement not found.");

        _db.Remove(ann);
        await _db.SaveChangesAsync(ct);
    }
}
