using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Options;

namespace MyApp.Infrastructure.Email;

/// <summary>
/// Sends transactional mail through Gmail SMTP using MailKit.
/// Configure the app password in appsettings under "Email:Password".
/// </summary>
public class MailKitEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<MailKitEmailSender> _logger;

    public MailKitEmailSender(IOptions<EmailOptions> options, ILogger<MailKitEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Email disabled; skipping '{Subject}' to {To}", subject, to);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.SenderEmail) || string.IsNullOrWhiteSpace(_options.Password))
        {
            _logger.LogWarning("Email credentials are not configured; skipping '{Subject}' to {To}", subject, to);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.SenderName, _options.SenderEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = Wrap(subject, htmlBody) }.ToMessageBody();

        // Gmail app passwords are displayed with spaces; the real password has none.
        var password = _options.Password.Replace(" ", string.Empty);

        using var client = new SmtpClient();
        await client.ConnectAsync(
            _options.Host,
            _options.Port,
            _options.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto,
            ct);
        await client.AuthenticateAsync(_options.SenderEmail, password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);

        _logger.LogInformation("Sent '{Subject}' to {To}", subject, to);
    }

    public Task SendPasswordResetCodeAsync(string to, string fullName, string code, int validMinutes, CancellationToken ct = default)
    {
        var body = $"""
            <h2>Password reset code</h2>
            <p>Hello {Escape(fullName)},</p>
            <p>Use the code below to reset your password. It is valid for <b>{validMinutes} minutes</b>.</p>
            <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:24px 0">{Escape(code)}</p>
            <p>If you did not request this, you can safely ignore this email.</p>
            """;

        return SendAsync(to, "Your password reset code", body, ct);
    }

    public Task SendAccountStatusAsync(string to, string fullName, string status, string? remarks, CancellationToken ct = default)
    {
        var friendly = status switch
        {
            "Active" => "approved",
            "Declined" => "declined",
            "Suspended" => "suspended",
            _ => status.ToLowerInvariant()
        };

        var body = $"""
            <h2>Account {Escape(friendly)}</h2>
            <p>Hello {Escape(fullName)},</p>
            <p>Your barangay account has been <b>{Escape(friendly)}</b>.</p>
            {(string.IsNullOrWhiteSpace(remarks) ? "" : $"<p><b>Remarks:</b> {Escape(remarks)}</p>")}
            <p>You may now open the mobile application to sign in.</p>
            """;

        return SendAsync(to, $"Your account has been {friendly}", body, ct);
    }

    private static string Wrap(string title, string innerHtml) => $"""
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>{Escape(title)}</title></head>
        <body style="margin:0;padding:24px;background:#f6f7f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
            <div style="font-size:13px;color:#6b7280;margin-bottom:16px">
              Barangay San Jose Annex Area 6 &middot; Rodriguez, Rizal
            </div>
            {innerHtml}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <div style="font-size:12px;color:#9ca3af">
              This is an automated message from the Barangay Management Information System.
            </div>
          </div>
        </body></html>
        """;

    private static string Escape(string? value) =>
        System.Net.WebUtility.HtmlEncode(value ?? string.Empty);
}
