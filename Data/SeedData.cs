using CafeShop.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeShop.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CafeShopDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        await dbContext.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Products', 'ImageUrl') IS NOT NULL
            BEGIN
                ALTER TABLE [Products] ALTER COLUMN [ImageUrl] NVARCHAR(MAX) NULL;
            END
            """);
        await dbContext.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Users', 'IsActive') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [IsActive] bit NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT(1);
            END
            """);
        await dbContext.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Orders', 'OrderCode') IS NULL
            BEGIN
                ALTER TABLE [Orders] ADD [OrderCode] NVARCHAR(40) NOT NULL CONSTRAINT DF_Orders_OrderCode DEFAULT('');
            END
            IF COL_LENGTH('Orders', 'PaymentMethod') IS NULL
            BEGIN
                ALTER TABLE [Orders] ADD [PaymentMethod] NVARCHAR(80) NOT NULL CONSTRAINT DF_Orders_PaymentMethod DEFAULT(N'Thanh toán khi nhận hàng');
            END
            IF COL_LENGTH('Orders', 'PaymentStatus') IS NULL
            BEGIN
                ALTER TABLE [Orders] ADD [PaymentStatus] NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_PaymentStatus DEFAULT(N'Chưa thanh toán');
            END
            """);
        await dbContext.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Orders', 'PaymentMethod') IS NOT NULL
            BEGIN
                ALTER TABLE [Orders] ALTER COLUMN [PaymentMethod] NVARCHAR(80) NOT NULL;
            END
            IF COL_LENGTH('Orders', 'PaymentStatus') IS NOT NULL
            BEGIN
                ALTER TABLE [Orders] ALTER COLUMN [PaymentStatus] NVARCHAR(50) NOT NULL;
            END
            """);
        await dbContext.Database.ExecuteSqlRawAsync("""
            UPDATE [Orders] SET [Status] = N'Chờ xử lý' WHERE [Status] IN (N'Pending', N'pending');
            UPDATE [Orders] SET [Status] = N'Đang giao' WHERE [Status] IN (N'Shipping', N'shipping');
            UPDATE [Orders] SET [Status] = N'Đã giao' WHERE [Status] IN (N'Delivered', N'delivered');
            UPDATE [Orders] SET [Status] = N'Đã hủy' WHERE [Status] IN (N'Cancelled', N'cancelled');
            UPDATE [Orders] SET [PaymentStatus] = N'Đã thanh toán' WHERE [PaymentStatus] IN (N'Paid', N'paid');
            UPDATE [Orders] SET [PaymentStatus] = N'Chưa thanh toán' WHERE [PaymentStatus] IN (N'Unpaid', N'unpaid');
            UPDATE [Orders] SET [PaymentMethod] = N'Thanh toán khi nhận hàng' WHERE [PaymentMethod] IN (N'COD', N'cod');
            UPDATE [Orders] SET [PaymentMethod] = N'Thanh toán trực tuyến' WHERE [PaymentMethod] IN (N'Online', N'online');
            UPDATE [Orders] SET [OrderCode] = STUFF([OrderCode], 1, 2, N'ĐH') WHERE [OrderCode] LIKE N'OD%';
            """);
        await dbContext.Database.ExecuteSqlRawAsync("""
            UPDATE [Orders]
            SET [OrderCode] = CONCAT(N'ĐH', FORMAT([CreatedAt], 'yyyyMMdd'), RIGHT(CONCAT('000000', CAST([Id] AS nvarchar(10))), 6))
            WHERE [OrderCode] = '';
            """);
        await dbContext.Database.ExecuteSqlRawAsync("""
            UPDATE [Categories] SET [Name] = N'Cà phê', [Description] = N'Các món cà phê nóng, đá và đá xay.' WHERE [Name] = N'Ca phe';
            UPDATE [Categories] SET [Name] = N'Trà sữa', [Description] = N'Trà sữa truyền thống, macchiato và topping.' WHERE [Name] = N'Tra sua';
            UPDATE [Categories] SET [Name] = N'Trà', [Description] = N'Trà trái cây, trà thanh nhiệt, trà thơm vị.' WHERE [Name] IN (N'Tra');
            UPDATE [Categories] SET [Name] = N'Đồ ăn', [Description] = N'Bánh ngọt, bánh mặn và đồ ăn nhẹ ăn kèm.' WHERE [Name] = N'Do an';
            UPDATE [Categories] SET [Name] = N'Nước ép', [Description] = N'Nước ép trái cây tươi và sinh tố.' WHERE [Name] = N'Nuoc ep';
            """);

        var adminEmail = "truong@";
        var adminPassword = "truong@123";
        var adminUser = await dbContext.Users
            .FirstOrDefaultAsync(x => x.Role == "Admin" || x.Email == "admin@cafeshop.local" || x.Email == adminEmail);

        if (adminUser is null)
        {
            dbContext.Users.Add(new AppUser
            {
                FullName = "Trường Admin",
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = "Admin",
                IsActive = true
            });
        }
        else
        {
            adminUser.FullName = "Trường Admin";
            adminUser.Email = adminEmail;
            adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
            adminUser.Role = "Admin";
            adminUser.IsActive = true;
        }

        var defaultCategories = new List<Category>
        {
            new() { Name = "Cà phê", Description = "Các món cà phê nóng, đá và đá xay." },
            new() { Name = "Trà sữa", Description = "Trà sữa truyền thống, macchiato và topping." },
            new() { Name = "Trà", Description = "Trà trái cây, trà thanh nhiệt, trà thơm vị." },
            new() { Name = "Đồ ăn", Description = "Bánh ngọt, bánh mặn và đồ ăn nhẹ ăn kèm." },
            new() { Name = "Nước ép", Description = "Nước ép trái cây tươi và sinh tố." }
        };

        var existingCategories = await dbContext.Categories
            .Include(x => x.Products)
            .ToListAsync();

        var desiredNameSet = defaultCategories
            .Select(x => x.Name.ToLower())
            .ToHashSet();

        foreach (var defaultCategory in defaultCategories)
        {
            var existed = existingCategories
                .FirstOrDefault(x => x.Name.Equals(defaultCategory.Name, StringComparison.OrdinalIgnoreCase));
            if (existed is null)
            {
                dbContext.Categories.Add(defaultCategory);
            }
            else
            {
                existed.Description = defaultCategory.Description;
            }
        }

        // Xóa các danh mục cũ không còn dùng nếu chưa gắn sản phẩm.
        var removableLegacyCategories = existingCategories
            .Where(x => !desiredNameSet.Contains(x.Name.ToLower()) && (x.Products?.Count ?? 0) == 0)
            .ToList();
        if (removableLegacyCategories.Count > 0)
        {
            dbContext.Categories.RemoveRange(removableLegacyCategories);
        }

        await dbContext.SaveChangesAsync();
    }
}
