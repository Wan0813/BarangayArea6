using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Announcements;
using MyApp.Application.Dtos.Operations;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

[Route("api/announcements")]
[Authorize]
public class AnnouncementsController : ApiControllerBase
{
    private readonly IAnnouncementService _announcements;
    private readonly IFileStorage _storage;

    public AnnouncementsController(IAnnouncementService announcements, IFileStorage storage)
    {
        _announcements = announcements;
        _storage = storage;
    }

    /// <summary>Paged announcements / community posts. Residents only see published ones.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _announcements.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _announcements.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        var request = await ReadRequestAsync(ct);
        return Success(await _announcements.CreateAsync(request, CurrentUserId, ct), "Announcement published.");
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Update(int id, CancellationToken ct)
    {
        var request = await ReadRequestAsync(ct);
        return Success(await _announcements.UpdateAsync(id, request, ct), "Announcement updated.");
    }

    [HttpPut("{id:int}/publish")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> SetPublished(int id, [FromBody] PublishRequest request, CancellationToken ct)
        => Success(await _announcements.SetPublishedAsync(id, request.IsPublished, ct),
            request.IsPublished ? "Published." : "Unpublished.");

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _announcements.DeleteAsync(id, ct);
        return Success("Announcement deleted.");
    }

    private async Task<UpdateAnnouncementRequest> ReadRequestAsync(CancellationToken ct)
    {
        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            var request = RequestReader.Bind<UpdateAnnouncementRequest>(form);
            request.ImagePath = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("image"), AppConstants.UploadFolders.Operations, ct);
            return request;
        }

        var body = await RequestReader.ReadBodyAsync<UpdateAnnouncementRequest>(Request, ct);
        body.ImagePath = await Uploads.SaveDataUrlAsync(
            _storage, body.ImagePath, AppConstants.UploadFolders.Operations, ct);
        return body;
    }
}
