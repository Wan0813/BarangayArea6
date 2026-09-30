using Microsoft.EntityFrameworkCore;
using MyApp.Shared.Models;

namespace MyApp.Application.Common.Extensions;

public static class QueryableExtensions
{
    /// <summary>
    /// Universal pagination. Every list service funnels through here so the
    /// clients always receive the same <see cref="PagedResult{T}"/> shape.
    /// </summary>
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, int page, int pageSize, CancellationToken ct = default)
    {
        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return PagedResult<T>.Create(items, page, pageSize, total);
    }

    /// <summary>Like <see cref="ToPagedResultAsync{T}"/>, but projects each row first.</summary>
    public static async Task<PagedResult<TResult>> ToPagedResultAsync<TSource, TResult>(
        this IQueryable<TSource> query, int page, int pageSize, Func<TSource, TResult> selector,
        CancellationToken ct = default)
    {
        var total = await query.CountAsync(ct);
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return PagedResult<TResult>.Create(rows.Select(selector), page, pageSize, total);
    }

    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, SearchQuery q, CancellationToken ct = default)
        => await query.ToPagedResultAsync(q.Page, q.PageSize, ct);

    public static async Task<PagedResult<TResult>> ToPagedResultAsync<TSource, TResult>(
        this IQueryable<TSource> query, SearchQuery q, Func<TSource, TResult> selector, CancellationToken ct = default)
        => await query.ToPagedResultAsync(q.Page, q.PageSize, selector, ct);
}
