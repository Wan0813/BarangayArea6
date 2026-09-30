using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Complaints;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Enums;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class ComplaintService : IComplaintService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _current;

    public ComplaintService(IApplicationDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PagedResult<ComplaintDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Complaints
            .Include(c => c.User)
            .Include(c => c.AssignedOfficer)
            .Include(c => c.Comments)
            .AsNoTracking()
            .AsQueryable();

        // Residents only ever see their own complaints.
        if (!_current.IsStaff)
        {
            var userId = _current.UserId ?? 0;
            q = q.Where(c => c.UserId == userId);
        }

        // Search bar: username, subject, location (+ type / description / status).
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(c =>
                c.Subject.Contains(s) ||
                c.Location.Contains(s) ||
                c.Type.Contains(s) ||
                c.Description.Contains(s) ||
                c.User.Username.Contains(s) ||
                c.User.FullName.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.ParseEnumOrNull<ComplaintStatus>();
            if (status is not null) q = q.Where(c => c.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Type))
        {
            var t = query.Type.Trim();
            q = q.Where(c => c.Type == t);
        }

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "subject" => query.IsDescending ? q.OrderByDescending(c => c.Subject) : q.OrderBy(c => c.Subject),
            "status" => query.IsDescending ? q.OrderByDescending(c => c.Status) : q.OrderBy(c => c.Status),
            "location" => query.IsDescending ? q.OrderByDescending(c => c.Location) : q.OrderBy(c => c.Location),
            _ => query.IsDescending ? q.OrderByDescending(c => c.Id) : q.OrderBy(c => c.Id)
        };

        return await q.ToPagedResultAsync(query, c => c.ToDto(), ct);
    }

    public async Task<ComplaintDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var complaint = await _db.Complaints
            .Include(c => c.User)
            .Include(c => c.AssignedOfficer)
            .Include(c => c.Comments)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundAppException("Complaint not found.");

        EnsureCanView(complaint);
        return complaint.ToDto();
    }

    public async Task<ComplaintDto> CreateAsync(CreateComplaintRequest request, int userId, CancellationToken ct = default)
    {
        var complaint = new Complaint
        {
            UserId = userId,
            Type = Guard.NotEmpty(request.Type, "Complaint type", 100),
            Subject = Guard.NotEmpty(request.Subject, "Subject", 200),
            Description = Guard.NotEmpty(request.Description, "Details", 4000),
            Location = Guard.NotEmpty(request.Location, "Incident location", 300),
            ImagePath = request.ImagePath,
            Status = ComplaintStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(complaint);
        await _db.SaveChangesAsync(ct);

        return await GetByIdAsync(complaint.Id, ct);
    }

    public async Task<ComplaintDto> UpdateStatusAsync(int id, UpdateComplaintStatusRequest request, CancellationToken ct = default)
    {
        if (!_current.IsStaff)
            throw new ForbiddenAppException("Only barangay admins can update complaint status.");

        var complaint = await _db.Complaints.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundAppException("Complaint not found.");

        if (request.AssignedOfficerId is int officerId)
        {
            var officerExists = await _db.Users.AnyAsync(u => u.Id == officerId, ct);
            if (!officerExists) throw new ValidationAppException("The selected assigned officer does not exist.");
            complaint.AssignedOfficerId = officerId;
        }

        complaint.Status = request.Status;
        complaint.Response = Guard.Optional(request.Response, "Response", 4000);
        complaint.UpdatedAt = DateTime.UtcNow;
        complaint.ResolvedAt = request.Status is ComplaintStatus.Resolved or ComplaintStatus.Rejected
            ? DateTime.UtcNow
            : null;

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(complaint.Id, ct);
    }

    public async Task<ComplaintCommentDto> AddCommentAsync(int id, AddComplaintCommentRequest request, CancellationToken ct = default)
    {
        var complaint = await _db.Complaints.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundAppException("Complaint not found.");

        if (!_current.IsStaff && complaint.UserId != _current.UserId)
            throw new ForbiddenAppException("You can only comment on your own complaints.");

        var message = Guard.NotEmpty(request.Message, "Comment", 4000);

        var comment = new ComplaintComment
        {
            ComplaintId = id,
            UserId = _current.UserId ?? complaint.UserId,
            Message = message,
            IsStaffReply = _current.IsStaff,
            StatusAtPost = _current.IsStaff && request.Status is not null ? request.Status.ToString() : null,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(comment);

        // A staff comment can move the status at the same time.
        if (_current.IsStaff && request.Status is not null && request.Status != complaint.Status)
        {
            complaint.Status = request.Status.Value;
            complaint.UpdatedAt = DateTime.UtcNow;
            complaint.ResolvedAt = request.Status is ComplaintStatus.Resolved or ComplaintStatus.Rejected
                ? DateTime.UtcNow
                : null;
        }

        await _db.SaveChangesAsync(ct);

        comment.User = await _db.Users.FirstOrDefaultAsync(u => u.Id == comment.UserId, ct) ?? new User { FullName = "Unknown" };
        return comment.ToDto();
    }

    public async Task<List<ComplaintCommentDto>> GetCommentsAsync(int id, CancellationToken ct = default)
    {
        var complaint = await _db.Complaints.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundAppException("Complaint not found.");

        EnsureCanView(complaint);

        return await _db.ComplaintComments
            .Include(c => c.User)
            .AsNoTracking()
            .Where(c => c.ComplaintId == id)
            .OrderBy(c => c.CreatedAt).ThenBy(c => c.Id)
            .Select(c => c.ToDto())
            .ToListAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        // Only head admins may delete, enforced by policy + this guard.
        if (!_current.IsHeadAdmin)
            throw new ForbiddenAppException("Only the head admin can delete complaints.");

        var complaint = await _db.Complaints
            .Include(c => c.Comments)
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundAppException("Complaint not found.");

        if (complaint.Comments.Count > 0)
            _db.RemoveRange(complaint.Comments);

        _db.Remove(complaint);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ComplaintStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var q = _db.Complaints.AsNoTracking().AsQueryable();
        if (!_current.IsStaff)
        {
            var userId = _current.UserId ?? 0;
            q = q.Where(c => c.UserId == userId);
        }

        var today = DateTime.UtcNow.Date;

        var byStatus = await q
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var byType = await q
            .GroupBy(c => c.Type)
            .Select(g => new ComplaintTypeCountDto { Type = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        var todayCount = await q.CountAsync(c => c.CreatedAt >= today, ct);

        int Count(ComplaintStatus s) => byStatus.FirstOrDefault(x => x.Status == s)?.Count ?? 0;

        return new ComplaintStatsDto
        {
            Total = byStatus.Sum(x => x.Count),
            Pending = Count(ComplaintStatus.Pending),
            Ongoing = Count(ComplaintStatus.Ongoing),
            Resolved = Count(ComplaintStatus.Resolved),
            Rejected = Count(ComplaintStatus.Rejected),
            TodayCount = todayCount,
            ByType = byType
        };
    }

    public async Task<List<string>> GetTypesAsync(CancellationToken ct = default)
    {
        var used = await _db.Complaints.AsNoTracking()
            .Select(c => c.Type)
            .Distinct()
            .ToListAsync(ct);

        var defaults = new List<string>
        {
            "Place Complaint",
            "Person Complaint",
            "Noise / Cleanliness",
            "Other"
        };

        return defaults.Concat(used.Where(t => !string.IsNullOrWhiteSpace(t)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(t => t)
            .ToList();
    }

    private void EnsureCanView(Complaint complaint)
    {
        if (!_current.IsStaff && complaint.UserId != _current.UserId)
            throw new ForbiddenAppException("You can only view your own complaints.");
    }
}
