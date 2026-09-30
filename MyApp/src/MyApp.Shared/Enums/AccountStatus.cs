namespace MyApp.Shared.Enums;

/// <summary>
/// Lifecycle of a signed-up account. New accounts start as <see cref="Pending"/>
/// and cannot log in until a head admin approves them.
/// </summary>
public enum AccountStatus
{
    Pending = 1,
    Active = 2,
    Declined = 3,
    Suspended = 4
}
