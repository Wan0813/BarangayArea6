using MyApp.Shared.Exceptions;

namespace MyApp.Application.Common.Extensions;

public static class EnumExtensions
{
    /// <summary>
    /// Case-insensitive enum parse used for `?status=` query parameters.
    /// Throws a friendly validation error instead of a raw FormatException.
    /// </summary>
    public static TEnum? ParseEnumOrNull<TEnum>(this string? value) where TEnum : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var v = value.Trim();
        if (Enum.TryParse<TEnum>(v, ignoreCase: true, out var parsed)) return parsed;
        if (int.TryParse(v, out var numeric) && Enum.IsDefined(typeof(TEnum), numeric))
            return (TEnum)Enum.ToObject(typeof(TEnum), numeric);

        throw new ValidationAppException($"'{value}' is not a valid value for {typeof(TEnum).Name}.",
            Enum.GetNames<TEnum>().Select(n => $"Allowed: {n}"));
    }

    /// <summary>Human readable label for an enum member, e.g. PatrolPeaceAndOrder -> "Patrol / Peace and Order".</summary>
    public static string ToDisplayName(this Enum value) => value switch
    {
        Shared.Enums.OperationCategory.PatrolPeaceAndOrder => "Patrol / Peace and Order",
        Shared.Enums.OperationCategory.ResidentServices => "Resident Services",
        Shared.Enums.OperationCategory.HealthServices => "Health Services",
        _ => System.Text.RegularExpressions.Regex.Replace(value.ToString(), "(?<!^)([A-Z])", " $1")
    };
}
