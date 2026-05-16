using System.ComponentModel.DataAnnotations;

namespace CafeShop.Api.Dtos;

public record ProductRequest(
    [param: Required(ErrorMessage = "Tên sản phẩm là bắt buộc."), StringLength(200, MinimumLength = 2, ErrorMessage = "Tên sản phẩm cần từ 2 đến 200 ký tự.")] string Name,
    [param: StringLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự.")] string? Description,
    [param: Range(1000, 100000000, ErrorMessage = "Giá phải từ 1.000 đồng trở lên.")] decimal Price,
    string? ImageUrl,
    bool IsAvailable,
    [param: Range(1, int.MaxValue, ErrorMessage = "Danh mục không hợp lệ.")] int CategoryId);

public record ProductQuery(
    string? Search,
    int? CategoryId,
    bool? IsAvailable,
    int Page = 1,
    int PageSize = 10);

public record ProductResponse(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    bool IsAvailable,
    int CategoryId,
    string CategoryName);

/// <summary>Kết quả xóa sản phẩm: có thể chỉ chuyển sang ngừng bán nếu đã có trong đơn/giỏ.</summary>
public record ProductDeleteResponse(bool NgungBan, string ThongBao);
