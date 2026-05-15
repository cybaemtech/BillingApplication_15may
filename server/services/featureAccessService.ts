import { db } from "../db.js";

export const FEATURE_CATALOG = {
  Dashboard: [],
  Sales: [
    "Customers",
    "Quotations",
    "Sales Orders",
    "Delivery Challans",
    "Invoices",
    "Recurring Invoices",
    "Payments Received",
    "Credit Notes",
    "Sales Returns",
  ],
  Purchase: [
    "Vendors",
    "Purchase Orders",
    "Bills",
    "Recurring Bills",
    "Payments Made",
    "Vendor Credits",
    "Purchase Returns",
  ],
  Inventory: [
    "Items",
    "Categories",
    "Price Lists",
    "Warehouses",
    "Stock Transfers",
    "Adjustments",
    "Stock Ledger",
    "Expenses",
  ],
  Accounting: [
    "Chart of Accounts",
    "Journal Entries",
    "Ledger",
    "Trial Balance",
    "Profit & Loss",
    "Balance Sheet",
    "Cash Flow",
    "Day Book",
  ],
  GST: [
    "GST Settings",
    "GSTR-1",
    "GSTR-3B",
    "HSN Summary",
    "E-Invoice",
    "E-Way Bill",
  ],
  POS: [
    "New Sale",
    "Sessions",
    "Orders",
    "Reports",
  ],
  Automation: [
    "Workflows",
    "Reminders",
    "Settings",
  ],
} as const;

export function toFeatureKey(moduleName: string, featureName?: string | null) {
  const modPart = moduleName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!featureName) {
    return modPart;
  }
  const featPart = featureName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${modPart}.${featPart}`;
}

export const FEATURE_OPTIONS = Object.entries(FEATURE_CATALOG).flatMap(([moduleName, features]) => {
  if (features.length === 0) {
    return [{
      module: moduleName,
      label: moduleName,
      key: toFeatureKey(moduleName),
    }];
  }

  return features.map((featureName) => ({
    module: moduleName,
    label: featureName,
    key: toFeatureKey(moduleName, featureName),
  }));
});

export const DEFAULT_PLAN_FEATURES: Record<string, string[]> = {
  free: [
    toFeatureKey("Dashboard"),
    toFeatureKey("Sales", "Customers"),
    toFeatureKey("GST", "GST Settings"),
  ],
  basic: [
    toFeatureKey("Dashboard"),
    toFeatureKey("Sales", "Customers"),
    toFeatureKey("Sales", "Quotations"),
    toFeatureKey("Sales", "Sales Orders"),
    toFeatureKey("Sales", "Delivery Challans"),
    toFeatureKey("Sales", "Invoices"),
    toFeatureKey("Sales", "Recurring Invoices"),
    toFeatureKey("Sales", "Payments Received"),
    toFeatureKey("Sales", "Credit Notes"),
    toFeatureKey("Sales", "Sales Returns"),
    toFeatureKey("Purchase", "Vendors"),
    toFeatureKey("Purchase", "Purchase Orders"),
    toFeatureKey("Purchase", "Bills"),
    toFeatureKey("Purchase", "Recurring Bills"),
    toFeatureKey("Purchase", "Payments Made"),
    toFeatureKey("Purchase", "Vendor Credits"),
    toFeatureKey("Purchase", "Purchase Returns"),
    toFeatureKey("GST", "GST Settings"),
    toFeatureKey("GST", "GSTR-1"),
    toFeatureKey("GST", "GSTR-3B"),
    toFeatureKey("GST", "HSN Summary"),
  ],
  pro: FEATURE_OPTIONS.map((feature) => feature.key),
};

export async function getPlanFeatures(planId: string) {
  const rows = await db.query`
    SELECT feature_key
    FROM plan_features
    WHERE plan_id = ${planId}
  `.then((result) => result.recordset);

  const validKeys = new Set(FEATURE_OPTIONS.map((f) => f.key));
  const mapped = rows
    .map((row: any) => String(row.feature_key || ""))
    .filter((key: string) => validKeys.has(key));

  if (mapped.length > 0) {
    return mapped;
  }

  const plan = await db.query`
    SELECT TOP 1 name
    FROM plans
    WHERE id = ${planId}
  `.then((result) => result.recordset[0]);

  const fallbackKey = String(plan?.name || "free").toLowerCase();
  return DEFAULT_PLAN_FEATURES[fallbackKey] || DEFAULT_PLAN_FEATURES.free;
}


export async function getTenantAllowedFeatures(tenantId: string) {
  const subscription = await db.query`
    SELECT TOP 1 plan_id, plan_name
    FROM subscriptions
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
  `.then((result) => result.recordset[0]);

  if (subscription?.plan_id) {
    return getPlanFeatures(String(subscription.plan_id));
  }

  const fallbackKey = String(subscription?.plan_name || "free").toLowerCase();
  return DEFAULT_PLAN_FEATURES[fallbackKey] || DEFAULT_PLAN_FEATURES.free;
}

export async function getTenantRolePermissions(tenantId: string) {
  const rows = await db.query`
    SELECT role, feature_key
    FROM role_permissions
    WHERE tenant_id = ${tenantId}
  `.then((result) => result.recordset);

  return rows.reduce((acc: Record<string, string[]>, row: any) => {
    const role = String(row.role || "viewer").toLowerCase();
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(String(row.feature_key || ""));
    return acc;
  }, {});
}

export async function setPlanFeatures(planId: string, featureKeys: string[]) {
  await db.query`DELETE FROM plan_features WHERE plan_id = ${planId}`;
  for (const featureKey of featureKeys) {
    await db.query`
      INSERT INTO plan_features (id, plan_id, feature_key, created_at)
      VALUES (NEWID(), ${planId}, ${featureKey}, GETDATE())
    `;
  }

  await db.query`
    UPDATE plans
    SET features_json = ${JSON.stringify(featureKeys)},
        updated_at = GETDATE()
    WHERE id = ${planId}
  `;
}

export async function setRolePermissions(tenantId: string, role: string, featureKeys: string[]) {
  await db.query`DELETE FROM role_permissions WHERE tenant_id = ${tenantId} AND role = ${role}`;
  for (const featureKey of featureKeys) {
    await db.query`
      INSERT INTO role_permissions (id, tenant_id, role, feature_key, created_at)
      VALUES (NEWID(), ${tenantId}, ${role}, ${featureKey}, GETDATE())
    `;
  }
}
