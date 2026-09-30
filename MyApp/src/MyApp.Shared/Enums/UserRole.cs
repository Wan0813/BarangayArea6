namespace MyApp.Shared.Enums;

/// <summary>
/// Who the account belongs to. Stored as a string in the database.
/// </summary>
public enum UserRole
{
    /// <summary>Regular resident / mobile user. Can file complaints and emergencies.</summary>
    Resident = 1,

    /// <summary>Standard barangay admin / staff. Can update complaint and emergency status.</summary>
    Admin = 2,

    /// <summary>Head admin. Full control, including staff management and deleting records.</summary>
    HeadAdmin = 3
}
