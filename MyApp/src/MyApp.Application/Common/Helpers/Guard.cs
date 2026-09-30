using MyApp.Shared.Exceptions;

namespace MyApp.Application.Common.Helpers;

/// <summary>Small validation helpers that throw friendly errors.</summary>
public static class Guard
{
    public static string NotEmpty(string? value, string field, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ValidationAppException($"{field} is required.");

        var v = value.Trim();
        if (v.Length > maxLength)
            throw new ValidationAppException($"{field} must not exceed {maxLength} characters.");

        return v;
    }

    public static string? Optional(string? value, string field, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var v = value.Trim();
        if (v.Length > maxLength)
            throw new ValidationAppException($"{field} must not exceed {maxLength} characters.");
        return v;
    }

    public static void Password(string? password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ValidationAppException("Password is required.");
        if (password.Length < 6)
            throw new ValidationAppException("Password must be at least 6 characters.");
        if (password.Length > 128)
            throw new ValidationAppException("Password must not exceed 128 characters.");
    }

    public static void Equal(string a, string b, string message)
    {
        if (!string.Equals(a, b, StringComparison.Ordinal))
            throw new ValidationAppException(message);
    }

    public static void Email(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ValidationAppException("Email is required.");
        var e = email.Trim();
        var at = e.IndexOf('@');
        if (at <= 0 || at == e.Length - 1 || !e.Contains('.'))
            throw new ValidationAppException("Please enter a valid email address.");
    }

    public static void Age(int? age)
    {
        if (age is null) return;
        if (age is < 1 or > 120)
            throw new ValidationAppException("Age must be between 1 and 120.");
    }

    public static T Require<T>(T? value, string message) where T : class
        => value ?? throw new NotFoundAppException(message);
}
