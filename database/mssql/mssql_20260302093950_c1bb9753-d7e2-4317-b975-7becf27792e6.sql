-- SQL Server Migration - Billflow Accounting System
-- This script includes cleanup of existing objects
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================
-- CLEANUP EXISTING OBJECTS (if they exist)
-- =============================================

-- Drop triggers first
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_users_updated_at') DROP TRIGGER dbo.trg_users_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_profiles_updated_at') DROP TRIGGER dbo.trg_profiles_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_accounts_updated_at') DROP TRIGGER dbo.trg_accounts_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_tax_rates_updated_at') DROP TRIGGER dbo.trg_tax_rates_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_customers_updated_at') DROP TRIGGER dbo.trg_customers_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_vendors_updated_at') DROP TRIGGER dbo.trg_vendors_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_items_updated_at') DROP TRIGGER dbo.trg_items_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_quotations_updated_at') DROP TRIGGER dbo.trg_quotations_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_sales_orders_updated_at') DROP TRIGGER dbo.trg_sales_orders_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_delivery_challans_updated_at') DROP TRIGGER dbo.trg_delivery_challans_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_invoices_updated_at') DROP TRIGGER dbo.trg_invoices_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_credit_notes_updated_at') DROP TRIGGER dbo.trg_credit_notes_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_purchase_orders_updated_at') DROP TRIGGER dbo.trg_purchase_orders_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_bills_updated_at') DROP TRIGGER dbo.trg_bills_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_vendor_credits_updated_at') DROP TRIGGER dbo.trg_vendor_credits_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_expenses_updated_at') DROP TRIGGER dbo.trg_expenses_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_gst_settings_updated_at') DROP TRIGGER dbo.trg_gst_settings_updated_at;
GO

-- Drop stored procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GenerateDocumentNumber') DROP PROCEDURE dbo.sp_GenerateDocumentNumber;
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateStock') DROP PROCEDURE dbo.sp_UpdateStock;
GO

-- Drop tables in reverse order (to handle foreign key constraints)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_trail') DROP TABLE dbo.audit_trail;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_movements') DROP TABLE dbo.stock_movements;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'journal_entry_lines') DROP TABLE dbo.journal_entry_lines;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'journal_entries') DROP TABLE dbo.journal_entries;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'expenses') DROP TABLE dbo.expenses;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'payments_made') DROP TABLE dbo.payments_made;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'payments_received') DROP TABLE dbo.payments_received;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_credit_items') DROP TABLE dbo.vendor_credit_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_credits') DROP TABLE dbo.vendor_credits;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bill_items') DROP TABLE dbo.bill_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bills') DROP TABLE dbo.bills;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_order_items') DROP TABLE dbo.purchase_order_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_orders') DROP TABLE dbo.purchase_orders;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_note_items') DROP TABLE dbo.credit_note_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_notes') DROP TABLE dbo.credit_notes;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'invoice_items') DROP TABLE dbo.invoice_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'invoices') DROP TABLE dbo.invoices;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_challan_items') DROP TABLE dbo.delivery_challan_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_challans') DROP TABLE dbo.delivery_challans;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sales_order_items') DROP TABLE dbo.sales_order_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sales_orders') DROP TABLE dbo.sales_orders;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'quotation_items') DROP TABLE dbo.quotation_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'quotations') DROP TABLE dbo.quotations;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items') DROP TABLE dbo.items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendors') DROP TABLE dbo.vendors;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'customers') DROP TABLE dbo.customers;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'tax_rates') DROP TABLE dbo.tax_rates;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'accounts') DROP TABLE dbo.accounts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles') DROP TABLE dbo.user_roles;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'profiles') DROP TABLE dbo.profiles;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users') DROP TABLE dbo.users;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'document_sequences') DROP TABLE dbo.document_sequences;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'gst_settings') DROP TABLE dbo.gst_settings;
GO

-- =============================================
-- BILLFLOW ACCOUNTING SYSTEM - CORE SCHEMA
-- =============================================

-- 1. USERS TABLE (base table for authentication)
CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    last_login DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_users_username UNIQUE (username),
    CONSTRAINT UQ_users_email UNIQUE (email)
);
GO

-- 2. PROFILES TABLE
CREATE TABLE dbo.profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    display_name NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_profiles_user UNIQUE (user_id)
);
GO

-- 3. USER ROLES TABLE
CREATE TABLE dbo.user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role VARCHAR(50) NOT NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_user_roles UNIQUE (user_id, role)
);
GO

-- 4. CHART OF ACCOUNTS
CREATE TABLE dbo.accounts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    account_type NVARCHAR(50) NOT NULL,
    parent_id UNIQUEIDENTIFIER NULL,
    is_system BIT NOT NULL DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_accounts_parent FOREIGN KEY (parent_id) REFERENCES dbo.accounts(id),
    CONSTRAINT UQ_accounts_code UNIQUE (code),
    CONSTRAINT CK_account_type CHECK (account_type IN ('asset','liability','equity','income','expense'))
);
GO

-- 5. TAX RATES
CREATE TABLE dbo.tax_rates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    tax_type NVARCHAR(50) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT CK_tax_type CHECK (tax_type IN ('cgst', 'sgst', 'igst', 'cess', 'composite', 'GST', 'IGST', 'exempt'))
);
GO

-- 6. CUSTOMERS
CREATE TABLE dbo.customers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    gstin NVARCHAR(50) NULL,
    pan NVARCHAR(50) NULL,
    billing_address NVARCHAR(MAX) NULL,
    shipping_address NVARCHAR(MAX) NULL,
    state NVARCHAR(100) NULL,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_customers_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

-- 7. VENDORS
CREATE TABLE dbo.vendors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    gstin NVARCHAR(50) NULL,
    pan NVARCHAR(50) NULL,
    address NVARCHAR(MAX) NULL,
    state NVARCHAR(100) NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vendors_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

-- 8. ITEMS / INVENTORY
CREATE TABLE dbo.items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    sku NVARCHAR(100) NULL,
    hsn_code NVARCHAR(20) NULL,
    category NVARCHAR(100) NULL,
    unit NVARCHAR(20) NOT NULL DEFAULT 'pcs',
    purchase_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    selling_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    opening_stock DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_stock DECIMAL(15,2) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(15,2) DEFAULT 10,
    is_active BIT NOT NULL DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id),
    CONSTRAINT FK_items_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_items_sku UNIQUE (sku)
);
GO

-- 9. QUOTATIONS
CREATE TABLE dbo.quotations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    valid_until DATE NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    terms NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_quotations_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_quotations_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_quotations_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.quotation_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    quotation_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_quotation_items_quotation FOREIGN KEY (quotation_id) REFERENCES dbo.quotations(id) ON DELETE CASCADE,
    CONSTRAINT FK_quotation_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_quotation_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 10. SALES ORDERS
CREATE TABLE dbo.sales_orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    expected_delivery DATE NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    quotation_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_sales_orders_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_sales_orders_quotation FOREIGN KEY (quotation_id) REFERENCES dbo.quotations(id),
    CONSTRAINT FK_sales_orders_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_sales_orders_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.sales_order_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sales_order_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_so_items_sales_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_so_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_so_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 11. DELIVERY CHALLANS
CREATE TABLE dbo.delivery_challans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    sales_order_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_delivery_challans_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_delivery_challans_sales_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_orders(id),
    CONSTRAINT FK_delivery_challans_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_delivery_challans_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.delivery_challan_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    delivery_challan_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_dc_items_delivery_challan FOREIGN KEY (delivery_challan_id) REFERENCES dbo.delivery_challans(id) ON DELETE CASCADE,
    CONSTRAINT FK_dc_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id)
);
GO

-- 12. INVOICES
CREATE TABLE dbo.invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date DATE NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    sales_order_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    irn NVARCHAR(100) NULL,
    eway_bill NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    terms NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_invoices_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_invoices_sales_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_orders(id),
    CONSTRAINT FK_invoices_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_invoices_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.invoice_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE CASCADE,
    CONSTRAINT FK_invoice_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_invoice_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 13. CREDIT NOTES
CREATE TABLE dbo.credit_notes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    reason NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_credit_notes_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_credit_notes_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id),
    CONSTRAINT FK_credit_notes_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_credit_notes_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.credit_note_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    credit_note_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_cn_items_credit_note FOREIGN KEY (credit_note_id) REFERENCES dbo.credit_notes(id) ON DELETE CASCADE,
    CONSTRAINT FK_cn_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_cn_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 14. PURCHASE ORDERS
CREATE TABLE dbo.purchase_orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    expected_delivery DATE NULL,
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_purchase_orders_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_purchase_orders_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_purchase_orders_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.purchase_order_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    purchase_order_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_po_items_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES dbo.purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_po_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_po_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 15. BILLS
CREATE TABLE dbo.bills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date DATE NULL,
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    purchase_order_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_bills_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_bills_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES dbo.purchase_orders(id),
    CONSTRAINT FK_bills_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_bills_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.bill_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    bill_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_bill_items_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id) ON DELETE CASCADE,
    CONSTRAINT FK_bill_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_bill_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 16. VENDOR CREDITS
CREATE TABLE dbo.vendor_credits (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    bill_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    reason NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vendor_credits_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_vendor_credits_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id),
    CONSTRAINT FK_vendor_credits_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_vendor_credits_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.vendor_credit_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    vendor_credit_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_vc_items_vendor_credit FOREIGN KEY (vendor_credit_id) REFERENCES dbo.vendor_credits(id) ON DELETE CASCADE,
    CONSTRAINT FK_vc_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_vc_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 17. PAYMENTS RECEIVED
CREATE TABLE dbo.payments_received (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_mode NVARCHAR(50) NOT NULL DEFAULT 'cash',
    reference_number NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payments_received_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_payments_received_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id),
    CONSTRAINT FK_payments_received_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_payments_received_number UNIQUE (payment_number),
    CONSTRAINT CK_payment_mode_received CHECK (payment_mode IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'))
);
GO

-- 18. PAYMENTS MADE
CREATE TABLE dbo.payments_made (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    bill_id UNIQUEIDENTIFIER NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_mode NVARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    reference_number NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payments_made_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_payments_made_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id),
    CONSTRAINT FK_payments_made_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_payments_made_number UNIQUE (payment_number),
    CONSTRAINT CK_payment_mode_made CHECK (payment_mode IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'))
);
GO

-- 19. EXPENSES
CREATE TABLE dbo.expenses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    category NVARCHAR(100) NOT NULL,
    vendor_id UNIQUEIDENTIFIER NULL,
    account_id UNIQUEIDENTIFIER NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_mode NVARCHAR(50) DEFAULT 'cash',
    description NVARCHAR(MAX) NULL,
    is_recurring BIT NOT NULL DEFAULT 0,
    recurring_frequency NVARCHAR(20) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_expenses_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_expenses_account FOREIGN KEY (account_id) REFERENCES dbo.accounts(id),
    CONSTRAINT FK_expenses_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT CK_recurring_frequency CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly'))
);
GO

-- 20. JOURNAL ENTRIES
CREATE TABLE dbo.journal_entries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    journal_type VARCHAR(30) NOT NULL DEFAULT 'manual',
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    description NVARCHAR(MAX) NULL,
    is_auto BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_journal_entries_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_journal_entries_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.journal_entry_lines (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    journal_entry_id UNIQUEIDENTIFIER NOT NULL,
    account_id UNIQUEIDENTIFIER NOT NULL,
    debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    description NVARCHAR(MAX) NULL,
    CONSTRAINT FK_jel_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES dbo.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT FK_jel_account FOREIGN KEY (account_id) REFERENCES dbo.accounts(id)
);
GO

-- 21. STOCK MOVEMENTS
CREATE TABLE dbo.stock_movements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    item_id UNIQUEIDENTIFIER NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2) DEFAULT 0,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_stock_movements_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_stock_movements_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

-- 22. DOCUMENT SEQUENCES
CREATE TABLE dbo.document_sequences (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_type NVARCHAR(50) NOT NULL,
    prefix NVARCHAR(20) NOT NULL,
    next_number INT NOT NULL DEFAULT 1,
    padding INT NOT NULL DEFAULT 4,
    financial_year NVARCHAR(20) NULL,
    CONSTRAINT UQ_document_sequences_type UNIQUE (document_type)
);
GO

-- 23. GST SETTINGS
CREATE TABLE dbo.gst_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    gstin NVARCHAR(50) NULL,
    legal_name NVARCHAR(255) NULL,
    trade_name NVARCHAR(255) NULL,
    state NVARCHAR(100) NULL,
    state_code NVARCHAR(10) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    is_composition BIT NOT NULL DEFAULT 0,
    reverse_charge_applicable BIT NOT NULL DEFAULT 0,
    einvoice_enabled BIT NOT NULL DEFAULT 0,
    eway_bill_enabled BIT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 24. AUDIT TRAIL
CREATE TABLE dbo.audit_trail (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    table_name NVARCHAR(255) NOT NULL,
    record_id UNIQUEIDENTIFIER NOT NULL,
    action NVARCHAR(50) NOT NULL,
    old_data NVARCHAR(MAX) NULL,
    new_data NVARCHAR(MAX) NULL,
    user_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_audit_trail_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_audit_action CHECK (action IN ('create', 'update', 'delete'))
);
GO

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER trg_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET updated_at = GETDATE()
    FROM dbo.users u
    INNER JOIN inserted i ON u.id = i.id;
END
GO

CREATE TRIGGER trg_profiles_updated_at
ON dbo.profiles
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
    SET updated_at = GETDATE()
    FROM dbo.profiles p
    INNER JOIN inserted i ON p.id = i.id;
END
GO

CREATE TRIGGER trg_accounts_updated_at
ON dbo.accounts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE a
    SET updated_at = GETDATE()
    FROM dbo.accounts a
    INNER JOIN inserted i ON a.id = i.id;
END
GO

CREATE TRIGGER trg_tax_rates_updated_at
ON dbo.tax_rates
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tr
    SET updated_at = GETDATE()
    FROM dbo.tax_rates tr
    INNER JOIN inserted i ON tr.id = i.id;
END
GO

CREATE TRIGGER trg_customers_updated_at
ON dbo.customers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE c
    SET updated_at = GETDATE()
    FROM dbo.customers c
    INNER JOIN inserted i ON c.id = i.id;
END
GO

CREATE TRIGGER trg_vendors_updated_at
ON dbo.vendors
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE v
    SET updated_at = GETDATE()
    FROM dbo.vendors v
    INNER JOIN inserted i ON v.id = i.id;
END
GO

CREATE TRIGGER trg_items_updated_at
ON dbo.items
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE i
    SET updated_at = GETDATE()
    FROM dbo.items i
    INNER JOIN inserted ins ON i.id = ins.id;
END
GO

CREATE TRIGGER trg_quotations_updated_at
ON dbo.quotations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q
    SET updated_at = GETDATE()
    FROM dbo.quotations q
    INNER JOIN inserted i ON q.id = i.id;
END
GO

CREATE TRIGGER trg_sales_orders_updated_at
ON dbo.sales_orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE so
    SET updated_at = GETDATE()
    FROM dbo.sales_orders so
    INNER JOIN inserted i ON so.id = i.id;
END
GO

CREATE TRIGGER trg_delivery_challans_updated_at
ON dbo.delivery_challans
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dc
    SET updated_at = GETDATE()
    FROM dbo.delivery_challans dc
    INNER JOIN inserted i ON dc.id = i.id;
END
GO

CREATE TRIGGER trg_invoices_updated_at
ON dbo.invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inv
    SET updated_at = GETDATE()
    FROM dbo.invoices inv
    INNER JOIN inserted i ON inv.id = i.id;
END
GO

CREATE TRIGGER trg_credit_notes_updated_at
ON dbo.credit_notes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE cn
    SET updated_at = GETDATE()
    FROM dbo.credit_notes cn
    INNER JOIN inserted i ON cn.id = i.id;
END
GO

CREATE TRIGGER trg_purchase_orders_updated_at
ON dbo.purchase_orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE po
    SET updated_at = GETDATE()
    FROM dbo.purchase_orders po
    INNER JOIN inserted i ON po.id = i.id;
END
GO

CREATE TRIGGER trg_bills_updated_at
ON dbo.bills
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE b
    SET updated_at = GETDATE()
    FROM dbo.bills b
    INNER JOIN inserted i ON b.id = i.id;
END
GO

CREATE TRIGGER trg_vendor_credits_updated_at
ON dbo.vendor_credits
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE vc
    SET updated_at = GETDATE()
    FROM dbo.vendor_credits vc
    INNER JOIN inserted i ON vc.id = i.id;
END
GO

CREATE TRIGGER trg_expenses_updated_at
ON dbo.expenses
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE e
    SET updated_at = GETDATE()
    FROM dbo.expenses e
    INNER JOIN inserted i ON e.id = i.id;
END
GO

CREATE TRIGGER trg_gst_settings_updated_at
ON dbo.gst_settings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE gs
    SET updated_at = GETDATE()
    FROM dbo.gst_settings gs
    INNER JOIN inserted i ON gs.id = i.id;
END
GO

-- =============================================
-- STORED PROCEDURE FOR DOCUMENT NUMBER GENERATION
-- =============================================

CREATE PROCEDURE dbo.sp_GenerateDocumentNumber
    @DocumentType NVARCHAR(50),
    @NewDocumentNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Prefix NVARCHAR(20);
    DECLARE @NextNumber INT;
    DECLARE @Padding INT;
    DECLARE @FinancialYear NVARCHAR(20);
    
    -- Get or create sequence for document type
    IF NOT EXISTS (SELECT 1 FROM dbo.document_sequences WHERE document_type = @DocumentType)
    BEGIN
        INSERT INTO dbo.document_sequences (document_type, prefix, next_number, padding)
        VALUES (@DocumentType, 
                CASE @DocumentType 
                    WHEN 'QUOTATION' THEN 'Q'
                    WHEN 'SALES_ORDER' THEN 'SO'
                    WHEN 'DELIVERY_CHALLAN' THEN 'DC'
                    WHEN 'INVOICE' THEN 'INV'
                    WHEN 'CREDIT_NOTE' THEN 'CN'
                    WHEN 'PURCHASE_ORDER' THEN 'PO'
                    WHEN 'BILL' THEN 'BIL'
                    WHEN 'VENDOR_CREDIT' THEN 'VC'
                    WHEN 'PAYMENT_RECEIVED' THEN 'PR'
                    WHEN 'PAYMENT_MADE' THEN 'PM'
                    WHEN 'JOURNAL' THEN 'JV'
                    ELSE LEFT(@DocumentType, 3)
                END,
                1, 6);
    END
    
    -- Get current sequence values
    SELECT @Prefix = prefix, @NextNumber = next_number, @Padding = padding
    FROM dbo.document_sequences
    WHERE document_type = @DocumentType;
    
    -- Generate document number
    SET @NewDocumentNumber = @Prefix + RIGHT('000000' + CAST(@NextNumber AS NVARCHAR(10)), @Padding);
    
    -- Update next number
    UPDATE dbo.document_sequences
    SET next_number = next_number + 1
    WHERE document_type = @DocumentType;
END
GO

-- =============================================
-- STORED PROCEDURE FOR STOCK UPDATE
-- =============================================

CREATE PROCEDURE dbo.sp_UpdateStock
    @ItemId UNIQUEIDENTIFIER,
    @Quantity DECIMAL(15,2),
    @MovementType VARCHAR(30),
    @ReferenceId UNIQUEIDENTIFIER = NULL,
    @ReferenceType NVARCHAR(100) = NULL,
    @CostPrice DECIMAL(15,2) = 0,
    @UserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Update item stock
        IF @MovementType IN ('PURCHASE', 'RECEIPT', 'RETURN_IN')
        BEGIN
            UPDATE dbo.items
            SET current_stock = current_stock + @Quantity
            WHERE id = @ItemId;
        END
        ELSE IF @MovementType IN ('SALE', 'ISSUE', 'RETURN_OUT', 'ADJUSTMENT_MINUS')
        BEGIN
            UPDATE dbo.items
            SET current_stock = current_stock - @Quantity
            WHERE id = @ItemId;
        END
        
        -- Record stock movement
        INSERT INTO dbo.stock_movements (
            item_id, movement_type, quantity, cost_price, 
            reference_id, reference_type, notes, created_by, created_at
        )
        VALUES (
            @ItemId, @MovementType, @Quantity, @CostPrice,
            @ReferenceId, @ReferenceType, 
            'Stock ' + @MovementType + ' of ' + CAST(@Quantity AS NVARCHAR(20)),
            @UserId, GETDATE()
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IX_profiles_user_id ON dbo.profiles(user_id);
CREATE INDEX IX_user_roles_user_id ON dbo.user_roles(user_id);
CREATE INDEX IX_accounts_parent_id ON dbo.accounts(parent_id);
CREATE INDEX IX_accounts_account_type ON dbo.accounts(account_type);
CREATE INDEX IX_customers_created_by ON dbo.customers(created_by);
CREATE INDEX IX_customers_is_active ON dbo.customers(is_active);
CREATE INDEX IX_vendors_created_by ON dbo.vendors(created_by);
CREATE INDEX IX_vendors_is_active ON dbo.vendors(is_active);
CREATE INDEX IX_items_tax_rate_id ON dbo.items(tax_rate_id);
CREATE INDEX IX_items_is_active ON dbo.items(is_active);
CREATE INDEX IX_items_sku ON dbo.items(sku) WHERE sku IS NOT NULL;

-- Sales document indexes
CREATE INDEX IX_quotations_customer_id ON dbo.quotations(customer_id);
CREATE INDEX IX_quotations_created_by ON dbo.quotations(created_by);
CREATE INDEX IX_quotations_date ON dbo.quotations(date);
CREATE INDEX IX_quotation_items_quotation_id ON dbo.quotation_items(quotation_id);
CREATE INDEX IX_quotation_items_item_id ON dbo.quotation_items(item_id);

CREATE INDEX IX_sales_orders_customer_id ON dbo.sales_orders(customer_id);
CREATE INDEX IX_sales_orders_created_by ON dbo.sales_orders(created_by);
CREATE INDEX IX_sales_orders_date ON dbo.sales_orders(date);
CREATE INDEX IX_sales_order_items_sales_order_id ON dbo.sales_order_items(sales_order_id);

CREATE INDEX IX_delivery_challans_customer_id ON dbo.delivery_challans(customer_id);
CREATE INDEX IX_delivery_challans_created_by ON dbo.delivery_challans(created_by);
CREATE INDEX IX_delivery_challan_items_delivery_challan_id ON dbo.delivery_challan_items(delivery_challan_id);

CREATE INDEX IX_invoices_customer_id ON dbo.invoices(customer_id);
CREATE INDEX IX_invoices_created_by ON dbo.invoices(created_by);
CREATE INDEX IX_invoices_date ON dbo.invoices(date);
CREATE INDEX IX_invoice_items_invoice_id ON dbo.invoice_items(invoice_id);

CREATE INDEX IX_credit_notes_customer_id ON dbo.credit_notes(customer_id);
CREATE INDEX IX_credit_notes_created_by ON dbo.credit_notes(created_by);
CREATE INDEX IX_credit_note_items_credit_note_id ON dbo.credit_note_items(credit_note_id);

-- Purchase document indexes
CREATE INDEX IX_purchase_orders_vendor_id ON dbo.purchase_orders(vendor_id);
CREATE INDEX IX_purchase_orders_created_by ON dbo.purchase_orders(created_by);
CREATE INDEX IX_purchase_order_items_purchase_order_id ON dbo.purchase_order_items(purchase_order_id);

CREATE INDEX IX_bills_vendor_id ON dbo.bills(vendor_id);
CREATE INDEX IX_bills_created_by ON dbo.bills(created_by);
CREATE INDEX IX_bill_items_bill_id ON dbo.bill_items(bill_id);

CREATE INDEX IX_vendor_credits_vendor_id ON dbo.vendor_credits(vendor_id);
CREATE INDEX IX_vendor_credits_created_by ON dbo.vendor_credits(created_by);
CREATE INDEX IX_vendor_credit_items_vendor_credit_id ON dbo.vendor_credit_items(vendor_credit_id);

-- Payment indexes
CREATE INDEX IX_payments_received_customer_id ON dbo.payments_received(customer_id);
CREATE INDEX IX_payments_received_created_by ON dbo.payments_received(created_by);
CREATE INDEX IX_payments_received_date ON dbo.payments_received(date);

CREATE INDEX IX_payments_made_vendor_id ON dbo.payments_made(vendor_id);
CREATE INDEX IX_payments_made_created_by ON dbo.payments_made(created_by);
CREATE INDEX IX_payments_made_date ON dbo.payments_made(date);

-- Other indexes
CREATE INDEX IX_expenses_vendor_id ON dbo.expenses(vendor_id);
CREATE INDEX IX_expenses_created_by ON dbo.expenses(created_by);
CREATE INDEX IX_expenses_date ON dbo.expenses(date);

CREATE INDEX IX_journal_entries_created_by ON dbo.journal_entries(created_by);
CREATE INDEX IX_journal_entries_date ON dbo.journal_entries(date);
CREATE INDEX IX_journal_entry_lines_journal_entry_id ON dbo.journal_entry_lines(journal_entry_id);
CREATE INDEX IX_journal_entry_lines_account_id ON dbo.journal_entry_lines(account_id);

CREATE INDEX IX_stock_movements_item_id ON dbo.stock_movements(item_id);
CREATE INDEX IX_stock_movements_created_at ON dbo.stock_movements(created_at);

CREATE INDEX IX_audit_trail_record_id ON dbo.audit_trail(record_id);
CREATE INDEX IX_audit_trail_created_at ON dbo.audit_trail(created_at);

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

-- Insert default admin user (password: Admin@123 - you should change this)
DECLARE @AdminUserId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.users (id, username, email, password_hash, is_active, created_at, updated_at)
VALUES 
    (@AdminUserId, 'admin', 'admin@billflow.com', HASHBYTES('SHA2_256', 'Admin@123'), 1, GETDATE(), GETDATE());

-- Insert admin role
INSERT INTO dbo.user_roles (id, user_id, role, created_at)
VALUES (NEWID(), @AdminUserId, 'admin', GETDATE());

-- Insert admin profile
INSERT INTO dbo.profiles (id, user_id, display_name, email, created_at, updated_at)
VALUES (NEWID(), @AdminUserId, 'Administrator', 'admin@billflow.com', GETDATE(), GETDATE());

-- Insert basic tax rates
INSERT INTO dbo.tax_rates (id, name, rate, tax_type, is_active, created_at, updated_at)
VALUES 
    (NEWID(), 'GST 0%', 0, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 5%', 5, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 12%', 12, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 18%', 18, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 28%', 28, 'GST', 1, GETDATE(), GETDATE());

-- Insert default GST settings
INSERT INTO dbo.gst_settings (id, gstin, legal_name, trade_name, state, state_code, updated_at)
VALUES (NEWID(), NULL, 'Billflow Accounting', 'Billflow', NULL, NULL, GETDATE());

-- Insert basic chart of accounts
INSERT INTO dbo.accounts (id, code, name, account_type, is_system, balance, created_at, updated_at)
VALUES 
    (NEWID(), '1000', 'Assets', 'asset', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '1100', 'Current Assets', 'asset', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '1200', 'Fixed Assets', 'asset', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '2000', 'Liabilities', 'liability', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '2100', 'Current Liabilities', 'liability', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '3000', 'Equity', 'equity', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '4000', 'Income', 'income', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '5000', 'Expenses', 'expense', 1, 0, GETDATE(), GETDATE());

PRINT 'Billflow Accounting System database schema created successfully!';
GO-- SQL Server Migration - Billflow Accounting System
-- This script includes cleanup of existing objects
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================
-- CLEANUP EXISTING OBJECTS (if they exist)
-- =============================================

-- Drop triggers first
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_users_updated_at') DROP TRIGGER dbo.trg_users_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_profiles_updated_at') DROP TRIGGER dbo.trg_profiles_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_accounts_updated_at') DROP TRIGGER dbo.trg_accounts_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_tax_rates_updated_at') DROP TRIGGER dbo.trg_tax_rates_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_customers_updated_at') DROP TRIGGER dbo.trg_customers_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_vendors_updated_at') DROP TRIGGER dbo.trg_vendors_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_items_updated_at') DROP TRIGGER dbo.trg_items_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_quotations_updated_at') DROP TRIGGER dbo.trg_quotations_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_sales_orders_updated_at') DROP TRIGGER dbo.trg_sales_orders_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_delivery_challans_updated_at') DROP TRIGGER dbo.trg_delivery_challans_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_invoices_updated_at') DROP TRIGGER dbo.trg_invoices_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_credit_notes_updated_at') DROP TRIGGER dbo.trg_credit_notes_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_purchase_orders_updated_at') DROP TRIGGER dbo.trg_purchase_orders_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_bills_updated_at') DROP TRIGGER dbo.trg_bills_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_vendor_credits_updated_at') DROP TRIGGER dbo.trg_vendor_credits_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_expenses_updated_at') DROP TRIGGER dbo.trg_expenses_updated_at;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_gst_settings_updated_at') DROP TRIGGER dbo.trg_gst_settings_updated_at;
GO

-- Drop stored procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GenerateDocumentNumber') DROP PROCEDURE dbo.sp_GenerateDocumentNumber;
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateStock') DROP PROCEDURE dbo.sp_UpdateStock;
GO

-- Drop tables in reverse order (to handle foreign key constraints)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_trail') DROP TABLE dbo.audit_trail;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_movements') DROP TABLE dbo.stock_movements;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'journal_entry_lines') DROP TABLE dbo.journal_entry_lines;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'journal_entries') DROP TABLE dbo.journal_entries;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'expenses') DROP TABLE dbo.expenses;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'payments_made') DROP TABLE dbo.payments_made;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'payments_received') DROP TABLE dbo.payments_received;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_credit_items') DROP TABLE dbo.vendor_credit_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_credits') DROP TABLE dbo.vendor_credits;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bill_items') DROP TABLE dbo.bill_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'bills') DROP TABLE dbo.bills;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_order_items') DROP TABLE dbo.purchase_order_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_orders') DROP TABLE dbo.purchase_orders;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_note_items') DROP TABLE dbo.credit_note_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_notes') DROP TABLE dbo.credit_notes;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'invoice_items') DROP TABLE dbo.invoice_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'invoices') DROP TABLE dbo.invoices;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_challan_items') DROP TABLE dbo.delivery_challan_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_challans') DROP TABLE dbo.delivery_challans;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sales_order_items') DROP TABLE dbo.sales_order_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sales_orders') DROP TABLE dbo.sales_orders;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'quotation_items') DROP TABLE dbo.quotation_items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'quotations') DROP TABLE dbo.quotations;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items') DROP TABLE dbo.items;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vendors') DROP TABLE dbo.vendors;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'customers') DROP TABLE dbo.customers;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'tax_rates') DROP TABLE dbo.tax_rates;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'accounts') DROP TABLE dbo.accounts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles') DROP TABLE dbo.user_roles;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'profiles') DROP TABLE dbo.profiles;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users') DROP TABLE dbo.users;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'document_sequences') DROP TABLE dbo.document_sequences;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'gst_settings') DROP TABLE dbo.gst_settings;
GO

-- =============================================
-- BILLFLOW ACCOUNTING SYSTEM - CORE SCHEMA
-- =============================================

-- 1. USERS TABLE (base table for authentication)
CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    last_login DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_users_username UNIQUE (username),
    CONSTRAINT UQ_users_email UNIQUE (email)
);
GO

-- 2. PROFILES TABLE
CREATE TABLE dbo.profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    display_name NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_profiles_user UNIQUE (user_id)
);
GO

-- 3. USER ROLES TABLE
CREATE TABLE dbo.user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role VARCHAR(50) NOT NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_user_roles UNIQUE (user_id, role)
);
GO

-- 4. CHART OF ACCOUNTS
CREATE TABLE dbo.accounts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    account_type NVARCHAR(50) NOT NULL,
    parent_id UNIQUEIDENTIFIER NULL,
    is_system BIT NOT NULL DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_accounts_parent FOREIGN KEY (parent_id) REFERENCES dbo.accounts(id),
    CONSTRAINT UQ_accounts_code UNIQUE (code),
    CONSTRAINT CK_account_type CHECK (account_type IN ('asset','liability','equity','income','expense'))
);
GO

-- 5. TAX RATES
CREATE TABLE dbo.tax_rates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    tax_type NVARCHAR(50) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT CK_tax_type CHECK (tax_type IN ('cgst', 'sgst', 'igst', 'cess', 'composite', 'GST', 'IGST', 'exempt'))
);
GO

-- 6. CUSTOMERS
CREATE TABLE dbo.customers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    gstin NVARCHAR(50) NULL,
    pan NVARCHAR(50) NULL,
    billing_address NVARCHAR(MAX) NULL,
    shipping_address NVARCHAR(MAX) NULL,
    state NVARCHAR(100) NULL,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_customers_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

-- 7. VENDORS
CREATE TABLE dbo.vendors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    gstin NVARCHAR(50) NULL,
    pan NVARCHAR(50) NULL,
    address NVARCHAR(MAX) NULL,
    state NVARCHAR(100) NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vendors_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

-- 8. ITEMS / INVENTORY
CREATE TABLE dbo.items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    sku NVARCHAR(100) NULL,
    hsn_code NVARCHAR(20) NULL,
    category NVARCHAR(100) NULL,
    unit NVARCHAR(20) NOT NULL DEFAULT 'pcs',
    purchase_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    selling_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    opening_stock DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_stock DECIMAL(15,2) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(15,2) DEFAULT 10,
    is_active BIT NOT NULL DEFAULT 1,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id),
    CONSTRAINT FK_items_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_items_sku UNIQUE (sku)
);
GO

-- 9. QUOTATIONS
CREATE TABLE dbo.quotations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    valid_until DATE NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    terms NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_quotations_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_quotations_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_quotations_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.quotation_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    quotation_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_quotation_items_quotation FOREIGN KEY (quotation_id) REFERENCES dbo.quotations(id) ON DELETE CASCADE,
    CONSTRAINT FK_quotation_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_quotation_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 10. SALES ORDERS
CREATE TABLE dbo.sales_orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    expected_delivery DATE NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    quotation_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_sales_orders_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_sales_orders_quotation FOREIGN KEY (quotation_id) REFERENCES dbo.quotations(id),
    CONSTRAINT FK_sales_orders_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_sales_orders_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.sales_order_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sales_order_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_so_items_sales_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_so_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_so_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 11. DELIVERY CHALLANS
CREATE TABLE dbo.delivery_challans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    sales_order_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_delivery_challans_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_delivery_challans_sales_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_orders(id),
    CONSTRAINT FK_delivery_challans_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_delivery_challans_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.delivery_challan_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    delivery_challan_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_dc_items_delivery_challan FOREIGN KEY (delivery_challan_id) REFERENCES dbo.delivery_challans(id) ON DELETE CASCADE,
    CONSTRAINT FK_dc_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id)
);
GO

-- 12. INVOICES
CREATE TABLE dbo.invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date DATE NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    sales_order_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    irn NVARCHAR(100) NULL,
    eway_bill NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    terms NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_invoices_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_invoices_sales_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_orders(id),
    CONSTRAINT FK_invoices_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_invoices_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.invoice_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE CASCADE,
    CONSTRAINT FK_invoice_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_invoice_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 13. CREDIT NOTES
CREATE TABLE dbo.credit_notes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    reason NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_credit_notes_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_credit_notes_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id),
    CONSTRAINT FK_credit_notes_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_credit_notes_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.credit_note_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    credit_note_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_cn_items_credit_note FOREIGN KEY (credit_note_id) REFERENCES dbo.credit_notes(id) ON DELETE CASCADE,
    CONSTRAINT FK_cn_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_cn_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 14. PURCHASE ORDERS
CREATE TABLE dbo.purchase_orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    expected_delivery DATE NULL,
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_purchase_orders_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_purchase_orders_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_purchase_orders_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.purchase_order_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    purchase_order_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    tenant_id UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_po_items_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES dbo.purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_po_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_po_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 15. BILLS
CREATE TABLE dbo.bills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date DATE NULL,
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    purchase_order_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_bills_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_bills_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES dbo.purchase_orders(id),
    CONSTRAINT FK_bills_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_bills_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.bill_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    bill_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_bill_items_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id) ON DELETE CASCADE,
    CONSTRAINT FK_bill_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_bill_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 16. VENDOR CREDITS
CREATE TABLE dbo.vendor_credits (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    bill_id UNIQUEIDENTIFIER NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    reason NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vendor_credits_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_vendor_credits_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id),
    CONSTRAINT FK_vendor_credits_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_vendor_credits_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.vendor_credit_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    vendor_credit_id UNIQUEIDENTIFIER NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_id UNIQUEIDENTIFIER NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_vc_items_vendor_credit FOREIGN KEY (vendor_credit_id) REFERENCES dbo.vendor_credits(id) ON DELETE CASCADE,
    CONSTRAINT FK_vc_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_vc_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES dbo.tax_rates(id)
);
GO

-- 17. PAYMENTS RECEIVED
CREATE TABLE dbo.payments_received (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_mode NVARCHAR(50) NOT NULL DEFAULT 'cash',
    reference_number NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payments_received_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
    CONSTRAINT FK_payments_received_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id),
    CONSTRAINT FK_payments_received_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_payments_received_number UNIQUE (payment_number),
    CONSTRAINT CK_payment_mode_received CHECK (payment_mode IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'))
);
GO

-- 18. PAYMENTS MADE
CREATE TABLE dbo.payments_made (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    vendor_id UNIQUEIDENTIFIER NOT NULL,
    bill_id UNIQUEIDENTIFIER NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_mode NVARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    reference_number NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payments_made_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_payments_made_bill FOREIGN KEY (bill_id) REFERENCES dbo.bills(id),
    CONSTRAINT FK_payments_made_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_payments_made_number UNIQUE (payment_number),
    CONSTRAINT CK_payment_mode_made CHECK (payment_mode IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'))
);
GO

-- 19. EXPENSES
CREATE TABLE dbo.expenses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    category NVARCHAR(100) NOT NULL,
    vendor_id UNIQUEIDENTIFIER NULL,
    account_id UNIQUEIDENTIFIER NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_mode NVARCHAR(50) DEFAULT 'cash',
    description NVARCHAR(MAX) NULL,
    is_recurring BIT NOT NULL DEFAULT 0,
    recurring_frequency NVARCHAR(20) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_expenses_vendor FOREIGN KEY (vendor_id) REFERENCES dbo.vendors(id),
    CONSTRAINT FK_expenses_account FOREIGN KEY (account_id) REFERENCES dbo.accounts(id),
    CONSTRAINT FK_expenses_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT CK_recurring_frequency CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly'))
);
GO

-- 20. JOURNAL ENTRIES
CREATE TABLE dbo.journal_entries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_number NVARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    journal_type VARCHAR(30) NOT NULL DEFAULT 'manual',
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    description NVARCHAR(MAX) NULL,
    is_auto BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_journal_entries_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
    CONSTRAINT UQ_journal_entries_doc_number UNIQUE (document_number)
);
GO

CREATE TABLE dbo.journal_entry_lines (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    journal_entry_id UNIQUEIDENTIFIER NOT NULL,
    account_id UNIQUEIDENTIFIER NOT NULL,
    debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    description NVARCHAR(MAX) NULL,
    CONSTRAINT FK_jel_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES dbo.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT FK_jel_account FOREIGN KEY (account_id) REFERENCES dbo.accounts(id)
);
GO

-- 21. STOCK MOVEMENTS
CREATE TABLE dbo.stock_movements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    item_id UNIQUEIDENTIFIER NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2) DEFAULT 0,
    reference_id UNIQUEIDENTIFIER NULL,
    reference_type NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_stock_movements_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_stock_movements_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

-- 22. DOCUMENT SEQUENCES
CREATE TABLE dbo.document_sequences (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    document_type NVARCHAR(50) NOT NULL,
    prefix NVARCHAR(20) NOT NULL,
    next_number INT NOT NULL DEFAULT 1,
    padding INT NOT NULL DEFAULT 4,
    financial_year NVARCHAR(20) NULL,
    CONSTRAINT UQ_document_sequences_type UNIQUE (document_type)
);
GO

-- 23. GST SETTINGS
CREATE TABLE dbo.gst_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    gstin NVARCHAR(50) NULL,
    legal_name NVARCHAR(255) NULL,
    trade_name NVARCHAR(255) NULL,
    state NVARCHAR(100) NULL,
    state_code NVARCHAR(10) NULL,
    tenant_id UNIQUEIDENTIFIER NULL,
    is_composition BIT NOT NULL DEFAULT 0,
    reverse_charge_applicable BIT NOT NULL DEFAULT 0,
    einvoice_enabled BIT NOT NULL DEFAULT 0,
    eway_bill_enabled BIT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 24. AUDIT TRAIL
CREATE TABLE dbo.audit_trail (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    table_name NVARCHAR(255) NOT NULL,
    record_id UNIQUEIDENTIFIER NOT NULL,
    action NVARCHAR(50) NOT NULL,
    old_data NVARCHAR(MAX) NULL,
    new_data NVARCHAR(MAX) NULL,
    user_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_audit_trail_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_audit_action CHECK (action IN ('create', 'update', 'delete'))
);
GO

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER trg_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET updated_at = GETDATE()
    FROM dbo.users u
    INNER JOIN inserted i ON u.id = i.id;
END
GO

CREATE TRIGGER trg_profiles_updated_at
ON dbo.profiles
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
    SET updated_at = GETDATE()
    FROM dbo.profiles p
    INNER JOIN inserted i ON p.id = i.id;
END
GO

CREATE TRIGGER trg_accounts_updated_at
ON dbo.accounts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE a
    SET updated_at = GETDATE()
    FROM dbo.accounts a
    INNER JOIN inserted i ON a.id = i.id;
END
GO

CREATE TRIGGER trg_tax_rates_updated_at
ON dbo.tax_rates
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tr
    SET updated_at = GETDATE()
    FROM dbo.tax_rates tr
    INNER JOIN inserted i ON tr.id = i.id;
END
GO

CREATE TRIGGER trg_customers_updated_at
ON dbo.customers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE c
    SET updated_at = GETDATE()
    FROM dbo.customers c
    INNER JOIN inserted i ON c.id = i.id;
END
GO

CREATE TRIGGER trg_vendors_updated_at
ON dbo.vendors
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE v
    SET updated_at = GETDATE()
    FROM dbo.vendors v
    INNER JOIN inserted i ON v.id = i.id;
END
GO

CREATE TRIGGER trg_items_updated_at
ON dbo.items
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE i
    SET updated_at = GETDATE()
    FROM dbo.items i
    INNER JOIN inserted ins ON i.id = ins.id;
END
GO

CREATE TRIGGER trg_quotations_updated_at
ON dbo.quotations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q
    SET updated_at = GETDATE()
    FROM dbo.quotations q
    INNER JOIN inserted i ON q.id = i.id;
END
GO

CREATE TRIGGER trg_sales_orders_updated_at
ON dbo.sales_orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE so
    SET updated_at = GETDATE()
    FROM dbo.sales_orders so
    INNER JOIN inserted i ON so.id = i.id;
END
GO

CREATE TRIGGER trg_delivery_challans_updated_at
ON dbo.delivery_challans
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dc
    SET updated_at = GETDATE()
    FROM dbo.delivery_challans dc
    INNER JOIN inserted i ON dc.id = i.id;
END
GO

CREATE TRIGGER trg_invoices_updated_at
ON dbo.invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inv
    SET updated_at = GETDATE()
    FROM dbo.invoices inv
    INNER JOIN inserted i ON inv.id = i.id;
END
GO

CREATE TRIGGER trg_credit_notes_updated_at
ON dbo.credit_notes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE cn
    SET updated_at = GETDATE()
    FROM dbo.credit_notes cn
    INNER JOIN inserted i ON cn.id = i.id;
END
GO

CREATE TRIGGER trg_purchase_orders_updated_at
ON dbo.purchase_orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE po
    SET updated_at = GETDATE()
    FROM dbo.purchase_orders po
    INNER JOIN inserted i ON po.id = i.id;
END
GO

CREATE TRIGGER trg_bills_updated_at
ON dbo.bills
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE b
    SET updated_at = GETDATE()
    FROM dbo.bills b
    INNER JOIN inserted i ON b.id = i.id;
END
GO

CREATE TRIGGER trg_vendor_credits_updated_at
ON dbo.vendor_credits
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE vc
    SET updated_at = GETDATE()
    FROM dbo.vendor_credits vc
    INNER JOIN inserted i ON vc.id = i.id;
END
GO

CREATE TRIGGER trg_expenses_updated_at
ON dbo.expenses
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE e
    SET updated_at = GETDATE()
    FROM dbo.expenses e
    INNER JOIN inserted i ON e.id = i.id;
END
GO

CREATE TRIGGER trg_gst_settings_updated_at
ON dbo.gst_settings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE gs
    SET updated_at = GETDATE()
    FROM dbo.gst_settings gs
    INNER JOIN inserted i ON gs.id = i.id;
END
GO

-- =============================================
-- STORED PROCEDURE FOR DOCUMENT NUMBER GENERATION
-- =============================================

CREATE PROCEDURE dbo.sp_GenerateDocumentNumber
    @DocumentType NVARCHAR(50),
    @NewDocumentNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Prefix NVARCHAR(20);
    DECLARE @NextNumber INT;
    DECLARE @Padding INT;
    DECLARE @FinancialYear NVARCHAR(20);
    
    -- Get or create sequence for document type
    IF NOT EXISTS (SELECT 1 FROM dbo.document_sequences WHERE document_type = @DocumentType)
    BEGIN
        INSERT INTO dbo.document_sequences (document_type, prefix, next_number, padding)
        VALUES (@DocumentType, 
                CASE @DocumentType 
                    WHEN 'QUOTATION' THEN 'Q'
                    WHEN 'SALES_ORDER' THEN 'SO'
                    WHEN 'DELIVERY_CHALLAN' THEN 'DC'
                    WHEN 'INVOICE' THEN 'INV'
                    WHEN 'CREDIT_NOTE' THEN 'CN'
                    WHEN 'PURCHASE_ORDER' THEN 'PO'
                    WHEN 'BILL' THEN 'BIL'
                    WHEN 'VENDOR_CREDIT' THEN 'VC'
                    WHEN 'PAYMENT_RECEIVED' THEN 'PR'
                    WHEN 'PAYMENT_MADE' THEN 'PM'
                    WHEN 'JOURNAL' THEN 'JV'
                    ELSE LEFT(@DocumentType, 3)
                END,
                1, 6);
    END
    
    -- Get current sequence values
    SELECT @Prefix = prefix, @NextNumber = next_number, @Padding = padding
    FROM dbo.document_sequences
    WHERE document_type = @DocumentType;
    
    -- Generate document number
    SET @NewDocumentNumber = @Prefix + RIGHT('000000' + CAST(@NextNumber AS NVARCHAR(10)), @Padding);
    
    -- Update next number
    UPDATE dbo.document_sequences
    SET next_number = next_number + 1
    WHERE document_type = @DocumentType;
END
GO

-- =============================================
-- STORED PROCEDURE FOR STOCK UPDATE
-- =============================================

CREATE PROCEDURE dbo.sp_UpdateStock
    @ItemId UNIQUEIDENTIFIER,
    @Quantity DECIMAL(15,2),
    @MovementType VARCHAR(30),
    @ReferenceId UNIQUEIDENTIFIER = NULL,
    @ReferenceType NVARCHAR(100) = NULL,
    @CostPrice DECIMAL(15,2) = 0,
    @UserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Update item stock
        IF @MovementType IN ('PURCHASE', 'RECEIPT', 'RETURN_IN')
        BEGIN
            UPDATE dbo.items
            SET current_stock = current_stock + @Quantity
            WHERE id = @ItemId;
        END
        ELSE IF @MovementType IN ('SALE', 'ISSUE', 'RETURN_OUT', 'ADJUSTMENT_MINUS')
        BEGIN
            UPDATE dbo.items
            SET current_stock = current_stock - @Quantity
            WHERE id = @ItemId;
        END
        
        -- Record stock movement
        INSERT INTO dbo.stock_movements (
            item_id, movement_type, quantity, cost_price, 
            reference_id, reference_type, notes, created_by, created_at
        )
        VALUES (
            @ItemId, @MovementType, @Quantity, @CostPrice,
            @ReferenceId, @ReferenceType, 
            'Stock ' + @MovementType + ' of ' + CAST(@Quantity AS NVARCHAR(20)),
            @UserId, GETDATE()
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IX_profiles_user_id ON dbo.profiles(user_id);
CREATE INDEX IX_user_roles_user_id ON dbo.user_roles(user_id);
CREATE INDEX IX_accounts_parent_id ON dbo.accounts(parent_id);
CREATE INDEX IX_accounts_account_type ON dbo.accounts(account_type);
CREATE INDEX IX_customers_created_by ON dbo.customers(created_by);
CREATE INDEX IX_customers_is_active ON dbo.customers(is_active);
CREATE INDEX IX_vendors_created_by ON dbo.vendors(created_by);
CREATE INDEX IX_vendors_is_active ON dbo.vendors(is_active);
CREATE INDEX IX_items_tax_rate_id ON dbo.items(tax_rate_id);
CREATE INDEX IX_items_is_active ON dbo.items(is_active);
CREATE INDEX IX_items_sku ON dbo.items(sku) WHERE sku IS NOT NULL;

-- Sales document indexes
CREATE INDEX IX_quotations_customer_id ON dbo.quotations(customer_id);
CREATE INDEX IX_quotations_created_by ON dbo.quotations(created_by);
CREATE INDEX IX_quotations_date ON dbo.quotations(date);
CREATE INDEX IX_quotation_items_quotation_id ON dbo.quotation_items(quotation_id);
CREATE INDEX IX_quotation_items_item_id ON dbo.quotation_items(item_id);

CREATE INDEX IX_sales_orders_customer_id ON dbo.sales_orders(customer_id);
CREATE INDEX IX_sales_orders_created_by ON dbo.sales_orders(created_by);
CREATE INDEX IX_sales_orders_date ON dbo.sales_orders(date);
CREATE INDEX IX_sales_order_items_sales_order_id ON dbo.sales_order_items(sales_order_id);

CREATE INDEX IX_delivery_challans_customer_id ON dbo.delivery_challans(customer_id);
CREATE INDEX IX_delivery_challans_created_by ON dbo.delivery_challans(created_by);
CREATE INDEX IX_delivery_challan_items_delivery_challan_id ON dbo.delivery_challan_items(delivery_challan_id);

CREATE INDEX IX_invoices_customer_id ON dbo.invoices(customer_id);
CREATE INDEX IX_invoices_created_by ON dbo.invoices(created_by);
CREATE INDEX IX_invoices_date ON dbo.invoices(date);
CREATE INDEX IX_invoice_items_invoice_id ON dbo.invoice_items(invoice_id);

CREATE INDEX IX_credit_notes_customer_id ON dbo.credit_notes(customer_id);
CREATE INDEX IX_credit_notes_created_by ON dbo.credit_notes(created_by);
CREATE INDEX IX_credit_note_items_credit_note_id ON dbo.credit_note_items(credit_note_id);

-- Purchase document indexes
CREATE INDEX IX_purchase_orders_vendor_id ON dbo.purchase_orders(vendor_id);
CREATE INDEX IX_purchase_orders_created_by ON dbo.purchase_orders(created_by);
CREATE INDEX IX_purchase_order_items_purchase_order_id ON dbo.purchase_order_items(purchase_order_id);

CREATE INDEX IX_bills_vendor_id ON dbo.bills(vendor_id);
CREATE INDEX IX_bills_created_by ON dbo.bills(created_by);
CREATE INDEX IX_bill_items_bill_id ON dbo.bill_items(bill_id);

CREATE INDEX IX_vendor_credits_vendor_id ON dbo.vendor_credits(vendor_id);
CREATE INDEX IX_vendor_credits_created_by ON dbo.vendor_credits(created_by);
CREATE INDEX IX_vendor_credit_items_vendor_credit_id ON dbo.vendor_credit_items(vendor_credit_id);

-- Payment indexes
CREATE INDEX IX_payments_received_customer_id ON dbo.payments_received(customer_id);
CREATE INDEX IX_payments_received_created_by ON dbo.payments_received(created_by);
CREATE INDEX IX_payments_received_date ON dbo.payments_received(date);

CREATE INDEX IX_payments_made_vendor_id ON dbo.payments_made(vendor_id);
CREATE INDEX IX_payments_made_created_by ON dbo.payments_made(created_by);
CREATE INDEX IX_payments_made_date ON dbo.payments_made(date);

-- Other indexes
CREATE INDEX IX_expenses_vendor_id ON dbo.expenses(vendor_id);
CREATE INDEX IX_expenses_created_by ON dbo.expenses(created_by);
CREATE INDEX IX_expenses_date ON dbo.expenses(date);

CREATE INDEX IX_journal_entries_created_by ON dbo.journal_entries(created_by);
CREATE INDEX IX_journal_entries_date ON dbo.journal_entries(date);
CREATE INDEX IX_journal_entry_lines_journal_entry_id ON dbo.journal_entry_lines(journal_entry_id);
CREATE INDEX IX_journal_entry_lines_account_id ON dbo.journal_entry_lines(account_id);

CREATE INDEX IX_stock_movements_item_id ON dbo.stock_movements(item_id);
CREATE INDEX IX_stock_movements_created_at ON dbo.stock_movements(created_at);

CREATE INDEX IX_audit_trail_record_id ON dbo.audit_trail(record_id);
CREATE INDEX IX_audit_trail_created_at ON dbo.audit_trail(created_at);

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

-- Insert default admin user (password: Admin@123 - you should change this)
DECLARE @AdminUserId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.users (id, username, email, password_hash, is_active, created_at, updated_at)
VALUES 
    (@AdminUserId, 'admin', 'admin@billflow.com', HASHBYTES('SHA2_256', 'Admin@123'), 1, GETDATE(), GETDATE());

-- Insert admin role
INSERT INTO dbo.user_roles (id, user_id, role, created_at)
VALUES (NEWID(), @AdminUserId, 'admin', GETDATE());

-- Insert admin profile
INSERT INTO dbo.profiles (id, user_id, display_name, email, created_at, updated_at)
VALUES (NEWID(), @AdminUserId, 'Administrator', 'admin@billflow.com', GETDATE(), GETDATE());

-- Insert basic tax rates
INSERT INTO dbo.tax_rates (id, name, rate, tax_type, is_active, created_at, updated_at)
VALUES 
    (NEWID(), 'GST 0%', 0, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 5%', 5, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 12%', 12, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 18%', 18, 'GST', 1, GETDATE(), GETDATE()),
    (NEWID(), 'GST 28%', 28, 'GST', 1, GETDATE(), GETDATE());

-- Insert default GST settings
INSERT INTO dbo.gst_settings (id, gstin, legal_name, trade_name, state, state_code, updated_at)
VALUES (NEWID(), NULL, 'Billflow Accounting', 'Billflow', NULL, NULL, GETDATE());

-- Insert basic chart of accounts
INSERT INTO dbo.accounts (id, code, name, account_type, is_system, balance, created_at, updated_at)
VALUES 
    (NEWID(), '1000', 'Assets', 'asset', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '1100', 'Current Assets', 'asset', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '1200', 'Fixed Assets', 'asset', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '2000', 'Liabilities', 'liability', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '2100', 'Current Liabilities', 'liability', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '3000', 'Equity', 'equity', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '4000', 'Income', 'income', 1, 0, GETDATE(), GETDATE()),
    (NEWID(), '5000', 'Expenses', 'expense', 1, 0, GETDATE(), GETDATE());

PRINT 'Billflow Accounting System database schema created successfully!';
GO
