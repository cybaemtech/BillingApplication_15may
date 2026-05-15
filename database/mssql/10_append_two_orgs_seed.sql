USE [billing_application];
GO

PRINT 'Starting append seed for two additional organizations';
GO

IF OBJECT_ID(N'dbo.companies', N'U') IS NULL
BEGIN
  RAISERROR('companies table not found', 16, 1);
  RETURN;
END
GO

DECLARE @password_hash NVARCHAR(255) = N'$2b$10$SfB5wAKeYTqWqh.6xY5O0OXSdiEN7YH2yskBdcbisVB.AMINIXNdq';

DECLARE @orgs TABLE (
  org_code NVARCHAR(20),
  company_name NVARCHAR(500),
  city NVARCHAR(100),
  state NVARCHAR(100),
  plan_name NVARCHAR(50)
);

INSERT INTO @orgs (org_code, company_name, city, state, plan_name)
VALUES
  (N'ORG25', N'Northstar Office Supplies', N'Pune', N'Maharashtra', N'Basic'),
  (N'ORG26', N'Skyline Industrial Tools', N'Hyderabad', N'Telangana', N'Pro');

DECLARE @org_code NVARCHAR(20);
DECLARE @company_name NVARCHAR(500);
DECLARE @city NVARCHAR(100);
DECLARE @state NVARCHAR(100);
DECLARE @plan_name NVARCHAR(50);

DECLARE org_cursor CURSOR FOR
SELECT org_code, company_name, city, state, plan_name
FROM @orgs;

OPEN org_cursor;
FETCH NEXT FROM org_cursor INTO @org_code, @company_name, @city, @state, @plan_name;

WHILE @@FETCH_STATUS = 0
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.companies WHERE company_name = @company_name)
  BEGIN
    DECLARE @company_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @plan_id UNIQUEIDENTIFIER;
    DECLARE @admin_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @accountant_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @sales_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @viewer_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @customer_a UNIQUEIDENTIFIER = NEWID();
    DECLARE @customer_b UNIQUEIDENTIFIER = NEWID();
    DECLARE @invoice_a UNIQUEIDENTIFIER = NEWID();
    DECLARE @invoice_b UNIQUEIDENTIFIER = NEWID();

    SELECT TOP 1 @plan_id = id FROM dbo.plans WHERE name = @plan_name;

    INSERT INTO dbo.users (id, username, email, password_hash, is_active, created_at, updated_at, role)
    VALUES
      (@admin_id, LOWER(@org_code) + N'_admin', LOWER(@org_code) + N'_admin@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'admin'),
      (@accountant_id, LOWER(@org_code) + N'_accountant', LOWER(@org_code) + N'_accountant@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'accountant'),
      (@sales_id, LOWER(@org_code) + N'_sales', LOWER(@org_code) + N'_sales@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'sales'),
      (@viewer_id, LOWER(@org_code) + N'_viewer', LOWER(@org_code) + N'_viewer@demo.billflow.app', @password_hash, 1, GETDATE(), GETDATE(), N'viewer');

    INSERT INTO dbo.profiles (id, user_id, display_name, email, phone, created_at, updated_at, tenant_id)
    VALUES
      (NEWID(), @admin_id, @company_name + N' Admin', LOWER(@org_code) + N'_admin@demo.billflow.app', N'9010000001', GETDATE(), GETDATE(), @company_id),
      (NEWID(), @accountant_id, @company_name + N' Accountant', LOWER(@org_code) + N'_accountant@demo.billflow.app', N'9010000002', GETDATE(), GETDATE(), @company_id),
      (NEWID(), @sales_id, @company_name + N' Sales', LOWER(@org_code) + N'_sales@demo.billflow.app', N'9010000003', GETDATE(), GETDATE(), @company_id),
      (NEWID(), @viewer_id, @company_name + N' Viewer', LOWER(@org_code) + N'_viewer@demo.billflow.app', N'9010000004', GETDATE(), GETDATE(), @company_id);

    INSERT INTO dbo.user_roles (id, user_id, role, created_at, tenant_id)
    VALUES
      (NEWID(), @admin_id, N'admin', GETDATE(), @company_id),
      (NEWID(), @accountant_id, N'accountant', GETDATE(), @company_id),
      (NEWID(), @sales_id, N'sales', GETDATE(), @company_id),
      (NEWID(), @viewer_id, N'viewer', GETDATE(), @company_id);

    INSERT INTO dbo.companies (id, company_name, gstin, pan, address, city, state, pincode, phone, email, website, created_by, created_at, updated_at, tenant_id)
    VALUES (
      @company_id,
      @company_name,
      N'29APPEND' + RIGHT(@org_code, 2) + N'F1Z5',
      N'APPND' + RIGHT(@org_code, 2) + N'1234F',
      @company_name + N', Enterprise Park',
      @city,
      @state,
      N'411001',
      N'9876543210',
      LOWER(REPLACE(@org_code, N'ORG', N'contact')) + N'@demo.billflow.app',
      N'https://' + LOWER(REPLACE(@company_name, N' ', N'')) + N'.app',
      @admin_id,
      GETDATE(),
      GETDATE(),
      @company_id
    );

    INSERT INTO dbo.subscriptions (id, tenant_id, plan_id, plan_name, start_date, end_date, status, payment_provider, auto_renew, created_at, updated_at)
    VALUES (NEWID(), @company_id, @plan_id, @plan_name, GETDATE(), DATEADD(DAY, 365, GETDATE()), N'active', N'razorpay', 1, GETDATE(), GETDATE());

    INSERT INTO dbo.customers (id, name, email, phone, gstin, billing_address, shipping_address, state, credit_limit, outstanding_balance, is_active, created_by, created_at, updated_at, tenant_id)
    VALUES
      (@customer_a, @company_name + N' Customer A', LOWER(@org_code) + N'_custa@demo.billflow.app', N'9988776601', NULL, @city + N' Corporate Zone', @city + N' Corporate Zone', @state, 50000, 12500, 1, @sales_id, GETDATE(), GETDATE(), @company_id),
      (@customer_b, @company_name + N' Customer B', LOWER(@org_code) + N'_custb@demo.billflow.app', N'9988776602', NULL, @city + N' Market Lane', @city + N' Market Lane', @state, 60000, 0, 1, @sales_id, GETDATE(), GETDATE(), @company_id);

    INSERT INTO dbo.invoices (id, document_number, [date], due_date, customer_id, sales_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, terms, created_by, created_at, updated_at, tenant_id)
    VALUES
      (@invoice_a, N'INV-' + RIGHT(@org_code, 2) + N'-001', CAST(GETDATE() AS DATE), DATEADD(DAY, 30, CAST(GETDATE() AS DATE)), @customer_a, NULL, NULL, NULL, N'sent', 10000, 1800, 11800, 11800, N'Office supply order', N'Net 30', @sales_id, GETDATE(), GETDATE(), @company_id),
      (@invoice_b, N'INV-' + RIGHT(@org_code, 2) + N'-002', CAST(GETDATE() AS DATE), DATEADD(DAY, 15, CAST(GETDATE() AS DATE)), @customer_b, NULL, NULL, NULL, N'paid', 22000, 3960, 25960, 0, N'Industrial tool order', N'Net 15', @sales_id, GETDATE(), GETDATE(), @company_id);

  END

  FETCH NEXT FROM org_cursor INTO @org_code, @company_name, @city, @state, @plan_name;
END

CLOSE org_cursor;
DEALLOCATE org_cursor;

PRINT 'Append seed complete. Added two organizations without touching existing data. Password for new users: Password@123';
GO
