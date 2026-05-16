using System.ComponentModel.DataAnnotations;

namespace CafeShop.Api.Dtos;

public record CreateOrderRequest(
    [param: Required(ErrorMessage = "Địa chỉ giao hàng là bắt buộc."), StringLength(500, MinimumLength = 10, ErrorMessage = "Địa chỉ giao hàng cần từ 10 đến 500 ký tự.")] string ShippingAddress,
    [param: Required(ErrorMessage = "Phương thức thanh toán là bắt buộc."), StringLength(80, ErrorMessage = "Phương thức thanh toán không hợp lệ.")] string PaymentMethod);

public record UpdateOrderStatusRequest([param: Required(ErrorMessage = "Trạng thái là bắt buộc."), StringLength(50)] string Status);
public record UpdatePaymentStatusRequest([param: Required(ErrorMessage = "Tình trạng thanh toán là bắt buộc."), StringLength(50)] string PaymentStatus);

public record OrderItemResponse(
    int ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public record OrderCustomerResponse(
    int UserId,
    string FullName,
    string Email);

public record OrderResponse(
    int Id,
    string OrderCode,
    decimal TotalAmount,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    string ShippingAddress,
    DateTime CreatedAt,
    OrderCustomerResponse Customer,
    IReadOnlyCollection<OrderItemResponse> Items);

public record OrderStatsResponse(
    string Label,
    decimal Revenue,
    int Quantity);

public record TopProductStatsResponse(
    int ProductId,
    string ProductName,
    int QuantitySold,
    decimal Revenue);
