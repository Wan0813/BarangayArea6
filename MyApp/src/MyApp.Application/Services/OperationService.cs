using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Operations;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class OperationService : IOperationService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _current;

    public OperationService(IApplicationDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PagedResult<OperationDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.DailyOperations
            .Include(o => o.AssignedOfficer)
            .Include(o => o.AssignedStaff)
            .Include(o => o.CreatedBy)
            .AsNoTracking()
            .AsQueryable();

        // Residents only see published logs.
        if (!_current.IsStaff)
            q = q.Where(o => o.IsPublished);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(o =>
                o.Title.Contains(s) ||
                o.Details.Contains(s) ||
                (o.PersonnelInvolved != null && o.PersonnelInvolved.Contains(s)) ||
                (o.AssignedOfficer != null && o.AssignedOfficer.FullName.Contains(s)) ||
                (o.AssignedStaff != null && o.AssignedStaff.FullName.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Type))
        {
            var category = query.Type.ParseEnumOrNull<Shared.Enums.OperationCategory>();
            if (category is not null) q = q.Where(o => o.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var published = query.Status.Trim().ToLowerInvariant() switch
            {
                "published" or "true" => true,
                "draft" or "unpublished" or "false" => false,
                _ => (bool?)null
            };
            if (published is not null) q = q.Where(o => o.IsPublished == published);
        }

        q = q.OrderByDescending(o => o.Date).ThenByDescending(o => o.Id);

        return await q.ToPagedResultAsync(query, o => o.ToDto(), ct);
    }

    public async Task<OperationDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var op = await _db.DailyOperations
            .Include(o => o.AssignedOfficer)
            .Include(o => o.AssignedStaff)
            .Include(o => o.CreatedBy)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundAppException("Daily operation not found.");

        if (!_current.IsStaff && !op.IsPublished)
            throw new ForbiddenAppException("This log is not published.");

        return op.ToDto();
    }

    public async Task<OperationDto> CreateAsync(CreateOperationRequest request, int userId, CancellationToken ct = default)
    {
        await ValidateAssigneesAsync(request.AssignedOfficerId, request.AssignedStaffId, ct);

        var op = new DailyOperation
        {
            Date = request.Date,
            Title = Guard.NotEmpty(request.Title, "Activity title", 200),
            Details = Guard.NotEmpty(request.Details, "Details", 4000),
            Category = request.Category,
            AssignedOfficerId = request.AssignedOfficerId,
            AssignedStaffId = request.AssignedStaffId,
            PersonnelInvolved = Guard.Optional(request.PersonnelInvolved, "Personnel involved", 500),
            IsPublished = request.IsPublished,
            ImagePath = request.ImagePath,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(op);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(op.Id, ct);
    }

    public async Task<OperationDto> UpdateAsync(int id, UpdateOperationRequest request, CancellationToken ct = default)
    {
        var op = await _db.DailyOperations.FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundAppException("Daily operation not found.");

        await ValidateAssigneesAsync(request.AssignedOfficerId, request.AssignedStaffId, ct);

        op.Date = request.Date;
        op.Title = Guard.NotEmpty(request.Title, "Activity title", 200);
        op.Details = Guard.NotEmpty(request.Details, "Details", 4000);
        op.Category = request.Category;
        op.AssignedOfficerId = request.AssignedOfficerId;
        op.AssignedStaffId = request.AssignedStaffId;
        op.PersonnelInvolved = Guard.Optional(request.PersonnelInvolved, "Personnel involved", 500);
        op.IsPublished = request.IsPublished;
        if (!string.IsNullOrWhiteSpace(request.ImagePath)) op.ImagePath = request.ImagePath;
        op.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(op.Id, ct);
    }

    public async Task<OperationDto> SetPublishedAsync(int id, bool isPublished, CancellationToken ct = default)
    {
        var op = await _db.DailyOperations.FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundAppException("Daily operation not found.");

        op.IsPublished = isPublished;
        op.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(op.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var op = await _db.DailyOperations.FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundAppException("Daily operation not found.");

        _db.Remove(op);
        await _db.SaveChangesAsync(ct);
    }

    private async Task ValidateAssigneesAsync(int? officerId, int? staffId, CancellationToken ct)
    {
        if (officerId is int o && !await _db.Users.AnyAsync(u => u.Id == o, ct))
            throw new ValidationAppException("The assigned officer does not exist.");

        if (staffId is int s && !await _db.Users.AnyAsync(u => u.Id == s, ct))
            throw new ValidationAppException("The assigned staff does not exist.");
    }
}
