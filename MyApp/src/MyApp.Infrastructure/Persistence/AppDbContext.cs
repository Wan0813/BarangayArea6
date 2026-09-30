using Microsoft.EntityFrameworkCore;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Common;
using MyApp.Domain.Entities;

namespace MyApp.Infrastructure.Persistence;

/// <summary>
/// EF Core context for MySQL (Pomelo provider). Implements the
/// <see cref="IApplicationDbContext"/> abstraction consumed by Application.
/// </summary>
public class AppDbContext : DbContext, IApplicationDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<HouseholdMember> HouseholdMembers => Set<HouseholdMember>();
    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<ComplaintComment> ComplaintComments => Set<ComplaintComment>();
    public DbSet<Emergency> Emergencies => Set<Emergency>();
    public DbSet<DailyOperation> DailyOperations => Set<DailyOperation>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Hotline> Hotlines => Set<Hotline>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<DutyRoster> DutyRosters => Set<DutyRoster>();
    public DbSet<AboutInfo> AboutInfos => Set<AboutInfo>();
    public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();

    IQueryable<User> IApplicationDbContext.Users => Users.AsQueryable();
    IQueryable<Household> IApplicationDbContext.Households => Households.AsQueryable();
    IQueryable<HouseholdMember> IApplicationDbContext.HouseholdMembers => HouseholdMembers.AsQueryable();
    IQueryable<Complaint> IApplicationDbContext.Complaints => Complaints.AsQueryable();
    IQueryable<ComplaintComment> IApplicationDbContext.ComplaintComments => ComplaintComments.AsQueryable();
    IQueryable<Emergency> IApplicationDbContext.Emergencies => Emergencies.AsQueryable();
    IQueryable<DailyOperation> IApplicationDbContext.DailyOperations => DailyOperations.AsQueryable();
    IQueryable<Announcement> IApplicationDbContext.Announcements => Announcements.AsQueryable();
    IQueryable<Hotline> IApplicationDbContext.Hotlines => Hotlines.AsQueryable();
    IQueryable<OrganizationMember> IApplicationDbContext.OrganizationMembers => OrganizationMembers.AsQueryable();
    IQueryable<DutyRoster> IApplicationDbContext.DutyRosters => DutyRosters.AsQueryable();
    IQueryable<AboutInfo> IApplicationDbContext.AboutInfos => AboutInfos.AsQueryable();
    IQueryable<PasswordResetCode> IApplicationDbContext.PasswordResetCodes => PasswordResetCodes.AsQueryable();

    void IApplicationDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void IApplicationDbContext.AddRange<TEntity>(IEnumerable<TEntity> entities) => Set<TEntity>().AddRange(entities);
    void IApplicationDbContext.Update<TEntity>(TEntity entity) => Set<TEntity>().Update(entity);
    void IApplicationDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);
    void IApplicationDbContext.RemoveRange<TEntity>(IEnumerable<TEntity> entities) => Set<TEntity>().RemoveRange(entities);

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ---------- User ----------
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.Role);

            e.Property(x => x.Username).HasMaxLength(50).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.ContactNumber).HasMaxLength(30);
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.Position).HasMaxLength(100);
            e.Property(x => x.ValidIdType).HasMaxLength(100);
            e.Property(x => x.ValidIdImagePath).HasMaxLength(300);
            e.Property(x => x.PhotoPath).HasMaxLength(300);
            e.Property(x => x.StatusRemarks).HasMaxLength(500);

            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

            e.HasOne(x => x.Household)
                .WithMany(h => h.Accounts)
                .HasForeignKey(x => x.HouseholdId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasMany(x => x.Complaints).WithOne(c => c.User).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Emergencies).WithOne(c => c.User).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.PasswordResetCodes).WithOne(c => c.User).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- Household ----------
        b.Entity<Household>(e =>
        {
            e.ToTable("households");
            e.HasIndex(x => x.HouseholdNumber).IsUnique();
            e.Property(x => x.HouseholdNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Address).HasMaxLength(300).IsRequired();
            e.Property(x => x.Purok).HasMaxLength(100);
            e.Property(x => x.HeadOfFamily).HasMaxLength(150).IsRequired();
            e.Property(x => x.ContactNumber).HasMaxLength(30);

            e.HasMany(x => x.Members).WithOne(m => m.Household).HasForeignKey(m => m.HouseholdId).OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- HouseholdMember ----------
        b.Entity<HouseholdMember>(e =>
        {
            e.ToTable("household_members");
            e.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Gender).HasMaxLength(30);
            e.Property(x => x.RelationToHead).HasMaxLength(60);
            e.Property(x => x.CivilStatus).HasMaxLength(40);
            e.Property(x => x.Occupation).HasMaxLength(120);
            e.HasIndex(x => x.HouseholdId);
        });

        // ---------- Complaint ----------
        b.Entity<Complaint>(e =>
        {
            e.ToTable("complaints");
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.Type);
            e.HasIndex(x => x.CreatedAt);

            e.Property(x => x.Type).HasMaxLength(100).IsRequired();
            e.Property(x => x.Subject).HasMaxLength(200).IsRequired();
            // Long free text uses MySQL TEXT so the row stays under the 65535-byte limit.
            e.Property(x => x.Description).HasColumnType("text").IsRequired();
            e.Property(x => x.Location).HasMaxLength(300).IsRequired();
            e.Property(x => x.ImagePath).HasMaxLength(300);
            e.Property(x => x.Response).HasColumnType("text");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

            e.HasOne(x => x.AssignedOfficer)
                .WithMany()
                .HasForeignKey(x => x.AssignedOfficerId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasMany(x => x.Comments)
                .WithOne(c => c.Complaint)
                .HasForeignKey(c => c.ComplaintId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- ComplaintComment ----------
        b.Entity<ComplaintComment>(e =>
        {
            e.ToTable("complaint_comments");
            e.HasIndex(x => x.ComplaintId);
            e.Property(x => x.Message).HasColumnType("text").IsRequired();
            e.Property(x => x.StatusAtPost).HasMaxLength(20);

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Emergency ----------
        b.Entity<Emergency>(e =>
        {
            e.ToTable("emergencies");
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedAt);

            e.Property(x => x.Kind).HasMaxLength(100).IsRequired();
            e.Property(x => x.Location).HasMaxLength(300).IsRequired();
            e.Property(x => x.ContactNumber).HasMaxLength(30).IsRequired();
            e.Property(x => x.Description).HasColumnType("text").IsRequired();
            e.Property(x => x.ImagePath).HasMaxLength(300);
            e.Property(x => x.Response).HasColumnType("text");
            e.Property(x => x.Eta).HasMaxLength(100);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

            e.HasOne(x => x.AssignedOfficer)
                .WithMany()
                .HasForeignKey(x => x.AssignedOfficerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ---------- DailyOperation ----------
        b.Entity<DailyOperation>(e =>
        {
            e.ToTable("daily_operations");
            e.HasIndex(x => x.Date);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Details).HasColumnType("text").IsRequired();
            e.Property(x => x.ImagePath).HasMaxLength(300);
            e.Property(x => x.PersonnelInvolved).HasMaxLength(500);
            e.Property(x => x.Category).HasConversion<string>().HasMaxLength(40);

            e.HasOne(x => x.AssignedOfficer).WithMany().HasForeignKey(x => x.AssignedOfficerId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.AssignedStaff).WithMany().HasForeignKey(x => x.AssignedStaffId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Announcement ----------
        b.Entity<Announcement>(e =>
        {
            e.ToTable("announcements");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Body).HasColumnType("text").IsRequired();
            e.Property(x => x.ImagePath).HasMaxLength(300);
            e.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.IsPublished);
        });

        // ---------- Hotline ----------
        b.Entity<Hotline>(e =>
        {
            e.ToTable("hotlines");
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Number).HasMaxLength(50).IsRequired();
            e.Property(x => x.Description).HasMaxLength(300);
        });

        // ---------- OrganizationMember ----------
        b.Entity<OrganizationMember>(e =>
        {
            e.ToTable("organization_members");
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Position).HasMaxLength(150).IsRequired();
            e.Property(x => x.PhotoPath).HasMaxLength(300);

            e.HasOne(x => x.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // ---------- DutyRoster ----------
        b.Entity<DutyRoster>(e =>
        {
            e.ToTable("duty_rosters");
            e.HasIndex(x => x.Date);
            e.Property(x => x.AssignedDuty).HasMaxLength(150).IsRequired();
            e.Property(x => x.Area).HasMaxLength(150).IsRequired();
            e.Property(x => x.PersonnelName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Position).HasMaxLength(100).IsRequired();
            e.Property(x => x.ContactNumber).HasMaxLength(30);
            e.Property(x => x.TimeRange).HasMaxLength(60);
            e.Property(x => x.Shift).HasConversion<string>().HasMaxLength(20);

            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // ---------- AboutInfo ----------
        b.Entity<AboutInfo>(e =>
        {
            e.ToTable("about_info");
            e.Property(x => x.BarangayName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Municipality).HasMaxLength(200).IsRequired();
            e.Property(x => x.Mission).HasColumnType("text").IsRequired();
            e.Property(x => x.Vision).HasColumnType("text").IsRequired();
            e.Property(x => x.History).HasColumnType("text");
            e.Property(x => x.ContactEmail).HasMaxLength(200);
            e.Property(x => x.ContactNumber).HasMaxLength(30);
            e.Property(x => x.OfficeHours).HasMaxLength(200);
        });

        // ---------- PasswordResetCode ----------
        b.Entity<PasswordResetCode>(e =>
        {
            e.ToTable("password_reset_codes");
            e.HasIndex(x => x.UserId);
            e.Property(x => x.CodeHash).HasMaxLength(128).IsRequired();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added when entry.Entity.CreatedAt == default:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
    }
}
