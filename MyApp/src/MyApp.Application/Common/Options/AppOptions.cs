namespace MyApp.Application.Common.Options;

public class AuthOptions
{
    public const string SectionName = "Auth";

    /// <summary>How long a password reset code stays valid.</summary>
    public int ResetCodeValidityMinutes { get; set; } = 15;

    /// <summary>Max wrong attempts before a reset code is burned.</summary>
    public int MaxResetAttempts { get; set; } = 5;

    /// <summary>
    /// DEVELOPMENT ONLY. When true the generated reset code is also returned in
    /// the API response so the flow can be tested without a working mailbox.
    /// </summary>
    public bool ReturnResetCodeInResponse { get; set; }
}

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "MyApp.API";
    public string Audience { get; set; } = "MyApp.Clients";
    public string Key { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 480;
}

/// <summary>Gmail SMTP settings used by MailKit.</summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; } = true;
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool UseStartTls { get; set; } = true;
    public string SenderName { get; set; } = "Barangay Area 6";
    public string SenderEmail { get; set; } = string.Empty;

    /// <summary>Gmail app password (16 characters, spaces allowed).</summary>
    public string Password { get; set; } = string.Empty;
}

/// <summary>Links advertised on the promotional website.</summary>
public class DownloadOptions
{
    public const string SectionName = "Downloads";

    public string AndroidUrl { get; set; } = string.Empty;
    public string IosUrl { get; set; } = string.Empty;
    public string DirectDownloadUrl { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public string ReleaseNotes { get; set; } = string.Empty;
    public string FileSize { get; set; } = string.Empty;
    public string Requirements { get; set; } = "Android 8.0 or later / iOS 14 or later";
}

/// <summary>CORS origins allowed to call the API (admin Vite app, the static site).</summary>
public class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}
