using System.Security.Cryptography;
using System.Text;
using MyApp.Application.Common.Interfaces;

namespace MyApp.Infrastructure.Identity;

/// <summary>BCrypt password hashing with a tunable work factor.</summary>
public class BCryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash)
    {
        if (string.IsNullOrEmpty(hash)) return false;
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }

    public bool NeedsRehash(string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.PasswordNeedsRehash(hash, WorkFactor);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return true;
        }
    }
}

/// <summary>
/// Password reset codes. A cryptographically random numeric code is generated,
/// hashed with SHA-256, and only the hash is stored in the database.
/// </summary>
public class Sha256ResetCodeService : IResetCodeService
{
    public string Generate(int digits = 6)
    {
        if (digits is < 4 or > 10) digits = 6;
        var max = (int)Math.Pow(10, digits);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString(new string('0', digits));
    }

    public string Hash(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code.Trim()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>Constant-time comparison to avoid timing side channels.</summary>
    public bool Matches(string code, string storedHash)
    {
        if (string.IsNullOrEmpty(storedHash)) return false;
        var computed = Encoding.UTF8.GetBytes(Hash(code));
        var stored = Encoding.UTF8.GetBytes(storedHash.ToLowerInvariant());
        return computed.Length == stored.Length &&
               CryptographicOperations.FixedTimeEquals(computed, stored);
    }
}
