using CafeShop.Api.Data;
using CafeShop.Api.Dtos;
using CafeShop.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeShop.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(CafeShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductResponse>>> GetAll([FromQuery] ProductQuery query)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize switch
        {
            <= 0 => 10,
            > 50 => 50,
            _ => query.PageSize
        };

        var productQuery = dbContext.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var keyword = query.Search.Trim();
            productQuery = productQuery.Where(x => x.Name.Contains(keyword));
        }

        if (query.CategoryId.HasValue)
        {
            productQuery = productQuery.Where(x => x.CategoryId == query.CategoryId.Value);
        }

        var laQuanTri = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        if (!laQuanTri)
        {
            productQuery = productQuery.Where(x => x.IsAvailable);
        }
        else if (query.IsAvailable.HasValue)
        {
            productQuery = productQuery.Where(x => x.IsAvailable == query.IsAvailable.Value);
        }

        var totalItems = await productQuery.CountAsync();
        var products = await productQuery
            .OrderBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ProductResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Price,
                x.ImageUrl,
                x.IsAvailable,
                x.CategoryId,
                x.Category != null ? x.Category.Name : string.Empty))
            .ToListAsync();

        var result = new PagedResult<ProductResponse>(
            products,
            page,
            pageSize,
            totalItems,
            (int)Math.Ceiling((double)totalItems / pageSize));

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetById(int id)
    {
        var laQuanTri = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        var productQuery = dbContext.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Where(x => x.Id == id);
        if (!laQuanTri)
        {
            productQuery = productQuery.Where(x => x.IsAvailable);
        }

        var product = await productQuery
            .Select(x => new ProductResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Price,
                x.ImageUrl,
                x.IsAvailable,
                x.CategoryId,
                x.Category != null ? x.Category.Name : string.Empty))
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductResponse>> Create(ProductRequest request)
    {
        var categoryExists = await dbContext.Categories.AnyAsync(x => x.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Mã danh mục không tồn tại.");
        }

        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            Price = request.Price,
            ImageUrl = request.ImageUrl,
            IsAvailable = request.IsAvailable,
            CategoryId = request.CategoryId
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();

        var categoryName = await dbContext.Categories
            .Where(x => x.Id == product.CategoryId)
            .Select(x => x.Name)
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, new ProductResponse(
            product.Id,
            product.Name,
            product.Description,
            product.Price,
            product.ImageUrl,
            product.IsAvailable,
            product.CategoryId,
            categoryName));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, ProductRequest request)
    {
        var product = await dbContext.Products.FindAsync(id);
        if (product is null) return NotFound();

        var categoryExists = await dbContext.Categories.AnyAsync(x => x.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Mã danh mục không tồn tại.");
        }

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.ImageUrl = request.ImageUrl;
        product.IsAvailable = request.IsAvailable;
        product.CategoryId = request.CategoryId;

        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await dbContext.Products.FindAsync(id);
        if (product is null) return NotFound();

        var coTrongDonHoacGio = await dbContext.OrderItems.AsNoTracking().AnyAsync(x => x.ProductId == id)
            || await dbContext.CartItems.AsNoTracking().AnyAsync(x => x.ProductId == id);

        if (coTrongDonHoacGio)
        {
            product.IsAvailable = false;
            await dbContext.SaveChangesAsync();
            return Ok(new ProductDeleteResponse(
                NgungBan: true,
                ThongBao: "Sản phẩm đã từng có trong giỏ hoặc đơn hàng nên không xóa được. Đã chuyển sang trạng thái ngừng bán."));
        }

        dbContext.Products.Remove(product);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
