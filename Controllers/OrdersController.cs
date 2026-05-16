using CafeShop.Api.Data;
using CafeShop.Api.Dtos;
using CafeShop.Api.Extensions;
using CafeShop.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeShop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public class OrdersController(CafeShopDbContext dbContext) : ControllerBase
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        OrderWorkflowConstants.StatusChoXuLy,
        OrderWorkflowConstants.StatusDangGiao,
        OrderWorkflowConstants.StatusDaGiao,
        OrderWorkflowConstants.StatusDaHuy
    };

    private static readonly HashSet<string> AllowedPaymentMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        OrderWorkflowConstants.PaymentKhiNhanHang,
        OrderWorkflowConstants.PaymentTrucTuyen
    };

    private static readonly HashSet<string> AllowedPaymentStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        OrderWorkflowConstants.PayChua,
        OrderWorkflowConstants.PayDa
    };

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> CreateOrder(CreateOrderRequest request)
    {
        var userId = User.GetUserId();
        var cartItems = await dbContext.CartItems
            .Where(x => x.UserId == userId)
            .Include(x => x.Product)
            .ToListAsync();

        if (cartItems.Count == 0) return BadRequest("Gio hang dang trong.");

        var shippingAddress = request.ShippingAddress.Trim();
        if (string.IsNullOrWhiteSpace(shippingAddress))
        {
            return BadRequest("Dia chi giao hang khong hop le.");
        }

        var paymentMethod = request.PaymentMethod.Trim();
        if (!AllowedPaymentMethods.Contains(paymentMethod))
        {
            return BadRequest("Phuong thuc thanh toan khong hop le.");
        }

        var orderItems = cartItems.Select(x => new OrderItem
        {
            ProductId = x.ProductId,
            Quantity = x.Quantity,
            UnitPrice = x.Product?.Price ?? 0
        }).ToList();

        var totalAmount = orderItems.Sum(x => x.UnitPrice * x.Quantity);
        var order = new Order
        {
            UserId = userId,
            OrderCode = GenerateOrderCode(),
            ShippingAddress = shippingAddress,
            Status = OrderWorkflowConstants.StatusChoXuLy,
            PaymentMethod = paymentMethod,
            PaymentStatus = OrderWorkflowConstants.PayChua,
            TotalAmount = totalAmount,
            Items = orderItems
        };

        dbContext.Orders.Add(order);
        dbContext.CartItems.RemoveRange(cartItems);
        await dbContext.SaveChangesAsync();

        await dbContext.Entry(order).Reference(x => x.User).LoadAsync();
        return Ok(ToResponse(order, orderItems, cartItems, order.User));
    }

    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<OrderResponse>>> GetMyOrders()
    {
        var userId = User.GetUserId();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Include(x => x.User)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        var responses = orders.Select(MapOrder).ToList();
        return Ok(responses);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<OrderResponse>>> GetAllOrders()
    {
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        var responses = orders.Select(MapOrder).ToList();
        return Ok(responses);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderResponse>> GetOrderById(int id)
    {
        var userId = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (order is null) return NotFound();
        if (!isAdmin && order.UserId != userId) return Forbid();

        return Ok(MapOrder(order));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusRequest request)
    {
        var order = await dbContext.Orders.FindAsync(id);
        if (order is null) return NotFound();

        var status = request.Status.Trim();
        if (!AllowedStatuses.Contains(status))
        {
            return BadRequest("Trạng thái đơn hàng không hợp lệ.");
        }

        order.Status = status;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:int}/payment-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePaymentStatus(int id, UpdatePaymentStatusRequest request)
    {
        var order = await dbContext.Orders.FindAsync(id);
        if (order is null) return NotFound();

        var paymentStatus = request.PaymentStatus.Trim();
        if (!AllowedPaymentStatuses.Contains(paymentStatus))
        {
            return BadRequest("Tình trạng thanh toán không hợp lệ.");
        }

        order.PaymentStatus = paymentStatus;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<OrderStatsResponse>>> GetStats([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string groupBy = "ngay")
    {
        var start = (from ?? DateTime.UtcNow.AddDays(-29)).Date;
        var end = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.PaymentStatus == OrderWorkflowConstants.PayDa && x.CreatedAt >= start && x.CreatedAt <= end)
            .ToListAsync();

        IEnumerable<IGrouping<string, Order>> grouped = groupBy.Equals("thang", StringComparison.OrdinalIgnoreCase)
            ? orders.GroupBy(x => x.CreatedAt.ToLocalTime().ToString("yyyy-MM"))
            : orders.GroupBy(x => x.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd"));

        var result = grouped
            .OrderBy(x => x.Key)
            .Select(x => new OrderStatsResponse(
                x.Key,
                x.Sum(order => order.TotalAmount),
                x.Sum(order => order.Items.Sum(item => item.Quantity))))
            .ToList();

        return Ok(result);
    }

    [HttpGet("top-products")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<TopProductStatsResponse>>> GetTopProducts([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int take = 5)
    {
        var start = (from ?? DateTime.UtcNow.AddDays(-29)).Date;
        var end = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
        var normalizedTake = take <= 0 ? 5 : Math.Min(take, 20);

        var topProducts = await dbContext.OrderItems
            .AsNoTracking()
            .Where(x => x.Order != null && x.Order.PaymentStatus == OrderWorkflowConstants.PayDa && x.Order.CreatedAt >= start && x.Order.CreatedAt <= end)
            .GroupBy(x => new { x.ProductId, ProductName = x.Product != null ? x.Product.Name : string.Empty })
            .Select(group => new TopProductStatsResponse(
                group.Key.ProductId,
                group.Key.ProductName,
                group.Sum(x => x.Quantity),
                group.Sum(x => x.Quantity * x.UnitPrice)))
            .OrderByDescending(x => x.QuantitySold)
            .Take(normalizedTake)
            .ToListAsync();

        return Ok(topProducts);
    }

    private static OrderResponse MapOrder(Order order)
    {
        var itemResponses = order.Items.Select(item => new OrderItemResponse(
            item.ProductId,
            item.Product?.Name ?? string.Empty,
            item.Quantity,
            item.UnitPrice,
            item.UnitPrice * item.Quantity)).ToList();

        var customer = new OrderCustomerResponse(
            order.UserId,
            order.User?.FullName ?? string.Empty,
            order.User?.Email ?? string.Empty);

        return new OrderResponse(
            order.Id,
            order.OrderCode,
            order.TotalAmount,
            order.Status,
            order.PaymentMethod,
            order.PaymentStatus,
            order.ShippingAddress,
            order.CreatedAt,
            customer,
            itemResponses);
    }

    private static OrderResponse ToResponse(Order order, IReadOnlyCollection<OrderItem> orderItems, IReadOnlyCollection<CartItem> cartItems, AppUser? user)
    {
        var namesByProductId = cartItems
            .Where(x => x.Product != null)
            .ToDictionary(x => x.ProductId, x => x.Product!.Name);

        var responseItems = orderItems.Select(item => new OrderItemResponse(
            item.ProductId,
            namesByProductId.GetValueOrDefault(item.ProductId, string.Empty),
            item.Quantity,
            item.UnitPrice,
            item.UnitPrice * item.Quantity)).ToList();

        var customer = new OrderCustomerResponse(
            order.UserId,
            user?.FullName ?? string.Empty,
            user?.Email ?? string.Empty);

        return new OrderResponse(
            order.Id,
            order.OrderCode,
            order.TotalAmount,
            order.Status,
            order.PaymentMethod,
            order.PaymentStatus,
            order.ShippingAddress,
            order.CreatedAt,
            customer,
            responseItems);
    }

    private static string GenerateOrderCode()
    {
        return $"ĐH{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}";
    }
}
