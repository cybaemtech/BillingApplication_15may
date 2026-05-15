SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Adding missing tenant_id columns to MSSQL business tables...';
GO

IF COL_LENGTH('dbo.profiles', 'tenant_id') IS NULL
    ALTER TABLE dbo.profiles ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.user_roles', 'tenant_id') IS NULL
    ALTER TABLE dbo.user_roles ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.companies', 'tenant_id') IS NULL
    ALTER TABLE dbo.companies ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.accounts', 'tenant_id') IS NULL
    ALTER TABLE dbo.accounts ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.vendors', 'tenant_id') IS NULL
    ALTER TABLE dbo.vendors ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.customers', 'tenant_id') IS NULL
    ALTER TABLE dbo.customers ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.items', 'tenant_id') IS NULL
    ALTER TABLE dbo.items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.quotations', 'tenant_id') IS NULL
    ALTER TABLE dbo.quotations ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.quotation_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.quotation_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.sales_orders', 'tenant_id') IS NULL
    ALTER TABLE dbo.sales_orders ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.sales_order_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.sales_order_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.delivery_challans', 'tenant_id') IS NULL
    ALTER TABLE dbo.delivery_challans ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.delivery_challan_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.delivery_challan_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.invoices', 'tenant_id') IS NULL
    ALTER TABLE dbo.invoices ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.invoice_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.invoice_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.recurring_invoices', 'tenant_id') IS NULL
    ALTER TABLE dbo.recurring_invoices ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.payments_received', 'tenant_id') IS NULL
    ALTER TABLE dbo.payments_received ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.credit_notes', 'tenant_id') IS NULL
    ALTER TABLE dbo.credit_notes ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.credit_note_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.credit_note_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.sales_returns', 'tenant_id') IS NULL
    ALTER TABLE dbo.sales_returns ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.sales_return_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.sales_return_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.purchase_orders', 'tenant_id') IS NULL
    ALTER TABLE dbo.purchase_orders ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.purchase_order_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.purchase_order_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.bills', 'tenant_id') IS NULL
    ALTER TABLE dbo.bills ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.bill_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.bill_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.recurring_bills', 'tenant_id') IS NULL
    ALTER TABLE dbo.recurring_bills ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.payments_made', 'tenant_id') IS NULL
    ALTER TABLE dbo.payments_made ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.vendor_credits', 'tenant_id') IS NULL
    ALTER TABLE dbo.vendor_credits ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.vendor_credit_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.vendor_credit_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.purchase_returns', 'tenant_id') IS NULL
    ALTER TABLE dbo.purchase_returns ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.purchase_return_items', 'tenant_id') IS NULL
    ALTER TABLE dbo.purchase_return_items ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.warehouses', 'tenant_id') IS NULL
    ALTER TABLE dbo.warehouses ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.item_categories', 'tenant_id') IS NULL
    ALTER TABLE dbo.item_categories ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.price_lists', 'tenant_id') IS NULL
    ALTER TABLE dbo.price_lists ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.inventory_adjustments', 'tenant_id') IS NULL
    ALTER TABLE dbo.inventory_adjustments ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.stock_transfers', 'tenant_id') IS NULL
    ALTER TABLE dbo.stock_transfers ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.warehouse_stock', 'tenant_id') IS NULL
    ALTER TABLE dbo.warehouse_stock ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.stock_movements', 'tenant_id') IS NULL
    ALTER TABLE dbo.stock_movements ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.expenses', 'tenant_id') IS NULL
    ALTER TABLE dbo.expenses ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.journal_entries', 'tenant_id') IS NULL
    ALTER TABLE dbo.journal_entries ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.bank_accounts', 'tenant_id') IS NULL
    ALTER TABLE dbo.bank_accounts ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.gst_settings', 'tenant_id') IS NULL
    ALTER TABLE dbo.gst_settings ADD tenant_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.invoice_settings', 'tenant_id') IS NULL
    ALTER TABLE dbo.invoice_settings ADD tenant_id UNIQUEIDENTIFIER NULL;
GO

UPDATE c
SET c.tenant_id = c.id
FROM dbo.companies c
WHERE c.tenant_id IS NULL;
GO

UPDATE p
SET p.tenant_id = COALESCE(ur.tenant_id, c.id)
FROM dbo.profiles p
LEFT JOIN dbo.user_roles ur ON ur.user_id = p.user_id
LEFT JOIN dbo.companies c ON c.created_by = p.user_id
WHERE p.tenant_id IS NULL
  AND COALESCE(ur.tenant_id, c.id) IS NOT NULL;
GO

UPDATE ur
SET ur.tenant_id = COALESCE(p.tenant_id, c.id)
FROM dbo.user_roles ur
LEFT JOIN dbo.profiles p ON p.user_id = ur.user_id
LEFT JOIN dbo.companies c ON c.created_by = ur.user_id
WHERE ur.tenant_id IS NULL
  AND COALESCE(p.tenant_id, c.id) IS NOT NULL;
GO

UPDATE a
SET a.tenant_id = c.id
FROM dbo.accounts a
CROSS JOIN (
  SELECT TOP 1 id
  FROM dbo.companies
  ORDER BY created_at ASC
) c
WHERE a.tenant_id IS NULL;
GO

UPDATE je
SET je.tenant_id = c.id
FROM dbo.journal_entries je
CROSS JOIN (
  SELECT TOP 1 id
  FROM dbo.companies
  ORDER BY created_at ASC
) c
WHERE je.tenant_id IS NULL;
GO

UPDATE q
SET q.tenant_id = c.tenant_id
FROM dbo.quotations q
INNER JOIN dbo.customers c ON c.id = q.customer_id
WHERE q.tenant_id IS NULL
  AND c.tenant_id IS NOT NULL;
GO

UPDATE so
SET so.tenant_id = COALESCE(c.tenant_id, q.tenant_id)
FROM dbo.sales_orders so
LEFT JOIN dbo.customers c ON c.id = so.customer_id
LEFT JOIN dbo.quotations q ON q.id = so.quotation_id
WHERE so.tenant_id IS NULL
  AND COALESCE(c.tenant_id, q.tenant_id) IS NOT NULL;
GO

UPDATE dc
SET dc.tenant_id = COALESCE(c.tenant_id, so.tenant_id)
FROM dbo.delivery_challans dc
LEFT JOIN dbo.customers c ON c.id = dc.customer_id
LEFT JOIN dbo.sales_orders so ON so.id = dc.sales_order_id
WHERE dc.tenant_id IS NULL
  AND COALESCE(c.tenant_id, so.tenant_id) IS NOT NULL;
GO

UPDATE i
SET i.tenant_id = COALESCE(c.tenant_id, so.tenant_id)
FROM dbo.invoices i
LEFT JOIN dbo.customers c ON c.id = i.customer_id
LEFT JOIN dbo.sales_orders so ON so.id = i.sales_order_id
WHERE i.tenant_id IS NULL
  AND COALESCE(c.tenant_id, so.tenant_id) IS NOT NULL;
GO

UPDATE cn
SET cn.tenant_id = COALESCE(c.tenant_id, i.tenant_id)
FROM dbo.credit_notes cn
LEFT JOIN dbo.customers c ON c.id = cn.customer_id
LEFT JOIN dbo.invoices i ON i.id = cn.invoice_id
WHERE cn.tenant_id IS NULL
  AND COALESCE(c.tenant_id, i.tenant_id) IS NOT NULL;
GO

UPDATE ri
SET ri.tenant_id = COALESCE(c.tenant_id, i.tenant_id)
FROM dbo.recurring_invoices ri
LEFT JOIN dbo.customers c ON c.id = ri.customer_id
LEFT JOIN dbo.invoices i ON i.id = ri.base_invoice_id
WHERE ri.tenant_id IS NULL
  AND COALESCE(c.tenant_id, i.tenant_id) IS NOT NULL;
GO

UPDATE pr
SET pr.tenant_id = COALESCE(c.tenant_id, i.tenant_id)
FROM dbo.payments_received pr
LEFT JOIN dbo.customers c ON c.id = pr.customer_id
LEFT JOIN dbo.invoices i ON i.id = pr.invoice_id
WHERE pr.tenant_id IS NULL
  AND COALESCE(c.tenant_id, i.tenant_id) IS NOT NULL;
GO

UPDATE po
SET po.tenant_id = v.tenant_id
FROM dbo.purchase_orders po
INNER JOIN dbo.vendors v ON v.id = po.vendor_id
WHERE po.tenant_id IS NULL
  AND v.tenant_id IS NOT NULL;
GO

UPDATE b
SET b.tenant_id = COALESCE(v.tenant_id, po.tenant_id)
FROM dbo.bills b
LEFT JOIN dbo.vendors v ON v.id = b.vendor_id
LEFT JOIN dbo.purchase_orders po ON po.id = b.purchase_order_id
WHERE b.tenant_id IS NULL
  AND COALESCE(v.tenant_id, po.tenant_id) IS NOT NULL;
GO

UPDATE rb
SET rb.tenant_id = COALESCE(v.tenant_id, b.tenant_id)
FROM dbo.recurring_bills rb
LEFT JOIN dbo.vendors v ON v.id = rb.vendor_id
LEFT JOIN dbo.bills b ON b.id = rb.base_bill_id
WHERE rb.tenant_id IS NULL
  AND COALESCE(v.tenant_id, b.tenant_id) IS NOT NULL;
GO

UPDATE pm
SET pm.tenant_id = COALESCE(v.tenant_id, b.tenant_id)
FROM dbo.payments_made pm
LEFT JOIN dbo.vendors v ON v.id = pm.vendor_id
LEFT JOIN dbo.bills b ON b.id = pm.bill_id
WHERE pm.tenant_id IS NULL
  AND COALESCE(v.tenant_id, b.tenant_id) IS NOT NULL;
GO

UPDATE vc
SET vc.tenant_id = COALESCE(v.tenant_id, b.tenant_id)
FROM dbo.vendor_credits vc
LEFT JOIN dbo.vendors v ON v.id = vc.vendor_id
LEFT JOIN dbo.bills b ON b.id = vc.bill_id
WHERE vc.tenant_id IS NULL
  AND COALESCE(v.tenant_id, b.tenant_id) IS NOT NULL;
GO

UPDATE sr
SET sr.tenant_id = COALESCE(c.tenant_id, i.tenant_id)
FROM dbo.sales_returns sr
LEFT JOIN dbo.customers c ON c.id = sr.customer_id
LEFT JOIN dbo.invoices i ON i.id = sr.invoice_id
WHERE sr.tenant_id IS NULL
  AND COALESCE(c.tenant_id, i.tenant_id) IS NOT NULL;
GO

UPDATE pur
SET pur.tenant_id = COALESCE(v.tenant_id, b.tenant_id)
FROM dbo.purchase_returns pur
LEFT JOIN dbo.vendors v ON v.id = pur.vendor_id
LEFT JOIN dbo.bills b ON b.id = pur.bill_id
WHERE pur.tenant_id IS NULL
  AND COALESCE(v.tenant_id, b.tenant_id) IS NOT NULL;
GO

UPDATE qi
SET qi.tenant_id = q.tenant_id
FROM dbo.quotation_items qi
INNER JOIN dbo.quotations q ON q.id = qi.quotation_id
WHERE qi.tenant_id IS NULL
  AND q.tenant_id IS NOT NULL;
GO

UPDATE soi
SET soi.tenant_id = so.tenant_id
FROM dbo.sales_order_items soi
INNER JOIN dbo.sales_orders so ON so.id = soi.sales_order_id
WHERE soi.tenant_id IS NULL
  AND so.tenant_id IS NOT NULL;
GO

UPDATE dci
SET dci.tenant_id = dc.tenant_id
FROM dbo.delivery_challan_items dci
INNER JOIN dbo.delivery_challans dc ON dc.id = dci.delivery_challan_id
WHERE dci.tenant_id IS NULL
  AND dc.tenant_id IS NOT NULL;
GO

UPDATE ii
SET ii.tenant_id = i.tenant_id
FROM dbo.invoice_items ii
INNER JOIN dbo.invoices i ON i.id = ii.invoice_id
WHERE ii.tenant_id IS NULL
  AND i.tenant_id IS NOT NULL;
GO

UPDATE cni
SET cni.tenant_id = cn.tenant_id
FROM dbo.credit_note_items cni
INNER JOIN dbo.credit_notes cn ON cn.id = cni.credit_note_id
WHERE cni.tenant_id IS NULL
  AND cn.tenant_id IS NOT NULL;
GO

UPDATE poi
SET poi.tenant_id = po.tenant_id
FROM dbo.purchase_order_items poi
INNER JOIN dbo.purchase_orders po ON po.id = poi.purchase_order_id
WHERE poi.tenant_id IS NULL
  AND po.tenant_id IS NOT NULL;
GO

UPDATE bi
SET bi.tenant_id = b.tenant_id
FROM dbo.bill_items bi
INNER JOIN dbo.bills b ON b.id = bi.bill_id
WHERE bi.tenant_id IS NULL
  AND b.tenant_id IS NOT NULL;
GO

UPDATE vci
SET vci.tenant_id = vc.tenant_id
FROM dbo.vendor_credit_items vci
INNER JOIN dbo.vendor_credits vc ON vc.id = vci.vendor_credit_id
WHERE vci.tenant_id IS NULL
  AND vc.tenant_id IS NOT NULL;
GO

UPDATE sri
SET sri.tenant_id = sr.tenant_id
FROM dbo.sales_return_items sri
INNER JOIN dbo.sales_returns sr ON sr.id = sri.sales_return_id
WHERE sri.tenant_id IS NULL
  AND sr.tenant_id IS NOT NULL;
GO

UPDATE pri
SET pri.tenant_id = pr.tenant_id
FROM dbo.purchase_return_items pri
INNER JOIN dbo.purchase_returns pr ON pr.id = pri.purchase_return_id
WHERE pri.tenant_id IS NULL
  AND pr.tenant_id IS NOT NULL;
GO

UPDATE ba
SET ba.tenant_id = a.tenant_id
FROM dbo.bank_accounts ba
INNER JOIN dbo.accounts a ON a.id = ba.account_id
WHERE ba.tenant_id IS NULL
  AND a.tenant_id IS NOT NULL;
GO

UPDATE dbo.gst_settings
SET tenant_id = (SELECT TOP 1 id FROM dbo.companies ORDER BY created_at, id)
WHERE tenant_id IS NULL
  AND EXISTS (SELECT 1 FROM dbo.companies);
GO

UPDATE dbo.invoice_settings
SET tenant_id = (SELECT TOP 1 id FROM dbo.companies ORDER BY created_at, id)
WHERE tenant_id IS NULL
  AND EXISTS (SELECT 1 FROM dbo.companies);
GO

IF EXISTS (SELECT 1 FROM dbo.companies)
   AND (SELECT COUNT(*) FROM dbo.companies) = 1
BEGIN
    DECLARE @default_tenant_id UNIQUEIDENTIFIER;
    SELECT TOP 1 @default_tenant_id = id FROM dbo.companies ORDER BY created_at, id;

    UPDATE dbo.companies SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.profiles SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.user_roles SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.customers SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.vendors SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.quotations SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.quotation_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.sales_orders SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.sales_order_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.delivery_challans SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.delivery_challan_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.invoices SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.invoice_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.recurring_invoices SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.payments_received SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.credit_notes SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.credit_note_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.sales_returns SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.sales_return_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.purchase_orders SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.purchase_order_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.bills SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.bill_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.recurring_bills SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.payments_made SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.vendor_credits SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.vendor_credit_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.purchase_returns SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.purchase_return_items SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.warehouses SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.item_categories SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.price_lists SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.inventory_adjustments SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.stock_transfers SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.warehouse_stock SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.stock_movements SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.expenses SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.bank_accounts SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.gst_settings SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
    UPDATE dbo.invoice_settings SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
END
GO

UPDATE w
SET w.tenant_id = b.company_id
FROM dbo.warehouses w
INNER JOIN dbo.branches b ON b.id = w.branch_id
WHERE w.tenant_id IS NULL;
GO

UPDATE ws
SET ws.tenant_id = w.tenant_id
FROM dbo.warehouse_stock ws
INNER JOIN dbo.warehouses w ON w.id = ws.warehouse_id
WHERE ws.tenant_id IS NULL
  AND w.tenant_id IS NOT NULL;
GO

UPDATE ia
SET ia.tenant_id = w.tenant_id
FROM dbo.inventory_adjustments ia
INNER JOIN dbo.warehouses w ON w.id = ia.warehouse_id
WHERE ia.tenant_id IS NULL
  AND w.tenant_id IS NOT NULL;
GO

UPDATE st
SET st.tenant_id = COALESCE(wf.tenant_id, wt.tenant_id)
FROM dbo.stock_transfers st
LEFT JOIN dbo.warehouses wf ON wf.id = st.from_warehouse_id
LEFT JOIN dbo.warehouses wt ON wt.id = st.to_warehouse_id
WHERE st.tenant_id IS NULL
  AND COALESCE(wf.tenant_id, wt.tenant_id) IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_vendors_tenant_id' AND object_id = OBJECT_ID('dbo.vendors'))
    CREATE INDEX IX_vendors_tenant_id ON dbo.vendors (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_profiles_tenant_id' AND object_id = OBJECT_ID('dbo.profiles'))
    CREATE INDEX IX_profiles_tenant_id ON dbo.profiles (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_user_roles_tenant_id' AND object_id = OBJECT_ID('dbo.user_roles'))
    CREATE INDEX IX_user_roles_tenant_id ON dbo.user_roles (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_companies_tenant_id' AND object_id = OBJECT_ID('dbo.companies'))
    CREATE INDEX IX_companies_tenant_id ON dbo.companies (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customers_tenant_id' AND object_id = OBJECT_ID('dbo.customers'))
    CREATE INDEX IX_customers_tenant_id ON dbo.customers (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_items_tenant_id' AND object_id = OBJECT_ID('dbo.items'))
    CREATE INDEX IX_items_tenant_id ON dbo.items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotations_tenant_id' AND object_id = OBJECT_ID('dbo.quotations'))
    CREATE INDEX IX_quotations_tenant_id ON dbo.quotations (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotation_items_tenant_id' AND object_id = OBJECT_ID('dbo.quotation_items'))
    CREATE INDEX IX_quotation_items_tenant_id ON dbo.quotation_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_sales_orders_tenant_id' AND object_id = OBJECT_ID('dbo.sales_orders'))
    CREATE INDEX IX_sales_orders_tenant_id ON dbo.sales_orders (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_sales_order_items_tenant_id' AND object_id = OBJECT_ID('dbo.sales_order_items'))
    CREATE INDEX IX_sales_order_items_tenant_id ON dbo.sales_order_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_delivery_challans_tenant_id' AND object_id = OBJECT_ID('dbo.delivery_challans'))
    CREATE INDEX IX_delivery_challans_tenant_id ON dbo.delivery_challans (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_delivery_challan_items_tenant_id' AND object_id = OBJECT_ID('dbo.delivery_challan_items'))
    CREATE INDEX IX_delivery_challan_items_tenant_id ON dbo.delivery_challan_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_invoices_tenant_id' AND object_id = OBJECT_ID('dbo.invoices'))
    CREATE INDEX IX_invoices_tenant_id ON dbo.invoices (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_invoice_items_tenant_id' AND object_id = OBJECT_ID('dbo.invoice_items'))
    CREATE INDEX IX_invoice_items_tenant_id ON dbo.invoice_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_recurring_invoices_tenant_id' AND object_id = OBJECT_ID('dbo.recurring_invoices'))
    CREATE INDEX IX_recurring_invoices_tenant_id ON dbo.recurring_invoices (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_received_tenant_id' AND object_id = OBJECT_ID('dbo.payments_received'))
    CREATE INDEX IX_payments_received_tenant_id ON dbo.payments_received (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_credit_notes_tenant_id' AND object_id = OBJECT_ID('dbo.credit_notes'))
    CREATE INDEX IX_credit_notes_tenant_id ON dbo.credit_notes (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_credit_note_items_tenant_id' AND object_id = OBJECT_ID('dbo.credit_note_items'))
    CREATE INDEX IX_credit_note_items_tenant_id ON dbo.credit_note_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_sales_returns_tenant_id' AND object_id = OBJECT_ID('dbo.sales_returns'))
    CREATE INDEX IX_sales_returns_tenant_id ON dbo.sales_returns (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_sales_return_items_tenant_id' AND object_id = OBJECT_ID('dbo.sales_return_items'))
    CREATE INDEX IX_sales_return_items_tenant_id ON dbo.sales_return_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_purchase_orders_tenant_id' AND object_id = OBJECT_ID('dbo.purchase_orders'))
    CREATE INDEX IX_purchase_orders_tenant_id ON dbo.purchase_orders (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_purchase_order_items_tenant_id' AND object_id = OBJECT_ID('dbo.purchase_order_items'))
    CREATE INDEX IX_purchase_order_items_tenant_id ON dbo.purchase_order_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bills_tenant_id' AND object_id = OBJECT_ID('dbo.bills'))
    CREATE INDEX IX_bills_tenant_id ON dbo.bills (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bill_items_tenant_id' AND object_id = OBJECT_ID('dbo.bill_items'))
    CREATE INDEX IX_bill_items_tenant_id ON dbo.bill_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_recurring_bills_tenant_id' AND object_id = OBJECT_ID('dbo.recurring_bills'))
    CREATE INDEX IX_recurring_bills_tenant_id ON dbo.recurring_bills (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_made_tenant_id' AND object_id = OBJECT_ID('dbo.payments_made'))
    CREATE INDEX IX_payments_made_tenant_id ON dbo.payments_made (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_vendor_credits_tenant_id' AND object_id = OBJECT_ID('dbo.vendor_credits'))
    CREATE INDEX IX_vendor_credits_tenant_id ON dbo.vendor_credits (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_vendor_credit_items_tenant_id' AND object_id = OBJECT_ID('dbo.vendor_credit_items'))
    CREATE INDEX IX_vendor_credit_items_tenant_id ON dbo.vendor_credit_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_purchase_returns_tenant_id' AND object_id = OBJECT_ID('dbo.purchase_returns'))
    CREATE INDEX IX_purchase_returns_tenant_id ON dbo.purchase_returns (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_purchase_return_items_tenant_id' AND object_id = OBJECT_ID('dbo.purchase_return_items'))
    CREATE INDEX IX_purchase_return_items_tenant_id ON dbo.purchase_return_items (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_warehouses_tenant_id' AND object_id = OBJECT_ID('dbo.warehouses'))
    CREATE INDEX IX_warehouses_tenant_id ON dbo.warehouses (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_item_categories_tenant_id' AND object_id = OBJECT_ID('dbo.item_categories'))
    CREATE INDEX IX_item_categories_tenant_id ON dbo.item_categories (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_price_lists_tenant_id' AND object_id = OBJECT_ID('dbo.price_lists'))
    CREATE INDEX IX_price_lists_tenant_id ON dbo.price_lists (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_adjustments_tenant_id' AND object_id = OBJECT_ID('dbo.inventory_adjustments'))
    CREATE INDEX IX_inventory_adjustments_tenant_id ON dbo.inventory_adjustments (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_stock_transfers_tenant_id' AND object_id = OBJECT_ID('dbo.stock_transfers'))
    CREATE INDEX IX_stock_transfers_tenant_id ON dbo.stock_transfers (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_warehouse_stock_tenant_id' AND object_id = OBJECT_ID('dbo.warehouse_stock'))
    CREATE INDEX IX_warehouse_stock_tenant_id ON dbo.warehouse_stock (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_stock_movements_tenant_id' AND object_id = OBJECT_ID('dbo.stock_movements'))
    CREATE INDEX IX_stock_movements_tenant_id ON dbo.stock_movements (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_expenses_tenant_id' AND object_id = OBJECT_ID('dbo.expenses'))
    CREATE INDEX IX_expenses_tenant_id ON dbo.expenses (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bank_accounts_tenant_id' AND object_id = OBJECT_ID('dbo.bank_accounts'))
    CREATE INDEX IX_bank_accounts_tenant_id ON dbo.bank_accounts (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_gst_settings_tenant_id' AND object_id = OBJECT_ID('dbo.gst_settings'))
    CREATE INDEX IX_gst_settings_tenant_id ON dbo.gst_settings (tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_invoice_settings_tenant_id' AND object_id = OBJECT_ID('dbo.invoice_settings'))
    CREATE INDEX IX_invoice_settings_tenant_id ON dbo.invoice_settings (tenant_id);
GO

PRINT 'Missing tenant_id columns added. Single-company databases were backfilled automatically; multi-company databases may still need manual tenant assignment for legacy rows.';
GO
