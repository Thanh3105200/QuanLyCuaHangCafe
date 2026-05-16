namespace CafeShop.Api.Models;

/// <summary>Giá trị trạng thái đơn và thanh toán (tiếng Việt).</summary>
public static class OrderWorkflowConstants
{
    public const string StatusChoXuLy = "Chờ xử lý";
    public const string StatusDangGiao = "Đang giao";
    public const string StatusDaGiao = "Đã giao";
    public const string StatusDaHuy = "Đã hủy";

    public const string PaymentKhiNhanHang = "Thanh toán khi nhận hàng";
    public const string PaymentTrucTuyen = "Thanh toán trực tuyến";

    public const string PayChua = "Chưa thanh toán";
    public const string PayDa = "Đã thanh toán";
}
