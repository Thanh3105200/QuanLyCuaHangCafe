using System.ComponentModel.DataAnnotations;

namespace CafeShop.Api.Dtos;

public record AdminUserResponse(
    int Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    DateTime CreatedAt);

public record UpdateUserRoleRequest([param: Required(ErrorMessage = "Vai trò là bắt buộc."), StringLength(50)] string Role);
public record UpdateUserActiveRequest([param: Required(ErrorMessage = "Trạng thái hoạt động là bắt buộc.")] bool IsActive);
