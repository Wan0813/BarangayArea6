using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Complaints;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

[Route("api/complaints")]
[Authorize]
public class ComplaintsController : ApiControllerBase
{
    private readonly IComplaintService _complaints;
    private readonly IFileStorage _storage;

    public ComplaintsController(IComplaintService complaints, IFileStorage storage)
    {
        _complaints = complaints;
        _storage = storage;
    }

    /// <summary>
    /// Paged complaints. The search box matches username, subject and location
    /// (plus type, description and status). Residents only ever see their own.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _complaints.GetPagedAsync(query, ct));

    [HttpGet("stats")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> Stats(CancellationToken ct)
        => Success(await _complaints.GetStatsAsync(ct));

    /// <summary>Distinct complaint types, used as suggestions for the "select or type" control.</summary>
    [HttpGet("types")]
    public async Task<IActionResult> Types(CancellationToken ct)
        => Success(await _complaints.GetTypesAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _complaints.GetByIdAsync(id, ct));

    /// <summary>File a complaint. Accepts multipart/form-data (with image) or JSON (base64 imagePath).</summary>
    [HttpPost]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        CreateComplaintRequest request;
        string? imagePath = null;

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            request = RequestReader.Bind<CreateComplaintRequest>(form);
            imagePath = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("image") ?? form.Files.GetFile("photo"),
                AppConstants.UploadFolders.Complaints, ct);
        }
        else
        {
            request = await RequestReader.ReadBodyAsync<CreateComplaintRequest>(Request, ct);
            imagePath = await Uploads.SaveDataUrlAsync(
                _storage, request.ImagePath, AppConstants.UploadFolders.Complaints, ct);
        }

        request.ImagePath = imagePath;
        var created = await _complaints.CreateAsync(request, CurrentUserId, ct);
        return Success(created, "Complaint submitted successfully.");
    }

    /// <summary>Update the status / official response. Admin and head admin only.</summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateComplaintStatusRequest request, CancellationToken ct)
        => Success(await _complaints.UpdateStatusAsync(id, request, ct), "Complaint status updated.");

    [HttpGet("{id:int}/comments")]
    public async Task<IActionResult> GetComments(int id, CancellationToken ct)
        => Success(await _complaints.GetCommentsAsync(id, ct));

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddComplaintCommentRequest request, CancellationToken ct)
        => Success(await _complaints.AddCommentAsync(id, request, ct), "Comment added.");

    /// <summary>Delete a complaint. Head admin only.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _complaints.DeleteAsync(id, ct);
        return Success("Complaint deleted.");
    }
}
