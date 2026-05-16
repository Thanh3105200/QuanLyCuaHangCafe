using System.ComponentModel.DataAnnotations;

namespace CafeShop.Api.Dtos;

public record RegisterRequest(
    [param: Required(ErrorMessage = "Họ tên là bắt buộc."), StringLength(150, MinimumLength = 2, ErrorMessage = "Họ tên cần từ 2 đến 150 ký tự.")] string FullName,
    [param: Required(ErrorMessage = "Thư điện tử là bắt buộc."), StringLength(200, ErrorMessage = "Thư điện tử tối đa 200 ký tự.")] string Email,
    [param: Required(ErrorMessage = "Mật khẩu là bắt buộc."), StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu cần từ 6 đến 100 ký tự.")] string Password);

public record LoginRequest(
    [param: Required(ErrorMessage = "Thư điện tử là bắt buộc."), StringLength(200)] string Email,
    [param: Required(ErrorMessage = "Mật khẩu là bắt buộc."), StringLength(100, MinimumLength = 6)] string Password);

public record AuthResponse(string Token, DateTime ExpiresAt, string FullName, string Email, string Role);
public record UserProfileResponse(int Id, string FullName, string Email, string Role, DateTime CreatedAt);
