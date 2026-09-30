using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Auth;
using MyApp.Application.Dtos.Users;
using MyApp.Shared.Constants;

namespace MyApp.API.Controllers;

[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _auth;
    private readonly IFileStorage _storage;

    public AuthController(IAuthService auth, IFileStorage storage)
    {
        _auth = auth;
        _storage = storage;
    }

    /// <summary>Resident or admin sign-up. Requires a valid ID image (multipart) or a base64 data URL (JSON).</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Register(CancellationToken ct)
    {
        RegisterRequest request;
        string? imagePath;

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            request = RequestReader.Bind<RegisterRequest>(form);
            imagePath = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("validId") ?? form.Files.GetFile("validIdImage"),
                AppConstants.UploadFolders.ValidIds, ct);
        }
        else
        {
            request = await RequestReader.ReadBodyAsync<RegisterRequest>(Request, ct);
            imagePath = await Uploads.SaveDataUrlAsync(
                _storage, request.ValidIdImagePath, AppConstants.UploadFolders.ValidIds, ct);
        }

        request.ValidIdImagePath = imagePath;
        var message = await _auth.RegisterAsync(request, ct);
        return Success(new { message }, message);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
        => Success(await _auth.LoginAsync(request, ct), "Logged in successfully.");

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var result = await _auth.ForgotPasswordAsync(request, ct);
        return Success(new { message = result.Message, devCode = result.DevCode }, result.Message);
    }

    [HttpPost("verify-reset-code")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeRequest request, CancellationToken ct)
    {
        await _auth.VerifyResetCodeAsync(request, ct);
        return Success("The reset code is valid.");
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await _auth.ResetPasswordAsync(request, ct);
        return Success("Your password has been reset. You can now log in.");
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
        => Success(await _auth.GetProfileAsync(CurrentUserId, ct));

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        await _auth.ChangePasswordAsync(CurrentUserId, request, ct);
        return Success("Password updated successfully.");
    }

    /// <summary>Update the signed-in user's own profile.</summary>
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
        => Success(await _auth.UpdateProfileAsync(CurrentUserId, request, ct), "Profile updated successfully.");

    /// <summary>Upload the signed-in user's own profile photo.</summary>
    [HttpPost("photo")]
    [Authorize]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UpdatePhoto(CancellationToken ct)
    {
        string? path = null;

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            path = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("photo") ?? form.Files.GetFile("image"),
                AppConstants.UploadFolders.Photos, ct);
        }
        else
        {
            var body = await RequestReader.ReadBodyAsync<PhotoUploadRequest>(Request, ct);
            path = await Uploads.SaveDataUrlAsync(_storage, body.Photo, AppConstants.UploadFolders.Photos, ct);
        }

        if (path is null)
            return Fail("Please choose an image to upload.");

        return Success(await _auth.UpdateOwnPhotoAsync(CurrentUserId, path, ct), "Photo updated.");
    }
}

public class PhotoUploadRequest
{
    /// <summary>Base64 data URL (data:image/jpeg;base64,...) or an existing relative path.</summary>
    public string? Photo { get; set; }
    public string? Image { get; set; }
}
