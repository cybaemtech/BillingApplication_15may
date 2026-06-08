import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routes = readFileSync(resolve(process.cwd(), "server/routes.ts"), "utf8");
const migration = readFileSync(
  resolve(process.cwd(), "database/mssql/mssql_20260608120000_inventory_pos_tenant_isolation.sql"),
  "utf8",
);
const auth = readFileSync(resolve(process.cwd(), "server/auth.ts"), "utf8");
const tenantContext = readFileSync(resolve(process.cwd(), "server/middleware/tenantContext.ts"), "utf8");

describe("inventory and POS tenant isolation", () => {
  it.each([
    ["/item-categories", "inventory.categories"],
    ["/price-lists", "inventory.price_lists"],
    ["/warehouses", "inventory.warehouses"],
    ["/inventory-adjustments", "inventory.adjustments"],
    ["/stock-transfers", "inventory.stock_transfers"],
    ["/stock-movements", "inventory.stock_ledger"],
    ["/pos/sessions", "pos.sessions"],
    ["/pos/orders", "pos.orders"],
    ["/gst/hsn-summary", "gst.hsn_summary"],
  ])("protects %s with tenant and feature middleware", (path, feature) => {
    const routeStart = routes.indexOf(`router.get("${path}"`);
    expect(routeStart).toBeGreaterThan(-1);

    const routeDeclaration = routes.slice(routeStart, routes.indexOf("async", routeStart));
    expect(routeDeclaration).toContain("requireTenantContext");
    expect(routeDeclaration).toContain(`requireFeatureAccess("${feature}")`);
  });

  it.each([
    "item_categories",
    "price_lists",
    "price_list_items",
    "warehouses",
    "warehouse_stock",
    "inventory_adjustments",
    "inventory_adjustment_items",
    "stock_transfers",
    "stock_transfer_items",
    "stock_movements",
    "pos_sessions",
    "pos_orders",
    "pos_order_items",
    "pos_payments",
  ])("migrates and indexes %s by tenant", (table) => {
    expect(migration).toContain(`('${table}')`);
    expect(migration).toContain("tenant_id");
  });

  it("writes tenant ownership into inventory and POS records", () => {
    for (const table of [
      "item_categories",
      "price_lists",
      "price_list_items",
      "warehouses",
      "warehouse_stock",
      "inventory_adjustments",
      "inventory_adjustment_items",
      "stock_transfers",
      "stock_transfer_items",
      "stock_movements",
      "pos_sessions",
      "pos_orders",
      "pos_order_items",
      "pos_payments",
    ]) {
      expect(routes).toContain(`INSERT INTO ${table} (id, tenant_id,`);
    }
  });

  it("fails closed when a user has no organization membership", () => {
    expect(auth).not.toContain("using first company fallback");
    expect(auth).not.toContain("using token tenantId fallback");
    expect(tenantContext).not.toContain("SELECT TOP 1 id\n        FROM companies\n        ORDER BY created_at ASC");
  });
});
