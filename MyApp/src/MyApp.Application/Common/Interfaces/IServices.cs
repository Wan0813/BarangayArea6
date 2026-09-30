using MyApp.Application.Dtos.About;
using MyApp.Application.Dtos.Announcements;
using MyApp.Application.Dtos.Auth;
using MyApp.Application.Dtos.Complaints;
using MyApp.Application.Dtos.Dashboard;
using MyApp.Application.Dtos.Emergencies;
using MyApp.Application.Dtos.Households;
using MyApp.Application.Dtos.Operations;
using MyApp.Application.Dtos.Public;
using MyApp.Application.Dtos.Rosters;
using MyApp.Application.Dtos.Users;
using MyApp.Shared.Models;

namespace MyApp.Application.Common.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<string> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<ForgotPasswordResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task VerifyResetCodeAsync(VerifyResetCodeRequest request, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task<UserDto> GetProfileAsync(int userId, CancellationToken ct = default);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<UserDto> UpdateOwnPhotoAsync(int userId, string photoPath, CancellationToken ct = default);
}

public class ForgotPasswordResult
{
    public string Message { get; set; } = string.Empty;

    /// <summary>Only populated when Auth:ReturnResetCodeInResponse is enabled (development).</summary>
    public string? DevCode { get; set; }
}

public interface IUserService
{
    Task<PagedResult<UserDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<UserDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<UserDto> UpdateAsync(int id, UpdateUserRequest request, CancellationToken ct = default);
    Task<UserDto> UpdateStatusAsync(int id, UpdateUserStatusRequest request, int actingUserId, CancellationToken ct = default);
    Task<UserDto> UpdateRoleAsync(int id, UpdateUserRoleRequest request, int actingUserId, CancellationToken ct = default);
    Task<UserDto> UpdatePositionAsync(int id, UpdatePositionRequest request, CancellationToken ct = default);
    Task<UserDto> UpdatePhotoAsync(int id, string photoPath, CancellationToken ct = default);
    Task DeleteAsync(int id, int actingUserId, CancellationToken ct = default);
    Task<List<StaffOptionDto>> GetStaffOptionsAsync(CancellationToken ct = default);
}

public interface IComplaintService
{
    Task<PagedResult<ComplaintDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<ComplaintDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ComplaintDto> CreateAsync(CreateComplaintRequest request, int userId, CancellationToken ct = default);
    Task<ComplaintDto> UpdateStatusAsync(int id, UpdateComplaintStatusRequest request, CancellationToken ct = default);
    Task<ComplaintCommentDto> AddCommentAsync(int id, AddComplaintCommentRequest request, CancellationToken ct = default);
    Task<List<ComplaintCommentDto>> GetCommentsAsync(int id, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<ComplaintStatsDto> GetStatsAsync(CancellationToken ct = default);
    Task<List<string>> GetTypesAsync(CancellationToken ct = default);
}

public interface IEmergencyService
{
    Task<PagedResult<EmergencyDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<EmergencyDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<EmergencyDto> CreateAsync(CreateEmergencyRequest request, int userId, CancellationToken ct = default);
    Task<EmergencyDto> UpdateStatusAsync(int id, UpdateEmergencyStatusRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<EmergencyStatsDto> GetStatsAsync(CancellationToken ct = default);
}

public interface IOperationService
{
    Task<PagedResult<OperationDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<OperationDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<OperationDto> CreateAsync(CreateOperationRequest request, int userId, CancellationToken ct = default);
    Task<OperationDto> UpdateAsync(int id, UpdateOperationRequest request, CancellationToken ct = default);
    Task<OperationDto> SetPublishedAsync(int id, bool isPublished, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IAnnouncementService
{
    Task<PagedResult<AnnouncementDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<AnnouncementDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, int userId, CancellationToken ct = default);
    Task<AnnouncementDto> UpdateAsync(int id, UpdateAnnouncementRequest request, CancellationToken ct = default);
    Task<AnnouncementDto> SetPublishedAsync(int id, bool isPublished, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardOverviewDto> GetOverviewAsync(CancellationToken ct = default);
    Task<List<DutyRosterDto>> GetDutyRosterAsync(DateOnly? date, string? search, CancellationToken ct = default);
    Task<PagedResult<HouseholdDto>> GetHouseholdsSummaryAsync(SearchQuery query, CancellationToken ct = default);
}

public interface IHouseholdService
{
    Task<PagedResult<HouseholdDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<HouseholdDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<HouseholdDto> CreateAsync(SaveHouseholdRequest request, CancellationToken ct = default);
    Task<HouseholdDto> UpdateAsync(int id, SaveHouseholdRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<HouseholdMemberDto> AddMemberAsync(int householdId, SaveHouseholdMemberRequest request, CancellationToken ct = default);
    Task<HouseholdMemberDto> UpdateMemberAsync(int memberId, SaveHouseholdMemberRequest request, CancellationToken ct = default);
    Task DeleteMemberAsync(int memberId, CancellationToken ct = default);
}

public interface IDutyRosterService
{
    Task<PagedResult<DutyRosterDto>> GetPagedAsync(SearchQuery query, DateOnly? date, CancellationToken ct = default);
    Task<DutyRosterDto> CreateAsync(SaveDutyRosterRequest request, CancellationToken ct = default);
    Task<DutyRosterDto> UpdateAsync(int id, SaveDutyRosterRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IAboutService
{
    Task<AboutBundleDto> GetAsync(CancellationToken ct = default);
    Task<AboutInfoDto> UpdateAsync(SaveAboutInfoRequest request, CancellationToken ct = default);

    Task<List<HotlineDto>> GetHotlinesAsync(CancellationToken ct = default);
    Task<HotlineDto> CreateHotlineAsync(SaveHotlineRequest request, CancellationToken ct = default);
    Task<HotlineDto> UpdateHotlineAsync(int id, SaveHotlineRequest request, CancellationToken ct = default);
    Task DeleteHotlineAsync(int id, CancellationToken ct = default);

    Task<List<OrganizationMemberDto>> GetOrganizationAsync(CancellationToken ct = default);
    Task<OrganizationMemberDto> CreateOrganizationMemberAsync(SaveOrganizationMemberRequest request, CancellationToken ct = default);
    Task<OrganizationMemberDto> UpdateOrganizationMemberAsync(int id, SaveOrganizationMemberRequest request, CancellationToken ct = default);
    Task DeleteOrganizationMemberAsync(int id, CancellationToken ct = default);
}

public interface IPublicService
{
    Task<PublicSiteDto> GetSiteAsync(CancellationToken ct = default);
    Task<AboutInfoDto> GetInfoAsync(CancellationToken ct = default);
    Task<List<HotlineDto>> GetHotlinesAsync(CancellationToken ct = default);
    Task<List<OrganizationMemberDto>> GetOrganizationAsync(CancellationToken ct = default);
    Task<PagedResult<AnnouncementDto>> GetAnnouncementsAsync(SearchQuery query, CancellationToken ct = default);
    Task<PublicStatisticsDto> GetStatisticsAsync(CancellationToken ct = default);
    Task<DownloadInfoDto> GetDownloadsAsync(CancellationToken ct = default);
}
