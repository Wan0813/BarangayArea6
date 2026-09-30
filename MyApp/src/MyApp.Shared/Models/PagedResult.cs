namespace MyApp.Shared.Models;

/// <summary>
/// Universal wrapper for every paginated list endpoint so the clients
/// (admin, mobile, website) can share one list/pagination component.
/// </summary>
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public int TotalItems { get; init; }

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;

    public static PagedResult<T> Create(IEnumerable<T> items, int page, int pageSize, int totalItems)
        => new()
        {
            Items = items as IReadOnlyList<T> ?? items.ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems
        };

    public static PagedResult<T> Empty(int page = 1, int pageSize = 20)
        => new() { Page = page, PageSize = pageSize, TotalItems = 0 };
}
