using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Users;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

/// <summary>
/// Account management. Head admins manage everything; standard admins can view.
/// </summary>
[Route("api/users")]
[Authorize(Policy = AppConstants.Policies.StaffOnly)]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _users;
    private readonly IFileStorage _storage;

    public UsersController(IUserService users, IFileStorage storage)
    {
        _users = users;
        _storage = storage;
    }

    /// <summary>Paged accounts. Search matches username, full name, email, address and contact number.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _users.GetPagedAsync(query, ct));

    /// <summary>Lightweight staff list used by "assigned officer" dropdowns.</summary>
    [HttpGet("staff-options")]
    public async Task<IActionResult> StaffOptions(CancellationToken ct)
        => Success(await _users.GetStaffOptionsAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _users.GetByIdAsync(id, ct));

    /// <summary>Head admin creates a staff/admin account directly (already active).</summary>
    [HttpPost]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
        => Success(await _users.CreateAsync(request, ct), "Staff account created.");

    [HttpPut("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken ct)
        => Success(await _users.UpdateAsync(id, request, ct), "Account updated.");

    /// <summary>Approve, decline or suspend an account.</summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest request, CancellationToken ct)
        => Success(await _users.UpdateStatusAsync(id, request, CurrentUserId, ct), "Account status updated.");

    [HttpPut("{id:int}/role")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleRequest request, CancellationToken ct)
        => Success(await _users.UpdateRoleAsync(id, request, CurrentUserId, ct), "Account role updated.");

    [HttpPut("{id:int}/position")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> UpdatePosition(int id, [FromBody] UpdatePositionRequest request, CancellationToken ct)
        => Success(await _users.UpdatePositionAsync(id, request, ct), "Position updated.");

    /// <summary>Head admin uploads a photo for any account.</summary>
    [HttpPost("{id:int}/photo")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UpdatePhoto(int id, CancellationToken ct)
    {
        var path = await Uploads.SaveImageAsync(
            _storage, (await Request.ReadFormAsync(ct)).Files.GetFile("photo"),
            AppConstants.UploadFolders.Photos, ct);

        if (path is null) return Fail("Please choose an image to upload.");

        return Success(await _users.UpdatePhotoAsync(id, path, ct), "Photo updated.");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _users.DeleteAsync(id, CurrentUserId, ct);
        return Success("Account deleted.");
    }
}
