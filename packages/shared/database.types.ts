export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contractors: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          nip: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          nip?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          nip?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          name: string
          position: number
          quantity: number
          unit: string
          unit_price: number
          updated_at: string
          vat_rate: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          name: string
          position: number
          quantity: number
          unit?: string
          unit_price: number
          updated_at?: string
          vat_rate: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          name?: string
          position?: number
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
          vat_rate?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          buyer_address: string | null
          buyer_name: string
          buyer_nip: string | null
          contractor_id: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_method: string
          seller_address: string
          seller_bank_account: string | null
          seller_company_name: string
          seller_logo_url: string | null
          seller_nip: string
          status: Database["public"]["Enums"]["invoice_status"]
          total_gross: number
          total_net: number
          total_vat: number
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_address?: string | null
          buyer_name: string
          buyer_nip?: string | null
          contractor_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          payment_method?: string
          seller_address: string
          seller_bank_account?: string | null
          seller_company_name: string
          seller_logo_url?: string | null
          seller_nip: string
          status?: Database["public"]["Enums"]["invoice_status"]
          total_gross: number
          total_net: number
          total_vat: number
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_address?: string | null
          buyer_name?: string
          buyer_nip?: string | null
          contractor_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          payment_method?: string
          seller_address?: string
          seller_bank_account?: string | null
          seller_company_name?: string
          seller_logo_url?: string | null
          seller_nip?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          total_gross?: number
          total_net?: number
          total_vat?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          bank_account: string | null
          company_name: string | null
          created_at: string
          id: string
          invoice_number_counter: number | null
          invoice_number_format: string | null
          logo_url: string | null
          nip: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          company_name?: string | null
          created_at?: string
          id: string
          invoice_number_counter?: number | null
          invoice_number_format?: string | null
          logo_url?: string | null
          nip?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          invoice_number_counter?: number | null
          invoice_number_format?: string | null
          logo_url?: string | null
          nip?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: "draft" | "unpaid" | "paid"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      invoice_status: ["draft", "unpaid", "paid"],
    },
  },
} as const

