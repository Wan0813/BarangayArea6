namespace MyApp.Shared.Constants;

public static class AppConstants
{
    public const string AppName = "Barangay Management Information System";
    public const string DefaultBarangay = "Barangay San Jose Annex Area 6";
    public const string DefaultMunicipality = "Rodriguez, Rizal";

    /// <summary>Relative folder (under wwwroot) where uploaded images are stored.</summary>
    public static class UploadFolders
    {
        public const string ValidIds = "uploads/ids";
        public const string Photos = "uploads/photos";
        public const string Complaints = "uploads/complaints";
        public const string Emergencies = "uploads/emergencies";
        public const string Operations = "uploads/operations";
        public const string Organization = "uploads/organization";
    }

    /// <summary>Policy names registered in Program.cs.</summary>
    public static class Policies
    {
        public const string HeadAdminOnly = "HeadAdminOnly";
        public const string StaffOnly = "StaffOnly";
        public const string ResidentOnly = "ResidentOnly";
    }

    /// <summary>Custom claim types used inside the JWT.</summary>
    public static class Claims
    {
        public const string UserId = "uid";
        public const string Username = "uname";
        public const string Role = "role";
        public const string Status = "status";
    }
}
