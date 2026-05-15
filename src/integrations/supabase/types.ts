export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          nature: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          nature?: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          nature?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "account_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_type: string
          balance: number
          code: string
          created_at: string
          id: string
          is_system: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          account_type: string
          balance?: number
          code: string
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          balance?: number
          code?: string
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          module: string
          record_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          module: string
          record_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          module?: string
          record_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          record_id: string
          record_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          record_id: string
          record_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          record_id?: string
          record_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string
          file_url: string | null
          id: string
          size_bytes: number | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name: string
          file_url?: string | null
          id?: string
          size_bytes?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          size_bytes?: number | null
          status?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_id: string | null
          account_number: string | null
          bank_name: string
          branch_name: string | null
          created_at: string
          current_balance: number
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          bank_name: string
          branch_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          bank_name?: string
          branch_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation: {
        Row: {
          bank_account_id: string
          created_at: string
          created_by: string | null
          id: string
          reconciled_balance: number
          statement_balance: number
          statement_date: string
          status: string
        }
        Insert: {
          bank_account_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reconciled_balance?: number
          statement_balance?: number
          statement_date: string
          status?: string
        }
        Update: {
          bank_account_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reconciled_balance?: number
          statement_balance?: number
          statement_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_reconciled: boolean | null
          reconciled_at: string | null
          reference_number: string | null
          type: string
        }
        Insert: {
          amount?: number
          bank_account_id: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          reconciled_at?: string | null
          reference_number?: string | null
          type?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          reconciled_at?: string | null
          reference_number?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_items: {
        Row: {
          amount: number
          bill_id: string
          description: string | null
          id: string
          item_id: string
          quantity: number
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
        }
        Insert: {
          amount?: number
          bill_id: string
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          balance_due: number
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          due_date: string | null
          id: string
          notes: string | null
          purchase_order_id: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          balance_due?: number
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          due_date?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          balance_due?: number
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_name: string
          city: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          phone: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          branch_name: string
          city?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          branch_name?: string
          city?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          created_at: string
          created_by: string | null
          currency: string | null
          email: string | null
          financial_year_start: number | null
          gstin: string | null
          id: string
          logo_url: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          financial_year_start?: number | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          financial_year_start?: number | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      credit_note_items: {
        Row: {
          amount: number
          credit_note_id: string
          description: string | null
          id: string
          item_id: string
          quantity: number
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
        }
        Insert: {
          amount?: number
          credit_note_id: string
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Update: {
          amount?: number
          credit_note_id?: string
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_note_items_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "credit_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          document_number: string
          id: string
          invoice_id: string | null
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          document_number: string
          id?: string
          invoice_id?: string | null
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          document_number?: string
          id?: string
          invoice_id?: string | null
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          contact_name: string
          created_at: string
          customer_id: string
          designation: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          phone: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          customer_id: string
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          customer_id?: string
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address: string | null
          created_at: string
          created_by: string | null
          credit_limit: number | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          outstanding_balance: number
          pan: string | null
          phone: string | null
          shipping_address: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          outstanding_balance?: number
          pan?: string | null
          phone?: string | null
          shipping_address?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outstanding_balance?: number
          pan?: string | null
          phone?: string | null
          shipping_address?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_challan_items: {
        Row: {
          delivery_challan_id: string
          description: string | null
          id: string
          item_id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          delivery_challan_id: string
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          delivery_challan_id?: string
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challan_items_delivery_challan_id_fkey"
            columns: ["delivery_challan_id"]
            isOneToOne: false
            referencedRelation: "delivery_challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challan_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_challans: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          document_number: string
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          sales_order_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          document_number: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          document_number?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challans_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          document_type: string
          financial_year: string | null
          id: string
          next_number: number
          padding: number
          prefix: string
        }
        Insert: {
          document_type: string
          financial_year?: string | null
          id?: string
          next_number?: number
          padding?: number
          prefix: string
        }
        Update: {
          document_type?: string
          financial_year?: string | null
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
        }
        Relationships: []
      }
      e_invoice_records: {
        Row: {
          ack_date: string | null
          ack_number: string | null
          created_at: string
          error_message: string | null
          id: string
          invoice_id: string
          irn: string | null
          signed_invoice: Json | null
          status: string
        }
        Insert: {
          ack_date?: string | null
          ack_number?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id: string
          irn?: string | null
          signed_invoice?: Json | null
          status?: string
        }
        Update: {
          ack_date?: string | null
          ack_number?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string
          irn?: string | null
          signed_invoice?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "e_invoice_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      e_way_bills: {
        Row: {
          created_at: string
          distance_km: number | null
          eway_bill_number: string | null
          id: string
          invoice_id: string
          status: string
          transporter_name: string | null
          valid_from: string | null
          valid_until: string | null
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          eway_bill_number?: string | null
          id?: string
          invoice_id: string
          status?: string
          transporter_name?: string | null
          valid_from?: string | null
          valid_until?: string | null
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          eway_bill_number?: string | null
          id?: string
          invoice_id?: string
          status?: string
          transporter_name?: string | null
          valid_from?: string | null
          valid_until?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_way_bills_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
          created_at: string
          document_id: string | null
          document_type: string | null
          id: string
          sent_by: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          id?: string
          sent_by?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          id?: string
          sent_by?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          from_email: string | null
          from_name: string | null
          id: string
          is_active: boolean | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          updated_at: string
        }
        Insert: {
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string
        }
        Update: {
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean
          payment_mode: string | null
          recurring_frequency: string | null
          tax_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          payment_mode?: string | null
          recurring_frequency?: string | null
          tax_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          payment_mode?: string | null
          recurring_frequency?: string | null
          tax_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          end_date: string
          id: string
          is_closed: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_closed?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_closed?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      gst_returns: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json | null
          filing_date: string | null
          id: string
          period: string
          return_type: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          filing_date?: string | null
          id?: string
          period: string
          return_type: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          filing_date?: string | null
          id?: string
          period?: string
          return_type?: string
          status?: string
        }
        Relationships: []
      }
      gst_settings: {
        Row: {
          einvoice_enabled: boolean
          eway_bill_enabled: boolean
          gstin: string | null
          id: string
          is_composition: boolean
          legal_name: string | null
          reverse_charge_applicable: boolean
          state: string | null
          state_code: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          einvoice_enabled?: boolean
          eway_bill_enabled?: boolean
          gstin?: string | null
          id?: string
          is_composition?: boolean
          legal_name?: string | null
          reverse_charge_applicable?: boolean
          state?: string | null
          state_code?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          einvoice_enabled?: boolean
          eway_bill_enabled?: boolean
          gstin?: string | null
          id?: string
          is_composition?: boolean
          legal_name?: string | null
          reverse_charge_applicable?: boolean
          state?: string | null
          state_code?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_adjustment_items: {
        Row: {
          adjusted_quantity: number
          adjustment_id: string
          cost_price: number | null
          difference: number
          id: string
          item_id: string
          quantity_on_hand: number
        }
        Insert: {
          adjusted_quantity?: number
          adjustment_id: string
          cost_price?: number | null
          difference?: number
          id?: string
          item_id: string
          quantity_on_hand?: number
        }
        Update: {
          adjusted_quantity?: number
          adjustment_id?: string
          cost_price?: number | null
          difference?: number
          id?: string
          item_id?: string
          quantity_on_hand?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustment_items_adjustment_id_fkey"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "inventory_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustment_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          id: string
          reason: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string | null
          id: string
          invoice_id: string
          item_id: string
          quantity: number
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          invoice_id: string
          item_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          invoice_id?: string
          item_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          accent_color: string | null
          footer_text: string | null
          id: string
          notes_text: string | null
          show_logo: boolean | null
          show_signature: boolean | null
          template_id: string
          terms_text: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          footer_text?: string | null
          id?: string
          notes_text?: string | null
          show_logo?: boolean | null
          show_signature?: boolean | null
          template_id?: string
          terms_text?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          footer_text?: string | null
          id?: string
          notes_text?: string | null
          show_logo?: boolean | null
          show_signature?: boolean | null
          template_id?: string
          terms_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          balance_due: number
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          document_number: string
          due_date: string | null
          eway_bill: string | null
          id: string
          irn: string | null
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          sales_order_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          balance_due?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          document_number: string
          due_date?: string | null
          eway_bill?: string | null
          id?: string
          irn?: string | null
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          balance_due?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          document_number?: string
          due_date?: string | null
          eway_bill?: string | null
          id?: string
          irn?: string | null
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          current_stock: number
          hsn_code: string | null
          id: string
          is_active: boolean
          name: string
          opening_stock: number
          purchase_rate: number
          reorder_level: number | null
          selling_rate: number
          sku: string | null
          tax_rate_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_stock?: number
          hsn_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          opening_stock?: number
          purchase_rate?: number
          reorder_level?: number | null
          selling_rate?: number
          sku?: string | null
          tax_rate_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_stock?: number
          hsn_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          opening_stock?: number
          purchase_rate?: number
          reorder_level?: number | null
          selling_rate?: number
          sku?: string | null
          tax_rate_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          document_number: string
          id: string
          is_auto: boolean
          journal_type: Database["public"]["Enums"]["journal_type"]
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          document_number: string
          id?: string
          is_auto?: boolean
          journal_type?: Database["public"]["Enums"]["journal_type"]
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          document_number?: string
          id?: string
          is_auto?: boolean
          journal_type?: Database["public"]["Enums"]["journal_type"]
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments_received"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_made_allocations: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          payment_id: string
        }
        Insert: {
          amount?: number
          bill_id: string
          created_at?: string
          id?: string
          payment_id: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_made_allocations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_made_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments_made"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_made: {
        Row: {
          amount: number
          bill_id: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          payment_mode: string
          payment_number: string
          reference_number: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          payment_mode?: string
          payment_number: string
          reference_number?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          payment_mode?: string
          payment_number?: string
          reference_number?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_made_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_made_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_received: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_mode: string
          payment_number: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_mode?: string
          payment_number: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_mode?: string
          payment_number?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_received_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order_items: {
        Row: {
          amount: number
          discount: number
          id: string
          item_id: string
          item_name: string
          order_id: string
          quantity: number
          rate: number
          tax_amount: number
        }
        Insert: {
          amount?: number
          discount?: number
          id?: string
          item_id: string
          item_name: string
          order_id: string
          quantity?: number
          rate?: number
          tax_amount?: number
        }
        Update: {
          amount?: number
          discount?: number
          id?: string
          item_id?: string
          item_name?: string
          order_id?: string
          quantity?: number
          rate?: number
          tax_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          invoice_id: string | null
          order_number: string
          session_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_id?: string | null
          order_number: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_id?: string | null
          order_number?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_mode: string
          reference_number: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          order_id: string
          payment_mode?: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_mode?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          closed_at: string | null
          closing_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_balance: number
          status: string
          total_card: number | null
          total_cash: number | null
          total_sales: number | null
          total_upi: number | null
        }
        Insert: {
          closed_at?: string | null
          closing_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_balance?: number
          status?: string
          total_card?: number | null
          total_cash?: number | null
          total_sales?: number | null
          total_upi?: number | null
        }
        Update: {
          closed_at?: string | null
          closing_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_balance?: number
          status?: string
          total_card?: number | null
          total_cash?: number | null
          total_sales?: number | null
          total_upi?: number | null
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          price_list_id: string
          rate: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          price_list_id: string
          rate?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          price_list_id?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          amount: number
          description: string | null
          id: string
          item_id: string
          purchase_order_id: string
          quantity: number
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          item_id: string
          purchase_order_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          item_id?: string
          purchase_order_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          expected_delivery: string | null
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_items: {
        Row: {
          amount: number
          id: string
          item_id: string
          purchase_return_id: string
          quantity: number
          rate: number
          sort_order: number | null
          tax_amount: number
        }
        Insert: {
          amount?: number
          id?: string
          item_id: string
          purchase_return_id: string
          quantity?: number
          rate?: number
          sort_order?: number | null
          tax_amount?: number
        }
        Update: {
          amount?: number
          id?: string
          item_id?: string
          purchase_return_id?: string
          quantity?: number
          rate?: number
          sort_order?: number | null
          tax_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_items_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          bill_id: string | null
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          id: string
          notes: string | null
          reason: string | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          description: string | null
          id: string
          item_id: string
          quantity: number
          quotation_id: string
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          quotation_id: string
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          quotation_id?: string
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          document_number: string
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          terms: string | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          document_number: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          document_number?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_bills: {
        Row: {
          base_bill_id: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          next_bill_date: string | null
          start_date: string
          subtotal: number
          tax_amount: number
          total: number
          vendor_id: string
        }
        Insert: {
          base_bill_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_bill_date?: string | null
          start_date?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          vendor_id: string
        }
        Update: {
          base_bill_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_bill_date?: string | null
          start_date?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_base_bill_id_fkey"
            columns: ["base_bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          base_invoice_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          next_invoice_date: string | null
          start_date: string
          subtotal: number
          tax_amount: number
          total: number
        }
        Insert: {
          base_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_invoice_date?: string | null
          start_date?: string
          subtotal?: number
          tax_amount?: number
          total?: number
        }
        Update: {
          base_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_invoice_date?: string | null
          start_date?: string
          subtotal?: number
          tax_amount?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_base_invoice_id_fkey"
            columns: ["base_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cache: {
        Row: {
          data: Json | null
          generated_at: string
          id: string
          period: string
          report_type: string
        }
        Insert: {
          data?: Json | null
          generated_at?: string
          id?: string
          period: string
          report_type: string
        }
        Update: {
          data?: Json | null
          generated_at?: string
          id?: string
          period?: string
          report_type?: string
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          amount: number
          description: string | null
          id: string
          item_id: string
          quantity: number
          rate: number
          sales_order_id: string
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          rate?: number
          sales_order_id: string
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          rate?: number
          sales_order_id?: string
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          document_number: string
          expected_delivery: string | null
          id: string
          notes: string | null
          quotation_id: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          document_number: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          quotation_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          document_number?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          quotation_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_items: {
        Row: {
          amount: number
          id: string
          item_id: string
          quantity: number
          rate: number
          sales_return_id: string
          sort_order: number | null
          tax_amount: number
        }
        Insert: {
          amount?: number
          id?: string
          item_id: string
          quantity?: number
          rate?: number
          sales_return_id: string
          sort_order?: number | null
          tax_amount?: number
        }
        Update: {
          amount?: number
          id?: string
          item_id?: string
          quantity?: number
          rate?: number
          sales_return_id?: string
          sort_order?: number | null
          tax_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_sales_return_id_fkey"
            columns: ["sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          document_number: string
          id: string
          invoice_id: string | null
          notes: string | null
          reason: string | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          document_number: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          document_number?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          cost_price: number | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          id: string
          item_id: string
          quantity: number
          transfer_id: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity?: number
          transfer_id: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          from_warehouse_id: string | null
          id: string
          notes: string | null
          status: string
          to_warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          from_warehouse_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          to_warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          from_warehouse_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          to_warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          category?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      tax_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          cgst: number
          created_at: string
          id: string
          igst: number
          is_active: boolean
          is_default: boolean
          name: string
          rate: number
          sgst: number
          tax_type: string
        }
        Insert: {
          cgst?: number
          created_at?: string
          id?: string
          igst?: number
          is_active?: boolean
          is_default?: boolean
          name: string
          rate: number
          sgst?: number
          tax_type: string
        }
        Update: {
          cgst?: number
          created_at?: string
          id?: string
          igst?: number
          is_active?: boolean
          is_default?: boolean
          name?: string
          rate?: number
          sgst?: number
          tax_type?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_contacts: {
        Row: {
          contact_name: string
          created_at: string
          designation: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          phone: string | null
          vendor_id: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          vendor_id: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_credit_items: {
        Row: {
          amount: number
          description: string | null
          id: string
          item_id: string
          quantity: number
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate_id: string | null
          vendor_credit_id: string
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
          vendor_credit_id: string
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate_id?: string | null
          vendor_credit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_credit_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_credit_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_credit_items_vendor_credit_id_fkey"
            columns: ["vendor_credit_id"]
            isOneToOne: false
            referencedRelation: "vendor_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_credits: {
        Row: {
          bill_id: string | null
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          id: string
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_credits_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_credits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          outstanding_balance: number
          pan: string | null
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          outstanding_balance?: number
          pan?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outstanding_balance?: number
          pan?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      warehouse_stock: {
        Row: {
          id: string
          item_id: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          branch_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          warehouse_name: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          warehouse_name: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_actions: {
        Row: {
          action_config: Json | null
          action_type: string
          id: string
          sort_order: number | null
          workflow_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          id?: string
          sort_order?: number | null
          workflow_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          id?: string
          sort_order?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_actions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          details: string | null
          executed_at: string
          id: string
          status: string
          workflow_id: string
        }
        Insert: {
          details?: string | null
          executed_at?: string
          id?: string
          status?: string
          workflow_id: string
        }
        Update: {
          details?: string | null
          executed_at?: string
          id?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_event: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_event: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_event?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_document_number: { Args: { _doc_type: string }; Returns: string }
      has_any_role: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_accountant: { Args: never; Returns: boolean }
      is_purchase_user: { Args: never; Returns: boolean }
      is_sales_user: { Args: never; Returns: boolean }
      update_stock: {
        Args: {
          _cost?: number
          _item_id: string
          _movement_type: Database["public"]["Enums"]["stock_movement_type"]
          _qty: number
          _ref_id?: string
          _ref_type?: string
          _user_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "accountant" | "sales" | "purchase" | "viewer"
      document_status:
        | "draft"
        | "sent"
        | "confirmed"
        | "converted"
        | "partial"
        | "paid"
        | "overdue"
        | "cancelled"
        | "closed"
      journal_type:
        | "sales"
        | "purchase"
        | "payment"
        | "receipt"
        | "expense"
        | "adjustment"
        | "manual"
      stock_movement_type:
        | "sale"
        | "purchase"
        | "credit_note"
        | "vendor_credit"
        | "transfer"
        | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "accountant", "sales", "purchase", "viewer"],
      document_status: [
        "draft",
        "sent",
        "confirmed",
        "converted",
        "partial",
        "paid",
        "overdue",
        "cancelled",
        "closed",
      ],
      journal_type: [
        "sales",
        "purchase",
        "payment",
        "receipt",
        "expense",
        "adjustment",
        "manual",
      ],
      stock_movement_type: [
        "sale",
        "purchase",
        "credit_note",
        "vendor_credit",
        "transfer",
        "adjustment",
      ],
    },
  },
} as const
