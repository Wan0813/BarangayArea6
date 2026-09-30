using MyApp.Domain.Entities;

namespace MyApp.Domain.Abstractions;

/// <summary>
/// Persistence surface exposed to the Application layer. Implemented by
/// <c>AppDbContext</c> in Infrastructure. Using an interface keeps Application
/// independent of EF Core configuration details.
/// </summary>
public interface IApplicationDbContext
{
    IQueryable<User> Users { get; }
    IQueryable<Household> Households { get; }
    IQueryable<HouseholdMember> HouseholdMembers { get; }
    IQueryable<Complaint> Complaints { get; }
    IQueryable<ComplaintComment> ComplaintComments { get; }
    IQueryable<Emergency> Emergencies { get; }
    IQueryable<DailyOperation> DailyOperations { get; }
    IQueryable<Announcement> Announcements { get; }
    IQueryable<Hotline> Hotlines { get; }
    IQueryable<OrganizationMember> OrganizationMembers { get; }
    IQueryable<DutyRoster> DutyRosters { get; }
    IQueryable<AboutInfo> AboutInfos { get; }
    IQueryable<PasswordResetCode> PasswordResetCodes { get; }

    void Add<TEntity>(TEntity entity) where TEntity : class;
    void AddRange<TEntity>(IEnumerable<TEntity> entities) where TEntity : class;
    void Update<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    void RemoveRange<TEntity>(IEnumerable<TEntity> entities) where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
