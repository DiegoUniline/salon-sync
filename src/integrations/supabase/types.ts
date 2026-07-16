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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_subscriptions: {
        Row: {
          account_id: string
          amount_paid: number | null
          billing_cycle: string | null
          created_at: string | null
          expires_at: string
          id: string
          notes: string | null
          plan_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          amount_paid?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          notes?: string | null
          plan_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          amount_paid?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          address: string | null
          business_type: string | null
          created_at: string | null
          currency: string | null
          email: string
          facebook: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          tax_id: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          account_id: string | null
          branch_id: string
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          date: string | null
          discount: number
          duration_minutes: number | null
          employee_id: string | null
          folio: string | null
          id: string
          notes: string | null
          payment_status: string | null
          payments: Json
          products: Json
          reminder_24h_sent_at: string | null
          reminder_2h_sent_at: string | null
          reminder_sent: boolean | null
          scheduled_at: string
          service_id: string | null
          services: Json
          status: string | null
          stylist_id: string | null
          subtotal: number
          tax: number | null
          time: string | null
          total: number
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          branch_id: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          date?: string | null
          discount?: number
          duration_minutes?: number | null
          employee_id?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          payments?: Json
          products?: Json
          reminder_24h_sent_at?: string | null
          reminder_2h_sent_at?: string | null
          reminder_sent?: boolean | null
          scheduled_at: string
          service_id?: string | null
          services?: Json
          status?: string | null
          stylist_id?: string | null
          subtotal?: number
          tax?: number | null
          time?: string | null
          total?: number
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          branch_id?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          date?: string | null
          discount?: number
          duration_minutes?: number | null
          employee_id?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          payments?: Json
          products?: Json
          reminder_24h_sent_at?: string | null
          reminder_2h_sent_at?: string | null
          reminder_sent?: boolean | null
          scheduled_at?: string
          service_id?: string | null
          services?: Json
          status?: string | null
          stylist_id?: string | null
          subtotal?: number
          tax?: number | null
          time?: string | null
          total?: number
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          account_id: string
          action: string
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          summary: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          account_id: string
          action: string
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          summary?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          account_id?: string
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          summary?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      blocked_days: {
        Row: {
          account_id: string
          created_at: string | null
          end_date: string
          end_time: string | null
          id: string
          reason: string | null
          start_date: string
          start_time: string | null
          target_id: string | null
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_date: string
          start_time?: string | null
          target_id?: string | null
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_date?: string
          start_time?: string | null
          target_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_days_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          account_id: string
          address: string | null
          color: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_main: boolean | null
          name: string
          phone: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          account_id: string
          address?: string | null
          color?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_id?: string
          address?: string | null
          color?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_cuts: {
        Row: {
          account_id: string
          actual_cash: number | null
          branch_id: string
          created_at: string | null
          cut_date: string | null
          difference: number | null
          expected_cash: number | null
          id: string
          notes: string | null
          shift_id: string | null
          total_card: number | null
          total_cash: number | null
          total_expenses: number | null
          total_sales: number | null
          total_transfer: number | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          actual_cash?: number | null
          branch_id: string
          created_at?: string | null
          cut_date?: string | null
          difference?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          shift_id?: string | null
          total_card?: number | null
          total_cash?: number | null
          total_expenses?: number | null
          total_sales?: number | null
          total_transfer?: number | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          actual_cash?: number | null
          branch_id?: string
          created_at?: string | null
          cut_date?: string | null
          difference?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          shift_id?: string | null
          total_card?: number | null
          total_cash?: number | null
          total_expenses?: number | null
          total_sales?: number | null
          total_transfer?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_cuts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_cuts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_cuts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_cuts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          account_id: string
          amount: number
          branch_id: string | null
          created_at: string
          id: string
          reason: string | null
          reference_id: string | null
          shift_id: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          branch_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          shift_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          branch_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          shift_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_id: string
          address: string | null
          birthday: string | null
          created_at: string | null
          email: string | null
          gender: string | null
          id: string
          last_visit: string | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          tags: Json | null
          total_spent: number | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          address?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          last_visit?: string | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: Json | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          address?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          last_visit?: string | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: Json | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          account_id: string
          branch_id: string | null
          commission_amount: number
          created_at: string
          employee_id: string
          employee_name: string | null
          folio: string | null
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          payment_method: string
          period_from: string
          period_to: string
          sales_included: Json
          tips_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          account_id: string
          branch_id?: string | null
          commission_amount?: number
          created_at?: string
          employee_id: string
          employee_name?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          payment_method?: string
          period_from: string
          period_to: string
          sales_included?: Json
          tips_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          branch_id?: string | null
          commission_amount?: number
          created_at?: string
          employee_id?: string
          employee_name?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          payment_method?: string
          period_from?: string
          period_to?: string
          sales_included?: Json
          tips_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string
          amount: number
          branch_id: string
          category: string | null
          created_at: string | null
          description: string
          expense_date: string | null
          folio: string | null
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          amount?: number
          branch_id: string
          category?: string | null
          created_at?: string | null
          description: string
          expense_date?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          branch_id?: string
          category?: string | null
          created_at?: string | null
          description?: string
          expense_date?: string | null
          folio?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
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
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          id: string
          new_stock: number | null
          notes: string | null
          previous_stock: number | null
          product_id: string
          quantity: number
          reference_id: string | null
          type: string
          unit_cost: number | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          id?: string
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          product_id: string
          quantity: number
          reference_id?: string | null
          type: string
          unit_cost?: number | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          id?: string
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          type?: string
          unit_cost?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          account_id: string
          barcode: string | null
          brand: string | null
          category_id: string | null
          cost: number
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_stock: number | null
          min_stock: number
          name: string
          price: number
          sku: string | null
          stock: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_stock?: number | null
          min_stock?: number
          name: string
          price?: number
          sku?: string | null
          stock?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_stock?: number | null
          min_stock?: number
          name?: string
          price?: number
          sku?: string | null
          stock?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_id: string | null
          avatar_url: string | null
          branch_id: string | null
          color: string | null
          commission_percent: number | null
          created_at: string | null
          custom_role_id: string | null
          email: string
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          permissions: Json | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          color?: string | null
          commission_percent?: number | null
          created_at?: string | null
          custom_role_id?: string | null
          email: string
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permissions?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          color?: string | null
          commission_percent?: number | null
          created_at?: string | null
          custom_role_id?: string | null
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permissions?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          purchase_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          account_id: string
          amount_paid: number | null
          branch_id: string
          created_at: string | null
          expected_date: string | null
          folio: string | null
          id: string
          items: Json | null
          notes: string | null
          payments: Json
          purchase_date: string | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          amount_paid?: number | null
          branch_id: string
          created_at?: string | null
          expected_date?: string | null
          folio?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payments?: Json
          purchase_date?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          amount_paid?: number | null
          branch_id?: string
          created_at?: string | null
          expected_date?: string | null
          folio?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payments?: Json
          purchase_date?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          account_id: string
          appointment_id: string | null
          branch_id: string
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          commission: number | null
          created_at: string | null
          date: string | null
          discount: number | null
          employee_id: string | null
          folio: string | null
          id: string
          items: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          payments: Json
          sale_date: string | null
          shift_id: string | null
          subtotal: number | null
          tax: number | null
          time: string | null
          tip_amount: number
          tip_employee_id: string | null
          tips: Json
          total: number | null
          type: string
        }
        Insert: {
          account_id: string
          appointment_id?: string | null
          branch_id: string
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          commission?: number | null
          created_at?: string | null
          date?: string | null
          discount?: number | null
          employee_id?: string | null
          folio?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payments?: Json
          sale_date?: string | null
          shift_id?: string | null
          subtotal?: number | null
          tax?: number | null
          time?: string | null
          tip_amount?: number
          tip_employee_id?: string | null
          tips?: Json
          total?: number | null
          type?: string
        }
        Update: {
          account_id?: string
          appointment_id?: string | null
          branch_id?: string
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          commission?: number | null
          created_at?: string | null
          date?: string | null
          discount?: number | null
          employee_id?: string | null
          folio?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payments?: Json
          sale_date?: string | null
          shift_id?: string | null
          subtotal?: number | null
          tax?: number | null
          time?: string | null
          tip_amount?: number
          tip_employee_id?: string | null
          tips?: Json
          total?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tip_employee_id_fkey"
            columns: ["tip_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          schedule: Json | null
          target_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          schedule?: Json | null
          target_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          schedule?: Json | null
          target_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          account_id: string
          category_id: string | null
          color: string | null
          commission_percent: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          account_id: string
          category_id?: string | null
          color?: string | null
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          category_id?: string | null
          color?: string | null
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          account_id: string
          branch_id: string
          closed_at: string | null
          created_at: string | null
          difference: number | null
          expected_cash: number | null
          final_cash: number | null
          id: string
          initial_cash: number | null
          notes: string | null
          opened_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          branch_id: string
          closed_at?: string | null
          created_at?: string | null
          difference?: number | null
          expected_cash?: number | null
          final_cash?: number | null
          id?: string
          initial_cash?: number | null
          notes?: string | null
          opened_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          branch_id?: string
          closed_at?: string | null
          created_at?: string | null
          difference?: number | null
          expected_cash?: number | null
          final_cash?: number | null
          id?: string
          initial_cash?: number | null
          notes?: string | null
          opened_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_branches: number
          max_users: number
          name: string
          price: number
          price_yearly: number | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number
          max_users?: number
          name: string
          price?: number
          price_yearly?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number
          max_users?: number
          name?: string
          price?: number
          price_yearly?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          account_id: string
          address: string | null
          code: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number
          phone: string | null
          rfc: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_id: string
          address?: string | null
          code?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number
          phone?: string | null
          rfc?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_id?: string
          address?: string | null
          code?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number
          phone?: string | null
          rfc?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          label: string
          path: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          path: string
          position?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          path?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          account_id: string
          assigned_to: string | null
          client_id: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          instance_id: string | null
          is_archived: boolean
          last_message: string | null
          last_message_at: string | null
          remote_jid: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          client_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          is_archived?: boolean
          last_message?: string | null
          last_message_at?: string | null
          remote_jid: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          client_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          is_archived?: boolean
          last_message?: string | null
          last_message_at?: string | null
          remote_jid?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          account_id: string
          created_at: string
          id: string
          instance_name: string
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          instance_name: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          instance_name?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          account_id: string
          content: string | null
          conversation_id: string
          created_at: string
          from_me: boolean
          id: string
          instance_id: string | null
          media_mime: string | null
          media_url: string | null
          message_id: string | null
          message_type: string
          raw: Json | null
          sender_user_id: string | null
          status: string
          timestamp: string
        }
        Insert: {
          account_id: string
          content?: string | null
          conversation_id: string
          created_at?: string
          from_me?: boolean
          id?: string
          instance_id?: string | null
          media_mime?: string | null
          media_url?: string | null
          message_id?: string | null
          message_type?: string
          raw?: Json | null
          sender_user_id?: string | null
          status?: string
          timestamp?: string
        }
        Update: {
          account_id?: string
          content?: string | null
          conversation_id?: string
          created_at?: string
          from_me?: boolean
          id?: string
          instance_id?: string | null
          media_mime?: string | null
          media_url?: string | null
          message_id?: string | null
          message_type?: string
          raw?: Json | null
          sender_user_id?: string | null
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          account_id: string
          content: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          shortcut: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          shortcut?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          shortcut?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_product_stock: {
        Args: {
          p_branch_id?: string
          p_delta: number
          p_product_id: string
          p_reason?: string
          p_reference_id?: string
          p_type: string
        }
        Returns: {
          account_id: string
          barcode: string | null
          brand: string | null
          category_id: string | null
          cost: number
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_stock: number | null
          min_stock: number
          name: string
          price: number
          sku: string | null
          stock: number | null
          unit: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_subscription_status: {
        Args: { _account_id: string }
        Returns: {
          days_remaining: number
          is_valid: boolean
          status: Database["public"]["Enums"]["subscription_status"]
        }[]
      }
      complete_signup: {
        Args: {
          p_account_name: string
          p_admin_name: string
          p_admin_phone?: string
          p_branch_name: string
          p_plan_id?: string
        }
        Returns: Json
      }
      create_sale_atomic: {
        Args: { p_sale: Json }
        Returns: {
          account_id: string
          appointment_id: string | null
          branch_id: string
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          commission: number | null
          created_at: string | null
          date: string | null
          discount: number | null
          employee_id: string | null
          folio: string | null
          id: string
          items: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          payments: Json
          sale_date: string | null
          shift_id: string | null
          subtotal: number | null
          tax: number | null
          time: string | null
          tip_amount: number
          tip_employee_id: string | null
          tips: Json
          total: number | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_account_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_commission_payment: {
        Args: {
          p_branch_id?: string
          p_commission_amount: number
          p_employee_id: string
          p_employee_name: string
          p_notes?: string
          p_payment_method?: string
          p_period_from: string
          p_period_to: string
          p_sales_included?: Json
          p_tips_amount: number
        }
        Returns: {
          account_id: string
          branch_id: string | null
          commission_amount: number
          created_at: string
          employee_id: string
          employee_name: string | null
          folio: string | null
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          payment_method: string
          period_from: string
          period_to: string
          sales_included: Json
          tips_amount: number
          total: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "commission_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_purchase_payment: {
        Args: {
          p_amount: number
          p_notes?: string
          p_payment_method?: string
          p_purchase_id: string
        }
        Returns: {
          account_id: string
          amount_paid: number | null
          branch_id: string
          created_at: string | null
          expected_date: string | null
          folio: string | null
          id: string
          items: Json | null
          notes: string | null
          payments: Json
          purchase_date: string | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "super_admin" | "account_admin" | "branch_manager" | "employee"
      subscription_status: "active" | "expired" | "suspended" | "trial"
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
      app_role: ["super_admin", "account_admin", "branch_manager", "employee"],
      subscription_status: ["active", "expired", "suspended", "trial"],
    },
  },
} as const
