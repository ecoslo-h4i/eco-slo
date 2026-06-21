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
          user_id: string | null;
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
          user_id?: string | null;
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
          user_id?: string | null;
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
          last_run_at: string | null;
          name: string;
          needs_survey: boolean;
          next_run_at: string;
          survey_mode: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count: number;
          task_message: string;
          type: Database["public"]["Enums"]["TaskType"];
        };
        Insert: {
          assignees: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_active?: boolean;
          is_group_task?: boolean;
          last_run_at?: string | null;
          name?: string;
          needs_survey?: boolean;
          next_run_at: string;
          survey_mode?: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count?: number;
          task_message?: string;
          type?: Database["public"]["Enums"]["TaskType"];
        };
        Update: {
          assignees?: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_active?: boolean;
          is_group_task?: boolean;
          last_run_at?: string | null;
          name?: string;
          needs_survey?: boolean;
          next_run_at?: string;
          survey_mode?: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count?: number;
          task_message?: string;
          type?: Database["public"]["Enums"]["TaskType"];
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          body: Json;
          created_at: string;
          id: number;
          submitted_by: number | null;
          task: number | null;
          tree: number | null;
        };
        Insert: {
          body: Json;
          created_at?: string;
          id?: number;
          submitted_by?: number | null;
          task?: number | null;
          tree?: number | null;
        };
        Update: {
          body?: Json;
          created_at?: string;
          id?: number;
          submitted_by?: number | null;
          task?: number | null;
          tree?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "surveys_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "surveys_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "public_members";
            referencedColumns: ["id"];
          },
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
            referencedRelation: "public_trees";
            referencedColumns: ["ecoslo_num"];
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
          email_attempts: number;
          email_last_error: string | null;
          email_sent_at: string | null;
          id: number;
          is_complete: boolean;
          message: string;
          reminder_id: number | null;
          survey_mode: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count: number;
          surveys_needed: number;
          title: string;
          tree_targets: number[] | null;
          type: Database["public"]["Enums"]["TaskType"];
        };
        Insert: {
          assignees?: number[] | null;
          completion_date?: string | null;
          created_at?: string;
          created_by?: number | null;
          email_attempts?: number;
          email_last_error?: string | null;
          email_sent_at?: string | null;
          id?: number;
          is_complete?: boolean;
          message: string;
          reminder_id?: number | null;
          survey_mode?: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count?: number;
          surveys_needed?: number;
          title?: string;
          tree_targets?: number[] | null;
          type?: Database["public"]["Enums"]["TaskType"];
        };
        Update: {
          assignees?: number[] | null;
          completion_date?: string | null;
          created_at?: string;
          created_by?: number | null;
          email_attempts?: number;
          email_last_error?: string | null;
          email_sent_at?: string | null;
          id?: number;
          is_complete?: boolean;
          message?: string;
          reminder_id?: number | null;
          survey_mode?: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count?: number;
          surveys_needed?: number;
          title?: string;
          tree_targets?: number[] | null;
          type?: Database["public"]["Enums"]["TaskType"];
        };
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "public_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_reminder_id_fkey";
            columns: ["reminder_id"];
            isOneToOne: false;
            referencedRelation: "reminders";
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
          needs_survey: boolean;
          survey_mode: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count: number;
          task_message: string;
          type: Database["public"]["Enums"]["TaskType"];
        };
        Insert: {
          assignees: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_group_task?: boolean;
          name?: string;
          needs_survey?: boolean;
          survey_mode?: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count?: number;
          task_message?: string;
          type?: Database["public"]["Enums"]["TaskType"];
        };
        Update: {
          assignees?: number[];
          created_at?: string;
          crons_expression?: string;
          id?: number;
          is_group_task?: boolean;
          name?: string;
          needs_survey?: boolean;
          survey_mode?: Database["public"]["Enums"]["TaskSurveyMode"];
          survey_required_count?: number;
          task_message?: string;
          type?: Database["public"]["Enums"]["TaskType"];
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
          {
            foreignKeyName: "trees_tree_keeper_id_fkey";
            columns: ["tree_keeper_id"];
            isOneToOne: false;
            referencedRelation: "public_members";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_members: {
        Row: {
          firstname: string | null;
          id: number | null;
          lastname: string | null;
        };
        Insert: {
          firstname?: string | null;
          id?: number | null;
          lastname?: string | null;
        };
        Update: {
          firstname?: string | null;
          id?: number | null;
          lastname?: string | null;
        };
        Relationships: [];
      };
      public_trees: {
        Row: {
          address: string | null;
          common_name: string | null;
          condition: Database["public"]["Enums"]["Condition"] | null;
          date_planted: string | null;
          ecoslo_num: number | null;
          id: number | null;
          is_public: boolean | null;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          species_name: string | null;
          status: Database["public"]["Enums"]["TreeStatus"] | null;
          tree_keeper_firstname: string | null;
          tree_keeper_id: number | null;
          tree_keeper_lastname: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trees_tree_keeper_id_fkey";
            columns: ["tree_keeper_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trees_tree_keeper_id_fkey";
            columns: ["tree_keeper_id"];
            isOneToOne: false;
            referencedRelation: "public_members";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      complete_task: { Args: { p_task_id: number }; Returns: undefined };
      complete_task_survey: {
        Args: { p_task_id: number; p_tree?: number };
        Returns: undefined;
      };
      current_member_id: { Args: never; Returns: number };
      fire_reminder: {
        Args: { p_next_run_at: string; p_reminder_id: number };
        Returns: undefined;
      };
      fire_reminders_batch: {
        Args: { p_next_run_ats: string[]; p_reminder_ids: number[] };
        Returns: {
          failed: number;
          fired: number;
        }[];
      };
      get_pending_email_jobs: {
        Args: { p_limit?: number };
        Returns: {
          assignee_id: number;
          email_attempts: number;
          member_email: string;
          member_firstname: string;
          member_tree_count: number;
          member_tree_names: string;
          task_id: number;
          task_message: string;
          task_title: string;
        }[];
      };
      increment_email_attempts: {
        Args: { p_error: string; p_task_ids: number[] };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
      mark_task_tree_completed: {
        Args: {
          p_task: Database["public"]["Tables"]["tasks"]["Row"];
          p_tree: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      Condition: "good" | "fair" | "poor" | "okay" | "decent" | "dead";
      MemberType: "Admin" | "Tree Keeper";
      MulchingStatus: "Completed" | "Pending";
      TaskSurveyMode: "none" | "optional" | "required";
      TaskType: "Watering" | "Mulching" | "Other";
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
      Condition: ["good", "fair", "poor", "okay", "decent", "dead"],
      MemberType: ["Admin", "Tree Keeper"],
      MulchingStatus: ["Completed", "Pending"],
      TaskSurveyMode: ["none", "optional", "required"],
      TaskType: ["Watering", "Mulching", "Other"],
      TreeStatus: ["Active", "Graduated"],
      WateringStatus: ["Completed", "Pending"],
    },
  },
} as const;
