using System.ComponentModel.DataAnnotations;

namespace CafeShop.Api.Dtos;

public record CategoryRequest(
    [param: Required(ErrorMessage = "Tên danh mục là bắt buộc."), StringLength(150, MinimumLength = 2, ErrorMessage = "Tên danh mục cần từ 2 đến 150 ký tự.")] string Name,
    [param: StringLength(500, ErrorMessage = "Mô tả tối đa 500 ký tự.")] string? Description);

public record CategoryResponse(int Id, string Name, string? Description);
