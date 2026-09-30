namespace MyApp.Shared.Models;

/// <summary>
/// Base query object for every list endpoint. Keeping this universal is what
/// allows the admin UI to reuse a single search bar + reset button everywhere.
/// </summary>
public class SearchQuery
{
    public const int MaxPageSize = 200;

    private int _page = 1;
    private int _pageSize = 20;

    public int Page
    {
        get => _page < 1 ? 1 : _page;
        set => _page = value;
    }

    public int PageSize
    {
        get => _pageSize switch { < 1 => 20, > MaxPageSize => MaxPageSize, _ => _pageSize };
        set => _pageSize = value;
    }

    /// <summary>Free text search. Each service decides which columns it matches.</summary>
    public string? Search { get; set; }

    /// <summary>Optional status filter (complaint/emergency/account status).</summary>
    public string? Status { get; set; }

    /// <summary>Optional role filter (account lists).</summary>
    public string? Role { get; set; }

    /// <summary>Optional type/category filter (complaints, operations).</summary>
    public string? Type { get; set; }

    /// <summary>Optional sort key, e.g. "date", "name", "status".</summary>
    public string? SortBy { get; set; }

    /// <summary>"asc" or "desc". Defaults to "desc".</summary>
    public string? SortDir { get; set; }

    public bool IsDescending =>
        string.IsNullOrWhiteSpace(SortDir) || SortDir.Trim().StartsWith("desc", StringComparison.OrdinalIgnoreCase);
}
