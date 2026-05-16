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
[Route("api/cart")]
public class CartController(CafeShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CartItemResponse>>> GetMyCart()
    {
        var userId = User.GetUserId();
        var items = await dbContext.CartItems
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Include(x => x.Product)
            .Select(x => new CartItemResponse(
                x.Id,
                x.ProductId,
                x.Product != null ? x.Product.Name : string.Empty,
                x.Product != null ? x.Product.Price : 0,
                x.Quantity,
                (x.Product != null ? x.Product.Price : 0) * x.Quantity))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem(AddCartItemRequest request)
    {
        var userId = User.GetUserId();
        var product = await dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ProductId && x.IsAvailable);
        if (product is null) return BadRequest("Sản phẩm không tồn tại hoặc đã ngưng bán.");

        var existingItem = await dbContext.CartItems
            .FirstOrDefaultAsync(x => x.UserId == userId && x.ProductId == request.ProductId);

        if (existingItem is null)
        {
            dbContext.CartItems.Add(new CartItem
            {
                UserId = userId,
                ProductId = request.ProductId,
                Quantity = request.Quantity
            });
        }
        else
        {
            existingItem.Quantity += request.Quantity;
        }

        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, UpdateCartItemRequest request)
    {
        var userId = User.GetUserId();
        var item = await dbContext.CartItems.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (item is null) return NotFound();

        item.Quantity = request.Quantity;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var userId = User.GetUserId();
        var item = await dbContext.CartItems.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (item is null) return NotFound();

        dbContext.CartItems.Remove(item);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearCart()
    {
        var userId = User.GetUserId();
        var items = await dbContext.CartItems.Where(x => x.UserId == userId).ToListAsync();
        if (items.Count == 0) return NoContent();

        dbContext.CartItems.RemoveRange(items);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
