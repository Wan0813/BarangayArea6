using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Rosters;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

/// <summary>Daily duty roster: who is on duty, their assigned duty, area and position.</summary>
[Route("api/duty-roster")]
[Authorize(Policy = AppConstants.Policies.StaffOnly)]
public class DutyRosterController : ApiControllerBase
{
    private readonly IDutyRosterService _roster;

    public DutyRosterController(IDutyRosterService roster) => _roster = roster;

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] SearchQuery query,
        [FromQuery] DateOnly? date,
        CancellationToken ct)
        => Success(await _roster.GetPagedAsync(query, date, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveDutyRosterRequest request, CancellationToken ct)
        => Success(await _roster.CreateAsync(request, ct), "Duty roster entry added.");

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveDutyRosterRequest request, CancellationToken ct)
        => Success(await _roster.UpdateAsync(id, request, ct), "Duty roster entry updated.");

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _roster.DeleteAsync(id, ct);
        return Success("Duty roster entry removed.");
    }
}
