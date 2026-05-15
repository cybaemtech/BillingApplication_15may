import { api } from "./api-client";
import { FIXED_PAGE_SIZE, type PaginatedResponse } from "./pagination";

const getPaginatedPath = (path: string, page: number, limit = FIXED_PAGE_SIZE) =>
  `${path}?page=${page}&limit=${limit}`;

// ===== CUSTOMERS =====
export const customersApi = {
  list: () => api.get<any[]>("/customers"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/customers", page)),
  get: (id: string) => api.get<any>(`/customers/${id}`),
  create: (customer: any) => api.post<any>("/customers", customer),
  update: (id: string, updates: any) => api.put<any>(`/customers/${id}`, updates),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getLedger: (id: string) => api.get<any>(`/customers/${id}/ledger`),
};

// ===== VENDORS =====
export const vendorsApi = {
  list: () => api.get<any[]>("/vendors"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/vendors", page)),
  get: (id: string) => api.get<any>(`/vendors/${id}`),
  create: (vendor: any) => api.post<any>("/vendors", vendor),
  update: (id: string, updates: any) => api.put<any>(`/vendors/${id}`, updates),
  delete: (id: string) => api.delete(`/vendors/${id}`),
  getLedger: (id: string) => api.get<any>(`/vendors/${id}/ledger`),
};

// ===== ITEMS =====
export const itemsApi = {
  list: () => api.get<any[]>("/items"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/items", page)),
  get: (id: string) => api.get<any>(`/items/${id}`),
  create: (item: any) => api.post<any>("/items", item),
  update: (id: string, updates: any) => api.put<any>(`/items/${id}`, updates),
  delete: (id: string) => api.delete(`/items/${id}`),
  getStock: (id: string) => api.get<any[]>(`/items/${id}/stock`),
};

// ===== INVOICES =====
export const invoicesApi = {
  list: () => api.get<any[]>("/invoices"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/invoices", page)),
  get: (id: string) => api.get<any>(`/invoices/${id}`),
  create: (invoice: any, items: any[]) => api.post<any>("/invoices", { ...invoice, items }),
  update: (id: string, updates: any) => api.put<any>(`/invoices/${id}`, updates),
  updateWithItems: (id: string, invoice: any, items: any[]) => api.put<any>(`/invoices/${id}`, { ...invoice, items }),
  updateStatus: (id: string, status: string) => api.patch<any>(`/invoices/${id}/status`, { status }),
  clone: async (id: string) => {
    const original = await invoicesApi.get(id);
    if (!original) throw new Error("Invoice not found");
    const items = (original.items || original.invoice_items || []).map((i: any) => ({
      item_id: i.item_id || i.itemId, description: i.description, quantity: i.quantity,
      rate: i.rate, tax_amount: i.tax_amount || i.taxAmount, amount: i.amount,
    }));
    return invoicesApi.create({
      customer_id: original.customer_id || original.customerId,
      date: new Date().toISOString().split("T")[0],
      status: "draft", subtotal: original.subtotal, tax_amount: original.tax_amount || original.taxAmount,
      total: original.total, notes: original.notes, terms: original.terms,
    }, items);
  },
  delete: (id: string) => api.delete(`/invoices/${id}`),
};

// ===== QUOTATIONS =====
export const quotationsApi = {
  list: () => api.get<any[]>("/quotations"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/quotations", page)),
  get: (id: string) => api.get<any>(`/quotations/${id}`),
  create: (quotation: any, items: any[]) => api.post<any>("/quotations", { ...quotation, items }),
  update: (id: string, updates: any) => api.put<any>(`/quotations/${id}`, updates),
  updateWithItems: (id: string, quotation: any, items: any[]) => api.put<any>(`/quotations/${id}`, { ...quotation, items }),
  updateStatus: (id: string, status: string) => api.patch<any>(`/quotations/${id}/status`, { status }),
  clone: async (id: string) => {
    const original = await quotationsApi.get(id);
    if (!original) throw new Error("Quotation not found");
    const items = (original.items || original.quotation_items || []).map((i: any) => ({
      item_id: i.item_id || i.itemId, description: i.description, quantity: i.quantity,
      rate: i.rate, tax_amount: i.tax_amount || i.taxAmount, amount: i.amount,
    }));
    return quotationsApi.create({
      customer_id: original.customer_id || original.customerId,
      subtotal: original.subtotal, tax_amount: original.tax_amount || original.taxAmount,
      total: original.total, notes: original.notes, terms: original.terms,
    }, items);
  },
  convertToSalesOrder: async (id: string) => {
    const quote = await quotationsApi.get(id);
    if (!quote) throw new Error("Quotation not found");
    if (quote.status === "converted") throw new Error("Already converted");
    const items = (quote.items || quote.quotation_items || []).map((qi: any) => ({
      item_id: qi.item_id || qi.itemId, description: qi.description, quantity: qi.quantity,
      rate: qi.rate, tax_amount: qi.tax_amount || qi.taxAmount, amount: qi.amount,
    }));
    const so = await salesOrdersApi.create({
      customer_id: quote.customer_id || quote.customerId, date: new Date().toISOString().split("T")[0],
      expected_delivery: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      subtotal: quote.subtotal, tax_amount: quote.tax_amount || quote.taxAmount, total: quote.total,
      reference_id: quote.id, reference_type: "quotation", quotation_id: quote.id,
    }, items);
    await quotationsApi.updateStatus(id, "converted");
    return so;
  },
  convertToInvoice: async (id: string) => {
    const quote = await quotationsApi.get(id);
    if (!quote) throw new Error("Quotation not found");
    if (quote.status === "converted") throw new Error("Already converted");
    const items = (quote.items || quote.quotation_items || []).map((qi: any) => ({
      item_id: qi.item_id || qi.itemId, description: qi.description, quantity: qi.quantity,
      rate: qi.rate, tax_amount: qi.tax_amount || qi.taxAmount, amount: qi.amount,
    }));
    const inv = await invoicesApi.create({
      customer_id: quote.customer_id || quote.customerId, date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "sent", subtotal: quote.subtotal, tax_amount: quote.tax_amount || quote.taxAmount,
      total: quote.total, reference_id: quote.id, reference_type: "quotation",
    }, items);
    await quotationsApi.updateStatus(id, "converted");
    return inv;
  },
  delete: (id: string) => api.delete(`/quotations/${id}`),
};

// ===== SALES ORDERS =====
export const salesOrdersApi = {
  list: () => api.get<any[]>("/sales-orders"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/sales-orders", page)),
  get: (id: string) => api.get<any>(`/sales-orders/${id}`),
  create: (order: any, items: any[]) => api.post<any>("/sales-orders", { ...order, items }),
  update: (id: string, updates: any) => api.put<any>(`/sales-orders/${id}`, updates),
  updateWithItems: (id: string, order: any, items: any[]) => api.put<any>(`/sales-orders/${id}`, { ...order, items }),
  updateStatus: (id: string, status: string) => api.patch<any>(`/sales-orders/${id}/status`, { status }),
  clone: async (id: string) => {
    const original = await salesOrdersApi.get(id);
    if (!original) throw new Error("Sales order not found");
    const items = (original.items || original.sales_order_items || []).map((i: any) => ({
      item_id: i.item_id || i.itemId, description: i.description, quantity: i.quantity,
      rate: i.rate, tax_amount: i.tax_amount || i.taxAmount, amount: i.amount,
    }));
    return salesOrdersApi.create({
      customer_id: original.customer_id || original.customerId, subtotal: original.subtotal,
      tax_amount: original.tax_amount || original.taxAmount, total: original.total, notes: original.notes,
    }, items);
  },
  convertToInvoice: async (id: string) => {
    const so = await salesOrdersApi.get(id);
    if (!so) throw new Error("Sales order not found");
    if (so.status === "converted") throw new Error("Already converted");
    const items = (so.items || so.sales_order_items || []).map((si: any) => ({
      item_id: si.item_id || si.itemId, description: si.description, quantity: si.quantity,
      rate: si.rate, tax_amount: si.tax_amount || si.taxAmount, amount: si.amount,
    }));
    const inv = await invoicesApi.create({
      customer_id: so.customer_id || so.customerId, date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "sent", subtotal: so.subtotal, tax_amount: so.tax_amount || so.taxAmount,
      total: so.total, reference_id: so.id, reference_type: "sales_order", sales_order_id: so.id,
    }, items);
    await salesOrdersApi.updateStatus(id, "converted");
    return inv;
  },
  convertToDeliveryChallan: async (id: string) => {
    const so = await salesOrdersApi.get(id);
    if (!so) throw new Error("Sales order not found");
    const items = (so.items || so.sales_order_items || []).map((si: any) => ({
      item_id: si.item_id || si.itemId, description: si.description, quantity: si.quantity,
    }));
    return deliveryChallansApi.create({
      customer_id: so.customer_id || so.customerId, date: new Date().toISOString().split("T")[0],
      sales_order_id: so.id, reference_id: so.id, reference_type: "sales_order",
    }, items);
  },
  delete: (id: string) => api.delete(`/sales-orders/${id}`),
};

// ===== PURCHASE ORDERS =====
export const purchaseOrdersApi = {
  list: () => api.get<any[]>("/purchase-orders"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/purchase-orders", page)),
  get: (id: string) => api.get<any>(`/purchase-orders/${id}`),
  create: (po: any, items: any[]) => api.post<any>("/purchase-orders", { ...po, items }),
  update: (id: string, updates: any) => api.put<any>(`/purchase-orders/${id}`, updates),
  updateWithItems: (id: string, po: any, items: any[]) => api.put<any>(`/purchase-orders/${id}`, { ...po, items }),
  updateStatus: (id: string, status: string) => api.patch<any>(`/purchase-orders/${id}/status`, { status }),
  clone: async (id: string) => {
    const original = await purchaseOrdersApi.get(id);
    if (!original) throw new Error("PO not found");
    const items = (original.items || original.purchase_order_items || []).map((i: any) => ({
      item_id: i.item_id || i.itemId, description: i.description, quantity: i.quantity,
      rate: i.rate, tax_amount: i.tax_amount || i.taxAmount, amount: i.amount,
    }));
    return purchaseOrdersApi.create({
      vendor_id: original.vendor_id || original.vendorId, subtotal: original.subtotal,
      tax_amount: original.tax_amount || original.taxAmount, total: original.total, notes: original.notes,
    }, items);
  },
  convertToBill: async (id: string) => {
    const po = await purchaseOrdersApi.get(id);
    if (!po) throw new Error("Purchase order not found");
    if (po.status === "converted") throw new Error("Already converted");
    const items = (po.items || po.purchase_order_items || []).map((pi: any) => ({
      item_id: pi.item_id || pi.itemId, description: pi.description, quantity: pi.quantity,
      rate: pi.rate, tax_amount: pi.tax_amount || pi.taxAmount, amount: pi.amount,
    }));
    const bill = await billsApi.create({
      vendor_id: po.vendor_id || po.vendorId, date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      subtotal: po.subtotal, tax_amount: po.tax_amount || po.taxAmount, total: po.total,
      purchase_order_id: po.id, reference_id: po.id, reference_type: "purchase_order",
    }, items);
    await purchaseOrdersApi.updateStatus(id, "converted");
    return bill;
  },
  delete: (id: string) => api.delete(`/purchase-orders/${id}`),
};

// ===== BILLS =====
export const billsApi = {
  list: () => api.get<any[]>("/bills"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/bills", page)),
  get: (id: string) => api.get<any>(`/bills/${id}`),
  create: (bill: any, items: any[]) => api.post<any>("/bills", { ...bill, items }),
  update: (id: string, updates: any) => api.put<any>(`/bills/${id}`, updates),
  updateWithItems: (id: string, bill: any, items: any[]) => api.put<any>(`/bills/${id}`, { ...bill, items }),
  updateStatus: (id: string, status: string) => api.patch<any>(`/bills/${id}/status`, { status }),
  clone: async (id: string) => {
    const original = await billsApi.get(id);
    if (!original) throw new Error("Bill not found");
    const items = (original.items || original.bill_items || []).map((i: any) => ({
      item_id: i.item_id || i.itemId, description: i.description, quantity: i.quantity,
      rate: i.rate, tax_amount: i.tax_amount || i.taxAmount, amount: i.amount,
    }));
    return billsApi.create({
      vendor_id: original.vendor_id || original.vendorId, subtotal: original.subtotal,
      tax_amount: original.tax_amount || original.taxAmount, total: original.total, notes: original.notes,
    }, items);
  },
  delete: (id: string) => api.delete(`/bills/${id}`),
};

// ===== PAYMENTS RECEIVED =====
export const paymentsReceivedApi = {
  list: () => api.get<any[]>("/payments-received"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/payments-received", page)),
  get: (id: string) => api.get<any>(`/payments-received/${id}`),
  create: (payment: any) => api.post<any>("/payments-received", payment),
  delete: (id: string) => api.delete(`/payments-received/${id}`),
};

// ===== PAYMENTS MADE =====
export const paymentsMadeApi = {
  list: () => api.get<any[]>("/payments-made"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/payments-made", page)),
  get: (id: string) => api.get<any>(`/payments-made/${id}`),
  create: (payment: any) => api.post<any>("/payments-made", payment),
  delete: (id: string) => api.delete(`/payments-made/${id}`),
};

// ===== EXPENSES =====
export const expensesApi = {
  list: () => api.get<any[]>("/expenses"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/expenses", page)),
  get: (id: string) => api.get<any>(`/expenses/${id}`),
  create: (expense: any) => api.post<any>("/expenses", expense),
  update: (id: string, updates: any) => api.put<any>(`/expenses/${id}`, updates),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// ===== CREDIT NOTES =====
export const creditNotesApi = {
  list: () => api.get<any[]>("/credit-notes"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/credit-notes", page)),
  get: (id: string) => api.get<any>(`/credit-notes/${id}`),
  create: (cn: any, items: any[]) => api.post<any>("/credit-notes", { ...cn, items }),
  update: (id: string, payload: any) => api.put<any>(`/credit-notes/${id}`, payload),
  delete: (id: string) => api.delete(`/credit-notes/${id}`),
};

// ===== VENDOR CREDITS =====
export const vendorCreditsApi = {
  list: () => api.get<any[]>("/vendor-credits"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/vendor-credits", page)),
  get: (id: string) => api.get<any>(`/vendor-credits/${id}`),
  create: (vc: any, items: any[]) => api.post<any>("/vendor-credits", { ...vc, items }),
  update: (id: string, payload: any) => api.put<any>(`/vendor-credits/${id}`, payload),
  delete: (id: string) => api.delete(`/vendor-credits/${id}`),
};

// ===== DELIVERY CHALLANS =====
export const deliveryChallansApi = {
  list: () => api.get<any[]>("/delivery-challans"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/delivery-challans", page)),
  get: (id: string) => api.get<any>(`/delivery-challans/${id}`),
  create: (dc: any, items: any[]) => api.post<any>("/delivery-challans", { ...dc, items }),
  update: (id: string, updates: any) => api.put<any>(`/delivery-challans/${id}`, updates),
  updateStatus: (id: string, status: string) => api.patch<any>(`/delivery-challans/${id}/status`, { status }),
  convertToInvoice: async (id: string) => {
    const challan = await deliveryChallansApi.get(id);
    if (!challan) throw new Error("Delivery challan not found");

    const baseDate = challan.date ? new Date(challan.date) : new Date();
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const items = (challan.items || []).map((item: any) => ({
      item_id: item.item_id,
      description: item.description || item.item_name,
      quantity: Number(item.quantity || 0),
      rate: Number(item.rate || 0),
      tax_rate_id: item.tax_rate_id || null,
      tax_amount: Number(item.tax_amount || 0),
      amount: Number(item.amount || 0),
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const tax_amount = items.reduce((sum: number, item: any) => sum + Number(item.tax_amount || 0), 0);
    const total = subtotal + tax_amount;

    return invoicesApi.create({
      customer_id: challan.customer_id,
      date: baseDate.toISOString().split("T")[0],
      due_date: dueDate.toISOString().split("T")[0],
      status: "sent",
      subtotal,
      tax_amount,
      total,
      balance_due: total,
      notes: challan.notes,
      reference_id: challan.id,
      reference_type: "delivery_challan",
    }, items);
  },
  delete: (id: string) => api.delete(`/delivery-challans/${id}`),
};

// ===== ACCOUNTS =====
export const accountsApi = {
  list: () => api.get<any[]>("/accounts"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/accounts", page)),
  get: (id: string) => api.get<any>(`/accounts/${id}`),
  create: (account: any) => api.post<any>("/accounts", account),
  update: (id: string, updates: any) => api.put<any>(`/accounts/${id}`, updates),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

// ===== TAX RATES =====
export const taxRatesApi = {
  list: () => api.get<any[]>("/tax-rates"),
  create: (tax: any) => api.post<any>("/tax-rates", tax),
  update: (id: string, updates: any) => api.put<any>(`/tax-rates/${id}`, updates),
  delete: (id: string) => api.delete(`/tax-rates/${id}`),
};

// ===== STOCK MOVEMENTS =====
export const stockMovementsApi = {
  list: () => api.get<any[]>("/stock-movements"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/stock-movements", page)),
  get: (id: string) => api.get<any>(`/stock-movements/${id}`),
};

// ===== JOURNAL ENTRIES =====
export const journalEntriesApi = {
  list: () => api.get<any[]>("/journal-entries"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/journal-entries", page)),
  get: (id: string) => api.get<any>(`/journal-entries/${id}`),
  create: (entry: any, lines: any[]) => api.post<any>("/journal-entries", { ...entry, lines }),
  delete: (id: string) => api.delete(`/journal-entries/${id}`),
};

// ===== GST SETTINGS =====
export const gstSettingsApi = {
  get: () => api.get<any>("/gst-settings"),
  upsert: (settings: any) => api.post<any>("/gst-settings", settings),
};

// ===== DOCUMENT SEQUENCES =====
export const documentSequencesApi = {
  list: () => api.get<any[]>("/document-sequences"),
  update: (id: string, updates: any) => api.put<any>(`/document-sequences/${id}`, updates),
};

// ===== PROFILES =====
export const profilesApi = {
  getCurrent: () => api.get<any>("/profile"),
  update: (updates: any) => api.put<any>("/profile", updates),
};

// ===== USER ROLES =====
export const userRolesApi = {
  list: () => api.get<any[]>("/user-roles"),
  update: (id: string, role: string) => api.put<any>(`/user-roles/${id}`, { role }),
};

export const adminUsersApi = {
  create: (payload: any) => api.post<any>("/users", payload),
  createCompanyWithAdmin: (payload: any) => api.post<any>("/super-admin/companies", payload),
  update: (id: string, payload: any) => api.put<any>(`/users/${id}`, payload),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const featureAccessApi = {
  catalog: () => api.get<any>("/feature-catalog"),
  planFeatures: () => api.get<any>("/plan-features"),
  updatePlanFeatures: (planId: string, featureKeys: string[]) => api.put<any>(`/plans/${planId}/features`, { featureKeys }),
  rolePermissions: () => api.get<any>("/role-permissions"),
  updateRolePermissions: (role: string, featureKeys: string[]) => api.put<any>(`/role-permissions/${role}`, { featureKeys }),
};

export const rolesApi = {
  list: () => api.get<any[]>("/roles"),
  create: (payload: { name: string; label?: string }) => api.post<any>("/roles", payload),
  update: (id: string, payload: { label?: string; is_active?: boolean }) => api.put<any>(`/roles/${id}`, payload),
};

export const accessApi = {
  context: () => api.get<any>("/access-context"),
};

export const subscriptionApi = {
  current: () => api.get<any>("/subscription/current"),
  plans: () => api.get<any>("/subscription/plans"),
  overview: () => api.get<any>("/subscription/overview"),
  organizations: () => api.get<any>("/subscription/organizations"),
  updateOrganization: (id: string, payload: any) => api.put<any>(`/subscription/organizations/${id}`, payload),
  deleteOrganization: (id: string) => api.delete(`/subscription/organizations/${id}`),
  updatePlan: (id: string, payload: any) => api.put<any>(`/subscription/plans/${id}`, payload),
  updateOrganizationStatus: (id: string, status: string) => api.put<any>(`/subscription/organizations/${id}/status`, { status }),
  assignOrganizationPlan: (id: string, planName: string) => api.put<any>(`/subscription/organizations/${id}/plan`, { planName }),
  createRazorpayOrder: (planName: string) => api.post<any>("/billing/razorpay/order", { planName }),
  confirmUpgrade: (planName: string) => api.post<any>("/billing/upgrade/confirm", { planName }),
};

// ===== COMPANY =====
export const companyApi = {
  get: () => api.get<any>("/company"),
  upsert: (company: any) => api.post<any>("/company", company),
};

// ===== INVOICE SETTINGS =====
export const invoiceSettingsApi = {
  get: () => api.get<any>("/invoice-settings"),
  upsert: (settings: any) => api.post<any>("/invoice-settings", settings),
};

// ===== ACTIVITY LOGS =====
export const activityLogsApi = {
  list: (module?: string, recordId?: string) => api.get<any[]>("/activity-logs"),
  log: (module: string, recordId: string, action: string, details?: string) =>
    api.post("/activity-logs", { module, record_id: recordId, action, details }).catch(() => { }),
};

// ===== DASHBOARD =====
export const dashboardApi = {
  getStats: () => api.get<any>("/dashboard/stats"),
  getRecentInvoices: (page = 1) => api.get<any>(`/dashboard/recent-invoices?page=${page}&limit=10`),
  getLowStockItems: (page = 1) => api.get<any>(`/dashboard/low-stock?page=${page}&limit=5`),
};

// ===== ITEM CATEGORIES =====
export const itemCategoriesApi = {
  list: () => api.get<any[]>("/item-categories"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/item-categories", page)),
  get: (id: string) => api.get<any>(`/item-categories/${id}`),
  create: (cat: any) => api.post<any>("/item-categories", cat),
  update: (id: string, updates: any) => api.put<any>(`/item-categories/${id}`, updates),
  delete: (id: string) => api.delete(`/item-categories/${id}`),
};

// ===== PRICE LISTS =====
export const priceListsApi = {
  list: () => api.get<any[]>("/price-lists"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/price-lists", page)),
  get: (id: string) => api.get<any>(`/price-lists/${id}`),
  create: (pl: any, items: any[]) => api.post<any>("/price-lists", { ...pl, items }),
  delete: (id: string) => api.delete(`/price-lists/${id}`),
};

// ===== WAREHOUSES =====
export const warehousesApi = {
  list: () => api.get<any[]>("/warehouses"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/warehouses", page)),
  get: (id: string) => api.get<any>(`/warehouses/${id}`),
  create: (w: any) => api.post<any>("/warehouses", w),
  update: (id: string, updates: any) => api.put<any>(`/warehouses/${id}`, updates),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
};

// ===== INVENTORY ADJUSTMENTS =====
export const inventoryAdjustmentsApi = {
  list: () => api.get<any[]>("/inventory-adjustments"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/inventory-adjustments", page)),
  get: (id: string) => api.get<any>(`/inventory-adjustments/${id}`),
  create: (adj: any, items: any[]) => api.post<any>("/inventory-adjustments", { ...adj, items }),
};

// ===== STOCK TRANSFERS =====
export const stockTransfersApi = {
  list: () => api.get<any[]>("/stock-transfers"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/stock-transfers", page)),
  get: (id: string) => api.get<any>(`/stock-transfers/${id}`),
  create: (transfer: any, items: any[]) => api.post<any>("/stock-transfers", { ...transfer, items }),
};

// ===== RECURRING INVOICES =====
export const recurringInvoicesApi = {
  list: () => api.get<any[]>("/recurring-invoices"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/recurring-invoices", page)),
  get: (id: string) => api.get<any>(`/recurring-invoices/${id}`),
  create: (ri: any) => api.post<any>("/recurring-invoices", ri),
  delete: (id: string) => api.delete(`/recurring-invoices/${id}`),
};

// ===== RECURRING BILLS =====
export const recurringBillsApi = {
  list: () => api.get<any[]>("/recurring-bills"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/recurring-bills", page)),
  get: (id: string) => api.get<any>(`/recurring-bills/${id}`),
  create: (rb: any) => api.post<any>("/recurring-bills", rb),
  delete: (id: string) => api.delete(`/recurring-bills/${id}`),
};

// ===== SALES RETURNS =====
export const salesReturnsApi = {
  list: () => api.get<any[]>("/sales-returns"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/sales-returns", page)),
  get: (id: string) => api.get<any>(`/sales-returns/${id}`),
  create: (sr: any) => api.post<any>("/sales-returns", sr),
  update: (id: string, payload: any) => api.put<any>(`/sales-returns/${id}`, payload),
  delete: (id: string) => api.delete(`/sales-returns/${id}`),
};

// ===== PURCHASE RETURNS =====
export const purchaseReturnsApi = {
  list: () => api.get<any[]>("/purchase-returns"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/purchase-returns", page)),
  get: (id: string) => api.get<any>(`/purchase-returns/${id}`),
  create: (pr: any) => api.post<any>("/purchase-returns", pr),
  delete: (id: string) => api.delete(`/purchase-returns/${id}`),
};

// ===== GST RETURNS =====
export const gstReturnsApi = {
  list: () => api.get<any[]>("/gst-returns"),
};

// ===== WORKFLOWS =====
export const workflowsApi = {
  list: () => api.get<any[]>("/workflows"),
  create: (w: any) => api.post<any>("/workflows", w),
  update: (id: string, updates: any) => api.put<any>(`/workflows/${id}`, updates),
  delete: (id: string) => api.delete(`/workflows/${id}`),
};

// ===== BANK ACCOUNTS =====
export const bankAccountsApi = {
  list: () => api.get<any[]>("/bank-accounts"),
  create: (ba: any) => api.post<any>("/bank-accounts", ba),
};

// ===== POS =====
export const posSessionsApi = {
  list: () => api.get<any[]>("/pos/sessions"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/pos/sessions", page)),
  get: (id: string) => api.get<any>(`/pos/sessions/${id}`),
  create: (s: any) => api.post<any>("/pos/sessions", s),
  update: (id: string, updates: any) => api.put<any>(`/pos/sessions/${id}/close`, updates),
};

export const posOrdersApi = {
  list: () => api.get<any[]>("/pos/orders"),
  listPage: (page: number) => api.get<PaginatedResponse<any>>(getPaginatedPath("/pos/orders", page)),
  get: (id: string) => api.get<any>(`/pos/orders/${id}`),
  create: (o: any) => api.post<any>("/pos/orders", o),
};








