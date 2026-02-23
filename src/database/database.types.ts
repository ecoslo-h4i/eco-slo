export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      notifications: {
        Row: {
          created_at: string;
          id: number;
          label: string | null;
          message: string;
          recipient: string;
          sender: string;
          severity: string;
          timestamp: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          label?: string | null;
          message: string;
          recipient: string;
          sender: string;
          severity: string;
          timestamp?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          label?: string | null;
          message?: string;
          recipient?: string;
          sender?: string;
          severity?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Notifications_recipient_fkey";
            columns: ["recipient"];
            isOneToOne: false;
            referencedRelation: "volunteers";
            referencedColumns: ["email"];
          },
          {
            foreignKeyName: "Notifications_sender_fkey";
            columns: ["sender"];
            isOneToOne: false;
            referencedRelation: "volunteers";
            referencedColumns: ["email"];
          },
        ];
      };
      test: {
        Row: {
          created_at: string;
          id: number;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      trees: {
        Row: {
          address: string;
          adopter_email: string;
          adopter_name: string;
          adopter_phone: string;
          common_name: string;
          created_at: string;
          date_planted: string;
          ecoslo_num: number;
          funder: string;
          id: number;
          is_public: boolean;
          latitude: number;
          longitude: number;
          next_mulching_date: string | null;
          notes: string | null;
          species_name: string;
          status: string;
          weekly_watering_status: string | null;
        };
        Insert: {
          address: string;
          adopter_email: string;
          adopter_name: string;
          adopter_phone: string;
          common_name: string;
          created_at?: string;
          date_planted: string;
          ecoslo_num: number;
          funder: string;
          id?: number;
          is_public?: boolean;
          latitude: number;
          longitude: number;
          next_mulching_date?: string | null;
          notes?: string | null;
          species_name: string;
          status: string;
          weekly_watering_status?: string | null;
        };
        Update: {
          address?: string;
          adopter_email?: string;
          adopter_name?: string;
          adopter_phone?: string;
          common_name?: string;
          created_at?: string;
          date_planted?: string;
          ecoslo_num?: number;
          funder?: string;
          id?: number;
          is_public?: boolean;
          latitude?: number;
          longitude?: number;
          next_mulching_date?: string | null;
          notes?: string | null;
          species_name?: string;
          status?: string;
          weekly_watering_status?: string | null;
        };
        Relationships: [];
      };
      volunteers: {
        Row: {
          created_at: string;
          email: string;
          firstname: string;
          id: number;
          joined: string;
          lastname: string;
          phone: string;
          trees_planted: string[] | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          firstname: string;
          id?: number;
          joined?: string;
          lastname: string;
          phone: string;
          trees_planted?: string[] | null;
          type?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          firstname?: string;
          id?: number;
          joined?: string;
          lastname?: string;
          phone?: string;
          trees_planted?: string[] | null;
          type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
