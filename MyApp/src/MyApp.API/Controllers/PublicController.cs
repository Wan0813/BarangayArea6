using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

/// <summary>
/// Public, anonymous endpoints consumed by the promotional website.
/// </summary>
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ApiControllerBase
{
    private readonly IPublicService _public;

    public PublicController(IPublicService publicService) => _public = publicService;

    /// <summary>Everything the website needs in a single round trip.</summary>
    [HttpGet("site")]
    public async Task<IActionResult> Site(CancellationToken ct)
        => Success(await _public.GetSiteAsync(ct));

    [HttpGet("info")]
    public async Task<IActionResult> Info(CancellationToken ct)
        => Success(await _public.GetInfoAsync(ct));

    [HttpGet("hotlines")]
    public async Task<IActionResult> Hotlines(CancellationToken ct)
        => Success(await _public.GetHotlinesAsync(ct));

    [HttpGet("organization")]
    public async Task<IActionResult> Organization(CancellationToken ct)
        => Success(await _public.GetOrganizationAsync(ct));

    [HttpGet("announcements")]
    public async Task<IActionResult> Announcements([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _public.GetAnnouncementsAsync(query, ct));

    [HttpGet("statistics")]
    public async Task<IActionResult> Statistics(CancellationToken ct)
        => Success(await _public.GetStatisticsAsync(ct));

    [HttpGet("downloads")]
    public async Task<IActionResult> Downloads(CancellationToken ct)
        => Success(await _public.GetDownloadsAsync(ct));
}
