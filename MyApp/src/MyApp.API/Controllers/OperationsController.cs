using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Operations;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

[Route("api/operations")]
[Authorize]
public class OperationsController : ApiControllerBase
{
    private readonly IOperationService _operations;
    private readonly IFileStorage _storage;

    public OperationsController(IOperationService operations, IFileStorage storage)
    {
        _operations = operations;
        _storage = storage;
    }

    /// <summary>Paged daily operation logs. Residents only see published entries.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _operations.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _operations.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        var request = await ReadRequestAsync(ct);
        var created = await _operations.CreateAsync(request, CurrentUserId, ct);
        return Success(created, "Daily operation saved.");
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Update(int id, CancellationToken ct)
    {
        var request = await ReadRequestAsync(ct);
        return Success(await _operations.UpdateAsync(id, request, ct), "Daily operation updated.");
    }

    [HttpPut("{id:int}/publish")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> SetPublished(int id, [FromBody] PublishRequest request, CancellationToken ct)
        => Success(await _operations.SetPublishedAsync(id, request.IsPublished, ct),
            request.IsPublished ? "Published." : "Unpublished.");

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _operations.DeleteAsync(id, ct);
        return Success("Daily operation deleted.");
    }

    private async Task<UpdateOperationRequest> ReadRequestAsync(CancellationToken ct)
    {
        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            var request = RequestReader.Bind<UpdateOperationRequest>(form);
            request.ImagePath = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("image"), AppConstants.UploadFolders.Operations, ct);
            return request;
        }

        var body = await RequestReader.ReadBodyAsync<UpdateOperationRequest>(Request, ct);
        body.ImagePath = await Uploads.SaveDataUrlAsync(
            _storage, body.ImagePath, AppConstants.UploadFolders.Operations, ct);
        return body;
    }
}
