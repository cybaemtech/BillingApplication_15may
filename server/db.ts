import mssql from "mssql/msnodesqlv8.js";

// Database Configuration from Environment Variables
const dbConfig = {
  server: process.env.DB_SERVER || process.env.DATABASE_SERVER || "localhost",
  port: Number(process.env.DB_PORT || process.env.DATABASE_PORT || 1433),
  user: process.env.DB_USER || process.env.DATABASE_USER,
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.DB_NAME || process.env.DATABASE_NAME || "billing_application",
  instanceName: process.env.DATABASE_INSTANCE,
  windowsAuth: (process.env.DATABASE_WINDOWS_AUTH || "false").toLowerCase() === "true",
  encrypt: (process.env.DATABASE_ENCRYPT || "false").toLowerCase() === "true",
  trustServerCertificate: (process.env.DATABASE_TRUST_SERVER_CERTIFICATE || "true").toLowerCase() === "true",
};

const buildConfig = (serverHost: string): any => {
  // If user/password are provided, we should use SQL Authentication
  // msnodesqlv8 can use a connection string or a config object
  const isSqlAuth = dbConfig.user && dbConfig.password;
  
  // Base server string - handle instances if provided in server name or separate variable
  let fullServer = serverHost;
  if (dbConfig.instanceName && !dbConfig.port) {
    fullServer = `${serverHost}\\${dbConfig.instanceName}`;
  } else if (fullServer.includes("\\") && !fullServer.includes(",")) {
    // Already has instance name
  }

  let connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${fullServer}${dbConfig.port ? `,${dbConfig.port}` : ""};Database=${dbConfig.database};`;

  if (isSqlAuth && !dbConfig.windowsAuth) {
    connectionString += `UID=${dbConfig.user};PWD=${dbConfig.password};`;
  } else {
    connectionString += "Trusted_Connection=yes;";
  }

  connectionString += `Encrypt=${dbConfig.encrypt ? "yes" : "no"};`;
  connectionString += `TrustServerCertificate=${dbConfig.trustServerCertificate ? "yes" : "no"};`;

  console.log(`[db] Connection string built for host: ${serverHost} (SQL Auth: ${!!isSqlAuth})`);

  return {
    connectionString,
    requestTimeout: Number(process.env.DATABASE_REQUEST_TIMEOUT || 60000),
    connectionTimeout: Number(process.env.DATABASE_CONNECTION_TIMEOUT || 30000),
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
};

async function connectWithFallback() {
  const hosts = [dbConfig.server, "localhost", "127.0.0.1"].filter((v, i, arr) => arr.indexOf(v) === i);
  let lastError: unknown;

  for (const host of hosts) {
    try {
      const config = buildConfig(host);
      console.log(`[db] Attempting connection to host: ${host}`);
      return await mssql.connect(config);
    } catch (err: any) {
      console.error(`[db] Connection failed for host ${host}: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError;
}

async function ensureDeliveryChallanSchema() {
  const p = await getPool();
  console.log("[db:init] Ensuring delivery challan schema");
  
  // Check if table exists first
  const tableCheck = await p.request().query("SELECT OBJECT_ID(N'delivery_challans', N'U') as table_id");
  if (!tableCheck.recordset[0].table_id) {
    console.log("[db:init] Skipping delivery challan schema (table not found)");
    return;
  }

  await p.request().batch(`
    IF COL_LENGTH('delivery_challans', 'subtotal') IS NULL
      ALTER TABLE delivery_challans ADD subtotal DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challans_subtotal DEFAULT 0;

    IF COL_LENGTH('delivery_challans', 'tax_amount') IS NULL
      ALTER TABLE delivery_challans ADD tax_amount DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challans_tax_amount DEFAULT 0;

    IF COL_LENGTH('delivery_challans', 'total') IS NULL
      ALTER TABLE delivery_challans ADD total DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challans_total DEFAULT 0;

    IF COL_LENGTH('delivery_challan_items', 'rate') IS NULL
      ALTER TABLE delivery_challan_items ADD rate DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challan_items_rate DEFAULT 0;

    IF COL_LENGTH('delivery_challan_items', 'tax_rate_id') IS NULL
      ALTER TABLE delivery_challan_items ADD tax_rate_id UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('delivery_challan_items', 'tax_amount') IS NULL
      ALTER TABLE delivery_challan_items ADD tax_amount DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challan_items_tax_amount DEFAULT 0;

    IF COL_LENGTH('delivery_challan_items', 'amount') IS NULL
      ALTER TABLE delivery_challan_items ADD amount DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challan_items_amount DEFAULT 0;
  `);
  console.log("[db:init] Delivery challan schema ready");
}

async function ensureSubscriptionSchema() {
  const p = await getPool();
  console.log("[db:init] Ensuring subscription schema");
  await p.request().batch(`
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
    END;

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
    END;

    IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL AND COL_LENGTH('subscriptions', 'plan_id') IS NULL
      ALTER TABLE dbo.subscriptions ADD plan_id UNIQUEIDENTIFIER NULL;
    IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL AND COL_LENGTH('subscriptions', 'invoice_limit') IS NULL
      ALTER TABLE dbo.subscriptions ADD invoice_limit INT NULL;
    IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL AND COL_LENGTH('subscriptions', 'user_limit') IS NULL
      ALTER TABLE dbo.subscriptions ADD user_limit INT NULL;
  `);
  console.log("[db:init] Subscription schema ready");

  console.log("[db:init] Seeding plans and subscriptions");
  await p.request().batch(`
    IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE name = 'Free')
      INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
      VALUES (NEWID(), 'Free', 0, 25, 1, '{}', GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE name = 'Basic')
      INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
      VALUES (NEWID(), 'Basic', 999, 500, 5, '{}', GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM dbo.plans WHERE name = 'Pro')
      INSERT INTO dbo.plans (id, name, price, invoice_limit, user_limit, features_json, created_at, updated_at)
      VALUES (NEWID(), 'Pro', 2999, NULL, NULL, '{}', GETDATE(), GETDATE());

    IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL
    BEGIN
      UPDATE s
      SET s.plan_id = p.id
      FROM dbo.subscriptions s
      INNER JOIN dbo.plans p ON LOWER(p.name) = LOWER(COALESCE(s.plan_name, 'Free'))
      WHERE s.plan_id IS NULL;

      UPDATE s
      SET s.invoice_limit = COALESCE(s.invoice_limit, p.invoice_limit),
          s.user_limit = COALESCE(s.user_limit, p.user_limit)
      FROM dbo.subscriptions s
      INNER JOIN dbo.plans p ON p.id = s.plan_id;

      INSERT INTO dbo.subscriptions (id, tenant_id, plan_id, plan_name, start_date, invoice_limit, user_limit, status, auto_renew, created_at, updated_at)
      SELECT NEWID(), c.id, p.id, p.name, GETDATE(), p.invoice_limit, p.user_limit, 'active', 1, GETDATE(), GETDATE()
      FROM dbo.companies c
      CROSS JOIN dbo.plans p
      WHERE p.name = 'Free'
        AND OBJECT_ID(N'dbo.companies', N'U') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM dbo.subscriptions s WHERE s.tenant_id = c.id);
    END;
  `);
  console.log("[db:init] Subscription seed ready");
  await p.request().batch(`
    IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_subscriptions_tenant_id' AND object_id = OBJECT_ID('dbo.subscriptions'))
      CREATE INDEX IX_subscriptions_tenant_id ON dbo.subscriptions (tenant_id, status, created_at);
  `);
  console.log("[db:init] Subscription indexes ready");
}

async function ensureFeatureAccessSchema() {
  const p = await getPool();
  console.log("[db:init] Ensuring feature access schema");
  await p.request().batch(`
    IF OBJECT_ID(N'dbo.plan_features', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.plan_features (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        plan_id UNIQUEIDENTIFIER NOT NULL,
        feature_key NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
      );
    END;

    IF OBJECT_ID(N'dbo.role_permissions', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.role_permissions (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        tenant_id UNIQUEIDENTIFIER NOT NULL,
        role NVARCHAR(50) NOT NULL,
        feature_key NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
      );
    END;

    IF OBJECT_ID(N'dbo.plan_features', N'U') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_plan_features_plan_id' AND object_id = OBJECT_ID('dbo.plan_features'))
      CREATE INDEX IX_plan_features_plan_id ON dbo.plan_features (plan_id, feature_key);

    IF OBJECT_ID(N'dbo.role_permissions', N'U') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_role_permissions_tenant_id' AND object_id = OBJECT_ID('dbo.role_permissions'))
      CREATE INDEX IX_role_permissions_tenant_id ON dbo.role_permissions (tenant_id, role, feature_key);
  `);

  await p.request().batch(`
    DECLARE @free_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'free');
    DECLARE @basic_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'basic');
    DECLARE @pro_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'pro');

    IF @free_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.plan_features WHERE plan_id = @free_id)
    BEGIN
      INSERT INTO dbo.plan_features (id, plan_id, feature_key, created_at)
      VALUES
        (NEWID(), @free_id, 'dashboard', GETDATE()),
        (NEWID(), @free_id, 'sales.customers', GETDATE());
    END;

    IF @basic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.plan_features WHERE plan_id = @basic_id)
    BEGIN
      INSERT INTO dbo.plan_features (id, plan_id, feature_key, created_at)
      VALUES
        (NEWID(), @basic_id, 'dashboard', GETDATE()),
        (NEWID(), @basic_id, 'sales.customers', GETDATE()),
        (NEWID(), @basic_id, 'sales.quotations', GETDATE()),
        (NEWID(), @basic_id, 'sales.sales_orders', GETDATE()),
        (NEWID(), @basic_id, 'sales.delivery_challans', GETDATE()),
        (NEWID(), @basic_id, 'sales.invoices', GETDATE()),
        (NEWID(), @basic_id, 'sales.recurring_invoices', GETDATE()),
        (NEWID(), @basic_id, 'sales.payments_received', GETDATE()),
        (NEWID(), @basic_id, 'sales.credit_notes', GETDATE()),
        (NEWID(), @basic_id, 'sales.sales_returns', GETDATE()),
        (NEWID(), @basic_id, 'purchase.vendors', GETDATE()),
        (NEWID(), @basic_id, 'purchase.purchase_orders', GETDATE()),
        (NEWID(), @basic_id, 'purchase.bills', GETDATE()),
        (NEWID(), @basic_id, 'purchase.recurring_bills', GETDATE()),
        (NEWID(), @basic_id, 'purchase.payments_made', GETDATE()),
        (NEWID(), @basic_id, 'purchase.vendor_credits', GETDATE()),
        (NEWID(), @basic_id, 'purchase.purchase_returns', GETDATE()),
        (NEWID(), @basic_id, 'gst.gst_settings', GETDATE()),
        (NEWID(), @basic_id, 'gst.gstr_1', GETDATE()),
        (NEWID(), @basic_id, 'gst.gstr_3b', GETDATE()),
        (NEWID(), @basic_id, 'gst.hsn_summary', GETDATE());
    END;
  `);

  const proPlan = await p.request().query(`SELECT TOP 1 id FROM dbo.plans WHERE LOWER(name) = 'pro'`);
  const proId = proPlan.recordset[0]?.id;
  if (proId) {
    const featureKeys = [
      "dashboard",
      "sales.customers",
      "sales.quotations",
      "sales.sales_orders",
      "sales.delivery_challans",
      "sales.invoices",
      "sales.recurring_invoices",
      "sales.payments_received",
      "sales.credit_notes",
      "sales.sales_returns",
      "purchase.vendors",
      "purchase.purchase_orders",
      "purchase.bills",
      "purchase.recurring_bills",
      "purchase.payments_made",
      "purchase.vendor_credits",
      "purchase.purchase_returns",
      "inventory.items",
      "inventory.categories",
      "inventory.price_lists",
      "inventory.warehouses",
      "inventory.stock_transfers",
      "inventory.adjustments",
      "inventory.stock_ledger",
      "inventory.expenses",
      "accounting.chart_of_accounts",
      "accounting.journal_entries",
      "accounting.ledger",
      "accounting.trial_balance",
      "accounting.profit_loss",
      "accounting.balance_sheet",
      "accounting.cash_flow",
      "accounting.day_book",
      "gst.gst_settings",
      "gst.gstr_1",
      "gst.gstr_3b",
      "gst.hsn_summary",
      "gst.e_invoice",
      "gst.e_way_bill",
      "pos.new_sale",
      "pos.sessions",
      "pos.orders",
      "pos.reports",
      "automation.workflows",
      "automation.reminders",
      "automation.settings",
    ];
    await p.request().query(`DELETE FROM dbo.plan_features WHERE plan_id = '${proId}' AND feature_key NOT IN (${featureKeys.map((key) => `'${key}'`).join(",")})`);
    for (const featureKey of featureKeys) {
      await p.request().query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.plan_features WHERE plan_id = '${proId}' AND feature_key = '${featureKey}')
          INSERT INTO dbo.plan_features (id, plan_id, feature_key, created_at)
          VALUES (NEWID(), '${proId}', '${featureKey}', GETDATE())
      `);
    }
  }
  console.log("[db:init] Feature access schema ready");
}

let pool: any;

export async function getPool() {
  if (!pool) {
    pool = await connectWithFallback();
  }
  return pool;
}

export async function getDb() {
  if (!pool) {
    throw new Error("MSSQL pool is not initialized yet");
  }
  return pool;
}

async function ensureTenantIdColumns() {
  const p = await getPool();
  console.log("[db:init] Ensuring tenant_id columns on multi-tenant tables");
  const tables = [
    'delivery_challans',
    'purchase_orders',
    'quotations',
    'recurring_invoices',
    'sales_orders'
  ];
  
  for (const table of tables) {
    try {
      await p.request().batch(`
        IF COL_LENGTH('${table}', 'tenant_id') IS NULL
        BEGIN
          ALTER TABLE ${table} ADD tenant_id UNIQUEIDENTIFIER NULL;
          CREATE INDEX IX_${table}_tenant_id ON ${table}(tenant_id);
        END
      `);
    } catch (err: any) {
      console.error(`[db:init] Error adding tenant_id to ${table}:`, err.message);
    }
  }
}

export async function initializeDb() {
  try {
    await getPool();
    await ensureDeliveryChallanSchema();
    await ensureSubscriptionSchema();
    await ensureFeatureAccessSchema();
    await ensureTenantIdColumns();
    console.log("Connected to MSSQL database:", dbConfig.database);
    return true;
  } catch (err) {
    console.error("CRITICAL: Failed to connect to MSSQL database during initialization:");
    console.dir(err, { depth: null });
    throw err;
  }
}

export const db = {
  get pool() {
    return pool;
  },
  async request() {
    const p = await getPool();
    return p.request();
  },
  async query(strings: TemplateStringsArray, ...values: any[]) {
    const p = await getPool();
    const request = p.request();
    let queryArgs = "";
    strings.forEach((str, i) => {
      queryArgs += str;
      if (i < values.length) {
        request.input(`param${i}`, values[i]);
        queryArgs += `@param${i}`;
      }
    });
    return request.query(queryArgs);
  }
};
