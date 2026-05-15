USE [billing_application];
GO

PRINT 'Starting demo seed: subscription organizations, users, and subscriptions';
GO

IF OBJECT_ID(N'dbo.companies', N'U') IS NULL OR OBJECT_ID(N'dbo.users', N'U') IS NULL OR OBJECT_ID(N'dbo.user_roles', N'U') IS NULL OR OBJECT_ID(N'dbo.profiles', N'U') IS NULL
BEGIN
  RAISERROR('Base schema is missing. Ensure companies, users, profiles, and user_roles tables exist first.', 16, 1);
  RETURN;
END
GO

IF OBJECT_ID(N'dbo.plans', N'U') IS NULL OR OBJECT_ID(N'dbo.subscriptions', N'U') IS NULL
BEGIN
  RAISERROR('Subscription schema is missing. Run 08_task_management_module.sql first.', 16, 1);
  RETURN;
END
GO

DECLARE @password_hash NVARCHAR(255) = N'$2b$10$SfB5wAKeYTqWqh.6xY5O0OXSdiEN7YH2yskBdcbisVB.AMINIXNdq';

DECLARE @companies TABLE (
  row_num INT IDENTITY(1,1) PRIMARY KEY,
  company_name NVARCHAR(500),
  city NVARCHAR(100),
  state NVARCHAR(100)
);

INSERT INTO @companies (company_name, city, state)
VALUES
  (N'Aarav Retail Labs', N'Pune', N'Maharashtra'),
  (N'Bluefin Components', N'Chennai', N'Tamil Nadu'),
  (N'Cipher Logistics', N'Bengaluru', N'Karnataka'),
  (N'Delta Medisupply', N'Hyderabad', N'Telangana'),
  (N'Evergreen Foods', N'Ahmedabad', N'Gujarat'),
  (N'Futura Machines', N'Indore', N'Madhya Pradesh'),
  (N'Granite Works India', N'Jaipur', N'Rajasthan'),
  (N'Helio Print House', N'Lucknow', N'Uttar Pradesh'),
  (N'Iconic Automations', N'Noida', N'Uttar Pradesh'),
  (N'Jupiter Furnishings', N'Kochi', N'Kerala'),
  (N'Kite Pharma Trade', N'Nagpur', N'Maharashtra'),
  (N'Lotus Infra Equip', N'Surat', N'Gujarat'),
  (N'Metro Agri Chain', N'Coimbatore', N'Tamil Nadu'),
  (N'Nova Electronics Hub', N'Visakhapatnam', N'Andhra Pradesh'),
  (N'Optima Safety Gear', N'Bhopal', N'Madhya Pradesh'),
  (N'Prime Office Mart', N'Delhi', N'Delhi'),
  (N'Quantum Steel Store', N'Raipur', N'Chhattisgarh'),
  (N'Radian Textiles', N'Ludhiana', N'Punjab'),
  (N'Solaris Energy Trade', N'Patna', N'Bihar'),
  (N'Terrafirm Tools', N'Vadodara', N'Gujarat'),
  (N'Urban Fresh Supply', N'Mumbai', N'Maharashtra'),
  (N'Vertex Kitchenware', N'Kolkata', N'West Bengal'),
  (N'Willow Packaging Co', N'Kanpur', N'Uttar Pradesh'),
  (N'Zenith Mobility Parts', N'Nashik', N'Maharashtra');

DECLARE @max_row INT = (SELECT MAX(row_num) FROM @companies);
DECLARE @i INT = 1;

WHILE @i <= @max_row
BEGIN
  DECLARE @company_name NVARCHAR(500);
  DECLARE @city NVARCHAR(100);
  DECLARE @state NVARCHAR(100);

  SELECT @company_name = company_name, @city = city, @state = state
  FROM @companies
  WHERE row_num = @i;

  IF NOT EXISTS (SELECT 1 FROM dbo.companies WHERE company_name = @company_name)
  BEGIN
    DECLARE @company_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @admin_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @accountant_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @sales_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @viewer_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @admin_profile_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @accountant_profile_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @sales_profile_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @viewer_profile_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @admin_role_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @accountant_role_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @sales_role_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @viewer_role_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @plan_name NVARCHAR(50);
    DECLARE @plan_id UNIQUEIDENTIFIER;
    DECLARE @suffix NVARCHAR(20) = RIGHT('00' + CAST(@i AS NVARCHAR(10)), 2);

    SET @plan_name = CASE @i % 3 WHEN 1 THEN N'Free' WHEN 2 THEN N'Basic' ELSE N'Pro' END;
    SELECT TOP 1 @plan_id = id FROM dbo.plans WHERE name = @plan_name;

    INSERT INTO dbo.users (id, username, email, password_hash, is_active, created_at, updated_at, role)
    VALUES
      (@admin_id, N'admin_' + @suffix, N'admin' + @suffix + N'@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'admin'),
      (@accountant_id, N'accountant_' + @suffix, N'accountant' + @suffix + N'@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'accountant'),
      (@sales_id, N'sales_' + @suffix, N'sales' + @suffix + N'@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'sales'),
      (@viewer_id, N'viewer_' + @suffix, N'viewer' + @suffix + N'@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'viewer');

    INSERT INTO dbo.profiles (id, user_id, display_name, email, phone, created_at, updated_at, tenant_id)
    VALUES
      (@admin_profile_id, @admin_id, @company_name + N' Admin', N'admin' + @suffix + N'@demo.billflow.app', N'900000' + RIGHT('0000' + CAST(@i AS NVARCHAR(10)), 4), GETDATE(), GETDATE(), @company_id),
      (@accountant_profile_id, @accountant_id, @company_name + N' Accountant', N'accountant' + @suffix + N'@demo.billflow.app', N'910000' + RIGHT('0000' + CAST(@i AS NVARCHAR(10)), 4), GETDATE(), GETDATE(), @company_id),
      (@sales_profile_id, @sales_id, @company_name + N' Sales', N'sales' + @suffix + N'@demo.billflow.app', N'920000' + RIGHT('0000' + CAST(@i AS NVARCHAR(10)), 4), GETDATE(), GETDATE(), @company_id),
      (@viewer_profile_id, @viewer_id, @company_name + N' Viewer', N'viewer' + @suffix + N'@demo.billflow.app', N'930000' + RIGHT('0000' + CAST(@i AS NVARCHAR(10)), 4), GETDATE(), GETDATE(), @company_id);

    INSERT INTO dbo.user_roles (id, user_id, role, created_at, tenant_id)
    VALUES
      (@admin_role_id, @admin_id, N'admin', GETDATE(), @company_id),
      (@accountant_role_id, @accountant_id, N'accountant', GETDATE(), @company_id),
      (@sales_role_id, @sales_id, N'sales', GETDATE(), @company_id),
      (@viewer_role_id, @viewer_id, N'viewer', GETDATE(), @company_id);

    INSERT INTO dbo.companies (id, company_name, gstin, pan, address, city, state, pincode, phone, email, website, created_by, created_at, updated_at, tenant_id)
    VALUES (
      @company_id,
      @company_name,
      N'27DEMO' + @suffix + N'F1Z5',
      N'ABCDE12' + @suffix + N'F',
      @company_name + N', Demo Business Park',
      @city,
      @state,
      N'400' + RIGHT('000' + CAST(@i AS NVARCHAR(10)), 3),
      N'98' + RIGHT('00000000' + CAST(@i * 431 AS NVARCHAR(20)), 8),
      N'contact' + @suffix + N'@demo.billflow.app',
      N'https://demo' + @suffix + N'.billflow.app',
      @admin_id,
      GETDATE(),
      GETDATE(),
      @company_id
    );

    INSERT INTO dbo.subscriptions (id, tenant_id, plan_id, plan_name, start_date, end_date, status, payment_provider, auto_renew, created_at, updated_at)
    VALUES (NEWID(), @company_id, @plan_id, @plan_name, GETDATE(), DATEADD(DAY, 365, GETDATE()), N'active', N'razorpay', CASE WHEN @plan_name = N'Free' THEN 0 ELSE 1 END, GETDATE(), GETDATE());

  END

  SET @i = @i + 1;
END

PRINT 'Demo seed completed. Use Password@123 for all demo users.';
GO
