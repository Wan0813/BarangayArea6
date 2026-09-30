using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Common.Options;
using MyApp.Application.Dtos.Auth;
using MyApp.Application.Dtos.Users;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Enums;
using MyApp.Shared.Exceptions;

namespace MyApp.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IResetCodeService _codes;
    private readonly IEmailSender _email;
    private readonly AuthOptions _authOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IApplicationDbContext db,
        IPasswordHasher hasher,
        IJwtTokenService jwt,
        IResetCodeService codes,
        IEmailSender email,
        IOptions<AuthOptions> authOptions,
        ILogger<AuthService> logger)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _codes = codes;
        _email = email;
        _authOptions = authOptions.Value;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var identifier = Guard.NotEmpty(request.UsernameOrEmail, "Username or email", 200);
        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ValidationAppException("Password is required.");

        var user = await _db.Users
            .Include(u => u.Household)
            .FirstOrDefaultAsync(u => u.Username == identifier || u.Email == identifier, ct);

        if (user is null || !_hasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAppException("Incorrect username/email or password.");

        switch (user.Status)
        {
            case AccountStatus.Pending:
                throw new ValidationAppException("Your account is still waiting for admin approval.");
            case AccountStatus.Declined:
                throw new ValidationAppException(
                    "Your account was declined. Please contact the barangay." +
                    (string.IsNullOrWhiteSpace(user.StatusRemarks) ? "" : $" Reason: {user.StatusRemarks}"));
            case AccountStatus.Suspended:
                throw new ValidationAppException(
                    "Your account is suspended. Please contact the barangay." +
                    (string.IsNullOrWhiteSpace(user.StatusRemarks) ? "" : $" Reason: {user.StatusRemarks}"));
        }

        if (_hasher.NeedsRehash(user.PasswordHash))
            user.PasswordHash = _hasher.Hash(request.Password);

        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var (token, expires) = _jwt.CreateToken(user);

        return new LoginResponse
        {
            Token = token,
            ExpiresAtUtc = expires,
            User = user.ToDto()
        };
    }

    public async Task<string> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var username = Guard.NotEmpty(request.Username, "Username", 50);
        var fullName = Guard.NotEmpty(request.FullName, "Full name", 150);
        var email = Guard.NotEmpty(request.Email, "Email", 200);
        Guard.Email(email);
        Guard.Password(request.Password);
        Guard.Equal(request.Password, request.ConfirmPassword ?? string.Empty, "Passwords do not match.");
        Guard.Age(request.Age);

        if (!System.Text.RegularExpressions.Regex.IsMatch(username, "^[A-Za-z0-9._-]{3,50}$"))
            throw new ValidationAppException("Username must be 3-50 characters and may only contain letters, numbers, dot, underscore or hyphen.");

        if (string.IsNullOrWhiteSpace(request.ValidIdImagePath))
            throw new ValidationAppException("A valid ID image is required so an admin can verify your residency.");

        var exists = await _db.Users.AnyAsync(
            u => u.Username == username || u.Email == email, ct);
        if (exists)
            throw new ConflictAppException("Username or email is already in use.");

        var role = string.Equals(request.RegisterAs?.Trim(), "Admin", StringComparison.OrdinalIgnoreCase)
            ? UserRole.Admin
            : UserRole.Resident;

        var user = new User
        {
            Username = username,
            FullName = fullName,
            Email = email,
            ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30),
            Address = Guard.Optional(request.Address, "Address", 300),
            Age = request.Age,
            PasswordHash = _hasher.Hash(request.Password),
            Role = role,
            Status = AccountStatus.Pending,
            Position = role == UserRole.Admin ? "Staff" : null,
            ValidIdType = Guard.Optional(request.ValidIdType, "Valid ID type", 100),
            ValidIdImagePath = request.ValidIdImagePath,
            CreatedAt = DateTime.UtcNow
        };

        _db.Add(user);
        await _db.SaveChangesAsync(ct);

        await NotifyAdminsOfSignupAsync(user, ct);

        return "Your account has been submitted. An admin will review your ID and approve your account before you can log in.";
    }

    private async Task NotifyAdminsOfSignupAsync(User user, CancellationToken ct)
    {
        try
        {
            var admins = await _db.Users
                .Where(u => u.Role == UserRole.HeadAdmin && u.Status == AccountStatus.Active)
                .Select(u => u.Email)
                .ToListAsync(ct);

            foreach (var admin in admins)
            {
                await _email.SendAsync(
                    admin,
                    $"New {user.Role} sign-up: {user.FullName}",
                    $"<p>A new <b>{user.Role}</b> account is waiting for approval.</p>" +
                    $"<ul><li>Name: {user.FullName}</li><li>Username: {user.Username}</li>" +
                    $"<li>Email: {user.Email}</li><li>Address: {user.Address}</li></ul>" +
                    "<p>Open the admin dashboard to approve or decline it.</p>",
                    ct);
            }
        }
        catch
        {
            // Never fail a sign-up because the mail server is unreachable.
        }
    }

    public async Task<ForgotPasswordResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var email = Guard.NotEmpty(request.Email, "Email", 200);
        Guard.Email(email);

        const string genericMessage =
            "If the email is registered, a 6-digit reset code has been sent. It expires in " +
            "{0} minutes.";

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || user.Status == AccountStatus.Declined)
        {
            return new ForgotPasswordResult
            {
                Message = string.Format(genericMessage, _authOptions.ResetCodeValidityMinutes)
            };
        }

        // Burn any outstanding codes for this account.
        var previous = await _db.PasswordResetCodes
            .Where(c => c.UserId == user.Id && c.UsedAt == null)
            .ToListAsync(ct);
        foreach (var p in previous)
            p.UsedAt = DateTime.UtcNow;

        var code = _codes.Generate(6);
        _db.Add(new PasswordResetCode
        {
            UserId = user.Id,
            CodeHash = _codes.Hash(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_authOptions.ResetCodeValidityMinutes),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var message = string.Format(genericMessage, _authOptions.ResetCodeValidityMinutes);

        try
        {
            await _email.SendPasswordResetCodeAsync(
                user.Email, user.FullName, code, _authOptions.ResetCodeValidityMinutes, ct);
        }
        catch (Exception ex)
        {
            // The code is already stored, so the reset can still be completed if the
            // resident receives the code another way (e.g. the barangay sends it).
            _logger.LogError(ex, "Could not e-mail the password reset code to {Email}.", user.Email);
            message += " Note: the e-mail could not be sent automatically - please contact the barangay office.";
        }

        return new ForgotPasswordResult
        {
            Message = message,
            DevCode = _authOptions.ReturnResetCodeInResponse ? code : null
        };
    }

    public async Task VerifyResetCodeAsync(VerifyResetCodeRequest request, CancellationToken ct = default)
    {
        await RequireValidCodeAsync(request.Email, request.Code, burnOnFailure: false, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        Guard.Password(request.NewPassword);
        Guard.Equal(request.NewPassword, request.ConfirmPassword ?? string.Empty, "Passwords do not match.");

        var (user, code) = await RequireValidCodeAsync(request.Email, request.Code, burnOnFailure: true, ct);

        user.PasswordHash = _hasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        code.UsedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    private async Task<(User User, PasswordResetCode Code)> RequireValidCodeAsync(
        string? email, string? code, bool burnOnFailure, CancellationToken ct)
    {
        var e = Guard.NotEmpty(email, "Email", 200);
        var c = Guard.NotEmpty(code, "Reset code", 12);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == e, ct)
            ?? throw new ValidationAppException("Invalid or expired reset code.");

        var now = DateTime.UtcNow;
        var record = await _db.PasswordResetCodes
            .Where(x => x.UserId == user.Id && x.UsedAt == null && x.ExpiresAt > now)
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (record is null || record.AttemptCount >= _authOptions.MaxResetAttempts)
            throw new ValidationAppException("Invalid or expired reset code. Please request a new one.");

        if (!_codes.Matches(c, record.CodeHash))
        {
            record.AttemptCount++;
            if (burnOnFailure && record.AttemptCount >= _authOptions.MaxResetAttempts)
                record.UsedAt = now;
            await _db.SaveChangesAsync(ct);
            throw new ValidationAppException("Invalid or expired reset code. Please request a new one.");
        }

        return (user, record);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        Guard.Password(request.NewPassword);
        Guard.Equal(request.NewPassword, request.ConfirmPassword ?? string.Empty, "New passwords do not match.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException("Account not found.");

        if (!_hasher.Verify(request.CurrentPassword ?? string.Empty, user.PasswordHash))
            throw new ValidationAppException("Your current password is incorrect.");

        user.PasswordHash = _hasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetProfileAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException("Account not found.");
        return user.ToDto();
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException("Account not found.");

        var fullName = Guard.NotEmpty(request.FullName, "Full name", 150);
        var email = Guard.NotEmpty(request.Email, "Email", 200);
        Guard.Email(email);
        Guard.Age(request.Age);

        var taken = await _db.Users.AnyAsync(u => u.Id != userId && u.Email == email, ct);
        if (taken) throw new ConflictAppException("Email is already in use.");

        user.FullName = fullName;
        user.Email = email;
        user.Age = request.Age;
        user.ContactNumber = Guard.Optional(request.ContactNumber, "Contact number", 30);
        user.Address = Guard.Optional(request.Address, "Address", 300);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<UserDto> UpdateOwnPhotoAsync(int userId, string photoPath, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException("Account not found.");

        user.PhotoPath = photoPath;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }
}
