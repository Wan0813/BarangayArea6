namespace MyApp.Shared.Models;

/// <summary>
/// Every endpoint answers with this envelope so all three front-ends can use
/// one shared fetch helper.
/// </summary>
public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static ApiResponse<T> Ok(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, params string[] errors)
        => new() { Success = false, Message = message, Errors = errors };

    public static ApiResponse<T> Fail(IEnumerable<string> errors)
        => new() { Success = false, Message = "One or more validation errors occurred.", Errors = errors.ToList() };
}
