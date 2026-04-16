export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      members: {
        Row: {
          created_at: string;
          email: string;
          firstname: string;
          id: number;
          joined: string;
          lastname: string;
          phone: string;
          role: Database["public"]["Enums"]["MemberType"] | null;
          trees_assigned: number[] | null;
          trees_count: number;
        };
        Insert: {
          created_at?: string;
          email: string;
          firstname: string;
          id?: number;
          joined?: string;
          lastname: string;
          phone: string;
          role?: Database["public"]["Enums"]["MemberType"] | null;
          trees_assigned?: number[] | null;
          trees_count?: number;
        };
        Update: {
          created_at?: string;
          email?: string;
          firstname?: string;
          id?: number;
          joined?: string;
          lastname?: string;
          phone?: string;
          role?: Database["public"]["Enums"]["MemberType"] | null;
          trees_assigned?: number[] | null;
          trees_count?: number;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          assignees: number[];
          created_at: string;
          crons_expression: string;
          id: number;
          is_active: boolean;
          is_group_task: boolean;
          name: string;
          task_message: string;
        };
        Insert: {
          assignees: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_active?: boolean;
          is_group_task?: boolean;
          name?: string;
          task_message?: string;
        };
        Update: {
          assignees?: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_active?: boolean;
          is_group_task?: boolean;
          name?: string;
          task_message?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          body: Json;
          created_at: string;
          id: number;
          task: number | null;
          tree: number | null;
        };
        Insert: {
          body: Json;
          created_at?: string;
          id?: number;
          task?: number | null;
          tree?: number | null;
        };
        Update: {
          body?: Json;
          created_at?: string;
          id?: number;
          task?: number | null;
          tree?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "surveys_task_fkey";
            columns: ["task"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "surveys_tree_fkey";
            columns: ["tree"];
            isOneToOne: false;
            referencedRelation: "trees";
            referencedColumns: ["ecoslo_num"];
          },
        ];
      };
      tasks: {
        Row: {
          assignees: number[] | null;
          completion_date: string | null;
          created_at: string;
          created_by: number | null;
          id: number;
          is_complete: boolean;
          message: string;
          surveys_needed: number;
          title: string;
        };
        Insert: {
          assignees?: number[] | null;
          completion_date?: string | null;
          created_at?: string;
          created_by?: number | null;
          id?: number;
          is_complete?: boolean;
          message: string;
          surveys_needed?: number;
          title?: string;
        };
        Update: {
          assignees?: number[] | null;
          completion_date?: string | null;
          created_at?: string;
          created_by?: number | null;
          id?: number;
          is_complete?: boolean;
          message?: string;
          surveys_needed?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          assignees: number[];
          created_at: string;
          crons_expression: string;
          id: number;
          is_group_task: boolean;
          name: string;
          task_message: string;
        };
        Insert: {
          assignees: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_group_task?: boolean;
          name?: string;
          task_message?: string;
        };
        Update: {
          assignees?: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_group_task?: boolean;
          name?: string;
          task_message?: string;
        };
        Relationships: [];
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
          admin_notes: string;
          common_name: string;
          condition: Database["public"]["Enums"]["Condition"];
          created_at: string;
          date_planted: string;
          ecoslo_num: number;
          funder: string;
          id: number;
          is_public: boolean;
          latitude: number;
          longitude: number;
          next_mulching_date: string | null;
          next_watering_date: string | null;
          notes: string | null;
          species_name: string;
          status: Database["public"]["Enums"]["TreeStatus"];
          survey_logs: number[] | null;
          tree_keeper_id: number | null;
          weekly_watering_status: Database["public"]["Enums"]["WateringStatus"];
          yearly_mulching_status: Database["public"]["Enums"]["MulchingStatus"];
        };
        Insert: {
          address: string;
          admin_notes?: string;
          common_name: string;
          condition?: Database["public"]["Enums"]["Condition"];
          created_at?: string;
          date_planted: string;
          ecoslo_num?: number;
          funder: string;
          id?: number;
          is_public?: boolean;
          latitude: number;
          longitude: number;
          next_mulching_date?: string | null;
          next_watering_date?: string | null;
          notes?: string | null;
          species_name: string;
          status?: Database["public"]["Enums"]["TreeStatus"];
          survey_logs?: number[] | null;
          tree_keeper_id?: number | null;
          weekly_watering_status?: Database["public"]["Enums"]["WateringStatus"];
          yearly_mulching_status?: Database["public"]["Enums"]["MulchingStatus"];
        };
        Update: {
          address?: string;
          admin_notes?: string;
          common_name?: string;
          condition?: Database["public"]["Enums"]["Condition"];
          created_at?: string;
          date_planted?: string;
          ecoslo_num?: number;
          funder?: string;
          id?: number;
          is_public?: boolean;
          latitude?: number;
          longitude?: number;
          next_mulching_date?: string | null;
          next_watering_date?: string | null;
          notes?: string | null;
          species_name?: string;
          status?: Database["public"]["Enums"]["TreeStatus"];
          survey_logs?: number[] | null;
          tree_keeper_id?: number | null;
          weekly_watering_status?: Database["public"]["Enums"]["WateringStatus"];
          yearly_mulching_status?: Database["public"]["Enums"]["MulchingStatus"];
        };
        Relationships: [
          {
            foreignKeyName: "trees_tree_keeper_id_fkey";
            columns: ["tree_keeper_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      Condition: "good" | "fair" | "poor";
      MemberType: "Admin" | "Tree Keeper";
      MulchingStatus: "Completed" | "Pending";
      TreeStatus: "Active" | "Graduated";
      WateringStatus: "Completed" | "Pending";
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
    Enums: {
      Condition: ["good", "fair", "poor"],
      MemberType: ["Admin", "Tree Keeper"],
      MulchingStatus: ["Completed", "Pending"],
      TreeStatus: ["Active", "Graduated"],
      WateringStatus: ["Completed", "Pending"],
    },
  },
} as const;
