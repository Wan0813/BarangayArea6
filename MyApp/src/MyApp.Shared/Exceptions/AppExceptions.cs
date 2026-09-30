namespace MyApp.Shared.Exceptions;

/// <summary>Base type for all expected (handled) application errors.</summary>
public abstract class AppException : Exception
{
    protected AppException(string message) : base(message) { }
}

/// <summary>400 - the request was understood but the data is invalid.</summary>
public sealed class ValidationAppException : AppException
{
    public IReadOnlyList<string> Errors { get; }

    public ValidationAppException(string message, IEnumerable<string>? errors = null) : base(message)
        => Errors = errors?.ToList() ?? new List<string>();

    public ValidationAppException(IEnumerable<string> errors)
        : this("One or more validation errors occurred.", errors) { }
}

/// <summary>401 - bad credentials or expired token.</summary>
public sealed class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string message = "Invalid credentials.") : base(message) { }
}

/// <summary>403 - authenticated but not allowed.</summary>
public sealed class ForbiddenAppException : AppException
{
    public ForbiddenAppException(string message = "You are not allowed to perform this action.") : base(message) { }
}

/// <summary>404 - record does not exist.</summary>
public sealed class NotFoundAppException : AppException
{
    public NotFoundAppException(string message = "The requested record was not found.") : base(message) { }
}

/// <summary>409 - duplicate username/email, etc.</summary>
public sealed class ConflictAppException : AppException
{
    public ConflictAppException(string message) : base(message) { }
}
