-- SQL Server converted migration (auto-converted from Supabase/PostgreSQL).
-- Removed PostgreSQL-only constructs: RLS policies, plpgsql functions, Supabase auth hooks.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================
-- CLEANUP EXISTING OBJECTS (if they exist)
-- =============================================

-- Drop triggers first
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_companies_updated_at') DROP TRIGGER dbo.trg_companies_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_price_lists_updated_at') DROP TRIGGER dbo.trg_price_lists_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_warehouse_stock_updated_at') DROP TRIGGER dbo.trg_warehouse_stock_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_inventory_adjustments_updated_at') DROP TRIGGER dbo.trg_inventory_adjustments_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_sales_returns_updated_at') DROP TRIGGER dbo.trg_sales_returns_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_purchase_returns_updated_at') DROP TRIGGER dbo.trg_purchase_returns_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_bank_accounts_updated_at') DROP TRIGGER dbo.trg_bank_accounts_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_system_settings_updated_at') DROP TRIGGER dbo.trg_system_settings_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_invoice_settings_updated_at') DROP TRIGGER dbo.trg_invoice_settings_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_email_settings_updated_at') DROP TRIGGER dbo.trg_email_settings_updated_at;
GO

-- Drop tables in reverse order
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'report_cache') DROP TABLE dbo.report_cache;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'backups') DROP TABLE dbo.backups;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'workflow_logs') DROP TABLE dbo.workflow_logs;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'workflow_actions') DROP TABLE dbo.workflow_actions;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'workflows') DROP TABLE dbo.workflows;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'activity_logs') DROP TABLE dbo.activity_logs;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'attachments') DROP TABLE dbo.attachments;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'email_logs') DROP TABLE dbo.email_logs;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications') DROP TABLE dbo.notifications;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'email_settings') DROP TABLE dbo.email_settings;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'invoice_settings') DROP TABLE dbo.invoice_settings;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'system_settings') DROP TABLE dbo.system_settings;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pos_payments') DROP TABLE dbo.pos_payments;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pos_order_items') DROP TABLE dbo.pos_order_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pos_orders') DROP TABLE dbo.pos_orders;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pos_sessions') DROP TABLE dbo.pos_sessions;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'e_way_bills') DROP TABLE dbo.e_way_bills;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'e_invoice_records') DROP TABLE dbo.e_invoice_records;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'gst_returns') DROP TABLE dbo.gst_returns;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'tax_groups') DROP TABLE dbo.tax_groups;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'financial_periods') DROP TABLE dbo.financial_periods;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bank_reconciliation') DROP TABLE dbo.bank_reconciliation;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bank_transactions') DROP TABLE dbo.bank_transactions;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bank_accounts') DROP TABLE dbo.bank_accounts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'account_groups') DROP TABLE dbo.account_groups;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_return_items') DROP TABLE dbo.purchase_return_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_returns') DROP TABLE dbo.purchase_returns;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sales_return_items') DROP TABLE dbo.sales_return_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sales_returns') DROP TABLE dbo.sales_returns;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'payment_made_allocations') DROP TABLE dbo.payment_made_allocations;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'payment_allocations') DROP TABLE dbo.payment_allocations;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'recurring_bills') DROP TABLE dbo.recurring_bills;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'recurring_invoices') DROP TABLE dbo.recurring_invoices;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_transfer_items') DROP TABLE dbo.stock_transfer_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_transfers') DROP TABLE dbo.stock_transfers;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'inventory_adjustment_items') DROP TABLE dbo.inventory_adjustment_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'inventory_adjustments') DROP TABLE dbo.inventory_adjustments;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'warehouse_stock') DROP TABLE dbo.warehouse_stock;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'price_list_items') DROP TABLE dbo.price_list_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'price_lists') DROP TABLE dbo.price_lists;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'units') DROP TABLE dbo.units;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'item_categories') DROP TABLE dbo.item_categories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_contacts') DROP TABLE dbo.vendor_contacts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'customer_contacts') DROP TABLE dbo.customer_contacts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'warehouses') DROP TABLE dbo.warehouses;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'branches') DROP TABLE dbo.branches;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'companies') DROP TABLE dbo.companies;
GO

-- =============================================
-- BATCH 1: Organization & Core System Tables
-- =============================================

-- Companies
CREATE TABLE dbo.companies (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
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
    financial_year_start INT DEFAULT 4,
    currency NVARCHAR(10) DEFAULT 'INR',
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    tenant_id UNIQUEIDENTIFIER NULL
);
GO

-- Branches
CREATE TABLE dbo.branches (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL,
    branch_name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NULL,
    city NVARCHAR(100) NULL,
    state NVARCHAR(100) NULL,
    phone NVARCHAR(50) NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_branches_company FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE
);
GO

-- Warehouses
CREATE TABLE dbo.warehouses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    branch_id UNIQUEIDENTIFIER NULL,
    warehouse_name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NULL,
    is_active BIT DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_warehouses_branch FOREIGN KEY (branch_id) REFERENCES dbo.branches(id) ON DELETE SET NULL
);
GO

-- =============================================
-- BATCH 2: Contact Details
-- =============================================

-- Note: These tables reference customers and vendors which should exist from main schema
CREATE TABLE dbo.customer_contacts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    contact_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    designation NVARCHAR(100) NULL,
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_customer_contacts_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.vendor_contacts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    contact_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    designation NVARCHAR(100) NULL,
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vendor_contacts_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id) ON DELETE CASCADE
);
GO

-- =============================================
-- BATCH 3: Products & Inventory Extensions
-- =============================================

CREATE TABLE dbo.item_categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    parent_id UNIQUEIDENTIFIER NULL,
    description NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_item_categories_parent FOREIGN KEY (parent_id) REFERENCES dbo.item_categories(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.units (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    abbreviation NVARCHAR(20) NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.price_lists (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    is_active BIT DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.price_list_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    price_list_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_price_list_items_list FOREIGN KEY (price_list_id) REFERENCES dbo.price_lists(id) ON DELETE CASCADE,
    CONSTRAINT FK_price_list_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.warehouse_stock (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    warehouse_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_warehouse_stock_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT FK_warehouse_stock_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE CASCADE,
    CONSTRAINT UQ_warehouse_stock UNIQUE (warehouse_id, item_id)
);
GO

CREATE TABLE dbo.inventory_adjustments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    reason NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    warehouse_id UNIQUEIDENTIFIER NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_inventory_adjustments_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id) ON DELETE SET NULL,
    CONSTRAINT UQ_inventory_adjustments_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.inventory_adjustment_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    adjustment_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    quantity_on_hand DECIMAL(18,2) NOT NULL DEFAULT 0,
    adjusted_quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
    difference DECIMAL(18,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(18,2) DEFAULT 0,
    CONSTRAINT FK_inv_adj_items_adjustment FOREIGN KEY (adjustment_id) REFERENCES dbo.inventory_adjustments(id) ON DELETE CASCADE,
    CONSTRAINT FK_inv_adj_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.stock_transfers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    from_warehouse_id UNIQUEIDENTIFIER NULL,
    to_warehouse_id UNIQUEIDENTIFIER NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_stock_transfers_from_warehouse FOREIGN KEY (from_warehouse_id) REFERENCES dbo.warehouses(id) ON DELETE SET NULL,
    CONSTRAINT FK_stock_transfers_to_warehouse FOREIGN KEY (to_warehouse_id) REFERENCES dbo.warehouses(id) ON DELETE NO ACTION,
    CONSTRAINT UQ_stock_transfers_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.stock_transfer_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    transfer_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_stock_transfer_items_transfer FOREIGN KEY (transfer_id) REFERENCES dbo.stock_transfers(id) ON DELETE CASCADE,
    CONSTRAINT FK_stock_transfer_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE NO ACTION
);
GO

-- =============================================
-- BATCH 4: Recurring Documents & Returns
-- =============================================

CREATE TABLE dbo.recurring_invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    frequency NVARCHAR(50) NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    end_date DATE NULL,
    next_invoice_date DATE NULL,
    base_invoice_id UNIQUEIDENTIFIER NULL,
    is_active BIT DEFAULT 1,
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total DECIMAL(18,2) NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_recurring_invoices_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id) ON DELETE CASCADE,
    CONSTRAINT FK_recurring_invoices_base FOREIGN KEY (base_invoice_id) REFERENCES dbo.invoices(id) ON DELETE SET NULL
);
GO

CREATE TABLE dbo.recurring_bills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    frequency NVARCHAR(50) NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    end_date DATE NULL,
    next_bill_date DATE NULL,
    base_bill_id UNIQUEIDENTIFIER NULL,
    is_active BIT DEFAULT 1,
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total DECIMAL(18,2) NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_recurring_bills_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id) ON DELETE CASCADE,
    CONSTRAINT FK_recurring_bills_base FOREIGN KEY (base_bill_id) REFERENCES dbo.bills(id) ON DELETE SET NULL
);
GO

CREATE TABLE dbo.payment_allocations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER NOT NULL,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payment_allocations_payment FOREIGN KEY (payment_id) REFERENCES dbo.payments_received(id) ON DELETE CASCADE,
    CONSTRAINT FK_payment_allocations_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.payment_made_allocations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_id UNIQUEIDENTIFIER NOT NULL,
    bill_id UNIQUEIDENTIFIER NOT NULL,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payment_made_allocations_payment FOREIGN KEY (payment_id) REFERENCES dbo.payments_made(id) ON DELETE CASCADE,
    CONSTRAINT FK_payment_made_allocations_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.sales_returns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total DECIMAL(18,2) NOT NULL DEFAULT 0,
    reason NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_sales_returns_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id) ON DELETE CASCADE,
    CONSTRAINT FK_sales_returns_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE SET NULL,
    CONSTRAINT UQ_sales_returns_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.sales_return_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sales_return_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    quantity DECIMAL(18,2) NOT NULL DEFAULT 1,
    rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    CONSTRAINT FK_sales_return_items_return FOREIGN KEY (sales_return_id) REFERENCES dbo.sales_returns(id) ON DELETE CASCADE,
    CONSTRAINT FK_sales_return_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.purchase_returns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    bill_id UNIQUEIDENTIFIER NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total DECIMAL(18,2) NOT NULL DEFAULT 0,
    reason NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_purchase_returns_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id) ON DELETE CASCADE,
    CONSTRAINT FK_purchase_returns_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id) ON DELETE SET NULL,
    CONSTRAINT UQ_purchase_returns_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.purchase_return_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    purchase_return_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    quantity DECIMAL(18,2) NOT NULL DEFAULT 1,
    rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    CONSTRAINT FK_purchase_return_items_return FOREIGN KEY (purchase_return_id) REFERENCES dbo.purchase_returns(id) ON DELETE CASCADE,
    CONSTRAINT FK_purchase_return_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE NO ACTION
);
GO

-- =============================================
-- BATCH 5: Banking & Accounting Extensions
-- =============================================

CREATE TABLE dbo.account_groups (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    parent_id UNIQUEIDENTIFIER NULL,
    nature NVARCHAR(20) NOT NULL DEFAULT 'debit',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_account_groups_parent FOREIGN KEY (parent_id) REFERENCES dbo.account_groups(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.bank_accounts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    account_id UNIQUEIDENTIFIER NULL,
    bank_name NVARCHAR(255) NOT NULL,
    account_number NVARCHAR(100) NULL,
    ifsc_code NVARCHAR(50) NULL,
    branch_name NVARCHAR(255) NULL,
    current_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_active BIT DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_bank_accounts_account FOREIGN KEY (account_id) REFERENCES dbo.accounts(id) ON DELETE SET NULL
);
GO

CREATE TABLE dbo.bank_transactions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    bank_account_id UNIQUEIDENTIFIER NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    type NVARCHAR(20) NOT NULL DEFAULT 'debit',
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    description NVARCHAR(MAX) NULL,
    reference_number NVARCHAR(100) NULL,
    is_reconciled BIT DEFAULT 0,
    reconciled_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_bank_transactions_account FOREIGN KEY (bank_account_id) REFERENCES dbo.bank_accounts(id) ON DELETE CASCADE,
    CONSTRAINT CK_bank_transaction_type CHECK (type IN ('debit', 'credit'))
);
GO

CREATE TABLE dbo.bank_reconciliation (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    bank_account_id UNIQUEIDENTIFIER NOT NULL,
    statement_date DATE NOT NULL,
    statement_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    reconciled_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    status NVARCHAR(50) NOT NULL DEFAULT 'in_progress',
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_bank_reconciliation_account FOREIGN KEY (bank_account_id) REFERENCES dbo.bank_accounts(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.financial_periods (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BIT DEFAULT 0,
    closed_by UNIQUEIDENTIFIER NULL,
    closed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- BATCH 6: Tax Extensions
-- =============================================

CREATE TABLE dbo.tax_groups (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.gst_returns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    return_type NVARCHAR(50) NOT NULL,
    period NVARCHAR(20) NOT NULL,
    filing_date DATE NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    data NVARCHAR(MAX) NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.e_invoice_records (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL,
    irn NVARCHAR(100) NULL,
    ack_number NVARCHAR(100) NULL,
    ack_date DATETIME2 NULL,
    signed_invoice NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_e_invoice_records_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.e_way_bills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL,
    eway_bill_number NVARCHAR(100) NULL,
    valid_from DATETIME2 NULL,
    valid_until DATETIME2 NULL,
    vehicle_number NVARCHAR(50) NULL,
    transporter_name NVARCHAR(255) NULL,
    distance_km DECIMAL(18,2) DEFAULT 0,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_e_way_bills_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE CASCADE
);
GO

-- =============================================
-- BATCH 7: POS System
-- =============================================

CREATE TABLE dbo.pos_sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    opened_by UNIQUEIDENTIFIER NOT NULL,
    opened_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    closed_at DATETIME2 NULL,
    opening_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(18,2) NULL,
    total_sales DECIMAL(18,2) DEFAULT 0,
    total_cash DECIMAL(18,2) DEFAULT 0,
    total_upi DECIMAL(18,2) DEFAULT 0,
    total_card DECIMAL(18,2) DEFAULT 0,
    status NVARCHAR(50) NOT NULL DEFAULT 'open',
    notes NVARCHAR(MAX) NULL
);
GO

CREATE TABLE dbo.pos_orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NULL,
    invoice_id UNIQUEIDENTIFIER NULL,
    customer_id UNIQUEIDENTIFIER NULL,
    order_number NVARCHAR(50) NOT NULL,
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total DECIMAL(18,2) NOT NULL DEFAULT 0,
    status NVARCHAR(50) NOT NULL DEFAULT 'completed',
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_pos_orders_session FOREIGN KEY (session_id) REFERENCES dbo.pos_sessions(id) ON DELETE SET NULL,
    CONSTRAINT FK_pos_orders_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE SET NULL,
    CONSTRAINT FK_pos_orders_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id) ON DELETE SET NULL,
    CONSTRAINT UQ_pos_orders_number UNIQUE (order_number)
);
GO

CREATE TABLE dbo.pos_order_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    item_name NVARCHAR(255) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL DEFAULT 1,
    rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_pos_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.pos_orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_pos_order_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.pos_payments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    payment_mode NVARCHAR(50) NOT NULL DEFAULT 'cash',
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    reference_number NVARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_pos_payments_order FOREIGN KEY (order_id) REFERENCES dbo.pos_orders(id) ON DELETE CASCADE,
    CONSTRAINT CK_pos_payment_mode CHECK (payment_mode IN ('cash', 'upi', 'card', 'mix'))
);
GO

-- =============================================
-- BATCH 8: System & Settings
-- =============================================

CREATE TABLE dbo.system_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [key] NVARCHAR(255) NOT NULL,
    value NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NOT NULL DEFAULT 'general',
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_system_settings_key UNIQUE ([key])
);
GO

CREATE TABLE dbo.invoice_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id NVARCHAR(100) NOT NULL DEFAULT 'modern',
    show_logo BIT DEFAULT 1,
    show_signature BIT DEFAULT 1,
    footer_text NVARCHAR(MAX) DEFAULT 'Thank you for your business!',
    terms_text NVARCHAR(MAX) NULL,
    notes_text NVARCHAR(MAX) NULL,
    accent_color NVARCHAR(20) DEFAULT '#3b82f6',
    tenant_id UNIQUEIDENTIFIER NULL,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.email_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    smtp_host NVARCHAR(255) NULL,
    smtp_port INT DEFAULT 587,
    smtp_username NVARCHAR(255) NULL,
    smtp_password NVARCHAR(255) NULL,
    from_email NVARCHAR(255) NULL,
    from_name NVARCHAR(255) NULL,
    is_active BIT DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NULL,
    type NVARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BIT DEFAULT 0,
    link NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.email_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    to_email NVARCHAR(255) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    body NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'sent',
    document_type NVARCHAR(100) NULL,
    document_id UNIQUEIDENTIFIER NULL,
    sent_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.attachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    record_type NVARCHAR(100) NOT NULL,
    record_id UNIQUEIDENTIFIER NOT NULL,
    file_name NVARCHAR(500) NOT NULL,
    file_url NVARCHAR(500) NOT NULL,
    file_size INT NULL,
    mime_type NVARCHAR(100) NULL,
    uploaded_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.activity_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    module NVARCHAR(100) NOT NULL,
    record_id UNIQUEIDENTIFIER NOT NULL,
    action NVARCHAR(100) NOT NULL,
    details NVARCHAR(MAX) NULL,
    user_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- BATCH 9: Automation
-- =============================================

CREATE TABLE dbo.workflows (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    trigger_event NVARCHAR(100) NOT NULL,
    conditions NVARCHAR(MAX) NULL,
    is_active BIT DEFAULT 1,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.workflow_actions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    workflow_id UNIQUEIDENTIFIER NOT NULL,
    action_type NVARCHAR(100) NOT NULL,
    action_config NVARCHAR(MAX) NULL,
    sort_order INT DEFAULT 0,
    CONSTRAINT FK_workflow_actions_workflow FOREIGN KEY (workflow_id) REFERENCES dbo.workflows(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.workflow_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    workflow_id UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'success',
    details NVARCHAR(MAX) NULL,
    executed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_workflow_logs_workflow FOREIGN KEY (workflow_id) REFERENCES dbo.workflows(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.backups (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    file_name NVARCHAR(500) NOT NULL,
    file_url NVARCHAR(500) NULL,
    size_bytes BIGINT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'completed',
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.report_cache (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    report_type NVARCHAR(100) NOT NULL,
    period NVARCHAR(50) NOT NULL,
    data NVARCHAR(MAX) NULL,
    generated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_report_cache UNIQUE (report_type, period)
);
GO

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER trg_companies_updated_at ON dbo.companies AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE c SET updated_at = GETDATE()
    FROM dbo.companies c INNER JOIN inserted i ON c.id = i.id;
END
GO

CREATE TRIGGER trg_price_lists_updated_at ON dbo.price_lists AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p SET updated_at = GETDATE()
    FROM dbo.price_lists p INNER JOIN inserted i ON p.id = i.id;
END
GO

CREATE TRIGGER trg_warehouse_stock_updated_at ON dbo.warehouse_stock AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE w SET updated_at = GETDATE()
    FROM dbo.warehouse_stock w INNER JOIN inserted i ON w.id = i.id;
END
GO

CREATE TRIGGER trg_inventory_adjustments_updated_at ON dbo.inventory_adjustments AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE i SET updated_at = GETDATE()
    FROM dbo.inventory_adjustments i INNER JOIN inserted ins ON i.id = ins.id;
END
GO

CREATE TRIGGER trg_sales_returns_updated_at ON dbo.sales_returns AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE s SET updated_at = GETDATE()
    FROM dbo.sales_returns s INNER JOIN inserted i ON s.id = i.id;
END
GO

CREATE TRIGGER trg_purchase_returns_updated_at ON dbo.purchase_returns AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p SET updated_at = GETDATE()
    FROM dbo.purchase_returns p INNER JOIN inserted i ON p.id = i.id;
END
GO

CREATE TRIGGER trg_bank_accounts_updated_at ON dbo.bank_accounts AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE b SET updated_at = GETDATE()
    FROM dbo.bank_accounts b INNER JOIN inserted i ON b.id = i.id;
END
GO

CREATE TRIGGER trg_system_settings_updated_at ON dbo.system_settings AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE s SET updated_at = GETDATE()
    FROM dbo.system_settings s INNER JOIN inserted i ON s.id = i.id;
END
GO

CREATE TRIGGER trg_invoice_settings_updated_at ON dbo.invoice_settings AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE i SET updated_at = GETDATE()
    FROM dbo.invoice_settings i INNER JOIN inserted ins ON i.id = ins.id;
END
GO

CREATE TRIGGER trg_email_settings_updated_at ON dbo.email_settings AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE e SET updated_at = GETDATE()
    FROM dbo.email_settings e INNER JOIN inserted i ON e.id = i.id;
END
GO

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IX_companies_created_by ON dbo.companies(created_by);
CREATE INDEX IX_branches_company_id ON dbo.branches(company_id);
CREATE INDEX IX_branches_is_active ON dbo.branches(is_active);
CREATE INDEX IX_warehouses_branch_id ON dbo.warehouses(branch_id);
CREATE INDEX IX_warehouses_is_active ON dbo.warehouses(is_active);

CREATE INDEX IX_customer_contacts_customer_id ON dbo.customer_contacts(customer_id);
CREATE INDEX IX_customer_contacts_is_primary ON dbo.customer_contacts(is_primary);
CREATE INDEX IX_vendor_contacts_vendor_id ON dbo.vendor_contacts(vendor_id);
CREATE INDEX IX_vendor_contacts_is_primary ON dbo.vendor_contacts(is_primary);

CREATE INDEX IX_item_categories_parent_id ON dbo.item_categories(parent_id);
CREATE INDEX IX_units_is_active ON dbo.units(is_active);
CREATE INDEX IX_price_lists_is_active ON dbo.price_lists(is_active);
CREATE INDEX IX_price_list_items_price_list_id ON dbo.price_list_items(price_list_id);
CREATE INDEX IX_price_list_items_item_id ON dbo.price_list_items(item_id);
CREATE INDEX IX_warehouse_stock_warehouse_id ON dbo.warehouse_stock(warehouse_id);
CREATE INDEX IX_warehouse_stock_item_id ON dbo.warehouse_stock(item_id);
CREATE INDEX IX_inventory_adjustments_warehouse_id ON dbo.inventory_adjustments(warehouse_id);
CREATE INDEX IX_inventory_adjustments_date ON dbo.inventory_adjustments(date);
CREATE INDEX IX_inv_adj_items_adjustment_id ON dbo.inventory_adjustment_items(adjustment_id);
CREATE INDEX IX_inv_adj_items_item_id ON dbo.inventory_adjustment_items(item_id);
CREATE INDEX IX_stock_transfers_from_warehouse ON dbo.stock_transfers(from_warehouse_id);
CREATE INDEX IX_stock_transfers_to_warehouse ON dbo.stock_transfers(to_warehouse_id);
CREATE INDEX IX_stock_transfer_items_transfer_id ON dbo.stock_transfer_items(transfer_id);
CREATE INDEX IX_stock_transfer_items_item_id ON dbo.stock_transfer_items(item_id);

CREATE INDEX IX_recurring_invoices_customer_id ON dbo.recurring_invoices(customer_id);
CREATE INDEX IX_recurring_invoices_next_date ON dbo.recurring_invoices(next_invoice_date);
CREATE INDEX IX_recurring_bills_vendor_id ON dbo.recurring_bills(vendor_id);
CREATE INDEX IX_recurring_bills_next_date ON dbo.recurring_bills(next_bill_date);
CREATE INDEX IX_payment_allocations_payment_id ON dbo.payment_allocations(payment_id);
CREATE INDEX IX_payment_allocations_invoice_id ON dbo.payment_allocations(invoice_id);
CREATE INDEX IX_payment_made_allocations_payment_id ON dbo.payment_made_allocations(payment_id);
CREATE INDEX IX_payment_made_allocations_bill_id ON dbo.payment_made_allocations(bill_id);
CREATE INDEX IX_sales_returns_customer_id ON dbo.sales_returns(customer_id);
CREATE INDEX IX_sales_returns_date ON dbo.sales_returns(date);
CREATE INDEX IX_sales_return_items_return_id ON dbo.sales_return_items(sales_return_id);
CREATE INDEX IX_purchase_returns_vendor_id ON dbo.purchase_returns(vendor_id);
CREATE INDEX IX_purchase_returns_date ON dbo.purchase_returns(date);
CREATE INDEX IX_purchase_return_items_return_id ON dbo.purchase_return_items(purchase_return_id);

CREATE INDEX IX_account_groups_parent_id ON dbo.account_groups(parent_id);
CREATE INDEX IX_bank_accounts_account_id ON dbo.bank_accounts(account_id);
CREATE INDEX IX_bank_accounts_is_active ON dbo.bank_accounts(is_active);
CREATE INDEX IX_bank_transactions_bank_account_id ON dbo.bank_transactions(bank_account_id);
CREATE INDEX IX_bank_transactions_date ON dbo.bank_transactions(date);
CREATE INDEX IX_bank_transactions_is_reconciled ON dbo.bank_transactions(is_reconciled);
CREATE INDEX IX_bank_reconciliation_bank_account_id ON dbo.bank_reconciliation(bank_account_id);
CREATE INDEX IX_financial_periods_dates ON dbo.financial_periods(start_date, end_date);

CREATE INDEX IX_e_invoice_records_invoice_id ON dbo.e_invoice_records(invoice_id);
CREATE INDEX IX_e_way_bills_invoice_id ON dbo.e_way_bills(invoice_id);

CREATE INDEX IX_pos_sessions_opened_by ON dbo.pos_sessions(opened_by);
CREATE INDEX IX_pos_sessions_status ON dbo.pos_sessions(status);
CREATE INDEX IX_pos_orders_session_id ON dbo.pos_orders(session_id);
CREATE INDEX IX_pos_orders_invoice_id ON dbo.pos_orders(invoice_id);
CREATE INDEX IX_pos_orders_customer_id ON dbo.pos_orders(customer_id);
CREATE INDEX IX_pos_orders_created_at ON dbo.pos_orders(created_at);
CREATE INDEX IX_pos_order_items_order_id ON dbo.pos_order_items(order_id);
CREATE INDEX IX_pos_order_items_item_id ON dbo.pos_order_items(item_id);
CREATE INDEX IX_pos_payments_order_id ON dbo.pos_payments(order_id);

CREATE INDEX IX_notifications_user_id ON dbo.notifications(user_id);
CREATE INDEX IX_notifications_is_read ON dbo.notifications(is_read);
CREATE INDEX IX_email_logs_document_id ON dbo.email_logs(document_id);
CREATE INDEX IX_attachments_record_id ON dbo.attachments(record_id);
CREATE INDEX IX_activity_logs_record_id ON dbo.activity_logs(record_id);
CREATE INDEX IX_activity_logs_created_at ON dbo.activity_logs(created_at);

CREATE INDEX IX_workflows_trigger_event ON dbo.workflows(trigger_event);
CREATE INDEX IX_workflow_actions_workflow_id ON dbo.workflow_actions(workflow_id);
CREATE INDEX IX_workflow_logs_workflow_id ON dbo.workflow_logs(workflow_id);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert default company if not exists
IF NOT EXISTS (SELECT 1 FROM dbo.companies)
BEGIN
    INSERT INTO dbo.companies (company_name, gstin, pan, currency, financial_year_start, created_at, updated_at)
    VALUES ('My Company', '', '', 'INR', 4, GETDATE(), GETDATE());
END

-- Insert default units
IF NOT EXISTS (SELECT 1 FROM dbo.units)
BEGIN
    INSERT INTO dbo.units (name, abbreviation, is_active, created_at)
    VALUES 
        ('Pieces', 'pcs', 1, GETDATE()),
        ('Kilograms', 'kg', 1, GETDATE()),
        ('Grams', 'g', 1, GETDATE()),
        ('Meters', 'm', 1, GETDATE()),
        ('Box', 'box', 1, GETDATE()),
        ('Pack', 'pack', 1, GETDATE()),
        ('Dozen', 'dz', 1, GETDATE()),
        ('Liters', 'L', 1, GETDATE());
END

-- Insert default invoice settings
IF NOT EXISTS (SELECT 1 FROM dbo.invoice_settings)
BEGIN
    INSERT INTO dbo.invoice_settings (template_id, show_logo, show_signature, footer_text, updated_at)
    VALUES ('modern', 1, 1, 'Thank you for your business!', GETDATE());
END

-- Insert default system settings
IF NOT EXISTS (SELECT 1 FROM dbo.system_settings WHERE [key] = 'company_name')
BEGIN
    INSERT INTO dbo.system_settings ([key], value, category, updated_at)
    VALUES 
        ('company_name', 'My Company', 'general', GETDATE()),
        ('company_email', '', 'general', GETDATE()),
        ('company_phone', '', 'general', GETDATE()),
        ('timezone', 'Asia/Kolkata', 'general', GETDATE()),
        ('date_format', 'DD/MM/YYYY', 'general', GETDATE());
END

PRINT 'Additional Billflow Accounting System tables created successfully!';
GO
