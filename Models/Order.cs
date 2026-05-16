namespace CafeShop.Api.Models;

public class Order
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public int UserId { get; set; }
    public AppUser? User { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = OrderWorkflowConstants.StatusChoXuLy;
    public string PaymentMethod { get; set; } = OrderWorkflowConstants.PaymentKhiNhanHang;
    public string PaymentStatus { get; set; } = OrderWorkflowConstants.PayChua;
    public string ShippingAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
