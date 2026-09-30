using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Households;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

[Route("api/households")]
[Authorize(Policy = AppConstants.Policies.StaffOnly)]
public class HouseholdsController : ApiControllerBase
{
    private readonly IHouseholdService _households;

    public HouseholdsController(IHouseholdService households) => _households = households;

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _households.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _households.GetByIdAsync(id, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveHouseholdRequest request, CancellationToken ct)
        => Success(await _households.CreateAsync(request, ct), "Household created.");

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveHouseholdRequest request, CancellationToken ct)
        => Success(await _households.UpdateAsync(id, request, ct), "Household updated.");

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _households.DeleteAsync(id, ct);
        return Success("Household deleted.");
    }

    // ------------------------------------------------------------- members

    [HttpPost("{id:int}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] SaveHouseholdMemberRequest request, CancellationToken ct)
        => Success(await _households.AddMemberAsync(id, request, ct), "Household member added.");

    [HttpPut("members/{memberId:int}")]
    public async Task<IActionResult> UpdateMember(int memberId, [FromBody] SaveHouseholdMemberRequest request, CancellationToken ct)
        => Success(await _households.UpdateMemberAsync(memberId, request, ct), "Household member updated.");

    [HttpDelete("members/{memberId:int}")]
    public async Task<IActionResult> DeleteMember(int memberId, CancellationToken ct)
    {
        await _households.DeleteMemberAsync(memberId, ct);
        return Success("Household member removed.");
    }
}
