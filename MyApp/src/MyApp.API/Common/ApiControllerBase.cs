using Microsoft.AspNetCore.Mvc;
using MyApp.Application.Common.Interfaces;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Common;

/// <summary>
/// Base controller that wraps every payload in the shared
/// <see cref="ApiResponse{T}"/> envelope and exposes the caller's id.
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    protected int CurrentUserId =>
        int.TryParse(User.FindFirst(AppConstants.Claims.UserId)?.Value
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id)
            ? id
            : 0;

    protected IActionResult Success<T>(T data, string? message = null)
        => Ok(ApiResponse<T>.Ok(data, message));

    /// <summary>200 with an empty body payload (used for actions that return nothing).</summary>
    protected IActionResult Success(string? message = null)
        => Ok(ApiResponse<object>.Ok(new { }, message));

    protected IActionResult Fail(string message, params string[] errors)
        => BadRequest(ApiResponse<object>.Fail(message, errors));
}

public static class Uploads
{
    /// <summary>Stores an uploaded image and returns its web-relative path, or null when no file was sent.</summary>
    public static async Task<string?> SaveImageAsync(
        IFileStorage storage, IFormFile? file, string folder, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0) return null;

        await using var stream = file.OpenReadStream();
        return await storage.SaveAsync(stream, file.FileName, folder, ct);
    }

    /// <summary>Stores a base64 data URL image (used by the mobile/admin previews).</summary>
    public static async Task<string?> SaveDataUrlAsync(
        IFileStorage storage, string? dataUrl, string folder, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dataUrl)) return null;
        return await storage.SaveDataUrlAsync(dataUrl, folder, ct);
    }
}
