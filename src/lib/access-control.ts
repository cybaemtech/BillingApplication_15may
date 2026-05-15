export type AccessContext = {
  tenant_id: string | null;
  role: string | null;
  is_super_admin: boolean;
  plan_features: string[];
  role_features: string[];
  effective_features: string[];
  catalog: Array<{ module: string; label: string; key: string }>;
};

export const PATH_FEATURE_MAP: Array<{ match: (pathname: string) => boolean; featureKey: string | null }> = [
  { match: (pathname) => pathname === "/", featureKey: "dashboard" },
  { match: (pathname) => pathname.startsWith("/sales/customers"), featureKey: "sales.customers" },
  { match: (pathname) => pathname.startsWith("/sales/quotations"), featureKey: "sales.quotations" },
  { match: (pathname) => pathname.startsWith("/sales/orders"), featureKey: "sales.sales_orders" },
  { match: (pathname) => pathname.startsWith("/sales/delivery-challans"), featureKey: "sales.delivery_challans" },
  { match: (pathname) => pathname.startsWith("/sales/invoices"), featureKey: "sales.invoices" },
  { match: (pathname) => pathname.startsWith("/sales/recurring-invoices"), featureKey: "sales.recurring_invoices" },
  { match: (pathname) => pathname.startsWith("/sales/payments"), featureKey: "sales.payments_received" },
  { match: (pathname) => pathname.startsWith("/sales/credit-notes"), featureKey: "sales.credit_notes" },
  { match: (pathname) => pathname.startsWith("/sales/returns"), featureKey: "sales.sales_returns" },
  { match: (pathname) => pathname.startsWith("/purchase/vendors"), featureKey: "purchase.vendors" },
  { match: (pathname) => pathname.startsWith("/purchase/orders"), featureKey: "purchase.purchase_orders" },
  { match: (pathname) => pathname.startsWith("/purchase/bills"), featureKey: "purchase.bills" },
  { match: (pathname) => pathname.startsWith("/purchase/recurring-bills"), featureKey: "purchase.recurring_bills" },
  { match: (pathname) => pathname.startsWith("/purchase/payments"), featureKey: "purchase.payments_made" },
  { match: (pathname) => pathname.startsWith("/purchase/vendor-credits"), featureKey: "purchase.vendor_credits" },
  { match: (pathname) => pathname.startsWith("/purchase/returns"), featureKey: "purchase.purchase_returns" },
  { match: (pathname) => pathname.startsWith("/inventory/items"), featureKey: "inventory.items" },
  { match: (pathname) => pathname.startsWith("/inventory/categories"), featureKey: "inventory.categories" },
  { match: (pathname) => pathname.startsWith("/inventory/price-lists"), featureKey: "inventory.price_lists" },
  { match: (pathname) => pathname.startsWith("/inventory/warehouses"), featureKey: "inventory.warehouses" },
  { match: (pathname) => pathname.startsWith("/inventory/stock-transfers"), featureKey: "inventory.stock_transfers" },
  { match: (pathname) => pathname.startsWith("/inventory/adjustments"), featureKey: "inventory.adjustments" },
  { match: (pathname) => pathname.startsWith("/inventory/stock-ledger"), featureKey: "inventory.stock_ledger" },
  { match: (pathname) => pathname.startsWith("/expenses"), featureKey: "inventory.expenses" },
  { match: (pathname) => pathname.startsWith("/accounting/chart"), featureKey: "accounting.chart_of_accounts" },
  { match: (pathname) => pathname.startsWith("/accounting/journals"), featureKey: "accounting.journal_entries" },
  { match: (pathname) => pathname.startsWith("/accounting/ledger"), featureKey: "accounting.ledger" },
  { match: (pathname) => pathname.startsWith("/accounting/trial-balance"), featureKey: "accounting.trial_balance" },
  { match: (pathname) => pathname.startsWith("/accounting/pnl"), featureKey: "accounting.profit_loss" },
  { match: (pathname) => pathname.startsWith("/accounting/balance-sheet"), featureKey: "accounting.balance_sheet" },
  { match: (pathname) => pathname.startsWith("/accounting/cash-flow"), featureKey: "accounting.cash_flow" },
  { match: (pathname) => pathname.startsWith("/accounting/day-book"), featureKey: "accounting.day_book" },
  { match: (pathname) => pathname.startsWith("/gst/settings"), featureKey: "gst.gst_settings" },
  { match: (pathname) => pathname.startsWith("/gst/gstr1"), featureKey: "gst.gstr_1" },
  { match: (pathname) => pathname.startsWith("/gst/gstr3b"), featureKey: "gst.gstr_3b" },
  { match: (pathname) => pathname.startsWith("/gst/hsn"), featureKey: "gst.hsn_summary" },
  { match: (pathname) => pathname.startsWith("/gst/einvoice"), featureKey: "gst.e_invoice" },
  { match: (pathname) => pathname.startsWith("/gst/eway"), featureKey: "gst.e_way_bill" },
  { match: (pathname) => pathname === "/pos", featureKey: "pos.new_sale" },
  { match: (pathname) => pathname.startsWith("/pos/sessions"), featureKey: "pos.sessions" },
  { match: (pathname) => pathname.startsWith("/pos/orders"), featureKey: "pos.orders" },
  { match: (pathname) => pathname.startsWith("/automation/workflows"), featureKey: "automation.workflows" },
  { match: (pathname) => pathname.startsWith("/automation/reminders"), featureKey: "automation.reminders" },
  { match: (pathname) => pathname.startsWith("/reports"), featureKey: null },
  { match: (pathname) => pathname.startsWith("/settings"), featureKey: null },
];

export function getFeatureKeyForPath(pathname: string) {
  return PATH_FEATURE_MAP.find((entry) => entry.match(pathname))?.featureKey ?? null;
}

export function hasFeatureAccess(accessContext: AccessContext | null | undefined, pathname: string) {
  if (!accessContext) return false;
  if (accessContext.is_super_admin) return true;

  const featureKey = getFeatureKeyForPath(pathname);
  if (!featureKey) return true;

  return accessContext.effective_features.includes(featureKey);
}
