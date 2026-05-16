using CafeShop.Api.Data;
using CafeShop.Api.Dtos;
using CafeShop.Api.Extensions;
using CafeShop.Api.Models;
using CafeShop.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeShop.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(CafeShopDbContext dbContext, TokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var existingUser = await dbContext.Users.AnyAsync(x => x.Email == email);
        if (existingUser) return BadRequest("Email đã được sử dụng.");

        var user = new AppUser
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Customer",
            IsActive = true
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var (token, expiresAt) = tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, expiresAt, user.FullName, user.Email, user.Role));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is null) return Unauthorized("Tài khoản hoặc mật khẩu không đúng.");
        if (!user.IsActive) return Unauthorized("Tài khoản đã bị khóa.");

        var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!validPassword) return Unauthorized("Tài khoản hoặc mật khẩu không đúng.");

        var (token, expiresAt) = tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, expiresAt, user.FullName, user.Email, user.Role));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponse>> GetProfile()
    {
        var userId = User.GetUserId();
        var user = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == userId)
            .Select(x => new UserProfileResponse(x.Id, x.FullName, x.Email, x.Role, x.CreatedAt))
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }
}
