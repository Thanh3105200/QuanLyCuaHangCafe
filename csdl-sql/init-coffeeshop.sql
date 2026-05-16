
 
*/
IF DB_ID('CoffeeShopDB') IS NULL
BEGIN
  CREATE DATABASE CoffeeShopDB;
END
GO
USE CoffeeShopDB;
GO
/* =========================
   1) XOA DOI TUONG CU (neu co)
========================= */
IF OBJECT_ID('dbo.sp_Admin_DeleteEmployee', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_DeleteEmployee;
IF OBJECT_ID('dbo.sp_Admin_AddEmployee', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_AddEmployee;
IF OBJECT_ID('dbo.sp_Admin_DeleteProduct', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_DeleteProduct;
IF OBJECT_ID('dbo.sp_Admin_AddProduct', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_AddProduct;
GO
IF OBJECT_ID('dbo.vw_TopSellingProducts', 'V') IS NOT NULL DROP VIEW dbo.vw_TopSellingProducts;
IF OBJECT_ID('dbo.vw_DailyRevenue', 'V') IS NOT NULL DROP VIEW dbo.vw_DailyRevenue;
IF OBJECT_ID('dbo.vw_ProductSalesSummary', 'V') IS NOT NULL DROP VIEW dbo.vw_ProductSalesSummary;
GO
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
IF OBJECT_ID('dbo.StockMovements', 'U') IS NOT NULL DROP TABLE dbo.StockMovements;
IF OBJECT_ID('dbo.InvoiceItems', 'U') IS NOT NULL DROP TABLE dbo.InvoiceItems;
IF OBJECT_ID('dbo.Invoices', 'U') IS NOT NULL DROP TABLE dbo.Invoices;
IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DROP TABLE dbo.Customers;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO
/* =========================
   2) BANG ROLE + USERS
========================= */
CREATE TABLE dbo.Roles (
  RoleId       INT IDENTITY(1,1) PRIMARY KEY,
  RoleCode     NVARCHAR(30) NOT NULL UNIQUE, -- ADMIN / STAFF / CUSTOMER
  RoleName     NVARCHAR(100) NOT NULL
);
GO
CREATE TABLE dbo.Users (
  UserId           INT IDENTITY(1,1) PRIMARY KEY,
  Username         NVARCHAR(100) NOT NULL UNIQUE,
  PasswordHash     NVARCHAR(255) NOT NULL,
  FullName         NVARCHAR(150) NOT NULL,
  Phone            NVARCHAR(20) NULL,
  Email            NVARCHAR(150) NULL,
  RoleId           INT NOT NULL,
  IsActive         BIT NOT NULL DEFAULT 1,
  CreatedAt        DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  UpdatedAt        DATETIME2 NULL,
  CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
);
GO
/* =========================
   3) KHACH HANG
========================= */
CREATE TABLE dbo.Customers (
  CustomerId       INT IDENTITY(1,1) PRIMARY KEY,
  UserId           INT NULL, -- co the khach hang khong co tai khoan
  CustomerName     NVARCHAR(150) NOT NULL,
  Phone            NVARCHAR(20) NULL,
  Email            NVARCHAR(150) NULL,
  AddressLine      NVARCHAR(255) NULL,
  CreatedAt        DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Customers_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
GO
/* =========================
   4) SAN PHAM + DANH MUC
========================= */
CREATE TABLE dbo.Categories (
  CategoryId       INT IDENTITY(1,1) PRIMARY KEY,
  CategoryName     NVARCHAR(120) NOT NULL UNIQUE,
  IsActive         BIT NOT NULL DEFAULT 1,
  CreatedAt        DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
CREATE TABLE dbo.Products (
  ProductId        INT IDENTITY(1,1) PRIMARY KEY,
  CategoryId       INT NOT NULL,
  SKU              NVARCHAR(50) NOT NULL UNIQUE,
  ProductName      NVARCHAR(150) NOT NULL,
  Description      NVARCHAR(500) NULL,
  UnitName         NVARCHAR(30) NOT NULL DEFAULT N'ly',
  SalePrice        DECIMAL(18,2) NOT NULL CHECK (SalePrice >= 0),
  CostPrice        DECIMAL(18,2) NULL CHECK (CostPrice >= 0),
  StockQty         INT NOT NULL DEFAULT 0 CHECK (StockQty >= 0),
  IsActive         BIT NOT NULL DEFAULT 1,
  CreatedAt        DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  UpdatedAt        DATETIME2 NULL,
  CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(CategoryId)
);
GO
/* =========================
   5) HOA DON + CHI TIET HOA DON
========================= */
CREATE TABLE dbo.Invoices (
  InvoiceId          INT IDENTITY(1,1) PRIMARY KEY,
  InvoiceCode        NVARCHAR(40) NOT NULL UNIQUE,
  CustomerId         INT NULL,
  SoldByUserId       INT NOT NULL, -- nhan vien/admin lap hoa don
  SubTotal           DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (SubTotal >= 0),
  DiscountAmount     DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (DiscountAmount >= 0),
  TaxAmount          DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (TaxAmount >= 0),
  TotalAmount        AS (SubTotal - DiscountAmount + TaxAmount) PERSISTED,
  PaymentMethod      NVARCHAR(30) NOT NULL DEFAULT N'CASH',
  InvoiceStatus      NVARCHAR(20) NOT NULL DEFAULT N'PAID', -- DRAFT/PAID/CANCELLED
  Note               NVARCHAR(500) NULL,
  IssuedAt           DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Invoices_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(CustomerId),
  CONSTRAINT FK_Invoices_Users FOREIGN KEY (SoldByUserId) REFERENCES dbo.Users(UserId)
);
GO
CREATE TABLE dbo.InvoiceItems (
  InvoiceItemId      INT IDENTITY(1,1) PRIMARY KEY,
  InvoiceId          INT NOT NULL,
  ProductId          INT NOT NULL,
  Quantity           INT NOT NULL CHECK (Quantity > 0),
  UnitPrice          DECIMAL(18,2) NOT NULL CHECK (UnitPrice >= 0),
  LineTotal          AS (Quantity * UnitPrice) PERSISTED,
  CONSTRAINT FK_InvoiceItems_Invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.Invoices(InvoiceId),
  CONSTRAINT FK_InvoiceItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId)
);
GO
/* =========================
   6) TON KHO + AUDIT LOG
========================= */
CREATE TABLE dbo.StockMovements (
  StockMovementId    INT IDENTITY(1,1) PRIMARY KEY,
  ProductId          INT NOT NULL,
  MovementType       NVARCHAR(10) NOT NULL CHECK (MovementType IN (N'IN', N'OUT', N'ADJUST')),
  Quantity           INT NOT NULL,
  ReferenceType      NVARCHAR(30) NULL, -- INVOICE/IMPORT/ADJUST
  ReferenceId        INT NULL,
  Note               NVARCHAR(300) NULL,
  CreatedByUserId    INT NOT NULL,
  CreatedAt          DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT FK_StockMovements_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId),
  CONSTRAINT FK_StockMovements_Users FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(UserId)
);
GO
CREATE TABLE dbo.AuditLogs (
  AuditLogId         INT IDENTITY(1,1) PRIMARY KEY,
  ActorUserId        INT NOT NULL,
  ActionType         NVARCHAR(40) NOT NULL, -- ADD_PRODUCT, DELETE_PRODUCT, ADD_EMPLOYEE...
  EntityName         NVARCHAR(50) NOT NULL,
  EntityId           INT NULL,
  ActionDetail       NVARCHAR(1000) NULL,
  CreatedAt          DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (ActorUserId) REFERENCES dbo.Users(UserId)
);
GO
/* =========================
   7) INDEX
========================= */
CREATE INDEX IX_Products_ProductName ON dbo.Products(ProductName);
CREATE INDEX IX_Invoices_IssuedAt ON dbo.Invoices(IssuedAt);
CREATE INDEX IX_InvoiceItems_ProductId ON dbo.InvoiceItems(ProductId);
CREATE INDEX IX_InvoiceItems_InvoiceId ON dbo.InvoiceItems(InvoiceId);
CREATE INDEX IX_Users_RoleId ON dbo.Users(RoleId);
GO
/* =========================
   8) SEED DATA ROLE + ADMIN
========================= */
INSERT INTO dbo.Roles(RoleCode, RoleName)
VALUES
  (N'ADMIN', N'Quan tri'),
  (N'STAFF', N'Nhan vien'),
  (N'CUSTOMER', N'Khach hang');
GO
INSERT INTO dbo.Users(Username, PasswordHash, FullName, Phone, Email, RoleId, IsActive)
SELECT
  N'admin',
  N'CHANGE_ME_HASHED_PASSWORD',
  N'Chu cua hang',
  N'0900000000',
  N'admin@coffee.local',
  r.RoleId,
  1
FROM dbo.Roles r
WHERE r.RoleCode = N'ADMIN';
GO
/* =========================
   9) VIEW THONG KE BAN HANG
========================= */
CREATE VIEW dbo.vw_ProductSalesSummary
AS
SELECT
  p.ProductId,
  p.ProductName,
  SUM(ii.Quantity) AS TotalQtySold,
  SUM(ii.LineTotal) AS TotalRevenue
FROM dbo.InvoiceItems ii
JOIN dbo.Invoices i ON i.InvoiceId = ii.InvoiceId
JOIN dbo.Products p ON p.ProductId = ii.ProductId
WHERE i.InvoiceStatus = N'PAID'
GROUP BY p.ProductId, p.ProductName;
GO
CREATE VIEW dbo.vw_DailyRevenue
AS
SELECT
  CAST(i.IssuedAt AS DATE) AS RevenueDate,
  COUNT(DISTINCT i.InvoiceId) AS TotalInvoices,
  SUM(i.TotalAmount) AS Revenue
FROM dbo.Invoices i
WHERE i.InvoiceStatus = N'PAID'
GROUP BY CAST(i.IssuedAt AS DATE);
GO
CREATE VIEW dbo.vw_TopSellingProducts
AS
SELECT TOP 10
  p.ProductId,
  p.ProductName,
  SUM(ii.Quantity) AS QtySold,
  SUM(ii.LineTotal) AS Revenue
FROM dbo.InvoiceItems ii
JOIN dbo.Invoices i ON i.InvoiceId = ii.InvoiceId
JOIN dbo.Products p ON p.ProductId = ii.ProductId
WHERE i.InvoiceStatus = N'PAID'
GROUP BY p.ProductId, p.ProductName
ORDER BY SUM(ii.Quantity) DESC, SUM(ii.LineTotal) DESC;
GO
/* =========================
   10) STORED PROCEDURE CHI ADMIN
========================= */
CREATE PROCEDURE dbo.sp_Admin_AddProduct
  @ActorUserId      INT,
  @CategoryId       INT,
  @SKU              NVARCHAR(50),
  @ProductName      NVARCHAR(150),
  @Description      NVARCHAR(500) = NULL,
  @SalePrice        DECIMAL(18,2),
  @CostPrice        DECIMAL(18,2) = NULL,
  @StockQty         INT = 0
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.RoleId = u.RoleId
    WHERE u.UserId = @ActorUserId AND u.IsActive = 1 AND r.RoleCode = N'ADMIN'
  )
  BEGIN
    THROW 50001, 'Ban khong co quyen them san pham.', 1;
  END
  INSERT INTO dbo.Products(CategoryId, SKU, ProductName, Description, SalePrice, CostPrice, StockQty)
  VALUES (@CategoryId, @SKU, @ProductName, @Description, @SalePrice, @CostPrice, @StockQty);
  DECLARE @NewProductId INT = SCOPE_IDENTITY();
  INSERT INTO dbo.AuditLogs(ActorUserId, ActionType, EntityName, EntityId, ActionDetail)
  VALUES (@ActorUserId, N'ADD_PRODUCT', N'Products', @NewProductId, N'Them san pham moi');
END
GO
CREATE PROCEDURE dbo.sp_Admin_DeleteProduct
  @ActorUserId      INT,
  @ProductId        INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.RoleId = u.RoleId
    WHERE u.UserId = @ActorUserId AND u.IsActive = 1 AND r.RoleCode = N'ADMIN'
  )
  BEGIN
    THROW 50002, 'Ban khong co quyen xoa san pham.', 1;
  END
  UPDATE dbo.Products
  SET IsActive = 0, UpdatedAt = SYSDATETIME()
  WHERE ProductId = @ProductId;
  INSERT INTO dbo.AuditLogs(ActorUserId, ActionType, EntityName, EntityId, ActionDetail)
  VALUES (@ActorUserId, N'DELETE_PRODUCT', N'Products', @ProductId, N'Xoa mem san pham');
END
GO
CREATE PROCEDURE dbo.sp_Admin_AddEmployee
  @ActorUserId        INT,
  @Username           NVARCHAR(100),
  @PasswordHash       NVARCHAR(255),
  @FullName           NVARCHAR(150),
  @Phone              NVARCHAR(20) = NULL,
  @Email              NVARCHAR(150) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.RoleId = u.RoleId
    WHERE u.UserId = @ActorUserId AND u.IsActive = 1 AND r.RoleCode = N'ADMIN'
  )
  BEGIN
    THROW 50003, 'Ban khong co quyen them nhan vien.', 1;
  END
  DECLARE @StaffRoleId INT;
  SELECT @StaffRoleId = RoleId FROM dbo.Roles WHERE RoleCode = N'STAFF';
  INSERT INTO dbo.Users(Username, PasswordHash, FullName, Phone, Email, RoleId, IsActive)
  VALUES (@Username, @PasswordHash, @FullName, @Phone, @Email, @StaffRoleId, 1);
  DECLARE @NewUserId INT = SCOPE_IDENTITY();
  INSERT INTO dbo.AuditLogs(ActorUserId, ActionType, EntityName, EntityId, ActionDetail)
  VALUES (@ActorUserId, N'ADD_EMPLOYEE', N'Users', @NewUserId, N'Them nhan vien moi');
END
GO
CREATE PROCEDURE dbo.sp_Admin_DeleteEmployee
  @ActorUserId      INT,
  @EmployeeUserId   INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.RoleId = u.RoleId
    WHERE u.UserId = @ActorUserId AND u.IsActive = 1 AND r.RoleCode = N'ADMIN'
  )
  BEGIN
    THROW 50004, 'Ban khong co quyen xoa nhan vien.', 1;
  END
  IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.RoleId = u.RoleId
    WHERE u.UserId = @EmployeeUserId AND r.RoleCode = N'STAFF'
  )
  BEGIN
    THROW 50005, 'User can xoa khong phai nhan vien.', 1;
  END
  UPDATE dbo.Users
  SET IsActive = 0, UpdatedAt = SYSDATETIME()
  WHERE UserId = @EmployeeUserId;
  INSERT INTO dbo.AuditLogs(ActorUserId, ActionType, EntityName, EntityId, ActionDetail)
  VALUES (@ActorUserId, N'DELETE_EMPLOYEE', N'Users', @EmployeeUserId, N'Vo hieu hoa tai khoan nhan vien');
END
GO
/* =========================
   11) DU LIEU MAU DANH MUC + SAN PHAM
========================= */
INSERT INTO dbo.Categories(CategoryName) VALUES
  (N'Ca phe'),
  (N'Tra'),
  (N'Da xay'),
  (N'Banh ngan');
GO
DECLARE @AdminUserId INT = (SELECT TOP 1 UserId FROM dbo.Users u JOIN dbo.Roles r ON u.RoleId = r.RoleId WHERE r.RoleCode = N'ADMIN');
DECLARE @CatCoffee INT = (SELECT TOP 1 CategoryId FROM dbo.Categories WHERE CategoryName = N'Ca phe');
EXEC dbo.sp_Admin_AddProduct @ActorUserId=@AdminUserId, @CategoryId=@CatCoffee, @SKU=N'CF-ESP-001', @ProductName=N'Espresso', @Description=N'Ca phe dam da', @SalePrice=35000, @CostPrice=15000, @StockQty=100;
EXEC dbo.sp_Admin_AddProduct @ActorUserId=@AdminUserId, @CategoryId=@CatCoffee, @SKU=N'CF-LAT-001', @ProductName=N'Latte', @Description=N'Latte sua tuoi', @SalePrice=45000, @CostPrice=20000, @StockQty=100;
GO
PRINT N'Khoi tao CSDL CoffeeShopDB thanh cong.';
GO