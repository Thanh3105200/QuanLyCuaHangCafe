using System.Security.Claims;

namespace CafeShop.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? user.FindFirstValue("sub")
                    ?? throw new UnauthorizedAccessException("Phiên đăng nhập không hợp lệ.");

        if (!int.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException("Mã người dùng trong phiên không hợp lệ.");
        }

        return userId;
    }
}
