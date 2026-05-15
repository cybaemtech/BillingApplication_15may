SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting MSSQL SaaS multi-tenant bootstrap and repair script...';
GO

/* =========================================================
   SECTION 1: MULTI-TENANT IDENTITY + COMPANY LINKAGE
   Purpose:
   - Ensure company, profile, and role linkage exists
   - Backfill tenant_id for identity records
   - Ensure each company has at least one admin-linked user
   ========================================================= */

IF OBJECT_ID(N'dbo.companies', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.companies (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    company_name NVARCHAR(500) NOT NULL,
    gstin NVARCHAR(50) NULL,
    pan NVARCHAR(50) NULL,
    address NVARCHAR(MAX) NULL,
    city NVARCHAR(100) NULL,
    state NVARCHAR(100) NULL,
    pincode NVARCHAR(20) NULL,
    phone NVARCHAR(50) NULL,
    email NVARCHAR(255) NULL,
    website NVARCHAR(255) NULL,
    logo_url NVARCHAR(500) NULL,
    financial_year_start INT NOT NULL DEFAULT 4,
    currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    tenant_id UNIQUEIDENTIFIER NULL
  );
END
GO

IF OBJECT_ID(N'dbo.profiles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.profiles (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    display_name NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_profiles_user UNIQUE (user_id)
  );
END
GO

IF OBJECT_ID(N'dbo.user_roles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.user_roles (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(50) NOT NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_user_roles UNIQUE (user_id, role)
  );
END
GO

IF COL_LENGTH('dbo.companies', 'tenant_id') IS NULL
  ALTER TABLE dbo.companies ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.profiles', 'tenant_id') IS NULL
  ALTER TABLE dbo.profiles ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.user_roles', 'tenant_id') IS NULL
  ALTER TABLE dbo.user_roles ADD tenant_id UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_companies_tenant_id' AND object_id = OBJECT_ID('dbo.companies'))
  CREATE INDEX IX_companies_tenant_id ON dbo.companies (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_profiles_tenant_id' AND object_id = OBJECT_ID('dbo.profiles'))
  CREATE INDEX IX_profiles_tenant_id ON dbo.profiles (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_user_roles_tenant_id' AND object_id = OBJECT_ID('dbo.user_roles'))
  CREATE INDEX IX_user_roles_tenant_id ON dbo.user_roles (tenant_id);
GO

UPDATE c
SET c.tenant_id = c.id
FROM dbo.companies c
WHERE c.tenant_id IS NULL;
GO

UPDATE p
SET p.tenant_id = COALESCE(ur.tenant_id, c.id, c.tenant_id)
FROM dbo.profiles p
LEFT JOIN dbo.user_roles ur ON ur.user_id = p.user_id
LEFT JOIN dbo.companies c ON c.created_by = p.user_id
WHERE p.tenant_id IS NULL
  AND COALESCE(ur.tenant_id, c.id, c.tenant_id) IS NOT NULL;
GO

UPDATE ur
SET ur.tenant_id = COALESCE(p.tenant_id, c.id, c.tenant_id)
FROM dbo.user_roles ur
LEFT JOIN dbo.profiles p ON p.user_id = ur.user_id
LEFT JOIN dbo.companies c ON c.created_by = ur.user_id
WHERE ur.tenant_id IS NULL
  AND COALESCE(p.tenant_id, c.id, c.tenant_id) IS NOT NULL;
GO

IF OBJECT_ID('tempdb..#company_admin_targets') IS NOT NULL DROP TABLE #company_admin_targets;
SELECT
  c.id AS company_id,
  COALESCE(c.created_by, linked.user_id) AS admin_user_id
INTO #company_admin_targets
FROM dbo.companies c
OUTER APPLY (
  SELECT TOP 1 COALESCE(ur.user_id, p.user_id) AS user_id
  FROM dbo.user_roles ur
  FULL OUTER JOIN dbo.profiles p ON p.user_id = ur.user_id
  WHERE COALESCE(ur.tenant_id, p.tenant_id) = c.id
  ORDER BY COALESCE(ur.created_at, p.created_at)
) linked
WHERE COALESCE(c.created_by, linked.user_id) IS NOT NULL;

INSERT INTO dbo.profiles (id, user_id, display_name, email, phone, tenant_id, created_at, updated_at)
SELECT
  NEWID(),
  t.admin_user_id,
  COALESCE(u.username, u.email),
  u.email,
  NULL,
  t.company_id,
  GETDATE(),
  GETDATE()
FROM #company_admin_targets t
INNER JOIN dbo.users u ON u.id = t.admin_user_id
LEFT JOIN dbo.profiles p ON p.user_id = t.admin_user_id
WHERE p.user_id IS NULL;

UPDATE p
SET p.tenant_id = COALESCE(p.tenant_id, t.company_id),
    p.email = COALESCE(p.email, u.email),
    p.display_name = COALESCE(p.display_name, u.username, u.email),
    p.updated_at = GETDATE()
FROM dbo.profiles p
INNER JOIN #company_admin_targets t ON t.admin_user_id = p.user_id
INNER JOIN dbo.users u ON u.id = p.user_id;

INSERT INTO dbo.user_roles (id, user_id, role, tenant_id, created_at)
SELECT NEWID(), t.admin_user_id, 'admin', t.company_id, GETDATE()
FROM #company_admin_targets t
WHERE NOT EXISTS (
  SELECT 1
  FROM dbo.user_roles ur
  WHERE ur.user_id = t.admin_user_id
    AND ur.tenant_id = t.company_id
);

UPDATE ur
SET ur.tenant_id = COALESCE(ur.tenant_id, t.company_id)
FROM dbo.user_roles ur
INNER JOIN #company_admin_targets t ON t.admin_user_id = ur.user_id
WHERE ur.tenant_id IS NULL;
GO

/* =========================================================
   SECTION 2: SUBSCRIPTION + PLAN MANAGEMENT
   Purpose:
   - Create plans/subscriptions if missing
   - Assign default Free plan to every company
   - Keep plan pricing and limits dynamic from DB
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

IF COL_LENGTH('dbo.subscriptions', 'plan_id') IS NULL
  ALTER TABLE dbo.subscriptions ADD plan_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.subscriptions', 'invoice_limit') IS NULL
  ALTER TABLE dbo.subscriptions ADD invoice_limit INT NULL;
IF COL_LENGTH('dbo.subscriptions', 'user_limit') IS NULL
  ALTER TABLE dbo.subscriptions ADD user_limit INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_subscriptions_tenant_id' AND object_id = OBJECT_ID('dbo.subscriptions'))
  CREATE INDEX IX_subscriptions_tenant_id ON dbo.subscriptions (tenant_id, status, created_at);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE LOWER(name) = 'free')
  INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
  VALUES (NEWID(), 'Free', 0, 25, 1, '{}', GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE LOWER(name) = 'basic')
  INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
  VALUES (NEWID(), 'Basic', 999, 500, 5, '{}', GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE LOWER(name) = 'pro')
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
    s.user_limit = COALESCE(s.user_limit, p.user_limit),
    s.plan_name = COALESCE(NULLIF(s.plan_name, ''), p.name),
    s.updated_at = GETDATE()
FROM dbo.subscriptions s
INNER JOIN dbo.plans p ON p.id = s.plan_id;
GO

INSERT INTO dbo.subscriptions (id, tenant_id, plan_id, plan_name, start_date, invoice_limit, user_limit, status, auto_renew, created_at, updated_at)
SELECT NEWID(), c.id, p.id, p.name, GETDATE(), p.invoice_limit, p.user_limit, 'active', 1, GETDATE(), GETDATE()
FROM dbo.companies c
CROSS JOIN dbo.plans p
WHERE LOWER(p.name) = 'free'
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.subscriptions s
    WHERE s.tenant_id = c.id
  );
GO

/* =========================================================
   SECTION 3: PLAN FEATURE MANAGEMENT
   Purpose:
   - Store feature availability per plan
   - Only plan-enabled modules should appear in UI
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

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_plan_features_plan_id' AND object_id = OBJECT_ID('dbo.plan_features'))
  CREATE INDEX IX_plan_features_plan_id ON dbo.plan_features (plan_id, feature_key);
GO

DECLARE @free_plan UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'free');
DECLARE @basic_plan UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'basic');
DECLARE @pro_plan UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'pro');

IF OBJECT_ID('tempdb..#plan_feature_seed') IS NOT NULL DROP TABLE #plan_feature_seed;
CREATE TABLE #plan_feature_seed (
  plan_name NVARCHAR(50) NOT NULL,
  feature_key NVARCHAR(255) NOT NULL
);

INSERT INTO #plan_feature_seed (plan_name, feature_key)
VALUES
  ('Free', 'dashboard'),
  ('Free', 'sales.customers'),
  ('Free', 'gst.gst_settings'),

  ('Basic', 'dashboard'),
  ('Basic', 'sales.customers'),
  ('Basic', 'sales.quotations'),
  ('Basic', 'sales.sales_orders'),
  ('Basic', 'sales.delivery_challans'),
  ('Basic', 'sales.invoices'),
  ('Basic', 'sales.recurring_invoices'),
  ('Basic', 'sales.payments_received'),
  ('Basic', 'sales.credit_notes'),
  ('Basic', 'sales.sales_returns'),
  ('Basic', 'purchase.vendors'),
  ('Basic', 'purchase.purchase_orders'),
  ('Basic', 'purchase.bills'),
  ('Basic', 'purchase.recurring_bills'),
  ('Basic', 'purchase.payments_made'),
  ('Basic', 'purchase.vendor_credits'),
  ('Basic', 'purchase.purchase_returns'),
  ('Basic', 'gst.gst_settings'),
  ('Basic', 'gst.gstr_1'),
  ('Basic', 'gst.gstr_3b'),
  ('Basic', 'gst.hsn_summary'),

  ('Pro', 'dashboard'),
  ('Pro', 'sales.customers'),
  ('Pro', 'sales.quotations'),
  ('Pro', 'sales.sales_orders'),
  ('Pro', 'sales.delivery_challans'),
  ('Pro', 'sales.invoices'),
  ('Pro', 'sales.recurring_invoices'),
  ('Pro', 'sales.payments_received'),
  ('Pro', 'sales.credit_notes'),
  ('Pro', 'sales.sales_returns'),
  ('Pro', 'purchase.vendors'),
  ('Pro', 'purchase.purchase_orders'),
  ('Pro', 'purchase.bills'),
  ('Pro', 'purchase.recurring_bills'),
  ('Pro', 'purchase.payments_made'),
  ('Pro', 'purchase.vendor_credits'),
  ('Pro', 'purchase.purchase_returns'),
  ('Pro', 'inventory.items'),
  ('Pro', 'inventory.categories'),
  ('Pro', 'inventory.price_lists'),
  ('Pro', 'inventory.warehouses'),
  ('Pro', 'inventory.stock_transfers'),
  ('Pro', 'inventory.adjustments'),
  ('Pro', 'inventory.stock_ledger'),
  ('Pro', 'inventory.expenses'),
  ('Pro', 'accounting.chart_of_accounts'),
  ('Pro', 'accounting.journal_entries'),
  ('Pro', 'accounting.ledger'),
  ('Pro', 'accounting.trial_balance'),
  ('Pro', 'accounting.profit_loss'),
  ('Pro', 'accounting.balance_sheet'),
  ('Pro', 'accounting.cash_flow'),
  ('Pro', 'accounting.day_book'),
  ('Pro', 'gst.gst_settings'),
  ('Pro', 'gst.gstr_1'),
  ('Pro', 'gst.gstr_3b'),
  ('Pro', 'gst.hsn_summary'),
  ('Pro', 'gst.e_invoice'),
  ('Pro', 'gst.e_way_bill'),
  ('Pro', 'pos.new_sale'),
  ('Pro', 'pos.sessions'),
  ('Pro', 'pos.orders'),
  ('Pro', 'pos.reports'),
  ('Pro', 'automation.workflows'),
  ('Pro', 'automation.reminders'),
  ('Pro', 'automation.settings');

INSERT INTO dbo.plan_features (id, plan_id, feature_key, created_at)
SELECT NEWID(),
       CASE seed.plan_name
         WHEN 'Free' THEN @free_plan
         WHEN 'Basic' THEN @basic_plan
         WHEN 'Pro' THEN @pro_plan
       END,
       seed.feature_key,
       GETDATE()
FROM #plan_feature_seed seed
WHERE CASE seed.plan_name
        WHEN 'Free' THEN @free_plan
        WHEN 'Basic' THEN @basic_plan
        WHEN 'Pro' THEN @pro_plan
      END IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.plan_features pf
    WHERE pf.plan_id = CASE seed.plan_name
                         WHEN 'Free' THEN @free_plan
                         WHEN 'Basic' THEN @basic_plan
                         WHEN 'Pro' THEN @pro_plan
                       END
      AND pf.feature_key = seed.feature_key
  );
GO

/* =========================================================
   SECTION 4: ROLE-BASED ACCESS CONTROL
   Purpose:
   - Create per-tenant feature permissions
   - Final effective access = plan features intersect role permissions
   - Ensure company admin can immediately manage company data
   ========================================================= */

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

IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.roles (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(50) NOT NULL,
    label NVARCHAR(100) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_roles_tenant_id' AND object_id = OBJECT_ID('dbo.roles'))
  CREATE INDEX IX_roles_tenant_id ON dbo.roles (tenant_id, name, is_active);
GO

INSERT INTO dbo.roles (id, tenant_id, name, label, is_system, is_active, created_at, updated_at)
SELECT NEWID(), c.id, seed.name, seed.label, 1, 1, GETDATE(), GETDATE()
FROM dbo.companies c
CROSS JOIN (VALUES
  ('admin', 'Admin'),
  ('accountant', 'Accountant'),
  ('staff', 'Staff'),
  ('viewer', 'Viewer')
) AS seed(name, label)
WHERE NOT EXISTS (
  SELECT 1
  FROM dbo.roles r
  WHERE r.tenant_id = c.id
    AND LOWER(r.name) = LOWER(seed.name)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_role_permissions_tenant_id' AND object_id = OBJECT_ID('dbo.role_permissions'))
  CREATE INDEX IX_role_permissions_tenant_id ON dbo.role_permissions (tenant_id, role, feature_key);
GO

IF OBJECT_ID('tempdb..#tenant_plan_features') IS NOT NULL DROP TABLE #tenant_plan_features;
SELECT DISTINCT
  s.tenant_id,
  pf.feature_key
INTO #tenant_plan_features
FROM dbo.subscriptions s
INNER JOIN dbo.plan_features pf ON pf.plan_id = s.plan_id;

INSERT INTO dbo.role_permissions (id, tenant_id, role, feature_key, created_at)
SELECT NEWID(), tpf.tenant_id, 'admin', tpf.feature_key, GETDATE()
FROM #tenant_plan_features tpf
WHERE NOT EXISTS (
  SELECT 1
  FROM dbo.role_permissions rp
  WHERE rp.tenant_id = tpf.tenant_id
    AND rp.role = 'admin'
    AND rp.feature_key = tpf.feature_key
);

INSERT INTO dbo.role_permissions (id, tenant_id, role, feature_key, created_at)
SELECT NEWID(), tpf.tenant_id, 'accountant', tpf.feature_key, GETDATE()
FROM #tenant_plan_features tpf
WHERE tpf.feature_key IN (
  'dashboard',
  'sales.customers',
  'sales.quotations',
  'sales.sales_orders',
  'sales.delivery_challans',
  'sales.invoices',
  'sales.recurring_invoices',
  'sales.payments_received',
  'sales.credit_notes',
  'sales.sales_returns',
  'purchase.vendors',
  'purchase.purchase_orders',
  'purchase.bills',
  'purchase.recurring_bills',
  'purchase.payments_made',
  'purchase.vendor_credits',
  'purchase.purchase_returns',
  'inventory.items',
  'inventory.categories',
  'inventory.expenses',
  'gst.gst_settings',
  'gst.gstr_1',
  'gst.gstr_3b',
  'gst.hsn_summary',
  'accounting.chart_of_accounts',
  'accounting.journal_entries'
)
AND NOT EXISTS (
  SELECT 1
  FROM dbo.role_permissions rp
  WHERE rp.tenant_id = tpf.tenant_id
    AND rp.role = 'accountant'
    AND rp.feature_key = tpf.feature_key
);

INSERT INTO dbo.role_permissions (id, tenant_id, role, feature_key, created_at)
SELECT NEWID(), tpf.tenant_id, 'staff', tpf.feature_key, GETDATE()
FROM #tenant_plan_features tpf
WHERE tpf.feature_key IN (
  'dashboard',
  'sales.customers',
  'sales.quotations',
  'sales.sales_orders',
  'sales.invoices',
  'purchase.vendors',
  'inventory.items'
)
AND NOT EXISTS (
  SELECT 1
  FROM dbo.role_permissions rp
  WHERE rp.tenant_id = tpf.tenant_id
    AND rp.role = 'staff'
    AND rp.feature_key = tpf.feature_key
);

INSERT INTO dbo.role_permissions (id, tenant_id, role, feature_key, created_at)
SELECT NEWID(), tpf.tenant_id, 'viewer', tpf.feature_key, GETDATE()
FROM #tenant_plan_features tpf
WHERE tpf.feature_key IN ('dashboard')
AND NOT EXISTS (
  SELECT 1
  FROM dbo.role_permissions rp
  WHERE rp.tenant_id = tpf.tenant_id
    AND rp.role = 'viewer'
    AND rp.feature_key = tpf.feature_key
);
GO

/* =========================================================
   SECTION 5: SaaS SAFETY REPAIRS FOR EXISTING BUSINESS TABLES
   Purpose:
   - Ensure key business tables have tenant_id columns + indexes
   - Enforce tenant-aware filtering support for app queries
   ========================================================= */

IF OBJECT_ID('tempdb..#tenant_tables') IS NOT NULL DROP TABLE #tenant_tables;
CREATE TABLE #tenant_tables (table_name SYSNAME NOT NULL);

INSERT INTO #tenant_tables (table_name)
VALUES
  ('customers'),
  ('vendors'),
  ('items'),
  ('quotations'),
  ('quotation_items'),
  ('sales_orders'),
  ('sales_order_items'),
  ('delivery_challans'),
  ('delivery_challan_items'),
  ('invoices'),
  ('invoice_items'),
  ('recurring_invoices'),
  ('payments_received'),
  ('credit_notes'),
  ('credit_note_items'),
  ('sales_returns'),
  ('sales_return_items'),
  ('purchase_orders'),
  ('purchase_order_items'),
  ('bills'),
  ('bill_items'),
  ('recurring_bills'),
  ('payments_made'),
  ('vendor_credits'),
  ('vendor_credit_items'),
  ('purchase_returns'),
  ('purchase_return_items'),
  ('item_categories'),
  ('price_lists'),
  ('warehouses'),
  ('stock_transfers'),
  ('inventory_adjustments'),
  ('warehouse_stock'),
  ('stock_movements'),
  ('expenses'),
  ('accounts'),
  ('journal_entries'),
  ('journal_entry_lines'),
  ('gst_settings'),
  ('invoice_settings'),
  ('bank_accounts');

DECLARE @table_name SYSNAME;
DECLARE @sql NVARCHAR(MAX);
DECLARE tenant_table_cursor CURSOR FAST_FORWARD FOR
SELECT table_name FROM #tenant_tables;

OPEN tenant_table_cursor;
FETCH NEXT FROM tenant_table_cursor INTO @table_name;

WHILE @@FETCH_STATUS = 0
BEGIN
  IF OBJECT_ID(N'dbo.' + @table_name, N'U') IS NOT NULL
  BEGIN
    IF COL_LENGTH('dbo.' + @table_name, 'tenant_id') IS NULL
    BEGIN
      SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@table_name) + N' ADD tenant_id UNIQUEIDENTIFIER NULL;';
      EXEC sp_executesql @sql;
    END

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'IX_' + @table_name + '_tenant_id'
        AND object_id = OBJECT_ID('dbo.' + @table_name)
    )
    BEGIN
      SET @sql = N'CREATE INDEX ' + QUOTENAME('IX_' + @table_name + '_tenant_id') + N' ON dbo.' + QUOTENAME(@table_name) + N' (tenant_id);';
      EXEC sp_executesql @sql;
    END
  END

  FETCH NEXT FROM tenant_table_cursor INTO @table_name;
END

CLOSE tenant_table_cursor;
DEALLOCATE tenant_table_cursor;
GO

IF OBJECT_ID('tempdb..#company_tables') IS NOT NULL DROP TABLE #company_tables;
SELECT table_name INTO #company_tables FROM #tenant_tables;

DECLARE @company_table SYSNAME;
DECLARE @sql NVARCHAR(MAX);
DECLARE company_table_cursor CURSOR FAST_FORWARD FOR
SELECT table_name FROM #company_tables;

OPEN company_table_cursor;
FETCH NEXT FROM company_table_cursor INTO @company_table;

WHILE @@FETCH_STATUS = 0
BEGIN
  IF OBJECT_ID(N'dbo.' + @company_table, N'U') IS NOT NULL
  BEGIN
    IF COL_LENGTH('dbo.' + @company_table, 'company_id') IS NULL
    BEGIN
      SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@company_table) + N' ADD company_id UNIQUEIDENTIFIER NULL;';
      EXEC sp_executesql @sql;
    END

    SET @sql = N'UPDATE dbo.' + QUOTENAME(@company_table) + N' SET company_id = COALESCE(company_id, tenant_id) WHERE company_id IS NULL;';
    EXEC sp_executesql @sql;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'IX_' + @company_table + '_company_id'
        AND object_id = OBJECT_ID('dbo.' + @company_table)
    )
    BEGIN
      SET @sql = N'CREATE INDEX ' + QUOTENAME('IX_' + @company_table + '_company_id') + N' ON dbo.' + QUOTENAME(@company_table) + N' (company_id);';
      EXEC sp_executesql @sql;
    END
  END

  FETCH NEXT FROM company_table_cursor INTO @company_table;
END

CLOSE company_table_cursor;
DEALLOCATE company_table_cursor;
GO

PRINT 'MSSQL SaaS multi-tenant bootstrap and repair script completed successfully.';
GO
