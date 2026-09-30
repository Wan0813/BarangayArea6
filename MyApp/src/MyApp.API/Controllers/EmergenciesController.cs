using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Emergencies;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

[Route("api/emergencies")]
[Authorize]
public class EmergenciesController : ApiControllerBase
{
    private readonly IEmergencyService _emergencies;
    private readonly IFileStorage _storage;

    public EmergenciesController(IEmergencyService emergencies, IFileStorage storage)
    {
        _emergencies = emergencies;
        _storage = storage;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _emergencies.GetPagedAsync(query, ct));

    [HttpGet("stats")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> Stats(CancellationToken ct)
        => Success(await _emergencies.GetStatsAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _emergencies.GetByIdAsync(id, ct));

    /// <summary>Send an emergency rescue request. Multipart/form-data or JSON (base64 imagePath).</summary>
    [HttpPost]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        CreateEmergencyRequest request;
        string? imagePath = null;

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            request = RequestReader.Bind<CreateEmergencyRequest>(form);
            imagePath = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("image") ?? form.Files.GetFile("photo"),
                AppConstants.UploadFolders.Emergencies, ct);
        }
        else
        {
            request = await RequestReader.ReadBodyAsync<CreateEmergencyRequest>(Request, ct);
            imagePath = await Uploads.SaveDataUrlAsync(
                _storage, request.ImagePath, AppConstants.UploadFolders.Emergencies, ct);
        }

        request.ImagePath = imagePath;
        var created = await _emergencies.CreateAsync(request, CurrentUserId, ct);
        return Success(created, "Emergency request sent. The barangay has been notified.");
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateEmergencyStatusRequest request, CancellationToken ct)
        => Success(await _emergencies.UpdateStatusAsync(id, request, ct), "Emergency status updated.");

    /// <summary>Delete an emergency record. Head admin only.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _emergencies.DeleteAsync(id, ct);
        return Success("Emergency record deleted.");
    }
}
