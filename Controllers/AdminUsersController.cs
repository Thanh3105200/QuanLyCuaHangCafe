using CafeShop.Api.Data;
using CafeShop.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public class AdminUsersController(CafeShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserResponse>>> GetUsers()
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AdminUserResponse(
                x.Id,
                x.FullName,
                x.Email,
                x.Role,
                x.IsActive,
                x.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateUserRoleRequest request)
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user is null) return NotFound();

        var role = request.Role.Trim();
        if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !role.Equals("Customer", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Vai trò không hợp lệ.");
        }

        user.Role = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Customer";
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> UpdateActive(int id, UpdateUserActiveRequest request)
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
