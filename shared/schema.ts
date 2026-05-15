// Raw TypeScript interfaces for database schema matching MSSQL snake_case definitions

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: Date;
}

export interface AuthSession {
  id: string;
  user_id: string;
  jwt_token: string;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AuthAuditLog {
  id: string;
  user_id?: string;
  email?: string;
  event_type: string;
  success: boolean;
  message?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Company {
  id: string;
  company_name: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  financial_year_start?: number;
  currency?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Branch {
  id: string;
  company_id: string;
  branch_name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Warehouse {
  id: string;
  branch_id?: string;
  warehouse_name: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  parent_id?: string;
  is_system: boolean;
  balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface BankAccount {
  id: string;
  account_id?: string;
  bank_name: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  current_balance: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  tax_type: string;
  cgst: number;
  sgst: number;
  igst: number;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GstSetting {
  id: string;
  gstin?: string;
  legal_name?: string;
  trade_name?: string;
  state?: string;
  state_code?: string;
  is_composition: boolean;
  reverse_charge_applicable: boolean;
  einvoice_enabled: boolean;
  eway_bill_enabled: boolean;
  updated_at: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billing_address?: string;
  shipping_address?: string;
  state?: string;
  credit_limit?: number;
  outstanding_balance: number;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  contact_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  is_primary: boolean;
  created_at: Date;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  state?: string;
  outstanding_balance: number;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  contact_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  is_primary: boolean;
  created_at: Date;
}

export interface Item {
  id: string;
  name: string;
  sku?: string;
  hsn_code?: string;
  category?: string;
  unit: string;
  purchase_rate: number;
  selling_rate: number;
  tax_rate_id?: string;
  opening_stock: number;
  current_stock: number;
  reorder_level?: number;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Quotation {
  id: string;
  document_number: string;
  date: Date;
  valid_until?: Date;
  customer_id: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface SalesOrder {
  id: string;
  document_number: string;
  date: Date;
  expected_delivery?: Date;
  customer_id: string;
  quotation_id?: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface DeliveryChallan {
  id: string;
  document_number: string;
  date: Date;
  customer_id: string;
  sales_order_id?: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryChallanItem {
  id: string;
  delivery_challan_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  document_number: string;
  date: Date;
  due_date?: Date;
  customer_id: string;
  sales_order_id?: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  balance_due: number;
  irn?: string;
  eway_bill?: string;
  notes?: string;
  terms?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface CreditNote {
  id: string;
  document_number: string;
  date: Date;
  customer_id: string;
  invoice_id?: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  reason?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreditNoteItem {
  id: string;
  credit_note_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface PurchaseOrder {
  id: string;
  document_number: string;
  date: Date;
  expected_delivery?: Date;
  vendor_id: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface Bill {
  id: string;
  document_number: string;
  date: Date;
  due_date?: Date;
  vendor_id: string;
  purchase_order_id?: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  balance_due: number;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface VendorCredit {
  id: string;
  document_number: string;
  date: Date;
  vendor_id: string;
  bill_id?: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  reason?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VendorCreditItem {
  id: string;
  vendor_credit_id: string;
  item_id: string;
  description?: string;
  quantity: number;
  rate: number;
  tax_rate_id?: string;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface PaymentsReceived {
  id: string;
  payment_number: string;
  date: Date;
  customer_id: string;
  invoice_id?: string;
  amount: number;
  payment_mode: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
}

export interface PaymentsMade {
  id: string;
  payment_number: string;
  date: Date;
  vendor_id: string;
  bill_id?: string;
  amount: number;
  payment_mode: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
}

export interface Expense {
  id: string;
  date: Date;
  category: string;
  vendor_id?: string;
  account_id?: string;
  amount: number;
  tax_amount: number;
  payment_mode?: string;
  description?: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntry {
  id: string;
  document_number: string;
  date: Date;
  journal_type: string;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  is_auto: boolean;
  created_by?: string;
  created_at: Date;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: string;
  quantity: number;
  cost_price?: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
}

export interface DocumentSequence {
  id: string;
  document_type: string;
  prefix: string;
  next_number: number;
  padding: number;
  financial_year?: string;
}

export interface AuditTrail {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data?: string;
  new_data?: string;
  user_id?: string;
  created_at: Date;
}

export interface SystemSetting {
  id: string;
  key: string;
  value?: string;
  category: string;
  updated_at: Date;
}

export interface InvoiceSetting {
  id: string;
  template_id: string;
  show_logo: boolean;
  show_signature: boolean;
  footer_text: string;
  terms_text?: string;
  notes_text?: string;
  accent_color: string;
  updated_at: Date;
}

export interface EmailSetting {
  id: string;
  smtp_host?: string;
  smtp_port: number;
  smtp_username?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
  is_active: boolean;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: Date;
}

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  body?: string;
  status: string;
  document_type?: string;
  document_id?: string;
  sent_by?: string;
  created_at: Date;
}

export interface Attachment {
  id: string;
  record_type: string;
  record_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: Date;
}

export interface PosSession {
  id: string;
  opened_by: string;
  opened_at: Date;
  closed_at?: Date;
  opening_balance: number;
  closing_balance?: number;
  total_sales: number;
  total_cash: number;
  total_upi: number;
  total_card: number;
  status: string;
  notes?: string;
}

export interface PosOrder {
  id: string;
  session_id?: string;
  invoice_id?: string;
  customer_id?: string;
  order_number: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: string;
  created_by?: string;
  created_at: Date;
}

export interface PosOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_amount: number;
  amount: number;
}

export interface PosPayment {
  id: string;
  order_id: string;
  payment_mode: string;
  amount: number;
  reference_number?: string;
  created_at: Date;
}

export interface Workflow {
  id: string;
  name: string;
  trigger_event: string;
  conditions?: string;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
}

export interface WorkflowAction {
  id: string;
  workflow_id: string;
  action_type: string;
  action_config?: string;
  sort_order: number;
}

export interface WorkflowLog {
  id: string;
  workflow_id: string;
  status: string;
  details?: string;
  executed_at: Date;
}