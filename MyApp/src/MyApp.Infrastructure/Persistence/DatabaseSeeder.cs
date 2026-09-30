using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyApp.Application.Common.Interfaces;
using MyApp.Domain.Entities;
using MyApp.Shared.Enums;

namespace MyApp.Infrastructure.Persistence;

/// <summary>
/// Creates the schema and inserts the baseline data the system needs to run:
/// a head admin, a standard admin, the About page content, hotlines and a
/// starter organizational chart.
/// </summary>
public static class DatabaseSeeder
{
    public const string DefaultHeadAdminUsername = "headadmin";
    public const string DefaultAdminUsername = "admin";
    public const string DefaultPassword = "Admin@123";

    public static async Task SeedAsync(
        AppDbContext db,
        IPasswordHasher hasher,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        await SeedUsersAsync(db, hasher, configuration, logger, ct);
        await SeedAboutAsync(db, logger, ct);
        await SeedHotlinesAsync(db, logger, ct);
        await SeedOrganizationAsync(db, logger, ct);
        await SeedDemoDataAsync(db, configuration, logger, ct);
    }

    private static async Task SeedUsersAsync(
        AppDbContext db, IPasswordHasher hasher, IConfiguration configuration, ILogger logger, CancellationToken ct)
    {
        var headEmail = configuration["Seed:HeadAdminEmail"] ?? "head@brgy.local";
        var adminEmail = configuration["Seed:AdminEmail"] ?? "admin@brgy.local";
        var password = configuration["Seed:Password"] ?? DefaultPassword;

        if (!await db.Users.AnyAsync(u => u.Username == DefaultHeadAdminUsername, ct))
        {
            db.Users.Add(new User
            {
                Username = DefaultHeadAdminUsername,
                FullName = configuration["Seed:HeadAdminName"] ?? "Head Administrator",
                Email = headEmail,
                Address = "Barangay Hall",
                PasswordHash = hasher.Hash(password),
                Role = UserRole.HeadAdmin,
                Status = AccountStatus.Active,
                Position = "Barangay Captain",
                CreatedAt = DateTime.UtcNow
            });
            logger.LogInformation("Seeded head admin '{Username}'.", DefaultHeadAdminUsername);
        }

        if (!await db.Users.AnyAsync(u => u.Username == DefaultAdminUsername, ct))
        {
            db.Users.Add(new User
            {
                Username = DefaultAdminUsername,
                FullName = configuration["Seed:AdminName"] ?? "Barangay Admin",
                Email = adminEmail,
                Address = "Barangay Hall",
                PasswordHash = hasher.Hash(password),
                Role = UserRole.Admin,
                Status = AccountStatus.Active,
                Position = "Secretary",
                CreatedAt = DateTime.UtcNow
            });
            logger.LogInformation("Seeded admin '{Username}'.", DefaultAdminUsername);
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedAboutAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await db.AboutInfos.AnyAsync(a => a.Id == 1, ct)) return;

        db.AboutInfos.Add(new AboutInfo
        {
            Id = 1,
            BarangayName = "Barangay San Jose Annex Area 6",
            Municipality = "Rodriguez, Rizal",
            Mission = "To deliver fast, fair and caring public service to every resident of Barangay San Jose Annex Area 6 through transparent governance, peace and order, and prompt emergency response.",
            Vision = "A safe, united, clean and progressive community where every family is heard, protected and empowered.",
            History = "The Barangay Management Information System was developed to digitize resident records, complaint handling and emergency response for Barangay San Jose Annex Area 6.",
            ContactEmail = "brgy.sanjosearea6@example.com",
            ContactNumber = "(02) 8000-0000",
            OfficeHours = "Monday to Friday, 8:00 AM - 5:00 PM",
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded About page content.");
    }

    private static async Task SeedHotlinesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await db.Hotlines.AnyAsync(ct)) return;

        db.Hotlines.AddRange(
            new Hotline { Name = "National Emergency Hotline", Number = "911", SortOrder = 1, IsEmergency = true, CreatedAt = DateTime.UtcNow },
            new Hotline { Name = "Philippine Red Cross", Number = "143", SortOrder = 2, IsEmergency = true, CreatedAt = DateTime.UtcNow },
            new Hotline { Name = "Bureau of Fire Protection", Number = "160", SortOrder = 3, IsEmergency = true, CreatedAt = DateTime.UtcNow },
            new Hotline { Name = "PNP Rodriguez", Number = "117", SortOrder = 4, IsEmergency = true, CreatedAt = DateTime.UtcNow },
            new Hotline { Name = "Barangay Hall", Number = "(02) 8000-0000", SortOrder = 5, IsEmergency = false, CreatedAt = DateTime.UtcNow },
            new Hotline { Name = "Barangay Health Center / Ambulance", Number = "(02) 8000-0001", SortOrder = 6, IsEmergency = true, CreatedAt = DateTime.UtcNow });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded emergency hotlines.");
    }

    private static async Task SeedOrganizationAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await db.OrganizationMembers.AnyAsync(ct)) return;

        var captain = new OrganizationMember
        {
            Name = "Hon. Juan Dela Cruz",
            Position = "Barangay Captain",
            SortOrder = 1,
            CreatedAt = DateTime.UtcNow
        };
        db.OrganizationMembers.Add(captain);
        await db.SaveChangesAsync(ct);

        db.OrganizationMembers.AddRange(
            new OrganizationMember { Name = "Maria Santos", Position = "Barangay Secretary", ParentId = captain.Id, SortOrder = 1, CreatedAt = DateTime.UtcNow },
            new OrganizationMember { Name = "Pedro Reyes", Position = "Barangay Treasurer", ParentId = captain.Id, SortOrder = 2, CreatedAt = DateTime.UtcNow },
            new OrganizationMember { Name = "Ana Bautista", Position = "Kagawad - Peace and Order", ParentId = captain.Id, SortOrder = 3, CreatedAt = DateTime.UtcNow },
            new OrganizationMember { Name = "Jose Villanueva", Position = "Kagawad - Health", ParentId = captain.Id, SortOrder = 4, CreatedAt = DateTime.UtcNow },
            new OrganizationMember { Name = "Liza Fernandez", Position = "SK Chairperson", ParentId = captain.Id, SortOrder = 5, CreatedAt = DateTime.UtcNow });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded organizational chart.");
    }

    private static async Task SeedDemoDataAsync(AppDbContext db, IConfiguration configuration, ILogger logger, CancellationToken ct)
    {
        // Demo data is useful for a capstone demo but should be removable.
        if (!(configuration.GetValue("Seed:IncludeDemoData", true))) return;

        var captainId = await db.Users
            .Where(u => u.Username == DefaultHeadAdminUsername)
            .Select(u => (int?)u.Id)
            .FirstOrDefaultAsync(ct);

        var secretaryId = await db.Users
            .Where(u => u.Username == DefaultAdminUsername)
            .Select(u => (int?)u.Id)
            .FirstOrDefaultAsync(ct);

        if (!await db.DutyRosters.AnyAsync(ct))
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            db.DutyRosters.AddRange(
                new DutyRoster { Date = today, Shift = DutyShift.Day, AssignedDuty = "Barangay Hall Front Desk", Area = "Barangay Hall", PersonnelName = "Maria Santos", Position = "Barangay Secretary", TimeRange = "08:00 - 17:00", UserId = secretaryId, CreatedAt = DateTime.UtcNow },
                new DutyRoster { Date = today, Shift = DutyShift.Day, AssignedDuty = "Peace and Order Patrol", Area = "Purok 1 - Area 6", PersonnelName = "Ana Bautista", Position = "Kagawad - Peace and Order", TimeRange = "08:00 - 20:00", CreatedAt = DateTime.UtcNow },
                new DutyRoster { Date = today, Shift = DutyShift.Night, AssignedDuty = "Night Patrol", Area = "Purok 2 - Area 6", PersonnelName = "Jose Villanueva", Position = "Kagawad - Health", TimeRange = "20:00 - 05:00", CreatedAt = DateTime.UtcNow },
                new DutyRoster { Date = today, Shift = DutyShift.WholeDay, AssignedDuty = "Overall Supervision", Area = "Barangay-wide", PersonnelName = "Hon. Juan Dela Cruz", Position = "Barangay Captain", TimeRange = "Whole day", UserId = captainId, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded today's duty roster.");
        }

        if (!await db.Households.AnyAsync(ct))
        {
            var household = new Household
            {
                HouseholdNumber = "A6-0001",
                Address = "12 Mabini Street, Area 6",
                Purok = "Purok 1",
                HeadOfFamily = "Pedro Reyes",
                ContactNumber = "09170000000",
                CreatedAt = DateTime.UtcNow
            };
            db.Households.Add(household);
            await db.SaveChangesAsync(ct);

            db.HouseholdMembers.AddRange(
                new HouseholdMember { HouseholdId = household.Id, FullName = "Pedro Reyes", Age = 45, Gender = "Male", RelationToHead = "Head", CivilStatus = "Married", Occupation = "Tricycle Driver", CreatedAt = DateTime.UtcNow },
                new HouseholdMember { HouseholdId = household.Id, FullName = "Rosario Reyes", Age = 43, Gender = "Female", RelationToHead = "Spouse", CivilStatus = "Married", Occupation = "Housewife", CreatedAt = DateTime.UtcNow },
                new HouseholdMember { HouseholdId = household.Id, FullName = "Mark Reyes", Age = 16, Gender = "Male", RelationToHead = "Child", CivilStatus = "Single", Occupation = "Student", CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded a sample household.");
        }

        if (!await db.Announcements.AnyAsync(ct) && captainId is int uid)
        {
            db.Announcements.Add(new Announcement
            {
                Title = "Welcome to the Barangay Area 6 app",
                Body = "You can now file complaints and request emergency rescue directly from your phone. Please make sure your account is approved and your valid ID is on file.",
                IsPublished = true,
                CreatedByUserId = uid,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded a welcome announcement.");
        }
    }
}
