using System.Net;
using System.Text.Json;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.API.Middleware;

/// <summary>
/// Converts every unhandled exception into the shared ApiResponse envelope so
/// the front-ends only ever parse one error shape.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning(ex, "Response already started; cannot write error envelope.");
                throw;
            }

            var (status, message, errors) = Map(ex);

            if (status == HttpStatusCode.InternalServerError)
                _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            else
                _logger.LogInformation("Handled {Status} on {Method} {Path}: {Message}",
                    (int)status, context.Request.Method, context.Request.Path, message);

            context.Response.Clear();
            context.Response.StatusCode = (int)status;
            context.Response.ContentType = "application/json";

            var payload = ApiResponse<object>.Fail(message, errors.ToArray());
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, SerializerOptions));
        }
    }

    private static (HttpStatusCode Status, string Message, List<string> Errors) Map(Exception ex) => ex switch
    {
        ValidationAppException v => (HttpStatusCode.BadRequest,
            string.IsNullOrWhiteSpace(v.Message) ? "One or more validation errors occurred." : v.Message,
            v.Errors.ToList()),

        ConflictAppException c => (HttpStatusCode.Conflict, c.Message, new List<string>()),
        UnauthorizedAppException u => (HttpStatusCode.Unauthorized, u.Message, new List<string>()),
        ForbiddenAppException f => (HttpStatusCode.Forbidden, f.Message, new List<string>()),
        NotFoundAppException n => (HttpStatusCode.NotFound, n.Message, new List<string>()),
        AppException a => (HttpStatusCode.BadRequest, a.Message, new List<string>()),
        UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "You are not authorized.", new List<string>()),
        OperationCanceledException => (HttpStatusCode.RequestTimeout, "The request was cancelled.", new List<string>()),
        _ => (HttpStatusCode.InternalServerError,
            "An unexpected error occurred. Please try again or contact the barangay office.",
            new List<string>())
    };
}
