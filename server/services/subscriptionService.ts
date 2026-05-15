import { db } from "../db.js";

function parseFeatures(featuresJson?: string | null) {
  if (!featuresJson) return {};
  try {
    return JSON.parse(featuresJson);
  } catch {
    return {};
  }
}

async function getPlanFeatureKeys(planId?: string | null) {
  if (!planId) return [];

  const rows = await db.query`
    SELECT feature_key
    FROM plan_features
    WHERE plan_id = ${planId}
    ORDER BY feature_key ASC
  `.then((result) => result.recordset);

  return rows.map((row: any) => String(row.feature_key || "")).filter(Boolean);
}

function defaultPlan(planName = "Free") {
  const normalized = String(planName || "Free");
  if (normalized.toLowerCase() === "pro") {
    return {
      id: null,
      name: "Pro",
      price: 0,
      invoice_limit: null,
      user_limit: null,
      features: {},
      features_json: JSON.stringify({}),
    };
  }
  if (normalized.toLowerCase() === "basic") {
    return {
      id: null,
      name: "Basic",
      price: 0,
      invoice_limit: 500,
      user_limit: 5,
      features: {},
      features_json: JSON.stringify({}),
    };
  }
  return {
    id: null,
    name: "Free",
    price: 0,
    invoice_limit: 25,
    user_limit: 1,
    features: {},
    features_json: JSON.stringify({}),
  };
}

export async function getTenantSubscriptionContext(tenantId: string) {
  console.log("[subscription] tenant_id", tenantId);
  const subscription = await db.query`
    SELECT TOP 1 s.*, p.id as resolved_plan_id, p.name as plan_name_resolved, p.price as plan_price, p.invoice_limit as plan_invoice_limit, p.user_limit as plan_user_limit, p.features_json as plan_features_json
    FROM subscriptions s
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE s.tenant_id = ${tenantId}
    ORDER BY s.created_at DESC
  `.then((result) => result.recordset[0]);

  console.log("[subscription] raw row", subscription || null);

  const resolvedPlanName = subscription?.plan_name_resolved || subscription?.plan_name || "Free";
  const fallbackFromDb = await db.query`
    SELECT TOP 1 *
    FROM plans
    WHERE LOWER(name) = LOWER(${resolvedPlanName})
    ORDER BY created_at ASC
  `.then((result) => result.recordset[0]);

  const resolvedPlanId = subscription?.resolved_plan_id || subscription?.plan_id || fallbackFromDb?.id || null;
  const featuresJson = subscription?.plan_features_json ?? fallbackFromDb?.features_json ?? defaultPlan(resolvedPlanName).features_json;
  const featureKeys = await getPlanFeatureKeys(resolvedPlanId);
  const features = featureKeys.length > 0 ? featureKeys : parseFeatures(featuresJson);

  return {
    subscription: subscription || {
      id: null,
      tenant_id: tenantId,
      plan_id: fallbackFromDb?.id || null,
      plan_name: fallbackFromDb?.name || defaultPlan(resolvedPlanName).name,
      status: "inactive",
    },
    plan: {
      id: resolvedPlanId,
      name: subscription?.plan_name_resolved || fallbackFromDb?.name || defaultPlan(resolvedPlanName).name,
      price: Number(subscription?.plan_price ?? fallbackFromDb?.price ?? 0),
      invoice_limit: (subscription?.plan_invoice_limit ?? fallbackFromDb?.invoice_limit) == null ? null : Number(subscription?.plan_invoice_limit ?? fallbackFromDb?.invoice_limit),
      user_limit: (subscription?.plan_user_limit ?? fallbackFromDb?.user_limit) == null ? null : Number(subscription?.plan_user_limit ?? fallbackFromDb?.user_limit),
      features,
      features_json: featuresJson,
    },
  };
}

export async function updateTenantPlan(tenantId: string, planName: string) {
  const plan = await db.query`SELECT TOP 1 * FROM plans WHERE LOWER(name) = LOWER(${planName})`.then((result) => result.recordset[0]);
  if (!plan) throw new Error("Plan not found");

  const existing = await db.query`SELECT TOP 1 * FROM subscriptions WHERE tenant_id = ${tenantId} ORDER BY created_at DESC`.then((result) => result.recordset[0]);
  if (!existing) {
    await db.query`
      INSERT INTO subscriptions (id, tenant_id, plan_id, plan_name, start_date, invoice_limit, user_limit, status, auto_renew, created_at, updated_at)
      VALUES (NEWID(), ${tenantId}, ${plan.id}, ${plan.name}, GETDATE(), ${plan.invoice_limit ?? null}, ${plan.user_limit ?? null}, 'active', 1, GETDATE(), GETDATE())
    `;
    return plan;
  }

  await db.query`
    UPDATE subscriptions
    SET plan_id = ${plan.id},
        plan_name = ${plan.name},
        invoice_limit = ${plan.invoice_limit ?? null},
        user_limit = ${plan.user_limit ?? null},
        status = 'active',
        updated_at = GETDATE()
    WHERE id = ${existing.id}
  `;
  return plan;
}
