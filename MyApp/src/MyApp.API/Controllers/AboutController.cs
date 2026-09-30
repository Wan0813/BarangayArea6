using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.About;
using MyApp.Shared.Constants;

namespace MyApp.API.Controllers;

/// <summary>About Us content: mission/vision, hotlines and the organizational chart.</summary>
[Route("api/about")]
public class AboutController : ApiControllerBase
{
    private readonly IAboutService _about;
    private readonly IFileStorage _storage;

    public AboutController(IAboutService about, IFileStorage storage)
    {
        _about = about;
        _storage = storage;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Success(await _about.GetAsync(ct));

    [HttpPut]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Update([FromBody] SaveAboutInfoRequest request, CancellationToken ct)
        => Success(await _about.UpdateAsync(request, ct), "About information updated.");

    // ------------------------------------------------------------- hotlines

    [HttpGet("hotlines")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHotlines(CancellationToken ct)
        => Success(await _about.GetHotlinesAsync(ct));

    [HttpPost("hotlines")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> CreateHotline([FromBody] SaveHotlineRequest request, CancellationToken ct)
        => Success(await _about.CreateHotlineAsync(request, ct), "Hotline added.");

    [HttpPut("hotlines/{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> UpdateHotline(int id, [FromBody] SaveHotlineRequest request, CancellationToken ct)
        => Success(await _about.UpdateHotlineAsync(id, request, ct), "Hotline updated.");

    [HttpDelete("hotlines/{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> DeleteHotline(int id, CancellationToken ct)
    {
        await _about.DeleteHotlineAsync(id, ct);
        return Success("Hotline deleted.");
    }

    // -------------------------------------------------------- organization

    [HttpGet("organization")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOrganization(CancellationToken ct)
        => Success(await _about.GetOrganizationAsync(ct));

    [HttpPost("organization")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> CreateOrganizationMember(CancellationToken ct)
    {
        var request = await ReadMemberRequestAsync(ct);
        return Success(await _about.CreateOrganizationMemberAsync(request, ct), "Organization member added.");
    }

    [HttpPut("organization/{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UpdateOrganizationMember(int id, CancellationToken ct)
    {
        var request = await ReadMemberRequestAsync(ct);
        return Success(await _about.UpdateOrganizationMemberAsync(id, request, ct), "Organization member updated.");
    }

    [HttpDelete("organization/{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> DeleteOrganizationMember(int id, CancellationToken ct)
    {
        await _about.DeleteOrganizationMemberAsync(id, ct);
        return Success("Organization member removed.");
    }

    private async Task<SaveOrganizationMemberRequest> ReadMemberRequestAsync(CancellationToken ct)
    {
        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            var request = RequestReader.Bind<SaveOrganizationMemberRequest>(form);
            request.PhotoPath = await Uploads.SaveImageAsync(
                _storage, form.Files.GetFile("photo"), AppConstants.UploadFolders.Organization, ct);
            return request;
        }

        var body = await RequestReader.ReadBodyAsync<SaveOrganizationMemberRequest>(Request, ct);
        body.PhotoPath = await Uploads.SaveDataUrlAsync(
            _storage, body.PhotoPath, AppConstants.UploadFolders.Organization, ct);
        return body;
    }
}
