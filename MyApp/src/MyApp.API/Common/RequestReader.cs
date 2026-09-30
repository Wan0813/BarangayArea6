using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyApp.API.Common;

/// <summary>
/// Lets every endpoint accept <b>both</b> <c>multipart/form-data</c> (file uploads
/// from the mobile app / admin UI) and plain JSON (Swagger, the website), by
/// binding the request body onto the same DTO without changing the action signature.
/// </summary>
public static class RequestReader
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task<T> ReadBodyAsync<T>(HttpRequest request, CancellationToken ct = default)
        where T : new()
    {
        if (request.ContentLength is null or 0)
            return new T();

        try
        {
            var value = await JsonSerializer.DeserializeAsync<T>(request.Body, Json, ct);
            return value ?? new T();
        }
        catch (JsonException ex)
        {
            throw new Shared.Exceptions.ValidationAppException(
                "The request body could not be read.", new[] { ex.Message });
        }
    }

    /// <summary>Binds an HTML form collection onto a DTO using reflection.</summary>
    public static T Bind<T>(IFormCollection form) where T : new()
    {
        var result = new T();
        var type = typeof(T);

        foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (!property.CanWrite) continue;

            var raw = form[property.Name];
            if (raw.Count == 0)
            {
                // Also accept snake_case / camelCase form field names.
                raw = form[ToCamel(property.Name)];
                if (raw.Count == 0) continue;
            }

            var text = raw.ToString();
            if (string.IsNullOrWhiteSpace(text)) continue;

            var converted = Convert(text, property.PropertyType);
            if (converted is not null) property.SetValue(result, converted);
        }

        return result;
    }

    private static object? Convert(string text, Type targetType)
    {
        var underlying = Nullable.GetUnderlyingType(targetType) ?? targetType;
        text = text.Trim();

        try
        {
            if (underlying == typeof(string)) return text;
            if (underlying == typeof(int)) return int.Parse(text);
            if (underlying == typeof(long)) return long.Parse(text);
            if (underlying == typeof(decimal)) return decimal.Parse(text);
            if (underlying == typeof(double)) return double.Parse(text);
            if (underlying == typeof(bool)) return IsTruthy(text);
            if (underlying == typeof(DateOnly)) return DateOnly.Parse(text);
            if (underlying == typeof(DateTime)) return DateTime.Parse(text);
            if (underlying == typeof(Guid)) return Guid.Parse(text);
            if (underlying.IsEnum) return Enum.Parse(underlying, text, ignoreCase: true);
        }
        catch (Exception ex) when (ex is FormatException or OverflowException or ArgumentException)
        {
            throw new Shared.Exceptions.ValidationAppException(
                $"'{text}' is not a valid value for {targetType.Name}.");
        }

        return text;
    }

    private static bool IsTruthy(string text) => text.ToLowerInvariant() switch
    {
        "true" or "1" or "yes" or "y" or "on" => true,
        _ => false
    };

    private static string ToCamel(string name)
        => string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
