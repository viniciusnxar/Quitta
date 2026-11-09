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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          include_in_total: boolean
          initial_balance: number
          initial_balance_date: string
          institution: string | null
          name: string
          sort_order: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          include_in_total?: boolean
          initial_balance?: number
          initial_balance_date?: string
          institution?: string | null
          name: string
          sort_order?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          include_in_total?: boolean
          initial_balance?: number
          initial_balance_date?: string
          institution?: string | null
          name?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          month: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          month?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          reference_month: string
          user_id: string
        }
        Insert: {
          card_id: string
          closing_date: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          reference_month: string
          user_id?: string
        }
        Update: {
          card_id?: string
          closing_date?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          reference_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "card_invoices_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          nature: Database["public"]["Enums"]["category_nature"]
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          nature?: Database["public"]["Enums"]["category_nature"]
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          nature?: Database["public"]["Enums"]["category_nature"]
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_user_id_fkey"
            columns: ["parent_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          archived_at: string | null
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string
          credit_limit: number
          due_day: number
          id: string
          issuer: string | null
          last_digits: string | null
          name: string
          payment_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string
          credit_limit: number
          due_day: number
          id?: string
          issuer?: string | null
          last_digits?: string | null
          name: string
          payment_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          issuer?: string | null
          last_digits?: string | null
          name?: string
          payment_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_payment_account_id_user_id_fkey"
            columns: ["payment_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "credit_cards_payment_account_id_user_id_fkey"
            columns: ["payment_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      financing_extra_payments: {
        Row: {
          amount: number
          created_at: string
          financing_id: string
          id: string
          payment_date: string
          strategy: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          financing_id: string
          id?: string
          payment_date: string
          strategy?: string
          transaction_id?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          financing_id?: string
          id?: string
          payment_date?: string
          strategy?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_extra_payments_financing_id_user_id_fkey"
            columns: ["financing_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financings"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financing_extra_payments_financing_id_user_id_fkey"
            columns: ["financing_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_financings"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financing_extra_payments_transaction_id_user_id_fkey"
            columns: ["transaction_id", "user_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      financing_installments: {
        Row: {
          amortization: number
          balance_after: number
          due_date: string
          fees: number
          financing_id: string
          id: string
          interest: number
          number: number
          total: number | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amortization: number
          balance_after: number
          due_date: string
          fees?: number
          financing_id: string
          id?: string
          interest: number
          number: number
          total?: number | null
          transaction_id?: string | null
          user_id?: string
        }
        Update: {
          amortization?: number
          balance_after?: number
          due_date?: string
          fees?: number
          financing_id?: string
          id?: string
          interest?: number
          number?: number
          total?: number | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_installments_financing_id_user_id_fkey"
            columns: ["financing_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financings"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financing_installments_financing_id_user_id_fkey"
            columns: ["financing_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_financings"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financing_installments_transaction_id_user_id_fkey"
            columns: ["transaction_id", "user_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      financings: {
        Row: {
          account_id: string
          asset_value: number | null
          category_id: string | null
          cet_annual: number | null
          created_at: string
          down_payment: number
          financed_amount: number
          first_due_date: string
          id: string
          institution: string | null
          interest_rate: number
          kind: Database["public"]["Enums"]["financing_kind"]
          monthly_fees: number
          name: string
          paid_installments_before: number
          rate_period: Database["public"]["Enums"]["rate_period"]
          status: string
          system: Database["public"]["Enums"]["amortization_system"]
          term_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          asset_value?: number | null
          category_id?: string | null
          cet_annual?: number | null
          created_at?: string
          down_payment?: number
          financed_amount: number
          first_due_date: string
          id?: string
          institution?: string | null
          interest_rate?: number
          kind?: Database["public"]["Enums"]["financing_kind"]
          monthly_fees?: number
          name: string
          paid_installments_before?: number
          rate_period?: Database["public"]["Enums"]["rate_period"]
          status?: string
          system?: Database["public"]["Enums"]["amortization_system"]
          term_months: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string
          asset_value?: number | null
          category_id?: string | null
          cet_annual?: number | null
          created_at?: string
          down_payment?: number
          financed_amount?: number
          first_due_date?: string
          id?: string
          institution?: string | null
          interest_rate?: number
          kind?: Database["public"]["Enums"]["financing_kind"]
          monthly_fees?: number
          name?: string
          paid_installments_before?: number
          rate_period?: Database["public"]["Enums"]["rate_period"]
          status?: string
          system?: Database["public"]["Enums"]["amortization_system"]
          term_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financings_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financings_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financings_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      index_rates: {
        Row: {
          annual_rate: number
          code: string
          created_at: string
          id: string
          reference_date: string
          source: string
          user_id: string | null
        }
        Insert: {
          annual_rate: number
          code: string
          created_at?: string
          id?: string
          reference_date: string
          source?: string
          user_id?: string | null
        }
        Update: {
          annual_rate?: number
          code?: string
          created_at?: string
          id?: string
          reference_date?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      installment_plans: {
        Row: {
          account_id: string | null
          card_id: string | null
          category_id: string | null
          created_at: string
          description: string
          first_date: string
          id: string
          installment_amount: number
          installment_count: number
          notes: string | null
          start_installment: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          first_date: string
          id?: string
          installment_amount: number
          installment_count: number
          notes?: string | null
          start_installment?: number
          total_amount: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          first_date?: string
          id?: string
          installment_amount?: number
          installment_count?: number
          notes?: string | null
          start_installment?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      investment_movements: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          date: string
          id: string
          investment_id: string
          kind: Database["public"]["Enums"]["investment_movement_kind"]
          notes: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          date: string
          id?: string
          investment_id: string
          kind: Database["public"]["Enums"]["investment_movement_kind"]
          notes?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          date?: string
          id?: string
          investment_id?: string
          kind?: Database["public"]["Enums"]["investment_movement_kind"]
          notes?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_movements_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "investment_movements_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "investment_movements_investment_id_user_id_fkey"
            columns: ["investment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "investment_movements_investment_id_user_id_fkey"
            columns: ["investment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_investment_positions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "investment_movements_transaction_id_user_id_fkey"
            columns: ["transaction_id", "user_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      investments: {
        Row: {
          account_id: string | null
          created_at: string
          current_value: number | null
          current_value_at: string | null
          id: string
          institution: string | null
          ir_rate_override: number | null
          kind: Database["public"]["Enums"]["investment_kind"]
          liquidity: string
          liquidity_days: number | null
          maturity_date: string | null
          name: string
          notes: string | null
          rate: number | null
          rate_mode: Database["public"]["Enums"]["rate_mode"]
          rate_period: Database["public"]["Enums"]["rate_period"]
          start_date: string
          status: string
          tax_exempt: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          current_value?: number | null
          current_value_at?: string | null
          id?: string
          institution?: string | null
          ir_rate_override?: number | null
          kind: Database["public"]["Enums"]["investment_kind"]
          liquidity?: string
          liquidity_days?: number | null
          maturity_date?: string | null
          name: string
          notes?: string | null
          rate?: number | null
          rate_mode?: Database["public"]["Enums"]["rate_mode"]
          rate_period?: Database["public"]["Enums"]["rate_period"]
          start_date: string
          status?: string
          tax_exempt?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          current_value?: number | null
          current_value_at?: string | null
          id?: string
          institution?: string | null
          ir_rate_override?: number | null
          kind?: Database["public"]["Enums"]["investment_kind"]
          liquidity?: string
          liquidity_days?: number | null
          maturity_date?: string | null
          name?: string
          notes?: string | null
          rate?: number | null
          rate_mode?: Database["public"]["Enums"]["rate_mode"]
          rate_period?: Database["public"]["Enums"]["rate_period"]
          start_date?: string
          status?: string
          tax_exempt?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "investments_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          due_date: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          read_at: string | null
          ref_id: string | null
          ref_table: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          read_at?: string | null
          ref_id?: string | null
          ref_table?: string | null
          title: string
          user_id?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          read_at?: string | null
          ref_id?: string | null
          ref_table?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          full_name: string | null
          id: string
          notify_days_before: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          id: string
          notify_days_before?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          id?: string
          notify_days_before?: number
          updated_at?: string
        }
        Relationships: []
      }
      recurring_rules: {
        Row: {
          account_id: string | null
          amount: number
          auto_confirm: boolean
          card_id: string | null
          category_id: string | null
          created_at: string
          cycle: Database["public"]["Enums"]["billing_cycle"]
          description: string
          end_date: string | null
          generated_until: string | null
          id: string
          is_active: boolean
          start_date: string
          to_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_confirm?: boolean
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          description: string
          end_date?: string | null
          generated_until?: string | null
          id?: string
          is_active?: boolean
          start_date: string
          to_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_confirm?: boolean
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          description?: string
          end_date?: string | null
          generated_until?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          to_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_rules_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_rules_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_rules_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_rules_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_rules_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_rules_to_account_id_user_id_fkey"
            columns: ["to_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_rules_to_account_id_user_id_fkey"
            columns: ["to_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      subscription_price_changes: {
        Row: {
          changed_at: string
          id: string
          new_amount: number
          old_amount: number
          subscription_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_amount: number
          old_amount: number
          subscription_id: string
          user_id?: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_amount?: number
          old_amount?: number
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_price_changes_subscription_id_user_id_fkey"
            columns: ["subscription_id", "user_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscription_price_changes_subscription_id_user_id_fkey"
            columns: ["subscription_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_subscriptions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          cycle: Database["public"]["Enums"]["billing_cycle"]
          end_date: string | null
          generated_until: string | null
          id: string
          name: string
          notes: string | null
          provider: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          end_date?: string | null
          generated_until?: string | null
          id?: string
          name: string
          notes?: string | null
          provider?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          end_date?: string | null
          generated_until?: string | null
          id?: string
          name?: string
          notes?: string | null
          provider?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_tags: {
        Row: {
          tag_id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          tag_id: string
          transaction_id: string
          user_id?: string
        }
        Update: {
          tag_id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_user_id_fkey"
            columns: ["tag_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_user_id_fkey"
            columns: ["transaction_id", "user_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          financing_id: string | null
          id: string
          installment_number: number | null
          installment_plan_id: string | null
          installment_total: number | null
          investment_id: string | null
          invoice_id: string | null
          notes: string | null
          paid_at: string | null
          recurring_rule_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          subscription_id: string | null
          to_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date: string
          description: string
          financing_id?: string | null
          id?: string
          installment_number?: number | null
          installment_plan_id?: string | null
          installment_total?: number | null
          investment_id?: string | null
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          recurring_rule_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subscription_id?: string | null
          to_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          financing_id?: string | null
          id?: string
          installment_number?: number | null
          installment_plan_id?: string | null
          installment_total?: number | null
          investment_id?: string | null
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          recurring_rule_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subscription_id?: string | null
          to_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_financing_id_user_id_fkey"
            columns: ["financing_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financings"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_financing_id_user_id_fkey"
            columns: ["financing_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_financings"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_installment_plan_id_user_id_fkey"
            columns: ["installment_plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_installment_plan_id_user_id_fkey"
            columns: ["installment_plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_installment_plans"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_investment_id_user_id_fkey"
            columns: ["investment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_investment_id_user_id_fkey"
            columns: ["investment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_investment_positions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_user_id_fkey"
            columns: ["invoice_id", "user_id"]
            isOneToOne: false
            referencedRelation: "card_invoices"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_user_id_fkey"
            columns: ["invoice_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_invoices"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_recurring_rule_id_user_id_fkey"
            columns: ["recurring_rule_id", "user_id"]
            isOneToOne: false
            referencedRelation: "recurring_rules"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_subscription_id_user_id_fkey"
            columns: ["subscription_id", "user_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_subscription_id_user_id_fkey"
            columns: ["subscription_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_subscriptions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_user_id_fkey"
            columns: ["to_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_user_id_fkey"
            columns: ["to_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      v_account_balances: {
        Row: {
          archived_at: string | null
          balance: number | null
          color: string | null
          icon: string | null
          id: string | null
          include_in_total: boolean | null
          institution: string | null
          name: string | null
          projected_balance_month_end: number | null
          sort_order: number | null
          type: Database["public"]["Enums"]["account_type"] | null
          user_id: string | null
        }
        Relationships: []
      }
      v_account_movements: {
        Row: {
          account_id: string | null
          date: string | null
          delta: number | null
          paid_at: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          user_id: string | null
        }
        Relationships: []
      }
      v_card_limits: {
        Row: {
          archived_at: string | null
          available: number | null
          brand: string | null
          closing_day: number | null
          color: string | null
          credit_limit: number | null
          due_day: number | null
          id: string | null
          issuer: string | null
          name: string | null
          used: number | null
          used_pct: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_financings: {
        Row: {
          account_id: string | null
          asset_value: number | null
          category_id: string | null
          cet_annual: number | null
          created_at: string | null
          down_payment: number | null
          financed_amount: number | null
          first_due_date: string | null
          id: string | null
          institution: string | null
          interest_rate: number | null
          kind: Database["public"]["Enums"]["financing_kind"] | null
          monthly_fees: number | null
          name: string | null
          next_amount: number | null
          next_due_date: string | null
          outstanding_balance: number | null
          paid_installments: number | null
          paid_installments_before: number | null
          rate_period: Database["public"]["Enums"]["rate_period"] | null
          remaining_installments: number | null
          status: string | null
          system: Database["public"]["Enums"]["amortization_system"] | null
          term_months: number | null
          total_interest_remaining: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financings_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financings_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "financings_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      v_installment_plans: {
        Row: {
          account_id: string | null
          card_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          first_date: string | null
          id: string | null
          installment_amount: number | null
          installment_count: number | null
          is_active: boolean | null
          next_date: string | null
          notes: string | null
          paid_installments: number | null
          remaining_amount: number | null
          remaining_installments: number | null
          start_installment: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "installment_plans_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      v_investment_positions: {
        Row: {
          account_id: string | null
          created_at: string | null
          current_value: number | null
          current_value_at: string | null
          id: string | null
          institution: string | null
          ir_rate_override: number | null
          kind: Database["public"]["Enums"]["investment_kind"] | null
          liquidity: string | null
          liquidity_days: number | null
          maturity_date: string | null
          name: string | null
          net_earnings: number | null
          net_invested: number | null
          notes: string | null
          position: number | null
          rate: number | null
          rate_mode: Database["public"]["Enums"]["rate_mode"] | null
          rate_period: Database["public"]["Enums"]["rate_period"] | null
          start_date: string | null
          status: string | null
          tax_exempt: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "investments_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      v_invoices: {
        Row: {
          card_id: string | null
          card_name: string | null
          closing_date: string | null
          due_date: string | null
          id: string | null
          paid: number | null
          reference_month: string | null
          remaining: number | null
          status: string | null
          total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "card_invoices_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      v_latest_rates: {
        Row: {
          annual_rate: number | null
          code: string | null
          is_custom: boolean | null
          reference_date: string | null
          source: string | null
        }
        Relationships: []
      }
      v_monthly_by_category: {
        Row: {
          category_id: string | null
          category_name: string | null
          count: number | null
          month: string | null
          nature: Database["public"]["Enums"]["category_nature"] | null
          parent_category_name: string | null
          total: number | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      v_subscriptions: {
        Row: {
          account_id: string | null
          amount: number | null
          card_id: string | null
          category_id: string | null
          created_at: string | null
          cycle: Database["public"]["Enums"]["billing_cycle"] | null
          end_date: string | null
          generated_until: string | null
          id: string | null
          monthly_equivalent: number | null
          name: string | null
          next_charge: string | null
          notes: string | null
          provider: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          yearly_equivalent: number | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string | null
          cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          end_date?: string | null
          generated_until?: string | null
          id?: string | null
          monthly_equivalent?: never
          name?: string | null
          next_charge?: never
          notes?: string | null
          provider?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          yearly_equivalent?: never
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string | null
          cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          end_date?: string | null
          generated_until?: string | null
          id?: string | null
          monthly_equivalent?: never
          name?: string | null
          next_charge?: never
          notes?: string | null
          provider?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          yearly_equivalent?: never
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_user_id_fkey"
            columns: ["card_id", "user_id"]
            isOneToOne: false
            referencedRelation: "v_card_limits"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "subscriptions_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Functions: {
      clamp_day: { Args: { p_day: number; p_month: string }; Returns: string }
      create_installment_plan: {
        Args: {
          p_account_id?: string
          p_card_id?: string
          p_category_id?: string
          p_description: string
          p_first_date: string
          p_installment_amount?: number
          p_installment_count: number
          p_notes?: string
          p_start_installment?: number
          p_total_amount?: number
        }
        Returns: string
      }
      cycle_interval: {
        Args: { c: Database["public"]["Enums"]["billing_cycle"] }
        Returns: string
      }
      cycle_monthly_factor: {
        Args: { c: Database["public"]["Enums"]["billing_cycle"] }
        Returns: number
      }
      ensure_invoice: {
        Args: { p_card_id: string; p_date: string }
        Returns: string
      }
      generate_financing_schedule: {
        Args: { p_financing_id: string }
        Returns: number
      }
      generate_recurring: { Args: { p_until?: string }; Returns: number }
      get_calendar: {
        Args: { p_from: string; p_to: string }
        Returns: {
          account_id: string
          amount: number
          card_id: string
          category_id: string
          event_date: string
          ref_id: string
          source: string
          status: string
          title: string
          type: string
        }[]
      }
      get_dashboard: { Args: { p_month?: string }; Returns: Json }
      invoice_dates: {
        Args: { p_closing_day: number; p_due_day: number; p_purchase: string }
        Returns: Record<string, unknown>
      }
      next_occurrence: {
        Args: {
          p_anchor: string
          p_cycle: Database["public"]["Enums"]["billing_cycle"]
          p_from?: string
        }
        Returns: string
      }
      pay_invoice: {
        Args: {
          p_account_id: string
          p_amount?: number
          p_date?: string
          p_invoice_id: string
        }
        Returns: string
      }
    }
    Enums: {
      account_type:
        | "corrente"
        | "poupanca"
        | "carteira"
        | "investimento"
        | "beneficio"
        | "outro"
      amortization_system: "price" | "sac" | "sem_juros"
      billing_cycle:
        | "semanal"
        | "quinzenal"
        | "mensal"
        | "bimestral"
        | "trimestral"
        | "semestral"
        | "anual"
      category_kind: "receita" | "despesa"
      category_nature:
        | "salario"
        | "renda_extra"
        | "beneficio"
        | "reembolso"
        | "fixa"
        | "variavel"
        | "imposto"
        | "taxa"
        | "juros"
        | "ajuste"
        | "outro"
      financing_kind:
        | "imovel"
        | "veiculo"
        | "pessoal"
        | "consignado"
        | "estudantil"
        | "outro"
      investment_kind:
        | "cdb"
        | "lci"
        | "lca"
        | "cri"
        | "cra"
        | "debenture"
        | "tesouro_selic"
        | "tesouro_ipca"
        | "tesouro_prefixado"
        | "poupanca"
        | "fundo"
        | "acao"
        | "fii"
        | "etf"
        | "cripto"
        | "previdencia"
        | "outro"
      investment_movement_kind:
        | "aporte"
        | "resgate"
        | "rendimento"
        | "imposto"
        | "taxa"
        | "atualizacao"
      notification_kind:
        | "fatura_fechando"
        | "fatura_vencendo"
        | "assinatura_renovando"
        | "conta_vencendo"
        | "parcela_financiamento"
        | "orcamento_excedido"
        | "limite_cartao"
        | "investimento_vencendo"
        | "sistema"
      rate_mode:
        | "prefixado"
        | "pos_cdi"
        | "pos_selic"
        | "ipca_mais"
        | "poupanca"
        | "variavel"
      rate_period: "mes" | "ano"
      subscription_status: "ativa" | "pausada" | "cancelada"
      transaction_status: "previsto" | "pago" | "cancelado"
      transaction_type:
        | "receita"
        | "despesa"
        | "transferencia"
        | "pagamento_fatura"
        | "aplicacao"
        | "resgate"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_type: [
        "corrente",
        "poupanca",
        "carteira",
        "investimento",
        "beneficio",
        "outro",
      ],
      amortization_system: ["price", "sac", "sem_juros"],
      billing_cycle: [
        "semanal",
        "quinzenal",
        "mensal",
        "bimestral",
        "trimestral",
        "semestral",
        "anual",
      ],
      category_kind: ["receita", "despesa"],
      category_nature: [
        "salario",
        "renda_extra",
        "beneficio",
        "reembolso",
        "fixa",
        "variavel",
        "imposto",
        "taxa",
        "juros",
        "ajuste",
        "outro",
      ],
      financing_kind: [
        "imovel",
        "veiculo",
        "pessoal",
        "consignado",
        "estudantil",
        "outro",
      ],
      investment_kind: [
        "cdb",
        "lci",
        "lca",
        "cri",
        "cra",
        "debenture",
        "tesouro_selic",
        "tesouro_ipca",
        "tesouro_prefixado",
        "poupanca",
        "fundo",
        "acao",
        "fii",
        "etf",
        "cripto",
        "previdencia",
        "outro",
      ],
      investment_movement_kind: [
        "aporte",
        "resgate",
        "rendimento",
        "imposto",
        "taxa",
        "atualizacao",
      ],
      notification_kind: [
        "fatura_fechando",
        "fatura_vencendo",
        "assinatura_renovando",
        "conta_vencendo",
        "parcela_financiamento",
        "orcamento_excedido",
        "limite_cartao",
        "investimento_vencendo",
        "sistema",
      ],
      rate_mode: [
        "prefixado",
        "pos_cdi",
        "pos_selic",
        "ipca_mais",
        "poupanca",
        "variavel",
      ],
      rate_period: ["mes", "ano"],
      subscription_status: ["ativa", "pausada", "cancelada"],
      transaction_status: ["previsto", "pago", "cancelado"],
      transaction_type: [
        "receita",
        "despesa",
        "transferencia",
        "pagamento_fatura",
        "aplicacao",
        "resgate",
      ],
    },
  },
} as const
