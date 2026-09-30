using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Auth;
using MyApp.Application.Dtos.Users;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Enums;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IEmailSender _email;

    public UserService(IApplicationDbContext db, IPasswordHasher hasher, IEmailSender email)
    {
        _db = db;
        _hasher = hasher;
        _email = email;
    }

    public async Task<PagedResult<UserDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Users.Include(u => u.Household).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(u =>
                u.Username.Contains(s) ||
                u.FullName.Contains(s) ||
                u.Email.Contains(s) ||
                (u.Address != null && u.Address.Contains(s)) ||
                (u.ContactNumber != null && u.ContactNumber.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.ParseEnumOrNull<AccountStatus>();
            if (status is not null) q = q.Where(u => u.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            var roleFilter = query.Role.ParseEnumOrNull<UserRole>();
            if (roleFilter is not null) q = q.Where(u => u.Role == roleFilter);
        }

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "name" => query.IsDescending ? q.OrderByDescending(u => u.FullName) : q.OrderBy(u => u.FullName),
            "username" => query.IsDescending ? q.OrderByDescending(u => u.Username) : q.OrderBy(u => u.Username),
            "status" => query.IsDescending ? q.OrderByDescending(u => u.Status) : q.OrderBy(u => u.Status),
            _ => query.IsDescending ? q.OrderByDescending(u => u.Id) : q.OrderBy(u => u.Id)
        };

        return await q.ToPagedResultAsync(query, u => u.ToDto(), ct);
    }

    public async Task<UserDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");
        return user.ToDto();
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var fullName = Guard.NotEmpty(request.FullName, "Full name", 150);
        var username = Guard.NotEmpty(request.Username, "Username", 50);
        var email = Guard.NotEmpty(request.Email, "Email", 200);
        Guard.Email(email);
        Guard.Password(request.Password);
        Guard.Age(request.Age);

        var exists = await _db.Users.AnyAsync(u => u.Username == username || u.Email == email, ct);
        if (exists) throw new ConflictAppException("Username or email is already in use.");

        var user = new User
        {
            FullName = fullName,
            Username = username,
            Email = email,
            PasswordHash = _hasher.Hash(request.Password),
            Position = Guard.Optional(request.Position, "Position", 100) ?? "Staff",
            ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30),
            Address = Guard.Optional(request.Address, "Address", 300) ?? "Barangay Hall",
            Age = request.Age,
            Role = request.Role,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(user);
        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");

        var email = Guard.NotEmpty(request.Email, "Email", 200);
        Guard.Email(email);
        Guard.Age(request.Age);

        var taken = await _db.Users.AnyAsync(u => u.Id != id && u.Email == email, ct);
        if (taken) throw new ConflictAppException("Email is already in use.");

        user.FullName = Guard.NotEmpty(request.FullName, "Full name", 150);
        user.Email = email;
        user.ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30);
        user.Address = Guard.Optional(request.Address, "Address", 300);
        user.Age = request.Age;
        user.Position = Guard.Optional(request.Position, "Position", 100);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<UserDto> UpdateStatusAsync(int id, UpdateUserStatusRequest request, int actingUserId, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");

        if (user.Id == actingUserId && request.Status != AccountStatus.Active)
            throw new ValidationAppException("You cannot change the status of your own account.");

        if (user.Role == UserRole.HeadAdmin && request.Status != AccountStatus.Active)
            await EnsureNotLastHeadAdminAsync(user.Id, ct);

        user.Status = request.Status;
        user.StatusRemarks = Guard.Optional(request.Remarks, "Remarks", 500);
        user.UpdatedAt = DateTime.UtcNow;

        if (request.HouseholdId is int hid)
        {
            var household = await _db.Households.FirstOrDefaultAsync(h => h.Id == hid, ct)
                ?? throw new ValidationAppException("The selected household does not exist.");
            user.HouseholdId = hid;
            user.Household = household;
        }

        await _db.SaveChangesAsync(ct);

        if (request.Status is AccountStatus.Active or AccountStatus.Declined or AccountStatus.Suspended)
        {
            try
            {
                await _email.SendAccountStatusAsync(
                    user.Email, user.FullName, request.Status.ToString(), user.StatusRemarks, ct);
            }
            catch
            {
                // status change must still succeed when mail is unavailable
            }
        }

        return user.ToDto();
    }

    public async Task<UserDto> UpdateRoleAsync(int id, UpdateUserRoleRequest request, int actingUserId, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");

        if (user.Id == actingUserId)
            throw new ValidationAppException("You cannot change your own role.");

        if (user.Role == UserRole.HeadAdmin && request.Role != UserRole.HeadAdmin)
            await EnsureNotLastHeadAdminAsync(user.Id, ct);

        user.Role = request.Role;
        if (!string.IsNullOrWhiteSpace(request.Position))
            user.Position = request.Position.Trim();
        else if (request.Role == UserRole.Admin && string.IsNullOrWhiteSpace(user.Position))
            user.Position = "Staff";
        else if (request.Role == UserRole.Resident)
            user.Position = null;

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<UserDto> UpdatePositionAsync(int id, UpdatePositionRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");

        user.Position = Guard.Optional(request.Position, "Position", 100);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<UserDto> UpdatePhotoAsync(int id, string photoPath, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");

        user.PhotoPath = photoPath;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task DeleteAsync(int id, int actingUserId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundAppException("Account not found.");

        if (user.Id == actingUserId)
            throw new ValidationAppException("You cannot delete your own account.");

        if (user.Role == UserRole.HeadAdmin)
            await EnsureNotLastHeadAdminAsync(user.Id, ct);

        var hasComplaints = await _db.Complaints.AnyAsync(c => c.UserId == id, ct);
        var hasEmergencies = await _db.Emergencies.AnyAsync(e => e.UserId == id, ct);
        if (hasComplaints || hasEmergencies)
            throw new ConflictAppException(
                "This account has complaints or emergency records. Decline or suspend the account instead of deleting it.");

        _db.Remove(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<StaffOptionDto>> GetStaffOptionsAsync(CancellationToken ct = default)
        => await _db.Users.AsNoTracking()
            .Where(u => (u.Role == UserRole.Admin || u.Role == UserRole.HeadAdmin) && u.Status == AccountStatus.Active)
            .OrderBy(u => u.FullName)
            .Select(u => new StaffOptionDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Position = u.Position,
                Role = u.Role
            })
            .ToListAsync(ct);

    private async Task EnsureNotLastHeadAdminAsync(int excludedUserId, CancellationToken ct)
    {
        var remaining = await _db.Users.CountAsync(
            u => u.Role == UserRole.HeadAdmin && u.Status == AccountStatus.Active && u.Id != excludedUserId, ct);

        if (remaining == 0)
            throw new ValidationAppException("There must always be at least one active head admin.");
    }
}
