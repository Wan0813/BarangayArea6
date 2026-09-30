using MyApp.Domain.Entities;
using MyApp.Shared.Enums;

namespace MyApp.Application.Common.Interfaces;

/// <summary>Reads the authenticated user from the current HTTP request (JWT claims).</summary>
public interface ICurrentUserService
{
    int? UserId { get; }
    string? Username { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
    bool IsStaff { get; }
    bool IsHeadAdmin { get; }
}

/// <summary>Creates signed JWT access tokens.</summary>
public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(User user);
}

/// <summary>Password hashing (BCrypt).</summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);

    /// <summary>Returns true when the stored hash uses an outdated work factor.</summary>
    bool NeedsRehash(string hash);
}

/// <summary>
/// Generates and hashes the password reset codes. Only the SHA-256 digest is
/// persisted; the plain code only travels by email.
/// </summary>
public interface IResetCodeService
{
    string Generate(int digits = 6);
    string Hash(string code);
    bool Matches(string code, string storedHash);
}
