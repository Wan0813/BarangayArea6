using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.About;
using MyApp.Shared.Constants;

namespace MyApp.API.Controllers;

[Route("api/dashboard")]
[Authorize(Policy = AppConstants.Policies.StaffOnly)]
public class DashboardController : ApiControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard) => _dashboard = dashboard;

    /// <summary>Stat cards, complaint stats, emergency stats and counters for the overview page.</summary>
    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken ct)
        => Success(await _dashboard.GetOverviewAsync(ct));

    /// <summary>Personnel on duty for a given day (defaults to today).</summary>
    [HttpGet("duty-roster")]
    public async Task<IActionResult> DutyRoster(
        [FromQuery] DateOnly? date,
        [FromQuery] string? search,
        CancellationToken ct)
        => Success(await _dashboard.GetDutyRosterAsync(date, search, ct));

    /// <summary>Households with their resident counts (total residents per household).</summary>
    [HttpGet("households-summary")]
    public async Task<IActionResult> HouseholdsSummary([FromQuery] Shared.Models.SearchQuery query, CancellationToken ct)
        => Success(await _dashboard.GetHouseholdsSummaryAsync(query, ct));
}
