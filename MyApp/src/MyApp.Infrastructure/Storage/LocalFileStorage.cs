using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using MyApp.Application.Common.Interfaces;
using MyApp.Shared.Exceptions;

namespace MyApp.Infrastructure.Storage;

/// <summary>
/// Saves uploaded images under wwwroot/uploads/{folder} and returns the
/// web-relative path (e.g. "uploads/complaints/ab12.jpg") that clients combine
/// with their config.fileBaseUrl.
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private readonly string _webRoot;
    private readonly ILogger<LocalFileStorage> _logger;

    public LocalFileStorage(IWebHostEnvironment env, ILogger<LocalFileStorage> logger)
    {
        _logger = logger;
        _webRoot = string.IsNullOrWhiteSpace(env.WebRootPath)
            ? Path.Combine(env.ContentRootPath, "wwwroot")
            : env.WebRootPath;
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string folder, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new ValidationAppException("Only JPG, PNG, GIF or WEBP images are allowed.");

        var relativeFolder = NormalizeFolder(folder);
        var absoluteFolder = Path.Combine(_webRoot, relativeFolder);
        Directory.CreateDirectory(absoluteFolder);

        var safeName = $"{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(absoluteFolder, safeName);

        await using (var target = File.Create(absolutePath))
        {
            await stream.CopyToAsync(target, ct);
        }

        var relativePath = $"{relativeFolder}/{safeName}".Replace('\\', '/');
        _logger.LogInformation("Stored upload at {Path}", relativePath);
        return relativePath;
    }

    public async Task<string> SaveDataUrlAsync(string dataUrl, string folder, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dataUrl))
            throw new ValidationAppException("The uploaded image is empty.");

        var comma = dataUrl.IndexOf(',');
        if (!dataUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase) || comma < 0)
            throw new ValidationAppException("The uploaded image is not a valid data URL.");

        var header = dataUrl[..comma];
        var payload = dataUrl[(comma + 1)..];

        var extension = header.Contains("png") ? ".png"
            : header.Contains("gif") ? ".gif"
            : header.Contains("webp") ? ".webp"
            : ".jpg";

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            throw new ValidationAppException("The uploaded image could not be decoded.");
        }

        using var ms = new MemoryStream(bytes);
        return await SaveAsync(ms, $"image{extension}", folder, ct);
    }

    public void Delete(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return;

        try
        {
            var relative = relativePath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
            var absolute = Path.GetFullPath(Path.Combine(_webRoot, relative));
            var root = Path.GetFullPath(_webRoot);

            // Never delete anything outside the web root.
            if (!absolute.StartsWith(root, StringComparison.OrdinalIgnoreCase)) return;

            if (File.Exists(absolute)) File.Delete(absolute);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not delete upload {Path}", relativePath);
        }
    }

    private static string NormalizeFolder(string folder)
        => folder.Replace('\\', '/').Trim('/').Replace('/', Path.DirectorySeparatorChar);
}
