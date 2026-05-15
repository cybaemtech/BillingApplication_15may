// @ts-nocheck
import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { authenticate, signToken, AuthRequest, resolveEffectiveRole } from "./auth.js";
import { v4 as uuidv4 } from "uuid";
import { requireTenantContext } from "./middleware/tenantContext.js";
import { requireFeatureAccess } from "./middleware/featureAccess.js";
import { FEATURE_OPTIONS, getPlanFeatures, getTenantAllowedFeatures, getTenantRolePermissions, setPlanFeatures, setRolePermissions } from "./services/featureAccessService.js";
import { getTenantSubscriptionContext, updateTenantPlan } from "./services/subscriptionService.js";


const router = Router();
const FIXED_PAGE_LIMIT = 10;

function requireAdmin(req: AuthRequest, res: any): boolean {
  if (!["admin", "SUPER_ADMIN"].includes(String(req.user?.role || ""))) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

async function requireCybaemtechSuperAdmin(req: AuthRequest, res: any): Promise<boolean> {
  const email = String(req.user?.email || "").toLowerCase();
  const tenantId = String(req.user?.tenantId || "");
  const hasSuperRole = String(req.user?.role || "").toUpperCase() === "SUPER_ADMIN";

  if (email === "ganesh@gmail.com" && hasSuperRole) {
    return true;
  }

  if (!tenantId || !hasSuperRole) {
    res.status(403).json({ error: "Super admin access is restricted to CybaemTech" });
    return false;
  }

  const company = await db.query`
    SELECT TOP 1 company_name, email, website
    FROM companies
    WHERE id = ${tenantId}
  `.then((result) => result.recordset[0]);

  const fingerprint = [company?.company_name, company?.email, company?.website, email].join(" ").toLowerCase();
  if (fingerprint.includes("cybaemtech")) {
    return true;
  }

  res.status(403).json({ error: "Super admin access is restricted to CybaemTech" });
  return false;
}

async function resolveCybaemtechTenantId() {
  const company = await db.query`
    SELECT TOP 1 id
    FROM companies
    WHERE LOWER(COALESCE(company_name, '')) LIKE '%cybaemtech%'
       OR LOWER(COALESCE(email, '')) LIKE '%cybaemtech%'
       OR LOWER(COALESCE(website, '')) LIKE '%cybaemtech%'
    ORDER BY created_at ASC
  `.then((result) => result.recordset[0]);

  if (company?.id) {
    return String(company.id);
  }

  const defaultCompany = await db.query`
    SELECT TOP 1 id
    FROM companies
    WHERE LOWER(COALESCE(company_name, '')) LIKE '%default%'
       OR LOWER(COALESCE(website, '')) LIKE '%default%'
       OR LOWER(COALESCE(email, '')) LIKE '%default%'
    ORDER BY created_at ASC
  `.then((result) => result.recordset[0]);

  if (defaultCompany?.id) {
    return String(defaultCompany.id);
  }

  const fallback = await db.query`
    SELECT TOP 1 id
    FROM companies
    ORDER BY created_at ASC
  `.then((result) => result.recordset[0]);

  return fallback?.id ? String(fallback.id) : null;
}

function isSuperAdminRequest(req: AuthRequest): boolean {
  return String(req.user?.role || "").toUpperCase() === "SUPER_ADMIN";
}

function normalizeTenantRole(role?: string | null) {
  return String(role || "viewer").trim().toLowerCase();
}

function canManageTenantRole(currentRole?: string | null, targetRole?: string | null) {
  const actor = String(currentRole || "").toUpperCase();
  const target = String(targetRole || "").toUpperCase();

  if (actor === "SUPER_ADMIN") {
    return true;
  }

  if (actor !== "ADMIN") {
    return false;
  }

  return target !== "SUPER_ADMIN";
}

async function getUserAccessScope(userId: string) {
  const row = await db.query`
    SELECT TOP 1
      u.id,
      COALESCE(ur.tenant_id, p.tenant_id) as tenant_id,
      UPPER(COALESCE(ur.role, 'VIEWER')) as role
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ${userId}
  `.then((result) => result.recordset[0]).catch(() => null);

  return row || null;
}

function canManageTargetUser(actor: AuthRequest, target: { tenant_id?: string | null; role?: string | null } | null) {
  if (!target) return false;

  const actorRole = String(actor.user?.role || "").toUpperCase();
  const actorTenantId = String(actor.user?.tenantId || "");
  const targetTenantId = String(target.tenant_id || "");
  const targetRole = String(target.role || "").toUpperCase();

  if (actorRole === "SUPER_ADMIN") {
    return true;
  }

  if (actorRole !== "ADMIN") {
    return false;
  }

  if (targetRole === "SUPER_ADMIN") {
    return false;
  }

  return Boolean(actorTenantId) && actorTenantId === targetTenantId;
}

const MANAGEABLE_PERMISSION_ROLES = ["accountant", "staff", "viewer"];

async function getTenantRoleNames(tenantId: string): Promise<string[]> {
  const rows = await db.query`
    SELECT name
    FROM roles
    WHERE tenant_id = ${tenantId}
      AND is_active = 1
    ORDER BY is_system DESC, name ASC
  `.then((result) => result.recordset).catch(() => []);

  if (rows.length > 0) {
    return rows.map((row: any) => String(row.name || "").trim().toLowerCase()).filter(Boolean);
  }

  return [...MANAGEABLE_PERMISSION_ROLES];
}

function getTenantId(req: AuthRequest): string {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    throw new Error("Tenant context missing");
  }
  return tenantId;
}

function getSubscriptionSections(plan: any) {
  return [
    {
      key: "user_management",
      label: "User Management Per Company",
      description: "Tenant-scoped users, roles, and access coverage.",
      enabled: true,
    },
    {
      key: "authentication",
      label: "Authentication System",
      description: "Email + password, token auth, tenant-aware login flow.",
      enabled: true,
    },
    {
      key: "subscription_system",
      label: "Subscription System",
      description: "Plan selection, usage limits, upgrade path, and feature gating.",
      enabled: true,
    },
    {
      key: "billing_payments",
      label: "Billing & Payments",
      description: "Razorpay/Stripe style subscription billing workflow.",
      enabled: true,
    },
    {
      key: "onboarding",
      label: "Onboarding Flow",
      description: "Register, create company, GST setup, first customer, first invoice.",
      enabled: true,
    },
    {
      key: "data_security",
      label: "Data Security",
      description: "Tenant isolation, secured auth, and request-level access validation.",
      enabled: true,
    },
    {
      key: "performance_scaling",
      label: "Performance & Scaling",
      description: "Pagination, caching, and async workloads readiness.",
      enabled: true,
    },
    {
      key: "core_modules",
      label: "Modules Remain Same",
      description: "Sales, purchase, inventory, accounting, GST, reports, POS, settings.",
      enabled: true,
    },
    {
      key: "tenant_settings",
      label: "Settings Per Tenant",
      description: "GST, invoice template, email configuration, and tax slabs.",
      enabled: true,
    },
    {
      key: "super_admin",
      label: "Admin Panel",
      description: "Cross-organization control, subscription management, and usage visibility.",
      enabled: String(plan?.name || "").toLowerCase() === "pro",
    },
    {
      key: "backup_restore",
      label: "Backup System",
      description: "Tenant-level backup and restore readiness.",
      enabled: String(plan?.name || "").toLowerCase() === "pro",
    },
  ];
}

function getPlanModuleMatrix(plan: any) {
  const isPro = String(plan?.name || "").toLowerCase() === "pro";

  return [
    {
      key: "dashboard",
      label: "Dashboard",
      enabled: true,
      items: [
        { key: "dashboard_overview", label: "Overview", enabled: true },
        { key: "dashboard_metrics", label: "Metrics", enabled: true },
      ],
    },
    {
      key: "sales",
      label: "Sales",
      enabled: true,
      items: [
        { key: "sales_customers", label: "Customers", enabled: true },
        { key: "sales_quotations", label: "Quotations", enabled: true },
        { key: "sales_orders", label: "Sales Orders", enabled: true },
        { key: "sales_invoices", label: "Invoices", enabled: true },
        { key: "sales_payments", label: "Payments", enabled: true },
      ],
    },
    {
      key: "purchase",
      label: "Purchase",
      enabled: true,
      items: [
        { key: "purchase_vendors", label: "Vendors", enabled: true },
        { key: "purchase_orders", label: "Purchase Orders", enabled: true },
        { key: "purchase_bills", label: "Bills", enabled: true },
      ],
    },
    {
      key: "inventory",
      label: "Inventory",
      enabled: true,
      items: [
        { key: "inventory_items", label: "Items", enabled: true },
        { key: "inventory_warehouses", label: "Warehouses", enabled: true },
        { key: "inventory_transfers", label: "Stock Transfers", enabled: true },
      ],
    },
    {
      key: "accounting",
      label: "Accounting",
      enabled: true,
      items: [
        { key: "accounting_chart", label: "Chart of Accounts", enabled: true },
        { key: "accounting_journals", label: "Journal Entries", enabled: true },
        { key: "accounting_reports", label: "Financial Reports", enabled: true },
      ],
    },
    {
      key: "gst",
      label: "GST",
      enabled: true,
      items: [
        { key: "gst_settings", label: "GST Settings", enabled: true },
        { key: "gst_returns", label: "Returns", enabled: true },
        { key: "gst_compliance", label: "Compliance", enabled: true },
      ],
    },
    {
      key: "reports",
      label: "Reports",
      enabled: true,
      items: [
        { key: "reports_sales", label: "Sales Reports", enabled: true },
        { key: "reports_tax", label: "Tax Reports", enabled: true },
        { key: "reports_inventory", label: "Inventory Reports", enabled: true },
      ],
    },
    {
      key: "pos",
      label: "POS",
      enabled: true,
      items: [
        { key: "pos_counter", label: "POS Counter", enabled: true },
        { key: "pos_sessions", label: "Sessions", enabled: true },
      ],
    },
    {
      key: "settings",
      label: "Settings",
      enabled: true,
      items: [
        { key: "settings_company", label: "Company", enabled: true },
        { key: "settings_tax", label: "Taxes", enabled: true },
        { key: "settings_invoice", label: "Invoice Settings", enabled: true },
      ],
    },
    {
      key: "super_admin",
      label: "Super Admin",
      enabled: isPro,
      items: [
        { key: "super_admin_orgs", label: "Organizations", enabled: isPro },
        { key: "super_admin_usage", label: "Usage", enabled: isPro },
        { key: "super_admin_disable", label: "Disable Tenant", enabled: isPro },
      ],
    },
  ];
}

function getPaginationParams(req: any) {
  const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
  const parsedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = FIXED_PAGE_LIMIT;
  const offset = (page - 1) * limit;
  return { shouldPaginate, page, limit, offset };
}

async function runRawQuery(sqlText: string, inputs: Record<string, any> = {}) {
  const request = await db.request();
  Object.entries(inputs).forEach(([key, value]) => {
    request.input(key, value);
  });
  return request.query(sqlText);
}

function getDocumentTableName(docType: string): string | null {
  const tableNames: Record<string, string> = {
    quotation: "quotations",
    sales_order: "sales_orders",
    delivery_challan: "delivery_challans",
    invoice: "invoices",
    credit_note: "credit_notes",
    purchase_order: "purchase_orders",
    bill: "bills",
    vendor_credit: "vendor_credits",
    sales_return: "sales_returns",
    purchase_return: "purchase_returns",
    payment_received: "payments_received",
    payment_made: "payments_made",
    journal_entry: "journal_entries",
    pos_order: "pos_orders",
  };

  return tableNames[docType] || null;
}

function getDocumentIdentifierColumn(docType: string): string {
  const columnNames: Record<string, string> = {
    payment_received: "payment_number",
    payment_made: "payment_number",
    pos_order: "order_number",
  };

  return columnNames[docType] || "document_number";
}

async function sendPaginatedResults(req: any, res: any, dataQuery: string, countQuery: string, inputs: Record<string, any> = {}) {
  const { shouldPaginate, page, limit, offset } = getPaginationParams(req);

  if (!shouldPaginate) {
    const result = await runRawQuery(dataQuery, inputs);
    res.json(result.recordset);
    return;
  }

  const [dataResult, countResult] = await Promise.all([
    runRawQuery(`${dataQuery} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, { ...inputs, offset, limit }),
    runRawQuery(countQuery, inputs),
  ]);

  const total = Number(countResult.recordset[0]?.total || 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = total === 0 ? 0 : offset + 1;
  const end = total === 0 ? 0 : Math.min(offset + dataResult.recordset.length, total);

  res.json({
    data: dataResult.recordset,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      start,
      end,
    },
  });
}

function sendPaginatedArray(req: any, res: any, items: any[]) {
  const { shouldPaginate, page, limit, offset } = getPaginationParams(req);

  if (!shouldPaginate) {
    res.json(items);
    return;
  }

  const total = items.length;
  const data = items.slice(offset, offset + limit);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = total === 0 ? 0 : offset + 1;
  const end = total === 0 ? 0 : Math.min(offset + data.length, total);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      start,
      end,
    },
  });
}

// ===== HELPER: Generate Document Number =====
async function generateDocNumber(docType: string): Promise<string> {
  const defaults: Record<string, { prefix: string; padding: number }> = {
    quotation: { prefix: "QT-", padding: 4 },
    sales_order: { prefix: "SO-", padding: 4 },
    delivery_challan: { prefix: "DC-", padding: 4 },
    invoice: { prefix: "INV-", padding: 4 },
    credit_note: { prefix: "CN-", padding: 4 },
    purchase_order: { prefix: "PO-", padding: 4 },
    bill: { prefix: "BILL-", padding: 4 },
    vendor_credit: { prefix: "VC-", padding: 4 },
    payment_received: { prefix: "PR-", padding: 4 },
    payment_made: { prefix: "PM-", padding: 4 },
    expense: { prefix: "EXP-", padding: 4 },
    sales_return: { prefix: "SR-", padding: 4 },
    purchase_return: { prefix: "PRTN-", padding: 4 },
    journal_entry: { prefix: "JE-", padding: 4 },
    pos_order: { prefix: "POS-", padding: 4 },
  };

  let seqResult = await db.query`SELECT * FROM document_sequences WHERE document_type = ${docType}`;
  let seq = seqResult.recordset[0];

  if (!seq) {
    const fallback = defaults[docType];
    if (!fallback) throw new Error(`Document sequence not found: ${docType}`);

    const id = uuidv4();
    await db.query`INSERT INTO document_sequences (id, document_type, prefix, next_number, padding)
      VALUES (${id}, ${docType}, ${fallback.prefix}, 1, ${fallback.padding})`;

    seqResult = await db.query`SELECT * FROM document_sequences WHERE document_type = ${docType}`;
    seq = seqResult.recordset[0];
  }

  const tableName = getDocumentTableName(docType);
  const identifierColumn = getDocumentIdentifierColumn(docType);
  let num = Number(seq.next_number || 1);
  let candidate = "";

  while (true) {
    const padded = String(num).padStart(seq.padding, "0");
    candidate = seq.prefix + padded;

    if (!tableName) {
      break;
    }

    const existingResult = await runRawQuery(
      `SELECT TOP 1 id FROM dbo.${tableName} WHERE ${identifierColumn} = @candidate`,
      { candidate }
    );

    if (!existingResult.recordset[0]) {
      break;
    }

    num += 1;
  }

  await db.query`UPDATE document_sequences SET next_number = ${num + 1} WHERE id = ${seq.id}`;
  return candidate;
}

// ===== HELPER: Update stock =====
// ===== HELPER: Update stock =====
async function updateStock(itemId: string, qty: number, movementType: any, refId: string, refType: string, cost: number = 0, userId?: string) {
  const itemResult = await db.query`SELECT * FROM items WHERE id = ${itemId}`;
  const item = itemResult.recordset[0];
  if (!item) return;
  const isInflow = ["purchase", "vendor_credit", "in"].includes(movementType);
  const newStock = Number(item.current_stock) + (isInflow ? qty : -qty);
  const effectiveCost = Number(cost || item.purchase_rate || 0);
  await db.query`UPDATE items SET current_stock = ${newStock} WHERE id = ${itemId}`;
  const movementId = uuidv4();
  await db.query`INSERT INTO stock_movements (id, item_id, movement_type, quantity, cost_price, reference_id, reference_type, created_by, created_at) 
    VALUES (${movementId}, ${itemId}, ${movementType}, ${qty}, ${effectiveCost}, ${refId}, ${refType}, ${userId || null}, GETDATE())`;
}

async function adjustWarehouseStock(warehouseId: string | null | undefined, itemId: string, delta: number) {
  if (!warehouseId || !itemId || !Number.isFinite(delta) || delta === 0) return;

  const existing = await db.query`
    SELECT TOP 1 * FROM warehouse_stock
    WHERE warehouse_id = ${warehouseId} AND item_id = ${itemId}
  `.then((result) => result.recordset[0]);

  if (existing) {
    await db.query`
      UPDATE warehouse_stock
      SET quantity = ${Number(existing.quantity || 0) + delta}, updated_at = GETDATE()
      WHERE id = ${existing.id}
    `;
    return;
  }

  await db.query`
    INSERT INTO warehouse_stock (id, warehouse_id, item_id, quantity, updated_at)
    VALUES (${uuidv4()}, ${warehouseId}, ${itemId}, ${delta}, GETDATE())
  `;
}

async function setWarehouseStock(warehouseId: string | null | undefined, itemId: string, quantity: number) {
  if (!warehouseId || !itemId || !Number.isFinite(quantity)) return;

  const existing = await db.query`
    SELECT TOP 1 * FROM warehouse_stock
    WHERE warehouse_id = ${warehouseId} AND item_id = ${itemId}
  `.then((result) => result.recordset[0]);

  if (existing) {
    await db.query`
      UPDATE warehouse_stock
      SET quantity = ${quantity}, updated_at = GETDATE()
      WHERE id = ${existing.id}
    `;
    return;
  }

  await db.query`
    INSERT INTO warehouse_stock (id, warehouse_id, item_id, quantity, updated_at)
    VALUES (${uuidv4()}, ${warehouseId}, ${itemId}, ${quantity}, GETDATE())
  `;
}

function normalizeAccountText(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function computeDerivedAccountBalances(accounts: any[], tenantId?: string | null) {
  const tenantFilter = tenantId || null;
  const [
    invoices,
    bills,
    paymentsReceived,
    paymentsMade,
    expenses,
    creditNotes,
    vendorCredits,
    salesReturns,
    purchaseReturns,
    items,
  ] = await Promise.all([
    db.query`SELECT total, balance_due, tax_amount FROM invoices WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT total, balance_due, tax_amount FROM bills WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT amount FROM payments_received WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT amount FROM payments_made WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT category, amount, tax_amount, payment_mode FROM expenses WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT total FROM credit_notes WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT total FROM vendor_credits WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT total FROM sales_returns WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT total FROM purchase_returns WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
    db.query`SELECT current_stock, purchase_rate FROM items WHERE ${tenantFilter} IS NULL OR tenant_id = ${tenantFilter}`.then((res) => res.recordset),
  ]);

  const sumField = (rows: any[], field: string) => rows.reduce((sum: number, row: any) => sum + Number(row?.[field] || 0), 0);
  const expenseTotalsByCategory = new Map<string, number>();
  for (const expense of expenses) {
    const category = normalizeAccountText(expense.category || "general expense");
    const total = Number(expense.amount || 0) + Number(expense.tax_amount || 0);
    expenseTotalsByCategory.set(category, (expenseTotalsByCategory.get(category) || 0) + total);
  }

  const receivables = sumField(invoices, "balance_due");
  const payables = sumField(bills, "balance_due");
  const netSales = sumField(invoices, "total") - sumField(creditNotes, "total") - sumField(salesReturns, "total");
  const purchaseSpend = sumField(bills, "total") - sumField(vendorCredits, "total") - sumField(purchaseReturns, "total");
  const directExpenses = expenses.reduce((sum: number, row: any) => sum + Number(row.amount || 0) + Number(row.tax_amount || 0), 0);
  const cashPosition = sumField(paymentsReceived, "amount") - sumField(paymentsMade, "amount") - directExpenses;
  const inventoryValue = items.reduce((sum: number, row: any) => sum + (Number(row.current_stock || 0) * Number(row.purchase_rate || 0)), 0);
  const equityValue = netSales - purchaseSpend - directExpenses;

  const typeTotals: Record<string, number> = {
    asset: receivables + inventoryValue + cashPosition,
    liability: payables,
    income: netSales,
    expense: purchaseSpend + directExpenses,
    equity: equityValue,
  };

  const derivedById = new Map<string, number | null>();

  for (const account of accounts) {
    const type = String(account.account_type || "").toLowerCase();
    const name = normalizeAccountText(`${account.code || ""} ${account.name || ""}`);
    let derived: number | null = null;

    if (type === "asset") {
      if (/(receivable|debtor|customer)/.test(name)) derived = receivables;
      else if (/(inventory|stock)/.test(name)) derived = inventoryValue;
      else if (/(cash|bank|upi|wallet|card)/.test(name)) derived = cashPosition;
    } else if (type === "liability") {
      if (/(payable|creditor|vendor|supplier)/.test(name)) derived = payables;
    } else if (type === "income") {
      if (/(sale|revenue|income)/.test(name)) derived = netSales;
    } else if (type === "expense") {
      const matchedCategory = Array.from(expenseTotalsByCategory.entries()).find(([category]) => category && (name.includes(category) || category.includes(name)));
      if (matchedCategory) derived = matchedCategory[1];
      else if (/(purchase|cost of goods|cogs)/.test(name)) derived = purchaseSpend;
      else if (/(expense|overhead|admin|rent|salary|travel|utility|office|marketing|fuel|repair|misc)/.test(name)) derived = directExpenses;
    } else if (type === "equity") {
      if (/(equity|capital|retained|earning|owner)/.test(name)) derived = equityValue;
    }

    derivedById.set(account.id, derived);
  }

  for (const [type, total] of Object.entries(typeTotals)) {
    const accountsOfType = accounts.filter((account: any) => String(account.account_type || "").toLowerCase() === type);
    if (accountsOfType.length === 0) continue;

    const allocated = accountsOfType.reduce((sum: number, account: any) => sum + Number(derivedById.get(account.id) || 0), 0);
    const residual = total - allocated;
    if (Math.abs(residual) <= 0.001) continue;

    const target = accountsOfType.find((account: any) => derivedById.get(account.id) == null) || accountsOfType[0];
    derivedById.set(target.id, Number(derivedById.get(target.id) || 0) + residual);
  }

  return accounts.map((account: any) => {
    const storedBalance = Number(account.balance || 0);
    const derivedBalance = Number(derivedById.get(account.id) || 0);
    return {
      ...account,
      stored_balance: storedBalance,
      derived_balance: derivedBalance,
      balance: storedBalance + derivedBalance,
    };
  });
}

// ===== AUTH ROUTES =====
router.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, username, display_name } = req.body;
    const ip_address = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
    const user_agent = (req.headers["user-agent"] as string) || null;

    // Check if user exists
    const existing = await db.query`SELECT * FROM users WHERE email = ${email} OR username = ${username || email}`;
    if (existing.recordset.length > 0) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user_id = uuidv4();

    // Insert into users
    await db.query`INSERT INTO users (id, username, email, password_hash, is_active, created_at, updated_at) 
      VALUES (${user_id}, ${username || email}, ${email}, ${password_hash}, 1, GETDATE(), GETDATE())`;

    // Insert into profiles
    const profile_id = uuidv4();
    await db.query`INSERT INTO profiles (id, user_id, display_name, email, created_at, updated_at) 
      VALUES (${profile_id}, ${user_id}, ${display_name || username || email}, ${email}, GETDATE(), GETDATE())`;

    // Default role = admin for first user, viewer for others
    const anyRoleResult = await db.query`SELECT TOP 1 * FROM user_roles`;
    const role = anyRoleResult.recordset.length === 0 ? "admin" : "viewer";
    const role_id = uuidv4();
    await db.query`INSERT INTO user_roles (id, user_id, role, created_at) VALUES (${role_id}, ${user_id}, ${role}, GETDATE())`;

    const token = signToken({ id: user_id, email, role });

    // Auth Session
    const session_id = uuidv4();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query`INSERT INTO auth_sessions (id, user_id, jwt_token, issued_at, expires_at, ip_address, user_agent, created_at) 
      VALUES (${session_id}, ${user_id}, ${token}, GETDATE(), ${expires_at}, ${ip_address}, ${user_agent}, GETDATE())`;

    // Audit Log
    const log_id = uuidv4();
    await db.query`INSERT INTO auth_audit_logs (id, user_id, email, event_type, success, message, ip_address, user_agent, created_at) 
      VALUES (${log_id}, ${user_id}, ${email}, 'signup', 1, 'User created successfully', ${ip_address}, ${user_agent}, GETDATE())`;

    res.status(201).json({
      token,
      user: {
        id: user_id,
        username: username || email,
        email,
        display_name: display_name || username || email,
        role
      }
    });
  } catch (e: any) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip_address = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
    const user_agent = (req.headers["user-agent"] as string) || null;

    const userResult = await db.query`
      SELECT u.*, p.display_name 
      FROM users u 
      LEFT JOIN profiles p ON u.id = p.user_id 
      WHERE u.email = ${email} OR u.username = ${email}`;
    const user = userResult.recordset[0];

    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      const log_id = uuidv4();
      await db.query`INSERT INTO auth_audit_logs (id, email, event_type, success, message, ip_address, user_agent, created_at) 
        VALUES (${log_id}, ${email}, 'signin', 0, 'Invalid email or password', ${ip_address}, ${user_agent}, GETDATE())`;
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const roleResult = await db.query`SELECT * FROM user_roles WHERE user_id = ${user.id}`;
    const roleRow = roleResult.recordset[0];
    const effectiveRole = resolveEffectiveRole(user.email, roleRow?.role);
    const token = signToken({ id: user.id, email: user.email, role: effectiveRole });

    const session_id = uuidv4();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query`INSERT INTO auth_sessions (id, user_id, jwt_token, issued_at, expires_at, ip_address, user_agent, created_at) 
      VALUES (${session_id}, ${user.id}, ${token}, GETDATE(), ${expires_at}, ${ip_address}, ${user_agent}, GETDATE())`;

    const log_id = uuidv4();
    await db.query`INSERT INTO auth_audit_logs (id, user_id, email, event_type, success, message, ip_address, user_agent, created_at) 
      VALUES (${log_id}, ${user.id}, ${user.email}, 'signin', 1, 'Signin successful', ${ip_address}, ${user_agent}, GETDATE())`;

    res.json({ token, user: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, role: effectiveRole } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/auth/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const userResult = await db.query`
      SELECT u.*, p.display_name 
      FROM users u 
      LEFT JOIN profiles p ON u.id = p.user_id 
      WHERE u.id = ${req.user!.id}`;
    const user = userResult.recordset[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const roleResult = await db.query`SELECT * FROM user_roles WHERE user_id = ${user.id}`;
    const roleRow = roleResult.recordset[0];
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      role: resolveEffectiveRole(user.email, roleRow?.role),
      tenant_id: req.user?.tenantId || null,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== CUSTOMERS =====
router.get("/customers", authenticate, requireTenantContext, requireFeatureAccess("sales.customers"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.gstin,
        c.pan,
        c.billing_address,
        c.shipping_address,
        c.state,
        c.credit_limit,
        c.is_active,
        c.created_by,
        c.created_at,
        c.updated_at,
        COALESCE((SELECT SUM(COALESCE(i.balance_due, 0)) FROM invoices i WHERE i.customer_id = c.id AND i.tenant_id = @tenant_id), 0) as outstanding_balance,
        COALESCE((SELECT SUM(COALESCE(i.total, 0)) FROM invoices i WHERE i.customer_id = c.id AND i.tenant_id = @tenant_id), 0) as total_sales,
        COALESCE((SELECT COUNT(*) FROM invoices i WHERE i.customer_id = c.id AND i.tenant_id = @tenant_id), 0) as invoice_count
      FROM customers c
      WHERE c.tenant_id = @tenant_id
      ORDER BY c.created_at DESC
    `, `SELECT COUNT(*) as total FROM customers WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/customers/:id", authenticate, async (req, res) => {
  try {
    const customerId = req.params.id;
    const customerResult = await db.query`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.gstin,
        c.pan,
        c.billing_address,
        c.shipping_address,
        c.state,
        c.credit_limit,
        c.is_active,
        c.created_by,
        c.created_at,
        c.updated_at,
        COALESCE((SELECT SUM(COALESCE(i.balance_due, 0)) FROM invoices i WHERE i.customer_id = c.id), 0) as outstanding_balance,
        COALESCE((SELECT SUM(COALESCE(i.total, 0)) FROM invoices i WHERE i.customer_id = c.id), 0) as total_sales,
        COALESCE((SELECT SUM(COALESCE(pr.amount, 0)) FROM payments_received pr WHERE pr.customer_id = c.id), 0) as total_received,
        COALESCE((SELECT SUM(COALESCE(cn.total, 0)) FROM credit_notes cn WHERE cn.customer_id = c.id), 0) as total_credits,
        COALESCE((SELECT SUM(COALESCE(sr.total, 0)) FROM sales_returns sr WHERE sr.customer_id = c.id), 0) as total_returns,
        COALESCE((SELECT COUNT(*) FROM quotations q WHERE q.customer_id = c.id), 0) as quotation_count,
        COALESCE((SELECT COUNT(*) FROM sales_orders so WHERE so.customer_id = c.id), 0) as sales_order_count,
        COALESCE((SELECT COUNT(*) FROM delivery_challans dc WHERE dc.customer_id = c.id), 0) as delivery_challan_count,
        COALESCE((SELECT COUNT(*) FROM invoices i WHERE i.customer_id = c.id), 0) as invoice_count
      FROM customers c
      WHERE c.id = ${customerId}
    `;
    const customer = customerResult.recordset[0];
    if (!customer) { res.status(404).json({ error: "Not found" }); return; }

    const [quotationsResult, salesOrdersResult, deliveryChallansResult, invoicesResult, paymentsResult, creditNotesResult, salesReturnsResult, itemSalesResult] = await Promise.all([
      db.query`SELECT id, document_number, date, total, status FROM quotations WHERE customer_id = ${customerId} ORDER BY date DESC, created_at DESC`,
      db.query`SELECT id, document_number, date, total, status FROM sales_orders WHERE customer_id = ${customerId} ORDER BY date DESC, created_at DESC`,
      db.query`SELECT id, document_number, date, total, status FROM delivery_challans WHERE customer_id = ${customerId} ORDER BY date DESC, created_at DESC`,
      db.query`SELECT id, document_number, date, due_date, total, balance_due, status FROM invoices WHERE customer_id = ${customerId} ORDER BY date DESC, created_at DESC`,
      db.query`
        SELECT pr.id, pr.payment_number, pr.date, pr.amount, pr.payment_mode, pr.reference_number, pr.invoice_id, i.document_number as invoice_number
        FROM payments_received pr
        LEFT JOIN invoices i ON pr.invoice_id = i.id
        WHERE pr.customer_id = ${customerId}
        ORDER BY pr.date DESC, pr.created_at DESC
      `,
      db.query`SELECT id, document_number, date, total, status FROM credit_notes WHERE customer_id = ${customerId} ORDER BY date DESC, created_at DESC`,
      db.query`SELECT id, document_number, date, total, status FROM sales_returns WHERE customer_id = ${customerId} ORDER BY date DESC, created_at DESC`,
      db.query`
        SELECT TOP 10
          ii.item_id,
          COALESCE(it.name, ii.description, 'Item') as item_name,
          COALESCE(it.hsn_code, '') as hsn_code,
          SUM(COALESCE(ii.quantity, 0)) as total_quantity,
          SUM(COALESCE(ii.amount, 0) + COALESCE(ii.tax_amount, 0)) as total_value
        FROM invoice_items ii
        INNER JOIN invoices inv ON ii.invoice_id = inv.id
        LEFT JOIN items it ON ii.item_id = it.id
        WHERE inv.customer_id = ${customerId}
        GROUP BY ii.item_id, it.name, ii.description, it.hsn_code
        ORDER BY total_value DESC
      `
    ]);

    res.json({
      ...customer,
      history: {
        quotations: quotationsResult.recordset,
        salesOrders: salesOrdersResult.recordset,
        deliveryChallans: deliveryChallansResult.recordset,
        invoices: invoicesResult.recordset,
        payments: paymentsResult.recordset,
        creditNotes: creditNotesResult.recordset,
        salesReturns: salesReturnsResult.recordset,
      },
      itemSales: itemSalesResult.recordset,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/customers", authenticate, requireTenantContext, requireFeatureAccess("sales.customers"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { name, email, phone, gstin, pan, billing_address, shipping_address, state, credit_limit, outstanding_balance, is_active } = req.body;
    await db.query`INSERT INTO customers (id, tenant_id, name, email, phone, gstin, pan, billing_address, shipping_address, state, credit_limit, outstanding_balance, is_active, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${name}, ${email || null}, ${phone || null}, ${gstin || null}, ${pan || null}, ${billing_address || null}, ${shipping_address || null}, ${state || null}, ${credit_limit || 0}, ${outstanding_balance || 0}, ${is_active ?? true}, ${req.user!.id}, GETDATE(), GETDATE())`;
    const dataResult = await db.query`SELECT * FROM customers WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/customers/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { name, email, phone, gstin, pan, billing_address, shipping_address, state, credit_limit, outstanding_balance, is_active } = req.body;
    await db.query`UPDATE customers SET name = COALESCE(${name}, name), email = COALESCE(${email}, email), phone = COALESCE(${phone}, phone), gstin = COALESCE(${gstin}, gstin), pan = COALESCE(${pan}, pan), billing_address = COALESCE(${billing_address}, billing_address), shipping_address = COALESCE(${shipping_address}, shipping_address), state = COALESCE(${state}, state), credit_limit = COALESCE(${credit_limit}, credit_limit), outstanding_balance = COALESCE(${outstanding_balance}, outstanding_balance), is_active = COALESCE(${is_active}, is_active), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM customers WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/customers/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM customers WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (
      message.includes("DELETE statement conflicted") ||
      message.includes("REFERENCE constraint") ||
      message.includes("FK_")
    ) {
      res.status(400).json({ error: "Customer cannot be deleted because it is linked to existing transactions." });
      return;
    }
    res.status(500).json({ error: e.message });
  }
});

router.get("/customers/:id/ledger", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const cid = req.params.id;
    const [invRowsResult, pmtRowsResult, cnRowsResult] = await Promise.all([
      db.query`SELECT id, document_number, date, total, balance_due, status FROM invoices WHERE customer_id = ${cid} AND tenant_id = ${tenantId} ORDER BY date DESC`,
      db.query`SELECT id, payment_number, date, amount, payment_mode FROM payments_received WHERE customer_id = ${cid} AND tenant_id = ${tenantId} ORDER BY date DESC`,
      db.query`SELECT id, document_number, date, total, status FROM credit_notes WHERE customer_id = ${cid} AND tenant_id = ${tenantId} ORDER BY date DESC`,
    ]);
    res.json({ invoices: invRowsResult.recordset, payments: pmtRowsResult.recordset, creditNotes: cnRowsResult.recordset });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== VENDORS =====
router.get("/vendors", authenticate, requireTenantContext, requireFeatureAccess("purchase.vendors"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT
        v.id,
        v.name,
        v.email,
        v.phone,
        v.gstin,
        v.pan,
        v.address,
        v.state,
        v.is_active,
        v.created_by,
        v.created_at,
        v.updated_at,
        COALESCE((SELECT SUM(COALESCE(b.balance_due, 0)) FROM bills b WHERE b.vendor_id = v.id AND b.tenant_id = @tenant_id), 0) as outstanding_balance,
        COALESCE((SELECT SUM(COALESCE(b.total, 0)) FROM bills b WHERE b.vendor_id = v.id AND b.tenant_id = @tenant_id), 0) as total_purchases,
        COALESCE((SELECT COUNT(*) FROM bills b WHERE b.vendor_id = v.id AND b.tenant_id = @tenant_id), 0) as bill_count
      FROM vendors v
      WHERE v.tenant_id = @tenant_id
      ORDER BY v.created_at DESC
    `, `SELECT COUNT(*) as total FROM vendors WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/vendors/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const vendorId = req.params.id;
    const vendorResult = await db.query`
      SELECT
        v.id,
        v.name,
        v.email,
        v.phone,
        v.gstin,
        v.pan,
        v.address,
        v.state,
        v.is_active,
        v.created_by,
        v.created_at,
        v.updated_at,
        COALESCE((SELECT SUM(COALESCE(b.balance_due, 0)) FROM bills b WHERE b.vendor_id = v.id AND b.tenant_id = ${tenantId}), 0) as outstanding_balance,
        COALESCE((SELECT SUM(COALESCE(b.total, 0)) FROM bills b WHERE b.vendor_id = v.id AND b.tenant_id = ${tenantId}), 0) as total_purchases,
        COALESCE((SELECT SUM(COALESCE(pm.amount, 0)) FROM payments_made pm WHERE pm.vendor_id = v.id AND pm.tenant_id = ${tenantId}), 0) as total_paid,
        COALESCE((SELECT SUM(COALESCE(vc.total, 0)) FROM vendor_credits vc WHERE vc.vendor_id = v.id AND vc.tenant_id = ${tenantId}), 0) as total_credits,
        COALESCE((SELECT SUM(COALESCE(pr.total, 0)) FROM purchase_returns pr WHERE pr.vendor_id = v.id AND pr.tenant_id = ${tenantId}), 0) as total_returns,
        COALESCE((SELECT COUNT(*) FROM purchase_orders po WHERE po.vendor_id = v.id AND po.tenant_id = ${tenantId}), 0) as purchase_order_count,
        COALESCE((SELECT COUNT(*) FROM bills b WHERE b.vendor_id = v.id AND b.tenant_id = ${tenantId}), 0) as bill_count
      FROM vendors v
      WHERE v.id = ${vendorId} AND v.tenant_id = ${tenantId}
    `;
    const vendor = vendorResult.recordset[0];
    if (!vendor) { res.status(404).json({ error: "Not found" }); return; }

    const [purchaseOrdersResult, billsResult, paymentsResult, vendorCreditsResult, purchaseReturnsResult, itemPurchasesResult] = await Promise.all([
      db.query`SELECT id, document_number, date, total, status FROM purchase_orders WHERE vendor_id = ${vendorId} ORDER BY date DESC, created_at DESC`,
      db.query`SELECT id, document_number, date, due_date, total, balance_due, status FROM bills WHERE vendor_id = ${vendorId} ORDER BY date DESC, created_at DESC`,
      db.query`
        SELECT pm.id, pm.payment_number, pm.date, pm.amount, pm.payment_mode, pm.reference_number, pm.bill_id, b.document_number as bill_number
        FROM payments_made pm
        LEFT JOIN bills b ON pm.bill_id = b.id
        WHERE pm.vendor_id = ${vendorId}
        ORDER BY pm.date DESC, pm.created_at DESC
      `,
      db.query`SELECT id, document_number, date, total, status FROM vendor_credits WHERE vendor_id = ${vendorId} ORDER BY date DESC, created_at DESC`,
      db.query`SELECT id, document_number, date, total, status FROM purchase_returns WHERE vendor_id = ${vendorId} ORDER BY date DESC, created_at DESC`,
      db.query`
        SELECT TOP 10
          bi.item_id,
          COALESCE(it.name, bi.description, 'Item') as item_name,
          COALESCE(it.hsn_code, '') as hsn_code,
          SUM(COALESCE(bi.quantity, 0)) as total_quantity,
          SUM(COALESCE(bi.amount, 0) + COALESCE(bi.tax_amount, 0)) as total_value
        FROM bill_items bi
        INNER JOIN bills b ON bi.bill_id = b.id
        LEFT JOIN items it ON bi.item_id = it.id
        WHERE b.vendor_id = ${vendorId}
        GROUP BY bi.item_id, it.name, bi.description, it.hsn_code
        ORDER BY total_value DESC
      `
    ]);

    res.json({
      ...vendor,
      history: {
        purchaseOrders: purchaseOrdersResult.recordset,
        bills: billsResult.recordset,
        payments: paymentsResult.recordset,
        vendorCredits: vendorCreditsResult.recordset,
        purchaseReturns: purchaseReturnsResult.recordset,
      },
      itemPurchases: itemPurchasesResult.recordset,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/vendors", authenticate, requireTenantContext, requireFeatureAccess("purchase.vendors"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { name, email, phone, gstin, pan, address, state, outstanding_balance, is_active } = req.body;
    await db.query`INSERT INTO vendors (id, tenant_id, name, email, phone, gstin, pan, address, state, outstanding_balance, is_active, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${name}, ${email || null}, ${phone || null}, ${gstin || null}, ${pan || null}, ${address || null}, ${state || null}, ${outstanding_balance || 0}, ${is_active ?? true}, ${req.user!.id}, GETDATE(), GETDATE())`;
    const dataResult = await db.query`SELECT * FROM vendors WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/vendors/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { name, email, phone, gstin, pan, address, state, outstanding_balance, is_active } = req.body;
    await db.query`UPDATE vendors SET name = COALESCE(${name}, name), email = COALESCE(${email}, email), phone = COALESCE(${phone}, phone), gstin = COALESCE(${gstin}, gstin), pan = COALESCE(${pan}, pan), address = COALESCE(${address}, address), state = COALESCE(${state}, state), outstanding_balance = COALESCE(${outstanding_balance}, outstanding_balance), is_active = COALESCE(${is_active}, is_active), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM vendors WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/vendors/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM vendors WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (
      message.includes("DELETE statement conflicted") ||
      message.includes("REFERENCE constraint") ||
      message.includes("FK_")
    ) {
      res.status(400).json({ error: "Vendor cannot be deleted because it is linked to existing purchase records." });
      return;
    }
    res.status(500).json({ error: e.message });
  }
});

router.get("/vendors/:id/ledger", authenticate, async (req, res) => {
  try {
    const vid = req.params.id;
    const [billRowsResult, pmtRowsResult] = await Promise.all([
      db.query`SELECT id, document_number, date, total, balance_due, status FROM bills WHERE vendor_id = ${vid} ORDER BY date DESC`,
      db.query`SELECT id, payment_number, date, amount, payment_mode FROM payments_made WHERE vendor_id = ${vid} ORDER BY date DESC`,
    ]);
    res.json({ bills: billRowsResult.recordset, payments: pmtRowsResult.recordset });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== ITEMS =====
router.get("/items", authenticate, requireTenantContext, requireFeatureAccess("inventory.items"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT i.*, tr.name as tax_rate_name, tr.rate as tax_rate_value
      FROM items i
      LEFT JOIN tax_rates tr ON i.tax_rate_id = tr.id
      WHERE i.tenant_id = @tenant_id
      ORDER BY i.created_at DESC
    `, `SELECT COUNT(*) as total FROM items WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/items/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const itemId = req.params.id;
    const dataResult = await db.query`
      SELECT
        i.id,
        i.name,
        i.sku,
        i.hsn_code,
        i.category,
        i.unit,
        i.purchase_rate,
        i.selling_rate,
        i.tax_rate_id,
        i.opening_stock,
        i.current_stock,
        i.reorder_level,
        i.is_active,
        i.created_by,
        i.created_at,
        i.updated_at,
        tr.name as tax_rate_name,
        tr.rate as tax_rate_value,
        COALESCE((SELECT SUM(COALESCE(ii.quantity, 0)) FROM invoice_items ii WHERE ii.item_id = i.id AND ii.tenant_id = ${tenantId}), 0) as sold_quantity,
        COALESCE((SELECT SUM(COALESCE(ii.amount, 0) + COALESCE(ii.tax_amount, 0)) FROM invoice_items ii WHERE ii.item_id = i.id AND ii.tenant_id = ${tenantId}), 0) as sales_value,
        COALESCE((SELECT SUM(COALESCE(bi.quantity, 0)) FROM bill_items bi WHERE bi.item_id = i.id AND bi.tenant_id = ${tenantId}), 0) as purchased_quantity,
        COALESCE((SELECT SUM(COALESCE(bi.amount, 0) + COALESCE(bi.tax_amount, 0)) FROM bill_items bi WHERE bi.item_id = i.id AND bi.tenant_id = ${tenantId}), 0) as purchase_value
      FROM items i
      LEFT JOIN tax_rates tr ON i.tax_rate_id = tr.id
      WHERE i.id = ${itemId} AND i.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const [stockResult, salesHistoryResult, purchaseHistoryResult] = await Promise.all([
      db.query`SELECT * FROM stock_movements WHERE item_id = ${itemId} ORDER BY created_at DESC`,
      db.query`
        SELECT TOP 20
          inv.id as document_id,
          inv.document_number,
          inv.date,
          inv.customer_id,
          c.name as customer_name,
          ii.quantity,
          ii.rate,
          ii.tax_amount,
          ii.amount,
          (COALESCE(ii.amount, 0) + COALESCE(ii.tax_amount, 0)) as line_total
        FROM invoice_items ii
        INNER JOIN invoices inv ON ii.invoice_id = inv.id
        LEFT JOIN customers c ON inv.customer_id = c.id
        WHERE ii.item_id = ${itemId}
        ORDER BY inv.date DESC, inv.created_at DESC
      `,
      db.query`
        SELECT TOP 20
          b.id as document_id,
          b.document_number,
          b.date,
          b.vendor_id,
          v.name as vendor_name,
          bi.quantity,
          bi.rate,
          bi.tax_amount,
          bi.amount,
          (COALESCE(bi.amount, 0) + COALESCE(bi.tax_amount, 0)) as line_total
        FROM bill_items bi
        INNER JOIN bills b ON bi.bill_id = b.id
        LEFT JOIN vendors v ON b.vendor_id = v.id
        WHERE bi.item_id = ${itemId}
        ORDER BY b.date DESC, b.created_at DESC
      `, { tenant_id: tenantId }
    ]);

    res.json({
      ...data,
      stock_movements: stockResult.recordset,
      sales_history: salesHistoryResult.recordset,
      purchase_history: purchaseHistoryResult.recordset,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/items", authenticate, requireTenantContext, requireFeatureAccess("inventory.items"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { name, sku, hsn_code, category, unit, purchase_rate, selling_rate, tax_rate_id, opening_stock, reorder_level, is_active } = req.body;
    const current_stock = opening_stock || 0;
    await db.query`INSERT INTO items (id, tenant_id, name, sku, hsn_code, category, unit, purchase_rate, selling_rate, tax_rate_id, opening_stock, current_stock, reorder_level, is_active, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${name}, ${sku || null}, ${hsn_code || null}, ${category || null}, ${unit || null}, ${purchase_rate || 0}, ${selling_rate || 0}, ${tax_rate_id || null}, ${opening_stock || 0}, ${current_stock}, ${reorder_level || 0}, ${is_active ?? true}, ${req.user!.id}, GETDATE(), GETDATE())`;
    const dataResult = await db.query`SELECT * FROM items WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/items/:id", authenticate, async (req, res) => {
  try {
    const { name, sku, hsn_code, category, unit, purchase_rate, selling_rate, tax_rate_id, current_stock, reorder_level, is_active } = req.body;
    await db.query`UPDATE items SET name = COALESCE(${name}, name), sku = COALESCE(${sku}, sku), hsn_code = COALESCE(${hsn_code}, hsn_code), category = COALESCE(${category}, category), unit = COALESCE(${unit}, unit), purchase_rate = COALESCE(${purchase_rate}, purchase_rate), selling_rate = COALESCE(${selling_rate}, selling_rate), tax_rate_id = COALESCE(${tax_rate_id}, tax_rate_id), current_stock = COALESCE(${current_stock}, current_stock), reorder_level = COALESCE(${reorder_level}, reorder_level), is_active = COALESCE(${is_active}, is_active), updated_at = GETDATE() WHERE id = ${req.params.id}`;
    const dataResult = await db.query`SELECT * FROM items WHERE id = ${req.params.id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/items/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM items WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/items/:id/stock", authenticate, async (req, res) => {
  try {
    const dataResult = await db.query`SELECT * FROM stock_movements WHERE item_id = ${req.params.id} ORDER BY created_at DESC`;
    res.json(dataResult.recordset);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== JOURNAL ENTRIES =====
router.get("/journal-entries", authenticate, requireTenantContext, requireFeatureAccess("accounting.journal_entries"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { shouldPaginate, page, limit, offset } = getPaginationParams(req);
    const entriesResult = shouldPaginate
      ? await runRawQuery(`
      SELECT je.*
      FROM journal_entries je
      WHERE je.tenant_id = @tenant_id
      ORDER BY je.date DESC, je.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `, { tenant_id: tenantId, offset, limit })
      : await db.query`
      SELECT je.*
      FROM journal_entries je
      WHERE je.tenant_id = ${tenantId}
      ORDER BY je.date DESC, je.created_at DESC
    `;
    const entries = entriesResult.recordset;

    for (const entry of entries) {
      const lines = await db.query`
        SELECT jel.*, a.name as account_name, a.code as account_code, a.account_type
        FROM journal_entry_lines jel
        LEFT JOIN accounts a ON jel.account_id = a.id
        WHERE jel.journal_entry_id = ${entry.id}
      `.then(res => res.recordset);
      entry.journal_entry_lines = lines;
    }

    if (!shouldPaginate) {
      res.json(entries);
      return;
    }

    const countResult = await runRawQuery(`SELECT COUNT(*) as total FROM journal_entries WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
    const total = Number(countResult.recordset[0]?.total || 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = total === 0 ? 0 : offset + 1;
    const end = total === 0 ? 0 : Math.min(offset + entries.length, total);

    res.json({
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        start,
        end,
      },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/journal-entries/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const entryResult = await db.query`SELECT * FROM journal_entries WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const entry = entryResult.recordset[0];
    if (!entry) { res.status(404).json({ error: "Not found" }); return; }

    const lines = await db.query`
      SELECT jel.*, a.name as account_name, a.code as account_code, a.account_type
      FROM journal_entry_lines jel
      LEFT JOIN accounts a ON jel.account_id = a.id
      WHERE jel.journal_entry_id = ${req.params.id}
    `.then(res => res.recordset);

    res.json({ ...entry, journal_entry_lines: lines });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/journal-entries", authenticate, requireTenantContext, requireFeatureAccess("accounting.journal_entries"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { date, description, journal_type, reference_id, reference_type, is_auto, lines } = req.body;
    const document_number = await generateDocNumber('journal_entry');
    const totalDebit = (lines || []).reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = (lines || []).reduce((sum, line) => sum + Number(line.credit || 0), 0);

    if (!Array.isArray(lines) || lines.length < 2) {
      res.status(400).json({ error: 'Journal entry requires at least two lines' });
      return;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      res.status(400).json({ error: 'Total debit must equal total credit' });
      return;
    }

    await db.query`
      INSERT INTO journal_entries (id, tenant_id, document_number, date, description, journal_type, reference_id, reference_type, is_auto, created_by, created_at)
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${description || null}, ${journal_type || 'general'}, ${reference_id || null}, ${reference_type || null}, ${is_auto ?? false}, ${req.user!.id}, GETDATE())
    `;

    for (const line of lines) {
      await db.query`
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit, description)
        VALUES (${uuidv4()}, ${id}, ${line.account_id}, ${Number(line.debit || 0)}, ${Number(line.credit || 0)}, ${line.description || null})
      `;
    }

    const entryResult = await db.query`SELECT * FROM journal_entries WHERE id = ${id}`;
    const created = entryResult.recordset[0];
    const lineRows = await db.query`
      SELECT jel.*, a.name as account_name, a.code as account_code, a.account_type
      FROM journal_entry_lines jel
      LEFT JOIN accounts a ON jel.account_id = a.id
      WHERE jel.journal_entry_id = ${id}
    `.then(res => res.recordset);

    res.json({ ...created, journal_entry_lines: lineRows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/journal-entries/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM journal_entry_lines WHERE journal_entry_id = ${req.params.id}`;
    await db.query`DELETE FROM journal_entries WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
// ===== TAX RATES =====
router.get("/tax-rates", authenticate, async (req, res) => {
  try {
    const data = await db.query`SELECT * FROM tax_rates ORDER BY rate ASC`.then(res => res.recordset);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/tax-rates", authenticate, async (req, res) => {
  try {
    const id = uuidv4();
    const { name, rate, tax_type, cgst, sgst, igst, is_active, is_default } = req.body;
    await db.query`
      INSERT INTO tax_rates (id, name, rate, tax_type, cgst, sgst, igst, is_default, is_active, created_at, updated_at)
      VALUES (
        ${id},
        ${name},
        ${rate},
        ${tax_type || 'GST'},
        ${cgst ?? (Number(rate || 0) / 2)},
        ${sgst ?? (Number(rate || 0) / 2)},
        ${igst ?? Number(rate || 0)},
        ${is_default ? 1 : 0},
        ${is_active ?? true ? 1 : 0},
        GETDATE(),
        GETDATE()
      )
    `;
    const dataResult = await db.query`SELECT * FROM tax_rates WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/tax-rates/:id", authenticate, async (req, res) => {
  try {
    const { name, rate, tax_type, cgst, sgst, igst, is_active, is_default } = req.body;
    await db.query`
      UPDATE tax_rates
      SET name = COALESCE(${name}, name),
          rate = COALESCE(${rate}, rate),
          tax_type = COALESCE(${tax_type}, tax_type),
          cgst = COALESCE(${cgst}, cgst),
          sgst = COALESCE(${sgst}, sgst),
          igst = COALESCE(${igst}, igst),
          is_active = COALESCE(${is_active}, is_active),
          is_default = COALESCE(${is_default}, is_default),
          updated_at = GETDATE()
      WHERE id = ${req.params.id}
    `;
    const dataResult = await db.query`SELECT * FROM tax_rates WHERE id = ${req.params.id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/tax-rates/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM tax_rates WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== ACCOUNTS =====
router.get("/accounts", authenticate, requireTenantContext, requireFeatureAccess("accounting.chart_of_accounts"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const rawAccounts = await db.query`SELECT * FROM accounts WHERE tenant_id = ${tenantId} ORDER BY code`.then(res => res.recordset);
    const data = await computeDerivedAccountBalances(rawAccounts, tenantId);
    sendPaginatedArray(req, res, data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/accounts/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const rawAccounts = await db.query`SELECT * FROM accounts WHERE tenant_id = ${tenantId} ORDER BY code`.then(res => res.recordset);
    const data = (await computeDerivedAccountBalances(rawAccounts, tenantId)).find((account: any) => account.id === req.params.id);
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/accounts", authenticate, requireTenantContext, requireFeatureAccess("accounting.chart_of_accounts"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { code, name, account_type, parent_id, is_system, balance } = req.body;
    await db.query`INSERT INTO accounts (id, tenant_id, code, name, account_type, parent_id, is_system, balance, created_at, updated_at) VALUES (${id}, ${tenantId}, ${code}, ${name}, ${account_type}, ${parent_id || null}, ${is_system ?? false}, ${balance || 0}, GETDATE(), GETDATE())`;
    const dataResult = await db.query`SELECT * FROM accounts WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/accounts/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { code, name, account_type, parent_id, is_system, balance } = req.body;
    await db.query`UPDATE accounts SET code = COALESCE(${code}, code), name = COALESCE(${name}, name), account_type = COALESCE(${account_type}, account_type), parent_id = COALESCE(${parent_id}, parent_id), is_system = COALESCE(${is_system}, is_system), balance = COALESCE(${balance}, balance), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM accounts WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/accounts/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM accounts WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Archaic Quotations and Sales Orders deleted.



// Routes moved to consolidated section below




// ===== STOCK MOVEMENTS =====
router.get("/stock-movements", authenticate, async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT
        sm.*,
        i.name AS item_name,
        i.sku AS item_sku,
        i.unit AS item_unit,
        CASE WHEN ISNULL(sm.cost_price, 0) = 0 THEN ISNULL(i.purchase_rate, 0) ELSE sm.cost_price END AS effective_cost
      FROM stock_movements sm
      LEFT JOIN items i ON sm.item_id = i.id
      ORDER BY sm.created_at DESC
    `, `SELECT COUNT(*) as total FROM stock_movements`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/stock-movements/:id", authenticate, async (req, res) => {
  try {
    const movement = await db.query`
      SELECT
        sm.*,
        i.name AS item_name,
        i.sku AS item_sku,
        i.unit AS item_unit,
        i.purchase_rate,
        CASE WHEN ISNULL(sm.cost_price, 0) = 0 THEN ISNULL(i.purchase_rate, 0) ELSE sm.cost_price END AS effective_cost
      FROM stock_movements sm
      LEFT JOIN items i ON sm.item_id = i.id
      WHERE sm.id = ${req.params.id}
    `.then((result) => result.recordset[0]);
    if (!movement) { res.status(404).json({ error: "Not found" }); return; }
    res.json(movement);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== GST SETTINGS =====
router.get("/gst-settings", authenticate, requireTenantContext, requireFeatureAccess("gst.gst_settings"), async (req, res) => {
  try {
    if (!requireAdmin(req as AuthRequest, res)) return;
    const tenantId = getTenantId(req as AuthRequest);
    let data = await db.query`
      SELECT TOP 1 *
      FROM gst_settings
      WHERE tenant_id = ${tenantId}
    `.then((result) => result.recordset[0]);

    if (!data) {
      const company = await db.query`
        SELECT TOP 1 company_name, gstin, state
        FROM companies
        WHERE id = ${tenantId} OR tenant_id = ${tenantId}
      `.then((result) => result.recordset[0]);

      if (company) {
        const id = uuidv4();
        await db.query`
          INSERT INTO gst_settings (
            id,
            tenant_id,
            gstin,
            legal_name,
            trade_name,
            state,
            updated_at
          )
          VALUES (
            ${id},
            ${tenantId},
            ${company.gstin || null},
            ${company.company_name || null},
            ${company.company_name || null},
            ${company.state || null},
            GETDATE()
          )
        `;
        data = await db.query`SELECT * FROM gst_settings WHERE id = ${id}`.then((result) => result.recordset[0]);
      }
    }

    res.json(data || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/gst-settings", authenticate, requireTenantContext, requireFeatureAccess("gst.gst_settings"), async (req, res) => {
  try {
    if (!requireAdmin(req as AuthRequest, res)) return;
    const tenantId = getTenantId(req as AuthRequest);
    const existingResult = await db.query`
      SELECT TOP 1 *
      FROM gst_settings
      WHERE tenant_id = ${tenantId}
    `;
    const existing = existingResult.recordset[0];
    const {
      gstin,
      legal_name,
      trade_name,
      state,
      state_code,
      is_composition,
      reverse_charge_applicable,
      einvoice_enabled,
      eway_bill_enabled,
    } = req.body;
    let data;
    if (existing) {
      await db.query`
        UPDATE gst_settings
        SET gstin = ${gstin || null},
            legal_name = ${legal_name || null},
            trade_name = ${trade_name || null},
            state = ${state || null},
            state_code = ${state_code || null},
            is_composition = ${is_composition ? 1 : 0},
            reverse_charge_applicable = ${reverse_charge_applicable ? 1 : 0},
            einvoice_enabled = ${einvoice_enabled ? 1 : 0},
            eway_bill_enabled = ${eway_bill_enabled ? 1 : 0},
            updated_at = GETDATE()
        WHERE id = ${existing.id}
          AND tenant_id = ${tenantId}
      `;
      const updatedResult = await db.query`SELECT * FROM gst_settings WHERE id = ${existing.id}`;
      data = updatedResult.recordset[0];
    } else {
      const id = uuidv4();
      await db.query`
        INSERT INTO gst_settings (
          id,
          tenant_id,
          gstin,
          legal_name,
          trade_name,
          state,
          state_code,
          is_composition,
          reverse_charge_applicable,
          einvoice_enabled,
          eway_bill_enabled,
          updated_at
        )
        VALUES (
          ${id},
          ${tenantId},
          ${gstin || null},
          ${legal_name || null},
          ${trade_name || null},
          ${state || null},
          ${state_code || null},
          ${is_composition ? 1 : 0},
          ${reverse_charge_applicable ? 1 : 0},
          ${einvoice_enabled ? 1 : 0},
          ${eway_bill_enabled ? 1 : 0},
          GETDATE()
        )
      `;
      const createdResult = await db.query`SELECT * FROM gst_settings WHERE id = ${id}`;
      data = createdResult.recordset[0];
    }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== DOCUMENT SEQUENCES =====
router.get("/document-sequences", authenticate, async (req, res) => {
  try {
    const data = await db.query`SELECT * FROM document_sequences ORDER BY document_type ASC`.then(res => res.recordset);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/document-sequences/:id", authenticate, async (req, res) => {
  try {
    const { prefix, next_number, padding } = req.body;
    await db.query`UPDATE document_sequences SET prefix = ${prefix}, next_number = ${next_number}, padding = ${padding} WHERE id = ${req.params.id}`;
    const dataResult = await db.query`SELECT * FROM document_sequences WHERE id = ${req.params.id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== COMPANY =====
router.get("/company", authenticate, requireTenantContext, async (req, res) => {
  try {
    if (!requireAdmin(req as AuthRequest, res)) return;
    const tenantId = getTenantId(req as AuthRequest);
    const data = await db.query`
      SELECT TOP 1 *
      FROM companies
      WHERE id = ${tenantId} OR tenant_id = ${tenantId}
    `.then((result) => result.recordset[0]);
    res.json(data || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/company", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req as AuthRequest, res)) return;
    const tenantId = getTenantId(req as AuthRequest);
    const existingResult = await db.query`
      SELECT TOP 1 *
      FROM companies
      WHERE id = ${tenantId} OR tenant_id = ${tenantId}
    `;
    const existing = existingResult.recordset[0];
    const { company_name, name, email, phone, website, address, city, state, pincode, zip_code, gstin, pan } = req.body;
    const resolvedName = company_name || name || null;
    const resolvedPincode = pincode || zip_code || null;
    let data;
    if (existing) {
      await db.query`
        UPDATE companies
        SET company_name = ${resolvedName || existing.company_name},
            email = ${email || null},
            phone = ${phone || null},
            website = ${website || null},
            address = ${address || null},
            city = ${city || null},
            state = ${state || null},
            pincode = ${resolvedPincode},
            gstin = ${gstin || null},
            pan = ${pan || null},
            updated_at = GETDATE()
        WHERE id = ${existing.id}
      `;
      const updatedResult = await db.query`SELECT * FROM companies WHERE id = ${existing.id}`;
      data = updatedResult.recordset[0];
    } else {
      const id = tenantId || uuidv4();
      await db.query`
        INSERT INTO companies (
          id,
          company_name,
          email,
          phone,
          website,
          address,
          city,
          state,
          pincode,
          gstin,
          pan,
          created_by,
          created_at,
          updated_at,
          tenant_id
        )
        VALUES (
          ${id},
          ${resolvedName || "Company"},
          ${email || null},
          ${phone || null},
          ${website || null},
          ${address || null},
          ${city || null},
          ${state || null},
          ${resolvedPincode},
          ${gstin || null},
          ${pan || null},
          ${req.user!.id},
          GETDATE(),
          GETDATE(),
          ${tenantId}
        )
      `;
      const createdResult = await db.query`SELECT * FROM companies WHERE id = ${id}`;
      data = createdResult.recordset[0];
    }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== INVOICE SETTINGS =====
router.get("/invoice-settings", authenticate, requireTenantContext, async (req, res) => {
  try {
    const tenantId = getTenantId(req as AuthRequest);
    const dataResult = await db.query`
      SELECT TOP 1 *
      FROM invoice_settings
      WHERE tenant_id = ${tenantId}
    `;
    res.json(dataResult.recordset[0] || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/invoice-settings", authenticate, requireTenantContext, async (req, res) => {
  try {
    const tenantId = getTenantId(req as AuthRequest);
    const existingResult = await db.query`
      SELECT TOP 1 *
      FROM invoice_settings
      WHERE tenant_id = ${tenantId}
    `;
    const existing = existingResult.recordset[0];
    const { template_id, show_logo, show_signature, footer_text, terms_text, notes_text, accent_color } = req.body;
    let data;
    if (existing) {
      await db.query`
        UPDATE invoice_settings
        SET template_id = COALESCE(${template_id || null}, template_id),
            show_logo = COALESCE(${show_logo}, show_logo),
            show_signature = COALESCE(${show_signature}, show_signature),
            footer_text = COALESCE(${footer_text || null}, footer_text),
            terms_text = COALESCE(${terms_text || null}, terms_text),
            notes_text = COALESCE(${notes_text || null}, notes_text),
            accent_color = COALESCE(${accent_color || null}, accent_color),
            updated_at = GETDATE()
        WHERE id = ${existing.id}
          AND tenant_id = ${tenantId}
      `;
      const updatedResult = await db.query`SELECT * FROM invoice_settings WHERE id = ${existing.id}`;
      data = updatedResult.recordset[0];
    } else {
      const id = uuidv4();
      await db.query`
        INSERT INTO invoice_settings (
          id,
          template_id,
          show_logo,
          show_signature,
          footer_text,
          terms_text,
          notes_text,
          accent_color,
          tenant_id,
          updated_at
        )
        VALUES (
          ${id},
          ${template_id || null},
          ${show_logo ?? 1},
          ${show_signature ?? 1},
          ${footer_text || null},
          ${terms_text || null},
          ${notes_text || null},
          ${accent_color || null},
          ${tenantId},
          GETDATE()
        )
      `;
      const createdResult = await db.query`SELECT * FROM invoice_settings WHERE id = ${id}`;
      data = createdResult.recordset[0];
    }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PROFILES =====
router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const data = await db.query`SELECT id, email, username, is_active FROM users WHERE id = ${req.user!.id}`.then(res => res.recordset[0]);
    const profile = await db.query`SELECT * FROM profiles WHERE user_id = ${req.user!.id}`.then(res => res.recordset[0]);
    res.json({ ...data, ...profile });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const { display_name, phone } = req.body;
    await db.query`UPDATE profiles SET display_name = ${display_name || null}, phone = ${phone || null}, updated_at = GETDATE() WHERE user_id = ${req.user!.id}`;
    const profile = await db.query`SELECT * FROM profiles WHERE user_id = ${req.user!.id}`.then(res => res.recordset[0]);
    res.json(profile);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== USER ROLES =====
router.get("/user-roles", authenticate, async (req, res) => {
  try {
    const tenantId = (req as AuthRequest).user?.tenantId;
    const isSuperAdmin = isSuperAdminRequest(req as AuthRequest);
    const cybaemtechTenantId = await resolveCybaemtechTenantId();
    const rows = await db.query`
      SELECT
        COALESCE(ur.id, p.id, u.id) as id,
        u.id as user_id,
        ur.role as db_role,
        u.email,
        u.username,
        u.is_active,
        p.display_name,
        p.phone,
        COALESCE(ur.tenant_id, p.tenant_id, c.id, c.tenant_id) as tenant_id,
        c.company_name,
        c.email as company_email,
        c.website as company_website
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN companies c ON c.id = COALESCE(ur.tenant_id, p.tenant_id)
         OR c.tenant_id = COALESCE(ur.tenant_id, p.tenant_id)
         OR c.created_by = u.id
      WHERE ${isSuperAdmin ? null : tenantId || null} IS NULL
         OR COALESCE(ur.tenant_id, p.tenant_id, c.id, c.tenant_id) = ${isSuperAdmin ? null : tenantId || null}
      ORDER BY COALESCE(p.display_name, u.email)
    `.then(res => res.recordset);

    res.json(rows.map((row: any) => ({
      ...row,
      role: resolveEffectiveRole(row.email, row.db_role),
      is_cybaemtech_team:
        String(row.tenant_id || "") === String(cybaemtechTenantId || ""),
    })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/users", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const tenantId = isSuperAdminRequest(req)
      ? (await resolveCybaemtechTenantId()) || req.user?.tenantId || null
      : req.user?.tenantId || null;

    const { email, password, username, display_name, phone, role, is_active } = req.body;
    const normalizedRole = normalizeTenantRole(role);
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (!canManageTenantRole(req.user?.role, normalizedRole)) {
      res.status(403).json({ message: "You cannot assign the super admin role" });
      return;
    }

    if (tenantId) {
      const roleExists = await db.query`
        SELECT TOP 1 id
        FROM roles
        WHERE tenant_id = ${tenantId}
          AND LOWER(name) = LOWER(${normalizedRole})
      `.then((result) => result.recordset[0]).catch(() => null);
      if (!roleExists) {
        await db.query`
          INSERT INTO roles (id, tenant_id, name, label, is_system, is_active, created_at, updated_at)
          VALUES (${uuidv4()}, ${tenantId}, ${normalizedRole}, ${normalizedRole}, 0, 1, GETDATE(), GETDATE())
        `;
      }
    }

    const existing = await db.query`
      SELECT TOP 1
        u.id,
        u.email,
        u.username,
        u.is_active,
        p.id AS profile_id,
        p.tenant_id AS profile_tenant_id,
        ur.id AS role_id,
        ur.role AS existing_role,
        ur.tenant_id AS role_tenant_id
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.email = ${email} OR u.username = ${username || email}
      ORDER BY CASE WHEN u.email = ${email} THEN 0 ELSE 1 END, u.created_at ASC
    `;
    const existingRow = existing.recordset[0];

    if (
      existingRow &&
      !isSuperAdminRequest(req) &&
      tenantId &&
      existingRow.role_tenant_id &&
      String(existingRow.role_tenant_id) !== String(tenantId) &&
      existingRow.profile_tenant_id &&
      String(existingRow.profile_tenant_id) !== String(tenantId)
    ) {
      res.status(400).json({ error: "User already exists in another company" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = existingRow?.id || uuidv4();

    if (existingRow) {
      await db.query`
        UPDATE users
        SET username = ${username || email},
            email = ${email},
            password_hash = ${passwordHash},
            is_active = ${is_active ?? true},
            updated_at = GETDATE()
        WHERE id = ${userId}
      `;
    } else {
      await db.query`INSERT INTO users (id, username, email, password_hash, is_active, created_at, updated_at)
        VALUES (${userId}, ${username || email}, ${email}, ${passwordHash}, ${is_active ?? true}, GETDATE(), GETDATE())`;
    }

    const profileId = existingRow?.profile_id || uuidv4();
    if (existingRow?.profile_id) {
      await db.query`
        UPDATE profiles
        SET display_name = ${display_name || username || email},
            email = ${email},
            phone = ${phone || null},
            tenant_id = COALESCE(tenant_id, ${tenantId}),
            updated_at = GETDATE()
        WHERE id = ${profileId}
      `;
    } else {
      await db.query`INSERT INTO profiles (id, user_id, display_name, email, phone, created_at, updated_at, tenant_id)
        VALUES (${profileId}, ${userId}, ${display_name || username || email}, ${email}, ${phone || null}, GETDATE(), GETDATE(), ${tenantId})`;
    }

    const roleId = existingRow?.role_id || uuidv4();
    if (existingRow?.role_id) {
      await db.query`
        UPDATE user_roles
        SET role = ${normalizedRole},
            tenant_id = COALESCE(tenant_id, ${tenantId})
        WHERE id = ${roleId}
      `;
    } else {
      await db.query`INSERT INTO user_roles (id, user_id, role, created_at, tenant_id)
        VALUES (${roleId}, ${userId}, ${normalizedRole}, GETDATE(), ${tenantId})`;
    }

    const created = await db.query`
      SELECT ur.id, ur.user_id, ur.role, u.email, u.username, u.is_active, p.display_name, p.phone, COALESCE(ur.tenant_id, p.tenant_id) as tenant_id
      FROM user_roles ur
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ${userId}
    `;
    res.status(existingRow ? 200 : 201).json(created.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/super-admin/companies", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const {
      company_name,
      gstin,
      address,
      company_email,
      admin_name,
      admin_email,
      admin_password,
      admin_phone,
      plan_name,
      invoice_limit,
      user_limit,
      start_date,
      end_date,
      auto_renew,
    } = req.body || {};

    if (!company_name || !admin_email || !admin_password) {
      res.status(400).json({ error: "Company name, admin email, and admin password are required" });
      return;
    }

    const existingUser = await db.query`SELECT TOP 1 id FROM users WHERE email = ${admin_email}`;
    if (existingUser.recordset[0]) {
      res.status(400).json({ error: "Admin user already exists" });
      return;
    }

    const existingCompany = await db.query`SELECT TOP 1 id FROM companies WHERE company_name = ${company_name}`;
    if (existingCompany.recordset[0]) {
      res.status(400).json({ error: "Company already exists" });
      return;
    }

    const normalizedPlanName = String(plan_name || "Free");
    const plan = await db.query`SELECT TOP 1 * FROM plans WHERE LOWER(name) = LOWER(${normalizedPlanName})`.then((result) => result.recordset[0]);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const companyId = uuidv4();
    const userId = uuidv4();
    const profileId = uuidv4();
    const roleId = uuidv4();
    const subscriptionId = uuidv4();
    const passwordHash = await bcrypt.hash(String(admin_password), 10);
    const adminDisplayName = admin_name || admin_email;

    await db.query`
      INSERT INTO users (id, username, email, password_hash, is_active, created_at, updated_at)
      VALUES (${userId}, ${admin_email}, ${admin_email}, ${passwordHash}, 1, GETDATE(), GETDATE())
    `;

    await db.query`
      INSERT INTO companies (id, company_name, gstin, address, email, created_by, created_at, updated_at, tenant_id)
      VALUES (${companyId}, ${company_name}, ${gstin || null}, ${address || null}, ${company_email || admin_email}, ${userId}, GETDATE(), GETDATE(), ${companyId})
    `;

    await db.query`
      INSERT INTO profiles (id, user_id, display_name, email, phone, created_at, updated_at, tenant_id)
      VALUES (${profileId}, ${userId}, ${adminDisplayName}, ${admin_email}, ${admin_phone || null}, GETDATE(), GETDATE(), ${companyId})
    `;

    await db.query`
      INSERT INTO user_roles (id, user_id, role, created_at, tenant_id)
      VALUES (${roleId}, ${userId}, 'admin', GETDATE(), ${companyId})
    `;

    await db.query`
      INSERT INTO subscriptions (id, tenant_id, plan_id, plan_name, start_date, end_date, invoice_limit, user_limit, status, payment_provider, auto_renew, created_at, updated_at)
      VALUES (
        ${subscriptionId},
        ${companyId},
        ${plan.id},
        ${plan.name},
        ${start_date || new Date().toISOString().split("T")[0]},
        ${end_date || null},
        ${invoice_limit === "" ? plan.invoice_limit ?? null : invoice_limit ?? plan.invoice_limit ?? null},
        ${user_limit === "" ? plan.user_limit ?? null : user_limit ?? plan.user_limit ?? null},
        'active',
        'manual',
        ${auto_renew ?? false},
        GETDATE(),
        GETDATE()
      )
    `;

    await db.query`
      IF NOT EXISTS (SELECT 1 FROM gst_settings WHERE tenant_id = ${companyId})
      BEGIN
        INSERT INTO gst_settings (id, tenant_id, legal_name, trade_name, gstin, state, updated_at)
        VALUES (NEWID(), ${companyId}, ${company_name}, ${company_name}, ${gstin || ''}, '', GETDATE())
      END
    `.catch(() => null);

    res.status(201).json({
      success: true,
      company: {
        id: companyId,
        company_name,
        gstin: gstin || null,
        address: address || null,
        email: company_email || admin_email,
        tenant_id: companyId,
      },
      admin: {
        id: userId,
        display_name: adminDisplayName,
        email: admin_email,
        role: "admin",
        tenant_id: companyId,
      },
      subscription: {
        id: subscriptionId,
        tenant_id: companyId,
        plan_id: plan.id,
        plan_name: plan.name,
        start_date: start_date || new Date().toISOString().split("T")[0],
        end_date: end_date || null,
        invoice_limit: invoice_limit === "" ? plan.invoice_limit : invoice_limit ?? plan.invoice_limit,
        user_limit: user_limit === "" ? plan.user_limit : user_limit ?? plan.user_limit,
        auto_renew: auto_renew ?? false,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/users/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { email, username, display_name, phone, role, is_active, password } = req.body;
    const userId = req.params.id;
    const normalizedRole = role ? normalizeTenantRole(role) : null;
    const actorTenantId = req.user?.tenantId || null;

    const existing = await db.query`
      SELECT TOP 1 u.id, COALESCE(ur.tenant_id, p.tenant_id) as tenant_id, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ${userId}
    `;
    const existingRow = existing.recordset[0];
    if (!existingRow) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!canManageTargetUser(req, existingRow)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db.query`UPDATE users SET email = COALESCE(${email}, email), username = COALESCE(${username}, username), is_active = COALESCE(${is_active}, is_active), updated_at = GETDATE() WHERE id = ${userId}`;
    await db.query`UPDATE profiles SET display_name = COALESCE(${display_name}, display_name), email = COALESCE(${email}, email), phone = COALESCE(${phone}, phone), updated_at = GETDATE() WHERE user_id = ${userId}`;
    if (normalizedRole) {
      if (!canManageTenantRole(req.user?.role, normalizedRole)) {
        res.status(403).json({ message: "You cannot assign the super admin role" });
        return;
      }
      if (actorTenantId) {
        const roleExists = await db.query`
          SELECT TOP 1 id
          FROM roles
          WHERE tenant_id = ${actorTenantId}
            AND LOWER(name) = LOWER(${normalizedRole})
        `.then((result) => result.recordset[0]).catch(() => null);
        if (!roleExists) {
          await db.query`
            INSERT INTO roles (id, tenant_id, name, label, is_system, is_active, created_at, updated_at)
            VALUES (${uuidv4()}, ${actorTenantId}, ${normalizedRole}, ${normalizedRole}, 0, 1, GETDATE(), GETDATE())
          `;
        }
      }
      await db.query`UPDATE user_roles SET role = ${normalizedRole} WHERE user_id = ${userId}`;
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.query`UPDATE users SET password_hash = ${passwordHash}, updated_at = GETDATE() WHERE id = ${userId}`;
    }

    const updated = await db.query`
      SELECT ur.id, ur.user_id, ur.role, u.email, u.username, u.is_active, p.display_name, p.phone
      FROM user_roles ur
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ${userId}
    `;
    const payload = updated.recordset[0] || {
      id: userId,
      user_id: userId,
      role: normalizedRole || existingRow.role || "viewer",
      email: email || null,
      username: username || null,
      is_active: is_active ?? true,
      display_name: display_name || null,
      phone: phone || null,
    };
    res.json(payload);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/users/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    if (req.user!.id === req.params.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    const actorTenantId = req.user?.tenantId || null;
    const existing = await db.query`
      SELECT TOP 1 u.id, COALESCE(ur.tenant_id, p.tenant_id) as tenant_id, UPPER(COALESCE(ur.role, 'VIEWER')) as role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ${req.params.id}
    `;
    const existingRow = existing.recordset[0];
    if (!existingRow) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!canManageTargetUser(req, existingRow)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db.query`UPDATE users SET is_active = 0, updated_at = GETDATE() WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/user-roles/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const normalizedRole = normalizeTenantRole(req.body?.role);
    const actorTenantId = req.user?.tenantId || null;
    const existing = await db.query`SELECT TOP 1 id, tenant_id FROM user_roles WHERE id = ${req.params.id}`;
    const existingRow = existing.recordset[0];
    if (!existingRow) {
      res.status(404).json({ error: "User role not found" });
      return;
    }
    if (!canManageTargetUser(req, existingRow)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!canManageTenantRole(req.user?.role, normalizedRole)) {
      res.status(403).json({ message: "You cannot assign the super admin role" });
      return;
    }
    await db.query`UPDATE user_roles SET role = ${normalizedRole} WHERE id = ${req.params.id}`;
    const dataResult = await db.query`SELECT * FROM user_roles WHERE id = ${req.params.id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== ACTIVITY LOGS =====
router.get("/activity-logs", authenticate, async (req, res) => {
  try {
    const dataResult = await db.query`SELECT TOP 50 * FROM activity_logs ORDER BY created_at DESC`;
    res.json(dataResult.recordset);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/activity-logs", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { action, entityType, entityId, details } = req.body;
    await db.query`INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, created_at) VALUES (${id}, ${req.user!.id}, ${action}, ${entityType}, ${entityId || null}, ${details || null}, GETDATE())`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== ITEM CATEGORIES =====
router.get("/item-categories", authenticate, requireTenantContext, requireFeatureAccess("inventory.categories"), async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `SELECT * FROM item_categories ORDER BY name`, `SELECT COUNT(*) as total FROM item_categories`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/item-categories/:id", authenticate, async (req, res) => {
  try {
    const categoryResult = await db.query`SELECT * FROM item_categories WHERE id = ${req.params.id}`;
    const category = categoryResult.recordset[0];
    if (!category) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const items = await db.query`
      SELECT
        i.id,
        i.name,
        i.sku,
        i.hsn_code,
        i.category,
        i.unit,
        i.current_stock,
        i.purchase_rate,
        i.selling_rate,
        i.is_active,
        i.created_at
      FROM items i
      WHERE i.category = ${category.name}
      ORDER BY i.created_at DESC, i.name ASC
    `.then((result) => result.recordset);

    res.json({
      ...category,
      item_count: items.length,
      items,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/item-categories", authenticate, requireTenantContext, requireFeatureAccess("inventory.categories"), async (req, res) => {
  try {
    const id = uuidv4();
    const { name, description } = req.body;
    await db.query`INSERT INTO item_categories (id, name, description, created_at) VALUES (${id}, ${name}, ${description || null}, GETDATE())`;
    const dataResult = await db.query`SELECT * FROM item_categories WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/item-categories/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM item_categories WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PRICE LISTS =====
router.get("/price-lists", authenticate, async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT
        pl.*,
        COALESCE((SELECT COUNT(*) FROM price_list_items pli WHERE pli.price_list_id = pl.id), 0) as item_count
      FROM price_lists pl
      ORDER BY pl.name
    `, `SELECT COUNT(*) as total FROM price_lists`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/price-lists/:id", authenticate, async (req, res) => {
  try {
    const priceList = await db.query`
      SELECT * FROM price_lists WHERE id = ${req.params.id}
    `.then((result) => result.recordset[0]);
    if (!priceList) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT
        pli.*,
        i.name as item_name,
        i.sku,
        i.selling_rate,
        i.purchase_rate,
        i.current_stock
      FROM price_list_items pli
      LEFT JOIN items i ON pli.item_id = i.id
      WHERE pli.price_list_id = ${req.params.id}
      ORDER BY i.name ASC
    `.then((result) => result.recordset);

    res.json({ ...priceList, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/price-lists", authenticate, async (req, res) => {
  try {
    const id = uuidv4();
    const { name, description, is_active, items } = req.body;
    await db.query`INSERT INTO price_lists (id, name, description, is_active, created_at, updated_at) VALUES (${id}, ${name}, ${description || null}, ${is_active ?? true}, GETDATE(), GETDATE())`;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query`INSERT INTO price_list_items (id, price_list_id, item_id, rate) VALUES (${uuidv4()}, ${id}, ${item.item_id}, ${item.rate_or_percentage || item.rate || 0})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM price_lists WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/price-lists/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM price_list_items WHERE price_list_id = ${req.params.id}`;
    await db.query`DELETE FROM price_lists WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== WAREHOUSES =====
router.get("/warehouses", authenticate, async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT
        w.*,
        COALESCE((SELECT COUNT(*) FROM stock_transfers st WHERE st.from_warehouse_id = w.id OR st.to_warehouse_id = w.id), 0) as transfer_count,
        COALESCE((SELECT COUNT(*) FROM inventory_adjustments ia WHERE ia.warehouse_id = w.id), 0) as adjustment_count
      FROM warehouses w
      ORDER BY w.warehouse_name
    `, `SELECT COUNT(*) as total FROM warehouses`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/warehouses/:id", authenticate, async (req, res) => {
  try {
    const warehouse = await db.query`
      SELECT
        w.*,
        COALESCE((SELECT COUNT(*) FROM stock_transfers st WHERE st.from_warehouse_id = w.id OR st.to_warehouse_id = w.id), 0) as transfer_count,
        COALESCE((SELECT COUNT(*) FROM inventory_adjustments ia WHERE ia.warehouse_id = w.id), 0) as adjustment_count
      FROM warehouses w
      WHERE w.id = ${req.params.id}
    `.then((result) => result.recordset[0]);
    if (!warehouse) { res.status(404).json({ error: "Not found" }); return; }

    const [stockItems, transfers, adjustments] = await Promise.all([
      db.query`
        SELECT
          ws.*,
          i.name as item_name,
          i.sku,
          i.unit
        FROM warehouse_stock ws
        LEFT JOIN items i ON ws.item_id = i.id
        WHERE ws.warehouse_id = ${req.params.id}
        ORDER BY i.name ASC
      `.then((result) => result.recordset),
      db.query`
        SELECT TOP 20
          st.*,
          fw.warehouse_name as from_warehouse_name,
          tw.warehouse_name as to_warehouse_name
        FROM stock_transfers st
        LEFT JOIN warehouses fw ON st.from_warehouse_id = fw.id
        LEFT JOIN warehouses tw ON st.to_warehouse_id = tw.id
        WHERE st.from_warehouse_id = ${req.params.id} OR st.to_warehouse_id = ${req.params.id}
        ORDER BY st.created_at DESC
      `.then((result) => result.recordset),
      db.query`
        SELECT TOP 20 * FROM inventory_adjustments
        WHERE warehouse_id = ${req.params.id}
        ORDER BY created_at DESC
      `.then((result) => result.recordset),
    ]);

    res.json({ ...warehouse, stock_items: stockItems, transfers, adjustments });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/warehouses", authenticate, async (req, res) => {
  try {
    const id = uuidv4();
    const warehouseName = req.body.warehouse_name || req.body.warehouseName || req.body.name;
    const { address, branch_id, is_active } = req.body;

    if (!warehouseName) {
      return res.status(400).json({ error: "warehouse_name is required" });
    }

    await db.query`INSERT INTO warehouses (id, warehouse_name, address, branch_id, is_active, created_at) VALUES (${id}, ${warehouseName}, ${address || null}, ${branch_id || null}, ${is_active ?? true}, GETDATE())`;
    const dataResult = await db.query`SELECT * FROM warehouses WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/warehouses/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM warehouses WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== INVENTORY ADJUSTMENTS =====
router.get("/inventory-adjustments", authenticate, async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT
        ia.*,
        w.warehouse_name,
        COALESCE((SELECT COUNT(*) FROM inventory_adjustment_items iai WHERE iai.adjustment_id = ia.id), 0) as item_count
      FROM inventory_adjustments ia
      LEFT JOIN warehouses w ON ia.warehouse_id = w.id
      ORDER BY ia.created_at DESC
    `, `SELECT COUNT(*) as total FROM inventory_adjustments`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/inventory-adjustments/:id", authenticate, async (req, res) => {
  try {
    const adjustment = await db.query`
      SELECT
        ia.*,
        w.warehouse_name
      FROM inventory_adjustments ia
      LEFT JOIN warehouses w ON ia.warehouse_id = w.id
      WHERE ia.id = ${req.params.id}
    `.then((result) => result.recordset[0]);
    if (!adjustment) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT
        iai.*,
        i.name as item_name,
        i.sku,
        i.unit
      FROM inventory_adjustment_items iai
      LEFT JOIN items i ON iai.item_id = i.id
      WHERE iai.adjustment_id = ${req.params.id}
      ORDER BY i.name ASC
    `.then((result) => result.recordset);

    res.json({ ...adjustment, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/inventory-adjustments", authenticate, async (req: AuthRequest, res) => {
  try {
    const { items: lineItems, ...adj } = req.body;
    const id = uuidv4();
    const documentNumber = adj.document_number || adj.documentNumber || adj.reference_number;
    const adjustmentDate = adj.date || new Date().toISOString().split("T")[0];

    if (!documentNumber) {
      return res.status(400).json({ error: "document_number is required" });
    }

    await db.query`INSERT INTO inventory_adjustments (id, document_number, date, reason, status, warehouse_id, created_by, created_at, updated_at) 
      VALUES (${id}, ${documentNumber}, ${adjustmentDate}, ${adj.reason || null}, ${adj.status || 'draft'}, ${adj.warehouse_id || null}, ${req.user!.id}, GETDATE(), GETDATE())`;
    if (lineItems?.length > 0) {
      for (const item of lineItems) {
        const itemId = uuidv4();
        const adjustedQuantity = Number(item.adjusted_quantity ?? item.quantity ?? 0);
        const quantityOnHand = Number(item.quantity_on_hand ?? 0);
        const difference = item.difference != null ? Number(item.difference) : adjustedQuantity - quantityOnHand;
        const movementType = difference >= 0 ? 'in' : 'out';
        const movementCost = Number(item.cost_price ?? 0);

        await db.query`INSERT INTO inventory_adjustment_items (id, adjustment_id, item_id, quantity_on_hand, adjusted_quantity, difference, cost_price) 
          VALUES (${itemId}, ${id}, ${item.item_id}, ${quantityOnHand}, ${adjustedQuantity}, ${difference}, ${item.cost_price || 0})`;

        if (difference !== 0) {
          await updateStock(item.item_id, Math.abs(difference), movementType, id, 'Inventory Adjustment', movementCost);
          await setWarehouseStock(adj.warehouse_id || null, item.item_id, adjustedQuantity);
        }
      }
    }
    const dataResult = await db.query`SELECT * FROM inventory_adjustments WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== STOCK TRANSFERS =====
router.get("/stock-transfers", authenticate, async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT
        st.*,
        fw.warehouse_name as from_warehouse_name,
        tw.warehouse_name as to_warehouse_name,
        COALESCE((SELECT COUNT(*) FROM stock_transfer_items sti WHERE sti.transfer_id = st.id), 0) as item_count
      FROM stock_transfers st
      LEFT JOIN warehouses fw ON st.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON st.to_warehouse_id = tw.id
      ORDER BY st.created_at DESC
    `, `SELECT COUNT(*) as total FROM stock_transfers`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/stock-transfers/:id", authenticate, async (req, res) => {
  try {
    const transfer = await db.query`
      SELECT
        st.*,
        fw.warehouse_name as from_warehouse_name,
        tw.warehouse_name as to_warehouse_name
      FROM stock_transfers st
      LEFT JOIN warehouses fw ON st.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON st.to_warehouse_id = tw.id
      WHERE st.id = ${req.params.id}
    `.then((result) => result.recordset[0]);
    if (!transfer) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT
        sti.*,
        i.name as item_name,
        i.sku,
        i.unit
      FROM stock_transfer_items sti
      LEFT JOIN items i ON sti.item_id = i.id
      WHERE sti.transfer_id = ${req.params.id}
      ORDER BY i.name ASC
    `.then((result) => result.recordset);

    res.json({ ...transfer, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/stock-transfers", authenticate, async (req: AuthRequest, res) => {
  try {
    const { items: lineItems, ...transfer } = req.body;
    const id = uuidv4();
    const documentNumber = transfer.document_number || transfer.documentNumber || transfer.reference_number;
    const transferDate = transfer.date || new Date().toISOString().split("T")[0];

    if (!documentNumber) {
      return res.status(400).json({ error: "document_number is required" });
    }

    if (!transfer.from_warehouse_id || !transfer.to_warehouse_id) {
      return res.status(400).json({ error: "Both source and destination warehouses are required" });
    }

    if (transfer.from_warehouse_id === transfer.to_warehouse_id) {
      return res.status(400).json({ error: "Source and destination warehouses must be different" });
    }

    await db.query`INSERT INTO stock_transfers (id, document_number, date, from_warehouse_id, to_warehouse_id, status, notes, created_by, created_at) 
      VALUES (${id}, ${documentNumber}, ${transferDate}, ${transfer.from_warehouse_id}, ${transfer.to_warehouse_id}, ${transfer.status || 'draft'}, ${transfer.notes || null}, ${req.user!.id}, GETDATE())`;
    if (lineItems?.length > 0) {
      for (const item of lineItems) {
        const itemId = uuidv4();
        await db.query`INSERT INTO stock_transfer_items (id, transfer_id, item_id, quantity) 
          VALUES (${itemId}, ${id}, ${item.item_id}, ${item.quantity})`;

        await updateStock(item.item_id, item.quantity, 'out', id, 'Stock Transfer Out', 0, req.user!.id);
        await updateStock(item.item_id, item.quantity, 'in', id, 'Stock Transfer In', 0, req.user!.id);
        await adjustWarehouseStock(transfer.from_warehouse_id, item.item_id, -Number(item.quantity || 0));
        await adjustWarehouseStock(transfer.to_warehouse_id, item.item_id, Number(item.quantity || 0));
      }
    }
    const dataResult = await db.query`SELECT * FROM stock_transfers WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== POS SESSIONS =====
router.get("/pos/sessions", authenticate, requireTenantContext, requireFeatureAccess("pos.sessions"), async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT ps.*, u.username as owner_name
      FROM pos_sessions ps
      LEFT JOIN users u ON ps.opened_by = u.id
      ORDER BY ps.opened_at DESC
    `, `SELECT COUNT(*) as total FROM pos_sessions`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/pos/sessions/:id", authenticate, async (req, res) => {
  try {
    const sessionResult = await db.query`
      SELECT ps.*, u.username as owner_name
      FROM pos_sessions ps
      LEFT JOIN users u ON ps.opened_by = u.id
      WHERE ps.id = ${req.params.id}
    `;
    const session = sessionResult.recordset[0];
    if (!session) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const orders = await db.query`
      SELECT po.*, c.name as customer_name
      FROM pos_orders po
      LEFT JOIN customers c ON po.customer_id = c.id
      WHERE po.session_id = ${req.params.id}
         OR (
           po.session_id IS NULL
           AND po.created_by = ${session.opened_by}
           AND po.created_at >= ${session.opened_at}
           AND (${session.closed_at} IS NULL OR po.created_at <= ${session.closed_at})
         )
      ORDER BY po.created_at DESC
    `.then((result) => result.recordset);

    res.json({
      ...session,
      order_count: orders.length,
      orders,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/pos/sessions", authenticate, requireTenantContext, requireFeatureAccess("pos.sessions"), async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { opening_balance, notes } = req.body;
    await db.query`INSERT INTO pos_sessions (id, opened_by, opened_at, opening_balance, status, notes) VALUES (${id}, ${req.user!.id}, GETDATE(), ${opening_balance || 0}, 'open', ${notes || null})`;
    const dataResult = await db.query`SELECT * FROM pos_sessions WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/pos/sessions/:id/close", authenticate, async (req, res) => {
  try {
    const { closing_balance, notes } = req.body;
    await db.query`UPDATE pos_sessions SET status = 'closed', closed_at = GETDATE(), closing_balance = ${closing_balance}, notes = COALESCE(${notes}, notes) WHERE id = ${req.params.id}`;
    const dataResult = await db.query`SELECT * FROM pos_sessions WHERE id = ${req.params.id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== POS ORDERS =====
router.get("/pos/orders", authenticate, requireTenantContext, requireFeatureAccess("pos.orders"), async (req, res) => {
  try {
    await sendPaginatedResults(req, res, `
      SELECT po.*, c.name as customer_name, ps.opened_at as session_opened_at
      FROM pos_orders po
      LEFT JOIN customers c ON po.customer_id = c.id
      LEFT JOIN pos_sessions ps ON po.session_id = ps.id
      ORDER BY po.created_at DESC
    `, `SELECT COUNT(*) as total FROM pos_orders`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/pos/orders/:id", authenticate, async (req, res) => {
  try {
    const orderResult = await db.query`
      SELECT
        po.*,
        c.name as customer_name,
        ps.opened_at as session_opened_at,
        ps.closed_at as session_closed_at,
        ps.status as session_status
      FROM pos_orders po
      LEFT JOIN customers c ON po.customer_id = c.id
      LEFT JOIN pos_sessions ps ON po.session_id = ps.id
      WHERE po.id = ${req.params.id}
    `;
    const order = orderResult.recordset[0];
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const items = await db.query`
      SELECT poi.*, i.sku, i.hsn_code, i.unit
      FROM pos_order_items poi
      LEFT JOIN items i ON poi.item_id = i.id
      WHERE poi.order_id = ${req.params.id}
      ORDER BY poi.item_name ASC
    `.then((result) => result.recordset);

    const payments = await db.query`
      SELECT *
      FROM pos_payments
      WHERE order_id = ${req.params.id}
      ORDER BY created_at ASC
    `.then((result) => result.recordset);

    res.json({
      ...order,
      items,
      payments,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/pos/orders", authenticate, requireTenantContext, requireFeatureAccess("pos.orders"), async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { session_id, customer_id, subtotal, tax_amount, discount, total, items, payments } = req.body;
    const order_number = await generateDocNumber('pos_order');

    await db.query`INSERT INTO pos_orders (id, session_id, customer_id, order_number, subtotal, tax_amount, discount, total, status, created_by, created_at) 
      VALUES (${id}, ${session_id || null}, ${customer_id || null}, ${order_number}, ${subtotal || 0}, ${tax_amount || 0}, ${discount || 0}, ${total || 0}, 'completed', ${req.user!.id}, GETDATE())`;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query`INSERT INTO pos_order_items (id, order_id, item_id, item_name, quantity, rate, discount, tax_amount, amount) 
          VALUES (${uuidv4()}, ${id}, ${item.item_id}, ${item.item_name}, ${item.quantity || 1}, ${item.rate || 0}, ${item.discount || 0}, ${item.tax_amount || 0}, ${item.amount || 0})`;

        // Update stock
        await updateStock(item.item_id, item.quantity, 'out', id, 'POS Order');
      }
    }

    if (payments && Array.isArray(payments)) {
      for (const pay of payments) {
        await db.query`INSERT INTO pos_payments (id, order_id, payment_mode, amount, reference_number, created_at) 
          VALUES (${uuidv4()}, ${id}, ${pay.payment_mode}, ${pay.amount}, ${pay.reference_number || null}, GETDATE())`;
      }
    }

    // Update session totals if session_id exists
    if (session_id) {
      const cash_total = payments?.filter(p => p.payment_mode === 'cash').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const upi_total = payments?.filter(p => p.payment_mode === 'upi').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const card_total = payments?.filter(p => p.payment_mode === 'card').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      await db.query`UPDATE pos_sessions SET total_sales = COALESCE(total_sales, 0) + ${total}, total_cash = COALESCE(total_cash, 0) + ${cash_total}, total_upi = COALESCE(total_upi, 0) + ${upi_total}, total_card = COALESCE(total_card, 0) + ${card_total} WHERE id = ${session_id}`;
    }

    const dataResult = await db.query`SELECT * FROM pos_orders WHERE id = ${id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== RECURRING INVOICES =====
router.get("/recurring-invoices", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT ri.*, c.name as customer_name, CASE WHEN ri.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_invoices ri
      LEFT JOIN customers c ON ri.customer_id = c.id
      WHERE ri.tenant_id = @tenant_id
      ORDER BY ri.created_at DESC
    `, `SELECT COUNT(*) as total FROM recurring_invoices WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/recurring-invoices/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT
        ri.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.gstin as customer_gstin,
        c.billing_address as customer_address,
        c.state as customer_state,
        i.document_number as base_invoice_number,
        i.date as base_invoice_date,
        CASE WHEN ri.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_invoices ri
      LEFT JOIN customers c ON ri.customer_id = c.id
      LEFT JOIN invoices i ON ri.base_invoice_id = i.id
      WHERE ri.id = ${req.params.id} AND ri.tenant_id = ${tenantId}
    `;
    const recurringInvoice = dataResult.recordset[0];
    if (!recurringInvoice) { res.status(404).json({ error: "Not found" }); return; }

    const items = recurringInvoice.base_invoice_id
      ? await db.query`
          SELECT
            ii.*,
            it.name as item_name,
            it.hsn_code,
            tr.rate as tax_rate
          FROM invoice_items ii
          LEFT JOIN items it ON ii.item_id = it.id
          LEFT JOIN tax_rates tr ON ii.tax_rate_id = tr.id
          WHERE ii.invoice_id = ${recurringInvoice.base_invoice_id}
          ORDER BY ii.sort_order ASC
        `.then((result) => result.recordset)
      : [];

    const recentInvoices = await db.query`
      SELECT TOP 10
        id,
        document_number,
        date,
        total,
        balance_due,
        status
      FROM invoices
      WHERE customer_id = ${recurringInvoice.customer_id} AND tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `.then((result) => result.recordset);

    res.json({
      ...recurringInvoice,
      items,
      recentInvoices,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/recurring-invoices", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, frequency, start_date, end_date, next_invoice_date, base_invoice_id, subtotal, tax_amount, total, is_active, items } = req.body;
    const today = new Date().toISOString().split("T")[0];
    await db.query`INSERT INTO recurring_invoices (id, tenant_id, customer_id, frequency, start_date, end_date, next_invoice_date, base_invoice_id, is_active, subtotal, tax_amount, total, created_by, created_at)
      VALUES (${id}, ${tenantId}, ${customer_id}, ${frequency || 'monthly'}, ${start_date || today}, ${end_date || null}, ${next_invoice_date || today}, ${base_invoice_id || null}, ${is_active ?? true}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${req.user!.id}, GETDATE())`;

      const dataResult = await db.query`SELECT ri.*, c.name as customer_name, CASE WHEN ri.is_active = 1 THEN 'active' ELSE 'inactive' END as status FROM recurring_invoices ri LEFT JOIN customers c ON ri.customer_id = c.id WHERE ri.id = ${id} AND ri.tenant_id = ${tenantId}`;
      res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/recurring-invoices/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM recurring_invoices WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== RECURRING BILLS =====
router.get("/recurring-bills", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT rb.*, v.name as vendor_name, CASE WHEN rb.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_bills rb
      LEFT JOIN vendors v ON rb.vendor_id = v.id
      WHERE rb.tenant_id = @tenant_id
      ORDER BY rb.created_at DESC
    `, `SELECT COUNT(*) as total FROM recurring_bills WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/recurring-bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT
        rb.*,
        v.name as vendor_name,
        v.email as vendor_email,
        v.phone as vendor_phone,
        v.gstin as vendor_gstin,
        v.address as vendor_address,
        v.state as vendor_state,
        b.document_number as base_bill_number,
        b.date as base_bill_date,
        CASE WHEN rb.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_bills rb
      LEFT JOIN vendors v ON rb.vendor_id = v.id
      LEFT JOIN bills b ON rb.base_bill_id = b.id
      WHERE rb.id = ${req.params.id} AND rb.tenant_id = ${tenantId}
    `;
    const recurringBill = dataResult.recordset[0];
    if (!recurringBill) { res.status(404).json({ error: "Not found" }); return; }

    const items = recurringBill.base_bill_id
      ? await db.query`
          SELECT
            bi.*,
            i.name as item_name,
            i.hsn_code,
            tr.rate as tax_rate
          FROM bill_items bi
          LEFT JOIN items i ON bi.item_id = i.id
          LEFT JOIN tax_rates tr ON bi.tax_rate_id = tr.id
          WHERE bi.bill_id = ${recurringBill.base_bill_id}
          ORDER BY bi.sort_order ASC
        `.then((result) => result.recordset)
      : [];

    const generatedBillsResult = await db.query`
      SELECT TOP 10
        id,
        document_number,
        date,
        total,
        balance_due,
        status
      FROM bills
      WHERE vendor_id = ${recurringBill.vendor_id} AND tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `;

    res.json({
      ...recurringBill,
      items,
      recentBills: generatedBillsResult.recordset,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/recurring-bills", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, frequency, start_date, end_date, next_bill_date, base_bill_id, subtotal, tax_amount, total, is_active, items } = req.body;
    const today = new Date().toISOString().split("T")[0];
    await db.query`INSERT INTO recurring_bills (id, tenant_id, vendor_id, frequency, start_date, end_date, next_bill_date, base_bill_id, is_active, subtotal, tax_amount, total, created_by, created_at)
      VALUES (${id}, ${tenantId}, ${vendor_id}, ${frequency || 'monthly'}, ${start_date || today}, ${end_date || null}, ${next_bill_date || today}, ${base_bill_id || null}, ${is_active ?? true}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${req.user!.id}, GETDATE())`;

    const docResult = await db.query`SELECT rb.*, v.name as vendor_name, CASE WHEN rb.is_active = 1 THEN 'active' ELSE 'inactive' END as status FROM recurring_bills rb LEFT JOIN vendors v ON rb.vendor_id = v.id WHERE rb.id = ${id} AND rb.tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/recurring-bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM recurring_bills WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== INVOICES =====
router.get("/invoices", authenticate, requireTenantContext, requireFeatureAccess("sales.invoices"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.tenant_id = @tenant_id
      ORDER BY i.created_at DESC
    `, `SELECT COUNT(*) as total FROM invoices WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/invoices/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT i.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address
      FROM invoices i 
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ${req.params.id} AND i.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT ii.*, it.name as item_name 
      FROM invoice_items ii 
      JOIN items it ON ii.item_id = it.id 
      WHERE ii.invoice_id = ${req.params.id} 
      ORDER BY ii.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/invoices", authenticate, requireTenantContext, requireFeatureAccess("sales.invoices"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, date, due_date, sales_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, terms, items } = req.body;
    const document_number = await generateDocNumber('invoice');

    await db.query`INSERT INTO invoices (id, tenant_id, document_number, date, due_date, customer_id, sales_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, terms, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${due_date || null}, ${customer_id}, ${sales_order_id || null}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${balance_due || total || 0}, ${notes || null}, ${terms || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO invoice_items (id, tenant_id, invoice_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;

        // Update stock
        await updateStock(item.item_id, item.quantity, 'out', id, 'Invoice');
      }
    }

    const dataResult = await db.query`SELECT * FROM invoices WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/invoices/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { customer_id, date, due_date, sales_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, terms, items } = req.body;
    await db.query`UPDATE invoices SET customer_id = COALESCE(${customer_id}, customer_id), date = COALESCE(${date}, date), due_date = COALESCE(${due_date}, due_date), sales_order_id = COALESCE(${sales_order_id}, sales_order_id), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), balance_due = COALESCE(${balance_due}, balance_due), notes = COALESCE(${notes}, notes), terms = COALESCE(${terms}, terms), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM invoice_items WHERE invoice_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO invoice_items (id, tenant_id, invoice_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM invoices WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/invoices/:id/status", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.body;
    await db.query`UPDATE invoices SET status = ${status}, updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM invoices WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.delete("/invoices/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM payment_allocations WHERE invoice_id = ${req.params.id}`;
    await db.query`UPDATE payments_received SET invoice_id = NULL WHERE invoice_id = ${req.params.id}`;
    await db.query`UPDATE credit_notes SET invoice_id = NULL WHERE invoice_id = ${req.params.id}`;
    await db.query`DELETE FROM invoice_items WHERE invoice_id = ${req.params.id}`;
    await db.query`DELETE FROM invoices WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PURCHASE ORDERS =====
router.get("/purchase-orders", authenticate, requireTenantContext, requireFeatureAccess("purchase.purchase_orders"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT po.*, v.name as vendor_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE po.tenant_id = @tenant_id
      ORDER BY po.created_at DESC
    `, `SELECT COUNT(*) as total FROM purchase_orders WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/purchase-orders/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT po.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state 
      FROM purchase_orders po 
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE po.id = ${req.params.id} AND po.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT poi.*, i.name as item_name 
      FROM purchase_order_items poi 
      LEFT JOIN items i ON poi.item_id = i.id 
      WHERE poi.purchase_order_id = ${req.params.id} AND poi.tenant_id = ${tenantId}
      ORDER BY poi.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/purchase-orders", authenticate, requireTenantContext, requireFeatureAccess("purchase.purchase_orders"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, date, expected_delivery, reference_id, reference_type, status, subtotal, tax_amount, total, notes, items } = req.body;
    const document_number = await generateDocNumber('purchase_order');

    await db.query`INSERT INTO purchase_orders (id, tenant_id, document_number, date, expected_delivery, vendor_id, reference_id, reference_type, status, subtotal, tax_amount, total, notes, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${expected_delivery || null}, ${vendor_id}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${notes || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO purchase_order_items (id, tenant_id, purchase_order_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }

    const dataResult = await db.query`SELECT * FROM purchase_orders WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/purchase-orders/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { vendor_id, date, expected_delivery, reference_id, reference_type, status, subtotal, tax_amount, total, notes, items } = req.body;
    await db.query`UPDATE purchase_orders SET vendor_id = COALESCE(${vendor_id}, vendor_id), date = COALESCE(${date}, date), expected_delivery = COALESCE(${expected_delivery}, expected_delivery), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), notes = COALESCE(${notes}, notes), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM purchase_order_items WHERE purchase_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO purchase_order_items (id, tenant_id, purchase_order_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM purchase_orders WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/purchase-orders/:id/status", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.body;
    await db.query`UPDATE purchase_orders SET status = ${status}, updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM purchase_orders WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.delete("/purchase-orders/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`UPDATE bills SET purchase_order_id = NULL WHERE purchase_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM purchase_order_items WHERE purchase_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM purchase_orders WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== BILLS =====
router.get("/bills", authenticate, requireTenantContext, requireFeatureAccess("purchase.bills"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT b.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state
      FROM bills b
      LEFT JOIN vendors v ON b.vendor_id = v.id
      WHERE b.tenant_id = @tenant_id
      ORDER BY b.created_at DESC
    `, `SELECT COUNT(*) as total FROM bills WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT b.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state 
      FROM bills b 
      LEFT JOIN vendors v ON b.vendor_id = v.id
      WHERE b.id = ${req.params.id} AND b.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT bi.*, i.name as item_name 
      FROM bill_items bi 
      LEFT JOIN items i ON bi.item_id = i.id 
      WHERE bi.bill_id = ${req.params.id} AND bi.tenant_id = ${tenantId}
      ORDER BY bi.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/bills", authenticate, requireTenantContext, requireFeatureAccess("purchase.bills"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, date, due_date, purchase_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, items } = req.body;
    const document_number = await generateDocNumber('bill');

    await db.query`INSERT INTO bills (id, tenant_id, document_number, date, due_date, vendor_id, purchase_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${due_date || null}, ${vendor_id}, ${purchase_order_id || null}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${balance_due || total || 0}, ${notes || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO bill_items (id, tenant_id, bill_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;

        // Update stock
        await updateStock(item.item_id, item.quantity, 'in', id, 'Bill', Number(item.rate || 0));
      }
    }

    const dataResult = await db.query`SELECT * FROM bills WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { vendor_id, date, due_date, purchase_order_id, reference_id, reference_type, status, subtotal, tax_amount, total, balance_due, notes, items } = req.body;
    await db.query`UPDATE bills SET vendor_id = COALESCE(${vendor_id}, vendor_id), date = COALESCE(${date}, date), due_date = COALESCE(${due_date}, due_date), purchase_order_id = COALESCE(${purchase_order_id}, purchase_order_id), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), balance_due = COALESCE(${balance_due}, balance_due), notes = COALESCE(${notes}, notes), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM bill_items WHERE bill_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO bill_items (id, tenant_id, bill_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM bills WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/bills/:id/status", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.body;
    await db.query`UPDATE bills SET status = ${status}, updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM bills WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.delete("/bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`UPDATE payments_made SET bill_id = NULL WHERE bill_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`UPDATE vendor_credits SET bill_id = NULL WHERE bill_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`UPDATE purchase_returns SET bill_id = NULL WHERE bill_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM bill_items WHERE bill_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM bills WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== CREDIT NOTES =====
router.get("/credit-notes", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT cn.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address, c.state as customer_state
      FROM credit_notes cn
      LEFT JOIN customers c ON cn.customer_id = c.id
      WHERE cn.tenant_id = @tenant_id
      ORDER BY cn.created_at DESC
    `, `SELECT COUNT(*) as total FROM credit_notes WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/credit-notes/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT cn.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address, c.state as customer_state 
      FROM credit_notes cn 
      LEFT JOIN customers c ON cn.customer_id = c.id
      WHERE cn.id = ${req.params.id} AND cn.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT cni.*, i.name as item_name 
      FROM credit_note_items cni 
      LEFT JOIN items i ON cni.item_id = i.id 
      WHERE cni.credit_note_id = ${req.params.id} AND cni.tenant_id = ${tenantId}
      ORDER BY cni.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/credit-notes", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, date, invoice_id, reference_id, reference_type, status, subtotal, tax_amount, total, reason, items } = req.body;
    const document_number = await generateDocNumber('credit_note');

    await db.query`INSERT INTO credit_notes (id, tenant_id, document_number, date, customer_id, invoice_id, reference_id, reference_type, status, subtotal, tax_amount, total, reason, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${customer_id}, ${invoice_id || null}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${reason || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO credit_note_items (id, tenant_id, credit_note_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;

        // Update stock
        await updateStock(item.item_id, item.quantity, 'in', id, 'Credit Note');
      }
    }

    const dataResult = await db.query`SELECT * FROM credit_notes WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/credit-notes/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { customer_id, date, invoice_id, reference_id, reference_type, status, subtotal, tax_amount, total, reason, items } = req.body;
    await db.query`UPDATE credit_notes SET customer_id = COALESCE(${customer_id}, customer_id), date = COALESCE(${date}, date), invoice_id = COALESCE(${invoice_id}, invoice_id), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), reason = COALESCE(${reason}, reason), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM credit_note_items WHERE credit_note_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO credit_note_items (id, tenant_id, credit_note_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM credit_notes WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/credit-notes/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM credit_note_items WHERE credit_note_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM credit_notes WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ===== VENDOR CREDITS =====
router.get("/vendor-credits", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT vc.*, v.name as vendor_name
      FROM vendor_credits vc
      LEFT JOIN vendors v ON vc.vendor_id = v.id
      WHERE vc.tenant_id = @tenant_id
      ORDER BY vc.created_at DESC
    `, `SELECT COUNT(*) as total FROM vendor_credits WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/vendor-credits/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT vc.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state
      FROM vendor_credits vc
      LEFT JOIN vendors v ON vc.vendor_id = v.id
      WHERE vc.id = ${req.params.id} AND vc.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT vci.*, i.name as item_name
      FROM vendor_credit_items vci
      LEFT JOIN items i ON vci.item_id = i.id
      WHERE vci.vendor_credit_id = ${req.params.id} AND vci.tenant_id = ${tenantId}
      ORDER BY vci.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/vendor-credits", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, date, bill_id, reference_id, reference_type, status, subtotal, tax_amount, total, reason, items } = req.body;
    const document_number = await generateDocNumber('vendor_credit');

    await db.query`INSERT INTO vendor_credits (id, tenant_id, document_number, date, vendor_id, bill_id, reference_id, reference_type, status, subtotal, tax_amount, total, reason, created_by, created_at, updated_at)
      VALUES (${id}, ${tenantId}, ${document_number}, ${date || new Date().toISOString().split("T")[0]}, ${vendor_id}, ${bill_id || null}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${reason || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO vendor_credit_items (id, tenant_id, vendor_credit_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order)
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;

        await updateStock(item.item_id, item.quantity, 'in', id, 'Vendor Credit', Number(item.rate || 0));
      }
    }

    const docResult = await db.query`SELECT * FROM vendor_credits WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/vendor-credits/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { vendor_id, date, bill_id, reference_id, reference_type, status, subtotal, tax_amount, total, reason, items } = req.body;
    await db.query`UPDATE vendor_credits SET vendor_id = COALESCE(${vendor_id}, vendor_id), date = COALESCE(${date}, date), bill_id = COALESCE(${bill_id}, bill_id), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), reason = COALESCE(${reason}, reason), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM vendor_credit_items WHERE vendor_credit_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO vendor_credit_items (id, tenant_id, vendor_credit_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order)
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }

    const docResult = await db.query`SELECT * FROM vendor_credits WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/vendor-credits/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM vendor_credit_items WHERE vendor_credit_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM vendor_credits WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
// ===== QUOTATIONS =====
router.get("/quotations", authenticate, requireTenantContext, requireFeatureAccess("sales.quotations"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT q.*, c.name as customer_name
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.tenant_id = @tenant_id
      ORDER BY q.created_at DESC
    `, `SELECT COUNT(*) as total FROM quotations WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/quotations/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT q.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address
      FROM quotations q 
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ${req.params.id} AND q.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT qi.*, i.name as item_name 
      FROM quotation_items qi 
      LEFT JOIN items i ON qi.item_id = i.id 
      WHERE qi.quotation_id = ${req.params.id} AND qi.tenant_id = ${tenantId}
      ORDER BY qi.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/quotations", authenticate, requireTenantContext, requireFeatureAccess("sales.quotations"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, date, valid_until, reference_id, reference_type, status, subtotal, tax_amount, total, notes, terms, items } = req.body;
    const document_number = await generateDocNumber('quotation');

    await db.query`INSERT INTO quotations (id, tenant_id, document_number, date, valid_until, customer_id, reference_id, reference_type, status, subtotal, tax_amount, total, notes, terms, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${valid_until || null}, ${customer_id}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${notes || null}, ${terms || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO quotation_items (id, tenant_id, quotation_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }

    const dataResult = await db.query`SELECT * FROM quotations WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/quotations/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { customer_id, date, valid_until, reference_id, reference_type, status, subtotal, tax_amount, total, notes, terms, items } = req.body;
    await db.query`UPDATE quotations SET customer_id = COALESCE(${customer_id}, customer_id), date = COALESCE(${date}, date), valid_until = COALESCE(${valid_until}, valid_until), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), notes = COALESCE(${notes}, notes), terms = COALESCE(${terms}, terms), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM quotation_items WHERE quotation_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO quotation_items (id, tenant_id, quotation_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM quotations WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/quotations/:id/status", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.body;
    await db.query`UPDATE quotations SET status = ${status}, updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM quotations WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.delete("/quotations/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`UPDATE sales_orders SET quotation_id = NULL WHERE quotation_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM quotation_items WHERE quotation_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM quotations WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== SALES ORDERS =====
router.get("/sales-orders", authenticate, requireTenantContext, requireFeatureAccess("sales.sales_orders"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT so.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE so.tenant_id = @tenant_id
      ORDER BY so.created_at DESC
    `, `SELECT COUNT(*) as total FROM sales_orders WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/sales-orders/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT so.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address 
      FROM sales_orders so 
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE so.id = ${req.params.id} AND so.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT soi.*, i.name as item_name 
      FROM sales_order_items soi 
      LEFT JOIN items i ON soi.item_id = i.id 
      WHERE soi.sales_order_id = ${req.params.id} AND soi.tenant_id = ${tenantId}
      ORDER BY soi.sort_order
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/sales-orders", authenticate, requireTenantContext, requireFeatureAccess("sales.sales_orders"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, date, expected_delivery, quotation_id, reference_id, reference_type, status, subtotal, tax_amount, total, notes, items } = req.body;
    const document_number = await generateDocNumber('sales_order');

    await db.query`INSERT INTO sales_orders (id, tenant_id, document_number, date, expected_delivery, customer_id, quotation_id, reference_id, reference_type, status, subtotal, tax_amount, total, notes, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${expected_delivery || null}, ${customer_id}, ${quotation_id || null}, ${reference_id || null}, ${reference_type || null}, ${status || 'confirmed'}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${notes || null}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO sales_order_items (id, tenant_id, sales_order_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }

    const dataResult = await db.query`SELECT * FROM sales_orders WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/sales-orders/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { customer_id, date, expected_delivery, quotation_id, reference_id, reference_type, status, subtotal, tax_amount, total, notes, items } = req.body;
    await db.query`UPDATE sales_orders SET customer_id = COALESCE(${customer_id}, customer_id), date = COALESCE(${date}, date), expected_delivery = COALESCE(${expected_delivery}, expected_delivery), quotation_id = COALESCE(${quotation_id}, quotation_id), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), notes = COALESCE(${notes}, notes), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM sales_order_items WHERE sales_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.query`INSERT INTO sales_order_items (id, tenant_id, sales_order_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${item.amount || 0}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM sales_orders WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/sales-orders/:id/status", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.body;
    await db.query`UPDATE sales_orders SET status = ${status}, updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const dataResult = await db.query`SELECT * FROM sales_orders WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.delete("/sales-orders/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`UPDATE delivery_challans SET sales_order_id = NULL WHERE sales_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`UPDATE invoices SET sales_order_id = NULL WHERE sales_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM sales_order_items WHERE sales_order_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM sales_orders WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== RECURRING INVOICES =====
router.get("/recurring-invoices", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT ri.*, c.name as customer_name, CASE WHEN ri.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_invoices ri
      LEFT JOIN customers c ON ri.customer_id = c.id
      WHERE ri.tenant_id = @tenant_id
      ORDER BY ri.created_at DESC
    `, `SELECT COUNT(*) as total FROM recurring_invoices WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/recurring-invoices/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT
        ri.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.gstin as customer_gstin,
        c.billing_address as customer_address,
        c.state as customer_state,
        i.document_number as base_invoice_number,
        i.date as base_invoice_date,
        CASE WHEN ri.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_invoices ri
      LEFT JOIN customers c ON ri.customer_id = c.id
      LEFT JOIN invoices i ON ri.base_invoice_id = i.id
      WHERE ri.id = ${req.params.id} AND ri.tenant_id = ${tenantId}
    `;
    const recurringInvoice = dataResult.recordset[0];
    if (!recurringInvoice) { res.status(404).json({ error: "Not found" }); return; }

    const items = recurringInvoice.base_invoice_id
      ? await db.query`
          SELECT
            ii.*,
            it.name as item_name,
            it.hsn_code,
            tr.rate as tax_rate
          FROM invoice_items ii
          LEFT JOIN items it ON ii.item_id = it.id
          LEFT JOIN tax_rates tr ON ii.tax_rate_id = tr.id
          WHERE ii.invoice_id = ${recurringInvoice.base_invoice_id}
          ORDER BY ii.sort_order ASC
        `.then((result) => result.recordset)
      : [];

    const recentInvoices = await db.query`
      SELECT TOP 10
        id,
        document_number,
        date,
        total,
        balance_due,
        status
      FROM invoices
      WHERE customer_id = ${recurringInvoice.customer_id}
      ORDER BY created_at DESC
    `.then((result) => result.recordset);

    res.json({
      ...recurringInvoice,
      items,
      recentInvoices,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/recurring-invoices", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, frequency, start_date, end_date, next_invoice_date, base_invoice_id, subtotal, tax_amount, total, is_active, items } = req.body;
    const today = new Date().toISOString().split("T")[0];
    await db.query`INSERT INTO recurring_invoices (id, tenant_id, customer_id, frequency, start_date, end_date, next_invoice_date, base_invoice_id, is_active, subtotal, tax_amount, total, created_by, created_at) 
      VALUES (${id}, ${tenantId}, ${customer_id}, ${frequency || 'monthly'}, ${start_date || today}, ${end_date || null}, ${next_invoice_date || today}, ${base_invoice_id || null}, ${is_active ?? true}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${req.user!.id}, GETDATE())`;

      const docResult = await db.query`SELECT ri.*, c.name as customer_name, CASE WHEN ri.is_active = 1 THEN 'active' ELSE 'inactive' END as status FROM recurring_invoices ri LEFT JOIN customers c ON ri.customer_id = c.id WHERE ri.id = ${id} AND ri.tenant_id = ${tenantId}`;
      res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/recurring-invoices/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM recurring_invoices WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== RECURRING BILLS =====
router.get("/recurring-bills", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT rb.*, v.name as vendor_name, CASE WHEN rb.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_bills rb
      LEFT JOIN vendors v ON rb.vendor_id = v.id
      WHERE rb.tenant_id = @tenant_id
      ORDER BY rb.created_at DESC
    `, `SELECT COUNT(*) as total FROM recurring_bills WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/recurring-bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT
        rb.*,
        v.name as vendor_name,
        v.email as vendor_email,
        v.phone as vendor_phone,
        v.gstin as vendor_gstin,
        v.address as vendor_address,
        v.state as vendor_state,
        b.document_number as base_bill_number,
        b.date as base_bill_date,
        CASE WHEN rb.is_active = 1 THEN 'active' ELSE 'inactive' END as status
      FROM recurring_bills rb
      LEFT JOIN vendors v ON rb.vendor_id = v.id
      LEFT JOIN bills b ON rb.base_bill_id = b.id
      WHERE rb.id = ${req.params.id} AND rb.tenant_id = ${tenantId}
    `;
    const recurringBill = dataResult.recordset[0];
    if (!recurringBill) { res.status(404).json({ error: "Not found" }); return; }

    const items = recurringBill.base_bill_id
      ? await db.query`
          SELECT
            bi.*,
            i.name as item_name,
            i.hsn_code,
            tr.rate as tax_rate
          FROM bill_items bi
          LEFT JOIN items i ON bi.item_id = i.id
          LEFT JOIN tax_rates tr ON bi.tax_rate_id = tr.id
          WHERE bi.bill_id = ${recurringBill.base_bill_id}
          ORDER BY bi.sort_order ASC
        `.then((result) => result.recordset)
      : [];

    const generatedBillsResult = await db.query`
      SELECT TOP 10
        id,
        document_number,
        date,
        total,
        balance_due,
        status
      FROM bills
      WHERE vendor_id = ${recurringBill.vendor_id}
      ORDER BY created_at DESC
    `;

    res.json({
      ...recurringBill,
      items,
      recentBills: generatedBillsResult.recordset,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/recurring-bills", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, frequency, start_date, end_date, next_bill_date, base_bill_id, subtotal, tax_amount, total, is_active, items } = req.body;
    const today = new Date().toISOString().split("T")[0];
    await db.query`INSERT INTO recurring_bills (id, tenant_id, vendor_id, frequency, start_date, end_date, next_bill_date, base_bill_id, is_active, subtotal, tax_amount, total, created_by, created_at) 
      VALUES (${id}, ${tenantId}, ${vendor_id}, ${frequency || 'monthly'}, ${start_date || today}, ${end_date || null}, ${next_bill_date || today}, ${base_bill_id || null}, ${is_active ?? true}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${req.user!.id}, GETDATE())`;

    const docResult = await db.query`SELECT rb.*, v.name as vendor_name, CASE WHEN rb.is_active = 1 THEN 'active' ELSE 'inactive' END as status FROM recurring_bills rb LEFT JOIN vendors v ON rb.vendor_id = v.id WHERE rb.id = ${id} AND rb.tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/recurring-bills/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM recurring_bills WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== SALES RETURNS =====
router.get("/sales-returns", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT sr.*, c.name as customer_name
      FROM sales_returns sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      WHERE sr.tenant_id = @tenant_id
      ORDER BY sr.created_at DESC
    `, `SELECT COUNT(*) as total FROM sales_returns WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/sales-returns/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT sr.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address, c.state as customer_state
      FROM sales_returns sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      WHERE sr.id = ${req.params.id} AND sr.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT sri.*, i.name as item_name, i.hsn_code
      FROM sales_return_items sri
      LEFT JOIN items i ON sri.item_id = i.id
      WHERE sri.sales_return_id = ${req.params.id} AND sri.tenant_id = ${tenantId}
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post("/sales-returns", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, invoice_id, date, subtotal, tax_amount, total, reason, notes, status, items } = req.body;
    const document_number = await generateDocNumber('sales_return');
    const today = new Date().toISOString().split("T")[0];

    await db.query`INSERT INTO sales_returns (id, tenant_id, document_number, customer_id, invoice_id, date, subtotal, tax_amount, total, reason, notes, status, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${customer_id}, ${invoice_id || null}, ${date || today}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${reason || null}, ${notes || null}, ${status || 'received'}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query`INSERT INTO sales_return_items (id, tenant_id, sales_return_id, item_id, quantity, rate, tax_amount, total) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.quantity}, ${item.rate}, ${item.tax_amount || 0}, ${item.total || item.amount || ((item.quantity || 0) * (item.rate || 0)) || 0})`;

        await updateStock(item.item_id, item.quantity, 'in', id, 'Sales Return');
      }
    }
    const docResult = await db.query`SELECT * FROM sales_returns WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/sales-returns/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { customer_id, invoice_id, date, subtotal, tax_amount, total, reason, notes, status, items } = req.body;
    await db.query`UPDATE sales_returns SET customer_id = COALESCE(${customer_id}, customer_id), invoice_id = COALESCE(${invoice_id}, invoice_id), date = COALESCE(${date}, date), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), reason = COALESCE(${reason}, reason), notes = COALESCE(${notes}, notes), status = COALESCE(${status}, status), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM sales_return_items WHERE sales_return_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (const item of items) {
        await db.query`INSERT INTO sales_return_items (id, tenant_id, sales_return_id, item_id, quantity, rate, tax_amount, total) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.quantity}, ${item.rate}, ${item.tax_amount || 0}, ${item.total || item.amount || ((item.quantity || 0) * (item.rate || 0)) || 0})`;
      }
    }
    const docResult = await db.query`SELECT * FROM sales_returns WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/sales-returns/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM sales_return_items WHERE sales_return_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM sales_returns WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PURCHASE RETURNS =====
router.get("/purchase-returns", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT pr.*, v.name as vendor_name
      FROM purchase_returns pr
      LEFT JOIN vendors v ON pr.vendor_id = v.id
      WHERE pr.tenant_id = @tenant_id
      ORDER BY pr.created_at DESC
    `, `SELECT COUNT(*) as total FROM purchase_returns WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/purchase-returns/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT pr.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state
      FROM purchase_returns pr
      LEFT JOIN vendors v ON pr.vendor_id = v.id
      WHERE pr.id = ${req.params.id} AND pr.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT pri.*, i.name as item_name, i.hsn_code
      FROM purchase_return_items pri
      LEFT JOIN items i ON pri.item_id = i.id
      WHERE pri.purchase_return_id = ${req.params.id} AND pri.tenant_id = ${tenantId}
    `.then(res => res.recordset);

    res.json({ ...data, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post("/purchase-returns", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, bill_id, date, subtotal, tax_amount, total, reason, notes, status, items } = req.body;
    const document_number = await generateDocNumber('purchase_return');
    const today = new Date().toISOString().split("T")[0];

    await db.query`INSERT INTO purchase_returns (id, tenant_id, document_number, vendor_id, bill_id, date, subtotal, tax_amount, total, reason, notes, status, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${vendor_id}, ${bill_id || null}, ${date || today}, ${subtotal || 0}, ${tax_amount || 0}, ${total || 0}, ${reason || null}, ${notes || null}, ${status || 'dispatched'}, ${req.user!.id}, GETDATE(), GETDATE())`;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query`INSERT INTO purchase_return_items (id, tenant_id, purchase_return_id, item_id, quantity, rate, tax_amount, total) 
          VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.quantity}, ${item.rate}, ${item.tax_amount || 0}, ${item.total || item.amount || ((item.quantity || 0) * (item.rate || 0)) || 0})`;

        await updateStock(item.item_id, item.quantity, 'out', id, 'Purchase Return', Number(item.rate || 0));
      }
    }
    const docResult = await db.query`SELECT * FROM purchase_returns WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/purchase-returns/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { vendor_id, bill_id, date, subtotal, tax_amount, total, reason, notes, status, items } = req.body;
    await db.query`UPDATE purchase_returns SET vendor_id = COALESCE(${vendor_id}, vendor_id), bill_id = COALESCE(${bill_id}, bill_id), date = COALESCE(${date}, date), subtotal = COALESCE(${subtotal}, subtotal), tax_amount = COALESCE(${tax_amount}, tax_amount), total = COALESCE(${total}, total), reason = COALESCE(${reason}, reason), notes = COALESCE(${notes}, notes), status = COALESCE(${status}, status), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (items && Array.isArray(items)) {
      await db.query`DELETE FROM purchase_return_items WHERE purchase_return_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (const item of items) {
        await db.query`INSERT INTO purchase_return_items (id, tenant_id, purchase_return_id, item_id, quantity, rate, tax_amount, total) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.quantity}, ${item.rate}, ${item.tax_amount || 0}, ${item.total || item.amount || ((item.quantity || 0) * (item.rate || 0)) || 0})`;
      }
    }
    const docResult = await db.query`SELECT * FROM purchase_returns WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/purchase-returns/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM purchase_return_items WHERE purchase_return_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM purchase_returns WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== GST RETURNS =====
router.get("/gst-returns", authenticate, requireTenantContext, requireFeatureAccess("gst.gstr_1"), async (req, res) => {
  try {
    const data = await db.query`SELECT * FROM gst_returns ORDER BY created_at DESC`.then(res => res.recordset);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== WORKFLOWS =====
router.get("/workflows", authenticate, requireTenantContext, requireFeatureAccess("automation.workflows"), async (req, res) => {
  try {
    const data = await db.query`SELECT * FROM workflows ORDER BY created_at DESC`.then(res => res.recordset);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/workflows", authenticate, requireTenantContext, requireFeatureAccess("automation.workflows"), async (req: AuthRequest, res) => {
  try {
    const id = uuidv4();
    const { name, trigger, conditions, actions, status } = req.body;
    await db.query`INSERT INTO workflows (id, name, [trigger], [conditions], [actions], status, created_at, updated_at) 
      VALUES (${id}, ${name}, ${trigger}, ${JSON.stringify(conditions || [])}, ${JSON.stringify(actions || [])}, ${status || 'active'}, GETDATE(), GETDATE())`;
    const docResult = await db.query`SELECT * FROM workflows WHERE id = ${id}`;
    res.json(docResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/workflows/:id", authenticate, async (req, res) => {
  try {
    const { name, trigger, conditions, actions, status } = req.body;
    await db.query`
      UPDATE workflows
      SET name = COALESCE(${name}, name),
          [trigger] = COALESCE(${trigger}, [trigger]),
          [conditions] = COALESCE(${conditions ? JSON.stringify(conditions) : null}, [conditions]),
          [actions] = COALESCE(${actions ? JSON.stringify(actions) : null}, [actions]),
          status = COALESCE(${status}, status),
          updated_at = GETDATE()
      WHERE id = ${req.params.id}
    `;
    const dataResult = await db.query`SELECT * FROM workflows WHERE id = ${req.params.id}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/workflows/:id", authenticate, async (req, res) => {
  try {
    await db.query`DELETE FROM workflows WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== BANK ACCOUNTS =====
router.get("/bank-accounts", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const data = await db.query`SELECT * FROM bank_accounts WHERE tenant_id = ${tenantId} ORDER BY bank_name`.then(res => res.recordset);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/bank-accounts", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { bank_name, account_number, ifsc_code, branch_name, current_balance, account_id } = req.body;
    await db.query`INSERT INTO bank_accounts (id, tenant_id, bank_name, account_number, ifsc_code, branch_name, current_balance, account_id, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${bank_name}, ${account_number}, ${ifsc_code}, ${branch_name}, ${current_balance || 0}, ${account_id || null}, GETDATE(), GETDATE())`;
    const dataResult = await db.query`SELECT * FROM bank_accounts WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ===== EXPENSES =====
router.get("/expenses", authenticate, requireTenantContext, requireFeatureAccess("inventory.expenses"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT e.*, v.name as vendor_name, a.name as account_name 
      FROM expenses e 
      LEFT JOIN vendors v ON e.vendor_id = v.id 
      LEFT JOIN accounts a ON e.account_id = a.id
      WHERE e.tenant_id = @tenant_id
      ORDER BY e.date DESC
    `, `SELECT COUNT(*) as total FROM expenses WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/expenses", authenticate, requireTenantContext, requireFeatureAccess("inventory.expenses"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { date, category, vendor_id, account_id, amount, tax_amount, payment_mode, description, is_recurring, recurring_frequency } = req.body;
    const expenseDate = date || new Date().toISOString().split("T")[0];
    await db.query`INSERT INTO expenses (id, tenant_id, date, category, vendor_id, account_id, amount, tax_amount, payment_mode, description, is_recurring, recurring_frequency, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${expenseDate}, ${category}, ${vendor_id || null}, ${account_id || null}, ${amount}, ${tax_amount || 0}, ${payment_mode || 'cash'}, ${description || null}, ${is_recurring ?? 0}, ${recurring_frequency || null}, ${req.user!.id}, GETDATE(), GETDATE())`;
    const dataResult = await db.query`SELECT * FROM expenses WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/expenses/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM expenses WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PAYMENTS RECEIVED =====
router.get("/payments-received", authenticate, requireTenantContext, requireFeatureAccess("sales.payments_received"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT pr.*, c.name as customer_name, i.document_number as invoice_number, i.balance_due as invoice_balance_due, i.total as invoice_total
      FROM payments_received pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      LEFT JOIN invoices i ON pr.invoice_id = i.id
      WHERE pr.tenant_id = @tenant_id
      ORDER BY pr.date DESC
    `, `SELECT COUNT(*) as total FROM payments_received WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/payments-received/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT pr.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address, c.state as customer_state, i.document_number as invoice_number
      FROM payments_received pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      LEFT JOIN invoices i ON pr.invoice_id = i.id
      WHERE pr.id = ${req.params.id} AND pr.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    let invoice = null;
    if (data.invoice_id) {
      const invoiceResult = await db.query`
        SELECT i.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address, c.state as customer_state
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ${data.invoice_id} AND i.tenant_id = ${tenantId}
      `;
      const invoiceData = invoiceResult.recordset[0];
      if (invoiceData) {
        const invoiceItems = await db.query`
          SELECT ii.*, it.name as item_name, it.hsn_code
          FROM invoice_items ii
          LEFT JOIN items it ON ii.item_id = it.id
          WHERE ii.invoice_id = ${data.invoice_id} AND ii.tenant_id = ${tenantId}
          ORDER BY ii.sort_order
        `.then(res => res.recordset);
        invoice = { ...invoiceData, items: invoiceItems };
      }
    }

    res.json({ ...data, invoice });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post("/payments-received", authenticate, requireTenantContext, requireFeatureAccess("sales.payments_received"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, invoice_id, amount, date, payment_mode, reference_number, notes } = req.body;
    const payment_number = await generateDocNumber('payment_received');

    await db.query`INSERT INTO payments_received (id, tenant_id, payment_number, date, customer_id, invoice_id, amount, payment_mode, reference_number, notes, created_by, created_at) 
      VALUES (${id}, ${tenantId}, ${payment_number}, ${date}, ${customer_id}, ${invoice_id || null}, ${amount}, ${payment_mode || 'cash'}, ${reference_number || null}, ${notes || null}, ${req.user!.id}, GETDATE())`;

    if (invoice_id) {
      const invResult = await db.query`SELECT balance_due FROM invoices WHERE id = ${invoice_id} AND tenant_id = ${tenantId}`;
      const inv = invResult.recordset[0];
      if (inv) {
        const newBalance = Math.max(0, Number(inv.balance_due) - Number(amount));
        const newStatus = newBalance <= 0 ? 'paid' : 'partial';
        await db.query`UPDATE invoices SET balance_due = ${newBalance}, status = ${newStatus}, updated_at = GETDATE() WHERE id = ${invoice_id} AND tenant_id = ${tenantId}`;
      }
    }

    const dataResult = await db.query`SELECT * FROM payments_received WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/payments-received/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM payments_received WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PAYMENTS MADE =====
router.get("/payments-made", authenticate, requireTenantContext, requireFeatureAccess("purchase.payments_made"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT pm.*, v.name as vendor_name, b.document_number as bill_number, b.balance_due as bill_balance_due, b.total as bill_total
      FROM payments_made pm
      LEFT JOIN vendors v ON pm.vendor_id = v.id
      LEFT JOIN bills b ON pm.bill_id = b.id
      WHERE pm.tenant_id = @tenant_id
      ORDER BY pm.date DESC
    `, `SELECT COUNT(*) as total FROM payments_made WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/payments-made/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT pm.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state, b.document_number as bill_number
      FROM payments_made pm
      LEFT JOIN vendors v ON pm.vendor_id = v.id
      LEFT JOIN bills b ON pm.bill_id = b.id
      WHERE pm.id = ${req.params.id} AND pm.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    let bill = null;
    if (data.bill_id) {
      const billResult = await db.query`
        SELECT b.*, v.name as vendor_name, v.gstin as vendor_gstin, v.address as vendor_address, v.state as vendor_state
        FROM bills b
        LEFT JOIN vendors v ON b.vendor_id = v.id
        WHERE b.id = ${data.bill_id} AND b.tenant_id = ${tenantId}
      `;
      const billData = billResult.recordset[0];
      if (billData) {
        const billItems = await db.query`
          SELECT bi.*, i.name as item_name, i.hsn_code
          FROM bill_items bi
          LEFT JOIN items i ON bi.item_id = i.id
          WHERE bi.bill_id = ${data.bill_id} AND bi.tenant_id = ${tenantId}
          ORDER BY bi.sort_order
        `.then(res => res.recordset);
        bill = { ...billData, items: billItems };
      }
    }

    res.json({ ...data, bill });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post("/payments-made", authenticate, requireTenantContext, requireFeatureAccess("purchase.payments_made"), async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { vendor_id, bill_id, amount, date, payment_mode, reference_number, notes } = req.body;
    const payment_number = await generateDocNumber('payment_made');

    await db.query`INSERT INTO payments_made (id, tenant_id, payment_number, date, vendor_id, bill_id, amount, payment_mode, reference_number, notes, created_by, created_at) 
      VALUES (${id}, ${tenantId}, ${payment_number}, ${date}, ${vendor_id}, ${bill_id || null}, ${amount}, ${payment_mode || 'bank_transfer'}, ${reference_number || null}, ${notes || null}, ${req.user!.id}, GETDATE())`;

    if (bill_id) {
      const billResult = await db.query`SELECT balance_due FROM bills WHERE id = ${bill_id} AND tenant_id = ${tenantId}`;
      const bill = billResult.recordset[0];
      if (bill) {
        const newBalance = Math.max(0, Number(bill.balance_due) - Number(amount));
        const newStatus = newBalance <= 0 ? 'paid' : 'partial';
        await db.query`UPDATE bills SET balance_due = ${newBalance}, status = ${newStatus}, updated_at = GETDATE() WHERE id = ${bill_id} AND tenant_id = ${tenantId}`;
      }
    }

    const dataResult = await db.query`SELECT * FROM payments_made WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/payments-made/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM payments_made WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== DASHBOARD =====
router.get("/dashboard/stats", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const custCountResult = await db.query`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
    const invCountResult = await db.query`SELECT COUNT(*) as count FROM invoices WHERE tenant_id = ${tenantId}`;
    const allInvoicesResult = await db.query`SELECT total, balance_due, status, tax_amount FROM invoices WHERE tenant_id = ${tenantId}`;
    const allBillsResult = await db.query`SELECT total, balance_due, status, tax_amount FROM bills WHERE tenant_id = ${tenantId}`;
    const allItemsResult = await db.query`SELECT current_stock, selling_rate, reorder_level FROM items WHERE tenant_id = ${tenantId}`;
    const allExpensesResult = await db.query`SELECT tax_amount FROM expenses WHERE tenant_id = ${tenantId}`;

    const allInvoices = allInvoicesResult.recordset;
    const allBills = allBillsResult.recordset;
    const allItems = allItemsResult.recordset;
    const allExpenses = allExpensesResult.recordset;

    const totalSales = allInvoices.reduce((s: number, i: any) => s + Number(i.total), 0);
    const totalReceivables = allInvoices.reduce((s: number, i: any) => s + Number(i.balance_due), 0);
    const totalPurchase = allBills.reduce((s: number, b: any) => s + Number(b.total), 0);
    const totalPayables = allBills.reduce((s: number, b: any) => s + Number(b.balance_due), 0);
    const stockValue = allItems.reduce((s: number, i: any) => s + Number(i.current_stock) * Number(i.selling_rate), 0);
    const lowStockCount = allItems.filter((i: any) => Number(i.current_stock) <= Number(i.reorder_level)).length;
    const outputGst = allInvoices.reduce((s: number, i: any) => s + Number(i.tax_amount), 0);
    const inputGstFromBills = allBills.reduce((s: number, b: any) => s + Number(b.tax_amount), 0);
    const inputGstFromExpenses = allExpenses.reduce((s: number, e: any) => s + Number(e.tax_amount), 0);
    const gstPayable = outputGst - inputGstFromBills - inputGstFromExpenses;

    res.json({
      totalSales, totalPurchase, totalReceivables, totalPayables,
      stockValue, lowStockCount, gstPayable,
      customerCount: Number(custCountResult.recordset[0]?.count || 0),
      invoiceCount: Number(invCountResult.recordset[0]?.count || 0),
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/dashboard/recent-invoices", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const parsedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!shouldPaginate) {
      const dataResult = await db.query`
        SELECT i.*, c.name as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.tenant_id = ${tenantId}
        ORDER BY i.created_at DESC
      `;
      const data = dataResult.recordset.map(row => ({
        ...row,
        customers: { name: row.customer_name }
      }));
      res.json(data);
      return;
    }

    const [dataResult, countResult] = await Promise.all([
      runRawQuery(`
        SELECT i.*, c.name as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.tenant_id = @tenant_id
        ORDER BY i.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `, { offset, limit, tenant_id: tenantId }),
      runRawQuery(`SELECT COUNT(*) as total FROM invoices WHERE tenant_id = @tenant_id`, { tenant_id: tenantId }),
    ]);

    const total = Number(countResult.recordset[0]?.total || 0);
    const data = dataResult.recordset.map(row => ({
      ...row,
      customers: { name: row.customer_name }
    }));

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        start: total === 0 ? 0 : offset + 1,
        end: total === 0 ? 0 : Math.min(offset + data.length, total),
      },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/dashboard/low-stock", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const parsedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const countResult = await runRawQuery(`
      SELECT COUNT(*) as total
      FROM items
      WHERE tenant_id = @tenant_id
        AND COALESCE(current_stock, 0) <= COALESCE(reorder_level, 0)
    `, { tenant_id: tenantId });
    const total = Number(countResult.recordset[0]?.total || 0);

    if (!shouldPaginate) {
      const dataResult = await runRawQuery(`
        SELECT *
        FROM items
        WHERE tenant_id = @tenant_id
          AND COALESCE(current_stock, 0) <= COALESCE(reorder_level, 0)
        ORDER BY current_stock ASC, created_at DESC
      `, { tenant_id: tenantId });
      res.json(dataResult.recordset);
      return;
    }

    const dataResult = await runRawQuery(`
      SELECT *
      FROM items
      WHERE tenant_id = @tenant_id
        AND COALESCE(current_stock, 0) <= COALESCE(reorder_level, 0)
      ORDER BY current_stock ASC, created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `, { offset, limit, tenant_id: tenantId });

    res.json({
      data: dataResult.recordset,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        start: total === 0 ? 0 : offset + 1,
        end: total === 0 ? 0 : Math.min(offset + dataResult.recordset.length, total),
      },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/invoice-items", authenticate, async (req, res) => {
  try {
    const dataResult = await db.query`
      SELECT TOP 500
        ii.*,
        inv.document_number,
        inv.date as invoice_date,
        inv.status as invoice_status,
        it.name as item_name,
        it.hsn_code
      FROM invoice_items ii
      INNER JOIN invoices inv ON ii.invoice_id = inv.id
      LEFT JOIN items it ON ii.item_id = it.id
      ORDER BY inv.date DESC, ii.sort_order ASC
    `;
    res.json(dataResult.recordset);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/gst/hsn-summary", authenticate, async (req, res) => {
  try {
    const dataResult = await db.query`
      SELECT
        summary.hsn,
        (
          SELECT STRING_AGG(names.item_name, ', ')
          FROM (
            SELECT DISTINCT
              COALESCE(
                NULLIF(LTRIM(RTRIM(it2.name)), ''),
                NULLIF(LTRIM(RTRIM(ii2.description)), ''),
                'Unknown Item'
              ) as item_name
            FROM invoice_items ii2
            INNER JOIN invoices inv2 ON ii2.invoice_id = inv2.id
            LEFT JOIN items it2 ON ii2.item_id = it2.id
            WHERE COALESCE(inv2.status, '') <> 'draft'
              AND COALESCE(NULLIF(LTRIM(RTRIM(it2.hsn_code)), ''), 'N/A') = summary.hsn
          ) names
        ) as item_names,
        summary.qty,
        summary.taxable_value,
        summary.tax_value,
        summary.total_value,
        summary.invoice_count
      FROM (
        SELECT
          COALESCE(NULLIF(LTRIM(RTRIM(it.hsn_code)), ''), 'N/A') as hsn,
          SUM(COALESCE(ii.quantity, 0)) as qty,
          SUM(COALESCE(ii.amount, 0)) as taxable_value,
          SUM(COALESCE(ii.tax_amount, 0)) as tax_value,
          SUM(COALESCE(ii.amount, 0) + COALESCE(ii.tax_amount, 0)) as total_value,
          COUNT(DISTINCT ii.invoice_id) as invoice_count
        FROM invoice_items ii
        INNER JOIN invoices inv ON ii.invoice_id = inv.id
        LEFT JOIN items it ON ii.item_id = it.id
        WHERE COALESCE(inv.status, '') <> 'draft'
        GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(it.hsn_code)), ''), 'N/A')
      ) summary
      ORDER BY summary.total_value DESC, summary.hsn ASC
    `;
    sendPaginatedArray(req, res, dataResult.recordset);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== DELIVERY CHALLANS =====
router.get("/delivery-challans", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await sendPaginatedResults(req, res, `
      SELECT dc.*, c.name as customer_name
      FROM delivery_challans dc
      LEFT JOIN customers c ON dc.customer_id = c.id
      WHERE dc.tenant_id = @tenant_id
      ORDER BY dc.created_at DESC
    `, `SELECT COUNT(*) as total FROM delivery_challans WHERE tenant_id = @tenant_id`, { tenant_id: tenantId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/delivery-challans/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const dataResult = await db.query`
      SELECT dc.*, c.name as customer_name, c.gstin as customer_gstin, c.billing_address as customer_address, c.state as customer_state
      FROM delivery_challans dc 
      LEFT JOIN customers c ON dc.customer_id = c.id
      WHERE dc.id = ${req.params.id} AND dc.tenant_id = ${tenantId}
    `;
    const data = dataResult.recordset[0];
    if (!data) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.query`
      SELECT
        dci.id,
        dci.delivery_challan_id,
        dci.item_id,
        dci.description,
        dci.quantity,
        dci.sort_order,
        i.name as item_name,
        i.hsn_code,
        CASE
          WHEN COALESCE(dci.rate, 0) = 0 AND COALESCE(dci.amount, 0) = 0 AND COALESCE(dci.tax_amount, 0) = 0
            THEN COALESCE(soi.rate, i.selling_rate, 0)
          ELSE COALESCE(dci.rate, 0)
        END as rate,
        CASE
          WHEN COALESCE(dci.rate, 0) = 0 AND COALESCE(dci.amount, 0) = 0 AND COALESCE(dci.tax_amount, 0) = 0
            THEN CAST(dci.quantity * COALESCE(soi.rate, i.selling_rate, 0) AS DECIMAL(18, 2))
          ELSE COALESCE(dci.amount, 0)
        END as amount,
        CASE
          WHEN COALESCE(dci.rate, 0) = 0 AND COALESCE(dci.amount, 0) = 0 AND COALESCE(dci.tax_amount, 0) = 0
            THEN CAST(
              dci.quantity * COALESCE(COALESCE(soi.tax_amount, 0) / NULLIF(soi.quantity, 0), 0)
              AS DECIMAL(18, 2)
            )
          ELSE COALESCE(dci.tax_amount, 0)
        END as tax_amount,
        COALESCE(dci.tax_rate_id, soi.tax_rate_id, i.tax_rate_id) as tax_rate_id,
        COALESCE(tr.rate, 0) as tax_rate
      FROM delivery_challan_items dci
      LEFT JOIN delivery_challans dc ON dci.delivery_challan_id = dc.id
      LEFT JOIN items i ON dci.item_id = i.id
      LEFT JOIN sales_order_items soi ON soi.sales_order_id = dc.sales_order_id AND soi.item_id = dci.item_id AND soi.sort_order = dci.sort_order
      LEFT JOIN tax_rates tr ON tr.id = COALESCE(dci.tax_rate_id, soi.tax_rate_id, i.tax_rate_id)
      WHERE dci.delivery_challan_id = ${req.params.id}
      ORDER BY dci.sort_order
    `.then(res => res.recordset);

    const computedSubtotal = items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const computedTaxAmount = items.reduce((sum: number, item: any) => sum + Number(item.tax_amount || 0), 0);
    const computedTotal = computedSubtotal + computedTaxAmount;

    const subtotal = Number(data.subtotal || 0) > 0 ? Number(data.subtotal) : computedSubtotal;
    const taxAmount = Number(data.tax_amount || 0) > 0 ? Number(data.tax_amount) : computedTaxAmount;
    const total = Number(data.total || 0) > 0 ? Number(data.total) : computedTotal;

    res.json({
      ...data,
      subtotal,
      tax_amount: taxAmount,
      total,
      items,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/delivery-challans", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const id = uuidv4();
    const { customer_id, date, sales_order_id, reference_id, reference_type, status, notes, subtotal, tax_amount, total, items } = req.body;
    const document_number = await generateDocNumber('delivery_challan');
    const safeItems = Array.isArray(items) ? items : [];
    const computedSubtotal = subtotal ?? safeItems.reduce((sum: number, item: any) => sum + Number(item.amount || (Number(item.quantity || 0) * Number(item.rate || 0))), 0);
    const computedTaxAmount = tax_amount ?? safeItems.reduce((sum: number, item: any) => sum + Number(item.tax_amount || 0), 0);
    const computedTotal = total ?? (Number(computedSubtotal) + Number(computedTaxAmount));

    await db.query`INSERT INTO delivery_challans (id, tenant_id, document_number, date, customer_id, sales_order_id, reference_id, reference_type, status, notes, subtotal, tax_amount, total, created_by, created_at, updated_at) 
      VALUES (${id}, ${tenantId}, ${document_number}, ${date}, ${customer_id}, ${sales_order_id || null}, ${reference_id || null}, ${reference_type || null}, ${status || 'draft'}, ${notes || null}, ${computedSubtotal}, ${computedTaxAmount}, ${computedTotal}, ${req.user!.id}, GETDATE(), GETDATE())`;

    for (let i = 0; i < safeItems.length; i++) {
      const item = safeItems[i];
      const lineAmount = Number(item.amount || (Number(item.quantity || 0) * Number(item.rate || 0)));
      await db.query`INSERT INTO delivery_challan_items (id, tenant_id, delivery_challan_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
        VALUES (${uuidv4()}, ${tenantId}, ${id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${lineAmount}, ${i})`;
    }

    const dataResult = await db.query`SELECT * FROM delivery_challans WHERE id = ${id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/delivery-challans/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { customer_id, date, sales_order_id, reference_id, reference_type, status, notes, subtotal, tax_amount, total, items } = req.body;
    const safeItems = Array.isArray(items) ? items : [];
    const computedSubtotal = subtotal ?? safeItems.reduce((sum: number, item: any) => sum + Number(item.amount || (Number(item.quantity || 0) * Number(item.rate || 0))), 0);
    const computedTaxAmount = tax_amount ?? safeItems.reduce((sum: number, item: any) => sum + Number(item.tax_amount || 0), 0);
    const computedTotal = total ?? (Number(computedSubtotal) + Number(computedTaxAmount));

    await db.query`UPDATE delivery_challans SET customer_id = COALESCE(${customer_id}, customer_id), date = COALESCE(${date}, date), sales_order_id = COALESCE(${sales_order_id}, sales_order_id), reference_id = COALESCE(${reference_id}, reference_id), reference_type = COALESCE(${reference_type}, reference_type), status = COALESCE(${status}, status), notes = COALESCE(${notes}, notes), subtotal = COALESCE(${computedSubtotal}, subtotal), tax_amount = COALESCE(${computedTaxAmount}, tax_amount), total = COALESCE(${computedTotal}, total), updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;

    if (Array.isArray(items)) {
      await db.query`DELETE FROM delivery_challan_items WHERE delivery_challan_id = ${req.params.id} AND tenant_id = ${tenantId}`;
      for (let i = 0; i < safeItems.length; i++) {
        const item = safeItems[i];
        const lineAmount = Number(item.amount || (Number(item.quantity || 0) * Number(item.rate || 0)));
        await db.query`INSERT INTO delivery_challan_items (id, tenant_id, delivery_challan_id, item_id, description, quantity, rate, tax_rate_id, tax_amount, amount, sort_order) 
          VALUES (${uuidv4()}, ${tenantId}, ${req.params.id}, ${item.item_id}, ${item.description || null}, ${item.quantity || 1}, ${item.rate || 0}, ${item.tax_rate_id || null}, ${item.tax_amount || 0}, ${lineAmount}, ${i})`;
      }
    }
    const dataResult = await db.query`SELECT * FROM delivery_challans WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json(dataResult.recordset[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/delivery-challans/:id/status", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.body;
    await db.query`UPDATE delivery_challans SET status = ${status}, updated_at = GETDATE() WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/delivery-challans/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    await db.query`DELETE FROM delivery_challan_items WHERE delivery_challan_id = ${req.params.id} AND tenant_id = ${tenantId}`;
    await db.query`DELETE FROM delivery_challans WHERE id = ${req.params.id} AND tenant_id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== SUBSCRIPTION =====
router.get("/feature-catalog", authenticate, async (_req: AuthRequest, res) => {
  res.json({ features: FEATURE_OPTIONS });
});

router.get("/plan-features", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;
    const plans = await db.query`SELECT id, name FROM plans ORDER BY name ASC`.then((result) => result.recordset);
    const payload = await Promise.all(plans.map(async (plan: any) => ({
      ...plan,
      features: await getPlanFeatures(String(plan.id)),
    })));
    res.json({ plans: payload, catalog: FEATURE_OPTIONS });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/plans/:id/features", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;
    const featureKeys = Array.isArray(req.body?.featureKeys) ? req.body.featureKeys.map((item: any) => String(item)) : [];
    const catalogKeys = new Set(FEATURE_OPTIONS.map((feature) => feature.key));
    const invalid = featureKeys.filter((key: string) => !catalogKeys.has(key));
    if (invalid.length > 0) {
      res.status(400).json({ error: `Invalid feature keys: ${invalid.join(", ")}` });
      return;
    }
    await setPlanFeatures(req.params.id, featureKeys);
    res.json({ success: true, featureKeys });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/role-permissions", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const tenantId = getTenantId(req);
    const allowedFeatures = await getTenantAllowedFeatures(tenantId);
    const permissions = await getTenantRolePermissions(tenantId);
    const roles = await getTenantRoleNames(tenantId);
    res.json({
      allowedFeatures,
      permissions,
      roles,
      catalog: FEATURE_OPTIONS.filter((feature) => allowedFeatures.includes(feature.key)),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/roles", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const tenantId = getTenantId(req);
    const rows = await db.query`
      SELECT id, name, label, is_system, is_active, created_at, updated_at
      FROM roles
      WHERE tenant_id = ${tenantId}
      ORDER BY is_system DESC, label ASC, name ASC
    `.then((result) => result.recordset).catch(() => []);

    if (rows.length > 0) {
      res.json(rows);
      return;
    }

    res.json(MANAGEABLE_PERMISSION_ROLES.map((name) => ({
      id: name,
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      is_system: 1,
      is_active: 1,
      created_at: null,
      updated_at: null,
    })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/roles", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const tenantId = getTenantId(req);
    const name = String(req.body?.name || "").trim().toLowerCase();
    const label = String(req.body?.label || name).trim();
    if (!name) {
      res.status(400).json({ error: "Role name is required" });
      return;
    }

    const exists = await db.query`
      SELECT TOP 1 id
      FROM roles
      WHERE tenant_id = ${tenantId}
        AND LOWER(name) = LOWER(${name})
    `.then((result) => result.recordset[0]).catch(() => null);
    if (exists) {
      res.status(400).json({ error: "Role already exists" });
      return;
    }

    const id = uuidv4();
    await db.query`
      INSERT INTO roles (id, tenant_id, name, label, is_system, is_active, created_at, updated_at)
      VALUES (${id}, ${tenantId}, ${name}, ${label || name}, 0, 1, GETDATE(), GETDATE())
    `;
    const created = await db.query`SELECT TOP 1 * FROM roles WHERE id = ${id}`.then((result) => result.recordset[0]);
    res.status(201).json(created);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/roles/:id", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const tenantId = getTenantId(req);
    const existing = await db.query`
      SELECT TOP 1 *
      FROM roles
      WHERE id = ${req.params.id}
        AND tenant_id = ${tenantId}
    `.then((result) => result.recordset[0]).catch(() => null);
    if (!existing) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    const nextLabel = req.body?.label == null ? existing.label : String(req.body.label);
    const nextActive = req.body?.is_active == null ? existing.is_active : req.body.is_active;
    await db.query`
      UPDATE roles
      SET label = ${nextLabel},
          is_active = ${nextActive ? 1 : 0},
          updated_at = GETDATE()
      WHERE id = ${req.params.id}
        AND tenant_id = ${tenantId}
    `;
    const updated = await db.query`SELECT TOP 1 * FROM roles WHERE id = ${req.params.id}`.then((result) => result.recordset[0]);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/access-context", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const actorRole = String(req.user?.role || "").toUpperCase();
    const planFeatures = actorRole === "SUPER_ADMIN"
      ? FEATURE_OPTIONS.map((feature) => feature.key)
      : await getTenantAllowedFeatures(tenantId);
    const permissions = actorRole === "SUPER_ADMIN"
      ? {}
      : await getTenantRolePermissions(tenantId);

    const roleKey = String(req.user?.role || "viewer").toLowerCase();
    const roleFeatures = permissions[roleKey] || [];
    const effectiveFeatures = actorRole === "SUPER_ADMIN" || actorRole === "ADMIN"
      ? planFeatures
      : Object.keys(permissions).length === 0
        ? planFeatures
        : planFeatures.filter((feature) => roleFeatures.includes(feature));

    res.json({
      tenant_id: tenantId,
      role: req.user?.role || null,
      is_super_admin: actorRole === "SUPER_ADMIN",
      plan_features: planFeatures,
      role_features: roleFeatures,
      effective_features: effectiveFeatures,
      catalog: FEATURE_OPTIONS.filter((feature) => effectiveFeatures.includes(feature.key)),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/role-permissions/:role", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const role = normalizeTenantRole(req.params.role);
    const tenantId = getTenantId(req);
    const roles = await getTenantRoleNames(tenantId);
    if (!roles.includes(role)) {
      res.status(400).json({ error: "Role cannot be managed here" });
      return;
    }
    const allowedFeatures = await getTenantAllowedFeatures(tenantId);
    const featureKeys = Array.isArray(req.body?.featureKeys) ? req.body.featureKeys.map((item: any) => String(item)) : [];
    const invalid = featureKeys.filter((key: string) => !allowedFeatures.includes(key));
    if (invalid.length > 0) {
      res.status(403).json({ error: `Cannot enable features outside plan: ${invalid.join(", ")}` });
      return;
    }

    await setRolePermissions(tenantId, role, featureKeys);
    res.json({ success: true, role, featureKeys });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/subscription/plans", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const [plans, current] = await Promise.all([
      db.query`SELECT * FROM plans ORDER BY CASE WHEN price IS NULL THEN 999999 ELSE price END ASC, name ASC`.then((result) => result.recordset),
      getTenantSubscriptionContext(tenantId),
    ]);

    const liveFeatureKeysByPlan = new Map<string, string[]>();
    await Promise.all(plans.map(async (plan: any) => {
      const keys = await getPlanFeatures(String(plan.id));
      liveFeatureKeysByPlan.set(String(plan.id), keys);
    }));

    res.json({
      currentPlan: current.plan.name,
      plans: plans.map((plan: any) => {
        const featureKeys = liveFeatureKeysByPlan.get(String(plan.id)) || [];
        try {
          const persisted = plan.features_json ? JSON.parse(plan.features_json) : null;
          if (Array.isArray(persisted) && persisted.length > 0 && featureKeys.length === 0) {
            featureKeys.push(...persisted.map((item: any) => String(item)));
          } else if (persisted && typeof persisted === "object" && Array.isArray((persisted as any).feature_keys) && featureKeys.length === 0) {
            featureKeys.push(...(persisted as any).feature_keys.map((item: any) => String(item)));
          }
        } catch {
          // ignore malformed JSON and rely on live feature rows
        }

        const includedFeatures = FEATURE_OPTIONS.filter((feature) => featureKeys.includes(feature.key)).map((feature) => feature.label);
        const excludedFeatures = FEATURE_OPTIONS.filter((feature) => !featureKeys.includes(feature.key)).map((feature) => feature.label);
        const normalizedPlan = {
          ...plan,
          price: Number(plan.price || 0),
          invoice_limit: plan.invoice_limit == null ? null : Number(plan.invoice_limit),
          user_limit: plan.user_limit == null ? null : Number(plan.user_limit),
          feature_keys: featureKeys,
          features: featureKeys,
          included_features: includedFeatures,
          excluded_features: excludedFeatures,
        };

        return {
          ...normalizedPlan,
          current: String(normalizedPlan.name).toLowerCase() === String(current.plan.name).toLowerCase(),
          sections: getSubscriptionSections(normalizedPlan),
          moduleMatrix: getPlanModuleMatrix(normalizedPlan),
        };
      }),
    });
  } catch (e: any) {
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.put("/subscription/plans/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const { price, invoice_limit, user_limit, features_json } = req.body;
    await db.query`
      UPDATE plans
      SET price = COALESCE(${price}, price),
          invoice_limit = ${invoice_limit === "" ? null : invoice_limit},
          user_limit = ${user_limit === "" ? null : user_limit},
          features_json = COALESCE(${features_json || null}, features_json),
          updated_at = GETDATE()
      WHERE id = ${req.params.id}
    `;

    const updated = await db.query`SELECT TOP 1 * FROM plans WHERE id = ${req.params.id}`.then((result) => result.recordset[0]);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.get("/branding", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    let company_name = "BillFlow";
    let accent_color = "#3b82f6";

    if (tenantId) {
      const company = await db.query`SELECT TOP 1 company_name FROM companies WHERE id = ${tenantId}`.then(r => r.recordset[0]);
      if (company?.company_name) {
        company_name = company.company_name;
      }
    }

    res.json({
      name: company_name,
      accentColor: accent_color,
      logo: null,
      footerText: "Professional Billing & Accounting",
      status: "active"
    });
  } catch (e: any) {
    console.error("[api/branding] error", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/organizations", authenticate, async (req: AuthRequest, res) => {
  try {
    const email = String(req.user?.email || "").toLowerCase();
    const hasSuperRole = String(req.user?.role || "").toUpperCase() === "SUPER_ADMIN";
    if (!hasSuperRole && email !== "ganesh@gmail.com") {
      return res.json({ organizations: [] });
    }
    res.redirect(307, "/api/subscription/organizations");
  } catch (e: any) {
    console.error("[api/organizations] error", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/subscription/current", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const context = await getTenantSubscriptionContext(tenantId);
    console.log("[api/subscription/current] tenant_id", tenantId, "plan", context.plan.name);
    res.json({
      subscription: context.subscription,
      plan_name: context.plan.name,
      invoice_limit: context.plan.invoice_limit,
      features_json: context.plan.features_json,
      plan: context.plan,
      sections: getSubscriptionSections(context.plan),
      moduleMatrix: getPlanModuleMatrix(context.plan),
    });
  } catch (e: any) {
    console.error("[api/subscription/current] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.get("/subscription/overview", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const [context, company, users, customerCount, invoiceCount, gstSettings, invoiceSettings] = await Promise.all([
      getTenantSubscriptionContext(tenantId),
      db.query`
        SELECT TOP 1 *
        FROM companies
        WHERE id = ${tenantId} OR tenant_id = ${tenantId}
        ORDER BY created_at ASC
      `.then((result) => result.recordset[0]),
      db.query`
        SELECT DISTINCT
          u.id,
          u.email,
          u.username,
          u.is_active,
          p.display_name,
          p.phone,
          ur.role,
          COALESCE(ur.tenant_id, p.tenant_id) AS tenant_id
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE COALESCE(ur.tenant_id, p.tenant_id) = ${tenantId}
           OR EXISTS (
             SELECT 1
             FROM companies c
             WHERE (c.id = ${tenantId} OR c.tenant_id = ${tenantId})
               AND c.created_by = u.id
           )
        ORDER BY COALESCE(p.display_name, u.email)
      `.then((result) => result.recordset),
      db.query`SELECT COUNT(*) as total FROM customers WHERE tenant_id = ${tenantId}`.then((result) => Number(result.recordset[0]?.total || 0)),
      db.query`SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ${tenantId}`.then((result) => Number(result.recordset[0]?.total || 0)),
      db.query`SELECT TOP 1 * FROM gst_settings WHERE tenant_id = ${tenantId}`.then((result) => result.recordset[0] || null).catch(() => null),
      db.query`SELECT TOP 1 * FROM invoice_settings WHERE tenant_id = ${tenantId}`.then((result) => result.recordset[0] || null).catch(() => null),
    ]);

    const roleBreakdown = users.reduce((acc: Record<string, number>, user: any) => {
      const role = String(user.role || "viewer").toLowerCase();
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      tenantId,
      company: company || null,
      subscription: context.subscription,
      plan: {
        ...context.plan,
        sections: getSubscriptionSections(context.plan),
        moduleMatrix: getPlanModuleMatrix(context.plan),
      },
      users,
      accessSummary: {
        totalUsers: users.length,
        activeUsers: users.filter((user: any) => user.is_active).length,
        roleBreakdown,
        userLimit: context.plan.user_limit,
      },
      onboarding: {
        companyConfigured: Boolean(company?.company_name),
        gstConfigured: Boolean(gstSettings?.gstin || company?.gstin),
        firstCustomerAdded: customerCount > 0,
        firstInvoiceCreated: invoiceCount > 0,
      },
      usage: {
        customers: customerCount,
        invoices: invoiceCount,
      },
      tenantSettings: {
        gstConfigured: Boolean(gstSettings?.gstin || company?.gstin),
        invoiceConfigured: Boolean(invoiceSettings),
      },
    });
  } catch (e: any) {
    console.error("[api/subscription/overview] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.get("/subscription/organizations", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const companies = await db.query`
      SELECT
        c.id,
        c.tenant_id,
        c.company_name,
        c.gstin,
        c.city,
        c.state,
        c.phone,
        c.email,
        c.website,
        c.created_by,
        c.created_at,
        c.updated_at,
        s.status as subscription_status,
        s.start_date,
        s.end_date,
        s.invoice_limit as subscription_invoice_limit,
        s.user_limit as subscription_user_limit,
        s.auto_renew,
        s.payment_provider,
        COALESCE(p.name, s.plan_name, 'Free') as plan_name,
        p.price,
        p.invoice_limit,
        p.user_limit
      FROM companies c
      LEFT JOIN subscriptions s ON s.tenant_id = c.id
      LEFT JOIN plans p ON p.id = s.plan_id
      ORDER BY c.created_at DESC
    `.then((result) => result.recordset);

    console.log(`[api/subscription/organizations] Found ${companies.length} companies`);

    if (companies.length === 0) {
      return res.json({ organizations: [] });
    }

    const users = await db.query`
      SELECT DISTINCT
        COALESCE(ur.tenant_id, p.tenant_id) as company_id,
        u.id as user_id,
        u.email,
        u.username,
        u.is_active,
        p.display_name,
        p.phone,
        ur.role
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE COALESCE(ur.tenant_id, p.tenant_id) IS NOT NULL
         OR EXISTS (SELECT 1 FROM companies c WHERE c.created_by = u.id)
    `.then((result) => result.recordset);

    const byCompany = new Map<string, any[]>();
    for (const user of users) {
      const key = String(user.company_id || "");
      const current = byCompany.get(key) || [];
      current.push({
        id: user.user_id,
        email: user.email,
        username: user.username,
        is_active: user.is_active,
        display_name: user.display_name,
        phone: user.phone,
        role: user.role,
      });
      byCompany.set(key, current);
    }

    const organizations = await Promise.all(companies.map(async (company: any) => {
      const companyUsers = byCompany.get(String(company.id)) || [];
      const creatorUsers = users
        .filter((user: any) => !user.company_id && company.created_by === user.user_id)
        .map((user: any) => ({
          id: user.user_id,
          email: user.email,
          username: user.username,
          is_active: user.is_active,
          display_name: user.display_name,
          phone: user.phone,
          role: user.role,
        }));
      const mergedUsers = [...companyUsers, ...creatorUsers.filter((creator: any) => !companyUsers.some((user: any) => user.id === creator.id))];
      
      const tenantScopeId = company.tenant_id || company.id;
      const [customerCount, invoiceCount, billCount, vendorCount, itemCount, quotationCount, salesOrderCount, purchaseOrderCount, paymentReceivedCount, paymentMadeCount] = await Promise.all([
        db.query`SELECT COUNT(*) as total FROM customers WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM invoices WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM bills WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM vendors WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM items WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM quotations WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM sales_orders WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM purchase_orders WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM payments_received WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
        db.query`SELECT COUNT(*) as total FROM payments_made WHERE tenant_id IN (${company.id}, ${tenantScopeId})`.then((result) => Number(result.recordset[0]?.total || 0)).catch(() => 0),
      ]);

      const roleBreakdown = mergedUsers.reduce((acc: Record<string, number>, user: any) => {
        const role = String(user.role || "viewer").toLowerCase();
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const planShape = {
        name: company.plan_name || "Free",
        price: Number(company.price || 0),
        invoice_limit: company.invoice_limit == null ? null : Number(company.invoice_limit),
        user_limit: company.user_limit == null ? null : Number(company.user_limit),
        features: getSubscriptionSections({ name: company.plan_name || "Free" }),
      };

      return {
        id: company.id,
        tenant_scope_id: tenantScopeId,
        company_name: company.company_name,
        gstin: company.gstin,
        city: company.city,
        state: company.state,
        phone: company.phone,
        email: company.email,
        website: company.website,
        domain: company.website || `${String(company.company_name || "company").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.app`,
        created_at: company.created_at,
        plan: planShape,
        subscription_status: company.subscription_status || "inactive",
        subscription_start_date: company.start_date || null,
        subscription_end_date: company.end_date || null,
        auto_renew: Boolean(company.auto_renew),
        payment_provider: company.payment_provider || null,
        users: mergedUsers,
        accessSummary: {
          totalUsers: mergedUsers.length,
          activeUsers: mergedUsers.filter((user: any) => user.is_active).length,
          admins: Number(roleBreakdown.admin || 0),
          roleBreakdown,
        },
        usage: {
          customers: customerCount,
          invoices: invoiceCount,
          bills: billCount,
          vendors: vendorCount,
          items: itemCount,
          quotations: quotationCount,
          salesOrders: salesOrderCount,
          purchaseOrders: purchaseOrderCount,
          paymentsReceived: paymentReceivedCount,
          paymentsMade: paymentMadeCount,
        },
      };
    }));

    res.json({ organizations });
  } catch (e: any) {
    console.error("[api/subscription/organizations] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.put("/subscription/organizations/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const tenantId = req.params.id;
    const {
      company_name,
      gstin,
      city,
      state,
      phone,
      email,
      website,
      address,
      pincode,
      plan_name,
      status,
      auto_renew,
    } = req.body || {};

    const company = await db.query`
      SELECT TOP 1 *
      FROM companies
      WHERE id = ${tenantId}
    `.then((result) => result.recordset[0]);

    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    await db.query`
      UPDATE companies
      SET company_name = COALESCE(${company_name || null}, company_name),
          gstin = COALESCE(${gstin || null}, gstin),
          city = COALESCE(${city || null}, city),
          state = COALESCE(${state || null}, state),
          phone = COALESCE(${phone || null}, phone),
          email = COALESCE(${email || null}, email),
          website = COALESCE(${website || null}, website),
          address = COALESCE(${address || null}, address),
          pincode = COALESCE(${pincode || null}, pincode),
          updated_at = GETDATE()
      WHERE id = ${tenantId}
    `;

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      if (!["active", "inactive", "suspended"].includes(normalizedStatus)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      await db.query`
        UPDATE subscriptions
        SET status = ${normalizedStatus},
            auto_renew = COALESCE(${auto_renew}, auto_renew),
            updated_at = GETDATE()
        WHERE tenant_id = ${tenantId}
      `;
    }

    if (plan_name) {
      await updateTenantPlan(tenantId, String(plan_name));
    }

    await db.query`
      UPDATE gst_settings
      SET legal_name = COALESCE(${company_name || null}, legal_name),
          trade_name = COALESCE(${company_name || null}, trade_name),
          gstin = COALESCE(${gstin || null}, gstin),
          state = COALESCE(${state || null}, state),
          updated_at = GETDATE()
      WHERE tenant_id = ${tenantId}
    `;

    const updatedCompany = await db.query`
      SELECT TOP 1 *
      FROM companies
      WHERE id = ${tenantId}
    `.then((result) => result.recordset[0]);

    res.json({ success: true, company: updatedCompany });
  } catch (e: any) {
    console.error("[api/subscription/organizations/:id] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.put("/subscription/organizations/:id/status", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const tenantId = req.params.id;
    const normalizedStatus = String(req.body?.status || "").toLowerCase();
    if (!["active", "inactive", "suspended"].includes(normalizedStatus)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const existing = await db.query`SELECT TOP 1 * FROM subscriptions WHERE tenant_id = ${tenantId} ORDER BY created_at DESC`.then((result) => result.recordset[0]);
    if (!existing) {
      res.status(404).json({ error: "Subscription not found for company" });
      return;
    }

    await db.query`
      UPDATE subscriptions
      SET status = ${normalizedStatus}, updated_at = GETDATE()
      WHERE id = ${existing.id}
    `;

    const updated = await db.query`SELECT TOP 1 * FROM subscriptions WHERE id = ${existing.id}`.then((result) => result.recordset[0]);
    res.json({ success: true, subscription: updated });
  } catch (e: any) {
    console.error("[api/subscription/organizations/:id/status] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.delete("/subscription/organizations/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const tenantId = req.params.id;
    const company = await db.query`
      SELECT TOP 1 id
      FROM companies
      WHERE id = ${tenantId}
    `.then((result) => result.recordset[0]);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const tenantTables = [
      "stock_movements",
      "warehouse_stock",
      "inventory_adjustments",
      "stock_transfers",
      "warehouses",
      "price_lists",
      "item_categories",
      "purchase_return_items",
      "purchase_returns",
      "vendor_credit_items",
      "vendor_credits",
      "payments_made",
      "recurring_bills",
      "bill_items",
      "bills",
      "purchase_order_items",
      "purchase_orders",
      "sales_return_items",
      "sales_returns",
      "credit_note_items",
      "credit_notes",
      "payments_received",
      "recurring_invoices",
      "invoice_items",
      "invoices",
      "delivery_challan_items",
      "delivery_challans",
      "sales_order_items",
      "sales_orders",
      "quotation_items",
      "quotations",
      "items",
      "vendors",
      "customers",
      "journal_entry_lines",
      "journal_entries",
      "accounts",
      "invoice_settings",
      "gst_settings",
      "role_permissions",
      "roles",
      "subscriptions",
      "profiles",
      "user_roles",
    ];

    const request = await db.request();
    request.input("tenantId", tenantId);
    for (const tableName of tenantTables) {
      await request.query(`DELETE FROM dbo.${tableName} WHERE tenant_id = @tenantId`).then(() => null).catch(() => null);
    }

    await db.query`DELETE FROM companies WHERE id = ${tenantId}`;
    res.json({ success: true });
  } catch (e: any) {
    console.error("[api/subscription/organizations/:id] delete error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.put("/subscription/organizations/:id/plan", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!(await requireCybaemtechSuperAdmin(req, res))) return;

    const tenantId = req.params.id;
    const planName = String(req.body?.planName || "");
    if (!planName) {
      res.status(400).json({ error: "planName is required" });
      return;
    }

    const plan = await updateTenantPlan(tenantId, planName);
    res.json({ success: true, plan });
  } catch (e: any) {
    console.error("[api/subscription/organizations/:id/plan] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.post("/billing/razorpay/order", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { planName } = req.body;
    console.log("[api/billing/razorpay/order] tenant_id", tenantId, "planName", planName);
    const plan = await db.query`SELECT TOP 1 * FROM plans WHERE LOWER(name) = LOWER(${planName})`.then((result) => result.recordset[0]);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      res.status(400).json({ message: "Internal Server Error", error: "Razorpay is not configured" });
      return;
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(plan.price || 0) * 100),
        currency: "INR",
        receipt: `${tenantId}-${String(plan.name).toLowerCase()}`,
        notes: { tenantId, planName: plan.name },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[api/billing/razorpay/order] razorpay error", errorBody);
      res.status(502).json({ message: "Internal Server Error", error: `Razorpay order creation failed: ${errorBody}` });
      return;
    }

    const order = await response.json();
    console.log("[api/billing/razorpay/order] order created", order?.id);
    res.json({ order, razorpayKeyId: keyId, plan });
  } catch (e: any) {
    console.error("[api/billing/razorpay/order] error", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});

router.post("/billing/upgrade/confirm", authenticate, requireTenantContext, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { planName } = req.body;
    const plan = await updateTenantPlan(tenantId, planName);
    res.json({ success: true, plan });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;

























































