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
      auth_connections: {
        Row: {
          avatar_url: string | null
          created_at: string
          encrypted_pat: string | null
          github_installation_id: number | null
          github_username: string | null
          id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          encrypted_pat?: string | null
          github_installation_id?: number | null
          github_username?: string | null
          id?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          encrypted_pat?: string | null
          github_installation_id?: number | null
          github_username?: string | null
          id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bridges: {
        Row: {
          aistudio_branch: string
          aistudio_prefix: string
          aistudio_repo: string
          auth_connection_id: string | null
          auto_merge: boolean
          canonical_branch: string
          canonical_repo: string
          created_at: string
          id: string
          lovable_branch: string
          lovable_prefix: string
          lovable_repo: string
          name: string
          setup_complete: boolean
          setup_pr_url: string | null
          squash_policy: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          aistudio_branch?: string
          aistudio_prefix?: string
          aistudio_repo: string
          auth_connection_id?: string | null
          auto_merge?: boolean
          canonical_branch?: string
          canonical_repo: string
          created_at?: string
          id?: string
          lovable_branch?: string
          lovable_prefix?: string
          lovable_repo: string
          name: string
          setup_complete?: boolean
          setup_pr_url?: string | null
          squash_policy?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          aistudio_branch?: string
          aistudio_prefix?: string
          aistudio_repo?: string
          auth_connection_id?: string | null
          auto_merge?: boolean
          canonical_branch?: string
          canonical_repo?: string
          created_at?: string
          id?: string
          lovable_branch?: string
          lovable_prefix?: string
          lovable_repo?: string
          name?: string
          setup_complete?: boolean
          setup_pr_url?: string | null
          squash_policy?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridges_auth_connection_id_fkey"
            columns: ["auth_connection_id"]
            isOneToOne: false
            referencedRelation: "auth_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          github_pat: string | null
          github_username: string | null
          id: string
          is_paid: boolean
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          github_pat?: string | null
          github_username?: string | null
          id: string
          is_paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          github_pat?: string | null
          github_username?: string | null
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      repo_state: {
        Row: {
          bridge_id: string
          id: string
          last_processed_sha: string | null
          repo: string
          updated_at: string
        }
        Insert: {
          bridge_id: string
          id?: string
          last_processed_sha?: string | null
          repo: string
          updated_at?: string
        }
        Update: {
          bridge_id?: string
          id?: string
          last_processed_sha?: string | null
          repo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_state_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          bridge_id: string
          created_at: string
          dest_repo: string
          direction: string
          error_message: string | null
          finished_at: string | null
          id: string
          log_excerpt: string | null
          pr_number: number | null
          pr_url: string | null
          source_repo: string
          started_at: string | null
          status: string
          trigger_commit_sha: string | null
          user_id: string
        }
        Insert: {
          bridge_id: string
          created_at?: string
          dest_repo: string
          direction: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          log_excerpt?: string | null
          pr_number?: number | null
          pr_url?: string | null
          source_repo: string
          started_at?: string | null
          status?: string
          trigger_commit_sha?: string | null
          user_id: string
        }
        Update: {
          bridge_id?: string
          created_at?: string
          dest_repo?: string
          direction?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          log_excerpt?: string | null
          pr_number?: number | null
          pr_url?: string | null
          source_repo?: string
          started_at?: string | null
          status?: string
          trigger_commit_sha?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          bridge_id: string | null
          delivery_id: string
          event_type: string
          id: string
          processed: boolean
          received_at: string
          repo: string
        }
        Insert: {
          bridge_id?: string | null
          delivery_id: string
          event_type: string
          id?: string
          processed?: boolean
          received_at?: string
          repo: string
        }
        Update: {
          bridge_id?: string | null
          delivery_id?: string
          event_type?: string
          id?: string
          processed?: boolean
          received_at?: string
          repo?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
