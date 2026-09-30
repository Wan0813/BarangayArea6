namespace MyApp.Application.Common.Interfaces;

/// <summary>Transactional email (Gmail SMTP through MailKit).</summary>
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);

    Task SendPasswordResetCodeAsync(string to, string fullName, string code, int validMinutes, CancellationToken ct = default);

    Task SendAccountStatusAsync(string to, string fullName, string status, string? remarks, CancellationToken ct = default);
}

/// <summary>Stores uploaded images and returns a web-relative path.</summary>
public interface IFileStorage
{
    /// <summary>Returns e.g. "uploads/complaints/abc123.jpg".</summary>
    Task<string> SaveAsync(Stream stream, string fileName, string folder, CancellationToken ct = default);

    /// <summary>Saves a data URL (base64 image) and returns the web-relative path.</summary>
    Task<string> SaveDataUrlAsync(string dataUrl, string folder, CancellationToken ct = default);

    void Delete(string? relativePath);
}
