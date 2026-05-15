USE [billing_application];
GO

PRINT 'Starting migration: 08_subscription_module';
GO

/* =========================================================
   SECTION 1: SUBSCRIPTION SCHEMA
   Purpose:
   - Create plans and subscriptions tables
   - Seed Free/Basic/Pro plans
   - Backfill plan_id for existing subscriptions
   - Create a default Free subscription per company
   Note:
   - tenant_id maps to companies.id in this system
   ========================================================= */

IF OBJECT_ID(N'dbo.plans', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.plans (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(50) NOT NULL,
    price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    invoice_limit INT NULL,
    user_limit INT NULL,
    features_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.subscriptions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NULL,
    plan_name NVARCHAR(50) NOT NULL DEFAULT 'Free',
    start_date DATETIME2 NOT NULL DEFAULT GETDATE(),
    end_date DATETIME2 NULL,
    invoice_limit INT NULL,
    user_limit INT NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'active',
    payment_provider NVARCHAR(30) NULL,
    provider_subscription_id NVARCHAR(255) NULL,
    auto_renew BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL AND COL_LENGTH('subscriptions', 'plan_id') IS NULL
  ALTER TABLE dbo.subscriptions ADD plan_id UNIQUEIDENTIFIER NULL;
IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL AND COL_LENGTH('subscriptions', 'invoice_limit') IS NULL
  ALTER TABLE dbo.subscriptions ADD invoice_limit INT NULL;
IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL AND COL_LENGTH('subscriptions', 'user_limit') IS NULL
  ALTER TABLE dbo.subscriptions ADD user_limit INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE name = 'Free')
  INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
  VALUES (NEWID(), 'Free', 0, 25, 1, '{}', GETDATE(), GETDATE());
IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE name = 'Basic')
  INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
  VALUES (NEWID(), 'Basic', 999, 500, 5, '{}', GETDATE(), GETDATE());
IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE name = 'Pro')
  INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
  VALUES (NEWID(), 'Pro', 2999, NULL, NULL, '{}', GETDATE(), GETDATE());
GO

UPDATE s
SET s.plan_id = p.id
FROM dbo.subscriptions s
INNER JOIN dbo.plans p ON LOWER(p.name) = LOWER(COALESCE(s.plan_name, 'Free'))
WHERE s.plan_id IS NULL;
GO

UPDATE s
SET s.invoice_limit = COALESCE(s.invoice_limit, p.invoice_limit),
    s.user_limit = COALESCE(s.user_limit, p.user_limit)
FROM dbo.subscriptions s
INNER JOIN dbo.plans p ON p.id = s.plan_id;
GO

IF OBJECT_ID(N'dbo.companies', N'U') IS NOT NULL
BEGIN
  INSERT INTO dbo.subscriptions (id, tenant_id, plan_id, plan_name, start_date, invoice_limit, user_limit, status, auto_renew, created_at, updated_at)
  SELECT NEWID(), c.id, p.id, p.name, GETDATE(), p.invoice_limit, p.user_limit, 'active', 1, GETDATE(), GETDATE()
  FROM dbo.companies c
  CROSS JOIN dbo.plans p
  WHERE p.name = 'Free'
    AND NOT EXISTS (SELECT 1 FROM dbo.subscriptions s WHERE s.tenant_id = c.id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_subscriptions_tenant_id' AND object_id = OBJECT_ID('dbo.subscriptions'))
  CREATE INDEX IX_subscriptions_tenant_id ON dbo.subscriptions (tenant_id, status, created_at);
GO

PRINT 'Subscription section completed';
GO

/* =========================================================
   SECTION 2: FEATURE ACCESS SCHEMA
   Purpose:
   - Create plan_features and role_permissions tables
   - Seed default feature access for Free/Basic/Pro plans
   ========================================================= */

IF OBJECT_ID(N'dbo.plan_features', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.plan_features (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    plan_id UNIQUEIDENTIFIER NOT NULL,
    feature_key NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF OBJECT_ID(N'dbo.role_permissions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.role_permissions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(50) NOT NULL,
    feature_key NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_plan_features_plan_id' AND object_id = OBJECT_ID('dbo.plan_features'))
  CREATE INDEX IX_plan_features_plan_id ON dbo.plan_features (plan_id, feature_key);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_role_permissions_tenant_id' AND object_id = OBJECT_ID('dbo.role_permissions'))
  CREATE INDEX IX_role_permissions_tenant_id ON dbo.role_permissions (tenant_id, role, feature_key);
GO

DECLARE @free_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'free');
DECLARE @basic_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'basic');
DECLARE @pro_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'pro');

IF @free_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.plan_features WHERE plan_id = @free_id)
BEGIN
  INSERT INTO dbo.plan_features (id, plan_id, feature_key, created_at)
  VALUES
    (NEWID(), @free_id, N'dashboard', GETDATE()),
    (NEWID(), @free_id, N'sales.customers', GETDATE());
END
GO

IF @basic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.plan_features WHERE plan_id = @basic_id)
BEGIN
  INSERT INTO dbo.plan_features (id, plan_id, feature_key, created_at)
  VALUES
    (NEWID(), @basic_id, N'dashboard', GETDATE()),
    (NEWID(), @basic_id, N'sales.customers', GETDATE()),
    (NEWID(), @basic_id, N'sales.quotations', GETDATE()),
    (NEWID(), @basic_id, N'sales.sales_orders', GETDATE()),
    (NEWID(), @basic_id, N'sales.delivery_challans', GETDATE()),
    (NEWID(), @basic_id, N'sales.invoices', GETDATE()),
    (NEWID(), @basic_id, N'sales.recurring_invoices', GETDATE()),
    (NEWID(), @basic_id, N'sales.payments_received', GETDATE()),
    (NEWID(), @basic_id, N'sales.credit_notes', GETDATE()),
    (NEWID(), @basic_id, N'sales.sales_returns', GETDATE()),
    (NEWID(), @basic_id, N'purchase.vendors', GETDATE()),
    (NEWID(), @basic_id, N'purchase.purchase_orders', GETDATE()),
    (NEWID(), @basic_id, N'purchase.bills', GETDATE()),
    (NEWID(), @basic_id, N'purchase.recurring_bills', GETDATE()),
    (NEWID(), @basic_id, N'purchase.payments_made', GETDATE()),
    (NEWID(), @basic_id, N'purchase.vendor_credits', GETDATE()),
    (NEWID(), @basic_id, N'purchase.purchase_returns', GETDATE()),
    (NEWID(), @basic_id, N'gst.gst_settings', GETDATE()),
    (NEWID(), @basic_id, N'gst.gstr_1', GETDATE()),
    (NEWID(), @basic_id, N'gst.gstr_3b', GETDATE()),
    (NEWID(), @basic_id, N'gst.hsn_summary', GETDATE());
END
GO

PRINT 'Feature access section completed';
GO
