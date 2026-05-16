using System.ComponentModel.DataAnnotations;

namespace CafeShop.Api.Dtos;

public record AddCartItemRequest(
    [param: Range(1, int.MaxValue, ErrorMessage = "Sản phẩm không hợp lệ.")] int ProductId,
    [param: Range(1, 100, ErrorMessage = "Số lượng phải từ 1 đến 100.")] int Quantity);

public record UpdateCartItemRequest([param: Range(1, 100, ErrorMessage = "Số lượng phải từ 1 đến 100.")] int Quantity);

public record CartItemResponse(
    int Id,
    int ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);
