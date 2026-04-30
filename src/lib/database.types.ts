export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          password: string;
          status_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          password?: string;
          status_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          password?: string;
          status_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          priority: string;
          repeat_rule: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          priority?: string;
          repeat_rule: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          priority?: string;
          repeat_rule?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      task_instances: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          priority: string;
          date: string;
          completed: boolean;
          completed_at: string | null;
          source_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id?: string | null;
          title: string;
          description?: string | null;
          category?: string | null;
          priority?: string;
          date: string;
          completed?: boolean;
          completed_at?: string | null;
          source_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string | null;
          title?: string;
          description?: string | null;
          category?: string | null;
          priority?: string;
          date?: string;
          completed?: boolean;
          completed_at?: string | null;
          source_type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_instances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_instances_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          }
        ];
      };
      recovery_states: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recovery_states_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      recovery_journeys: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_time: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_time?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recovery_journeys_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      failure_logs: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          timestamp: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          journey_id?: string | null;
          timestamp?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          journey_id?: string | null;
          timestamp?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "failure_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "failure_logs_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "recovery_journeys";
            referencedColumns: ["id"];
          }
        ];
      };
      competitive_journeys: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          start_date: string;
          end_date: string | null;
          rules_text: string | null;
          rules_json: Json;
          max_failures: number | null;
          consequence_rules: string | null;
          visibility: string;
          invite_code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          start_date: string;
          end_date?: string | null;
          rules_text?: string | null;
          rules_json?: Json;
          max_failures?: number | null;
          consequence_rules?: string | null;
          visibility?: string;
          invite_code?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          start_date?: string;
          end_date?: string | null;
          rules_text?: string | null;
          rules_json?: Json;
          max_failures?: number | null;
          consequence_rules?: string | null;
          visibility?: string;
          invite_code?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitive_journeys_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_participants: {
        Row: {
          id: string;
          journey_id: string;
          user_id: string;
          joined_at: string;
          role: string;
          status: string;
          current_streak: number;
          total_failures: number;
          last_failure_at: string | null;
          last_check_in_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          user_id: string;
          joined_at?: string;
          role?: string;
          status?: string;
          current_streak?: number;
          total_failures?: number;
          last_failure_at?: string | null;
          last_check_in_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          user_id?: string;
          joined_at?: string;
          role?: string;
          status?: string;
          current_streak?: number;
          total_failures?: number;
          last_failure_at?: string | null;
          last_check_in_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_participants_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_failures: {
        Row: {
          id: string;
          journey_id: string;
          user_id: string;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          user_id: string;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          user_id?: string;
          timestamp?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_failures_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_failures_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_consequences: {
        Row: {
          id: string;
          journey_id: string;
          failure_threshold: number;
          description: string;
          consequence_type: string;
          symbol: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          failure_threshold: number;
          description: string;
          consequence_type?: string;
          symbol?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          failure_threshold?: number;
          description?: string;
          consequence_type?: string;
          symbol?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_consequences_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_consequence_statuses: {
        Row: {
          id: string;
          journey_id: string;
          participant_id: string;
          consequence_id: string;
          status: string;
          triggered_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          journey_id: string;
          participant_id: string;
          consequence_id: string;
          status?: string;
          triggered_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          journey_id?: string;
          participant_id?: string;
          consequence_id?: string;
          status?: string;
          triggered_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journey_consequence_statuses_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_consequence_statuses_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "journey_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_consequence_statuses_consequence_id_fkey";
            columns: ["consequence_id"];
            isOneToOne: false;
            referencedRelation: "journey_consequences";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_invites: {
        Row: {
          id: string;
          journey_id: string;
          invited_by: string;
          invitee_user_id: string | null;
          invitee_email: string | null;
          invitee_username: string | null;
          token: string;
          status: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          journey_id: string;
          invited_by: string;
          invitee_user_id?: string | null;
          invitee_email?: string | null;
          invitee_username?: string | null;
          token?: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          journey_id?: string;
          invited_by?: string;
          invitee_user_id?: string | null;
          invitee_email?: string | null;
          invitee_username?: string | null;
          token?: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journey_invites_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_invites_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_invites_invitee_user_id_fkey";
            columns: ["invitee_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_reactions: {
        Row: {
          id: string;
          journey_id: string;
          from_user_id: string;
          to_user_id: string | null;
          emoji: string;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          from_user_id: string;
          to_user_id?: string | null;
          emoji?: string;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          from_user_id?: string;
          to_user_id?: string | null;
          emoji?: string;
          message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_reactions_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_reactions_from_user_id_fkey";
            columns: ["from_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_reactions_to_user_id_fkey";
            columns: ["to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      journey_check_ins: {
        Row: {
          id: string;
          journey_id: string;
          user_id: string;
          check_in_date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          user_id: string;
          check_in_date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          user_id?: string;
          check_in_date?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_check_ins_journey_id_fkey";
            columns: ["journey_id"];
            isOneToOne: false;
            referencedRelation: "competitive_journeys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_check_ins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          goal_type: string;
          target_date: string | null;
          target_count: number;
          current_count: number;
          completed: boolean;
          completed_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          goal_type?: string;
          target_date?: string | null;
          target_count?: number;
          current_count?: number;
          completed?: boolean;
          completed_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          goal_type?: string;
          target_date?: string | null;
          target_count?: number;
          current_count?: number;
          completed?: boolean;
          completed_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          plan_type: string;
          status: string;
          priority: string;
          category: string | null;
          notes: string | null;
          start_date: string;
          start_time: string | null;
          end_date: string | null;
          end_time: string | null;
          day_of_week: string | null;
          prayer_block: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          plan_type?: string;
          status?: string;
          priority?: string;
          category?: string | null;
          notes?: string | null;
          start_date: string;
          start_time?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          day_of_week?: string | null;
          prayer_block?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          plan_type?: string;
          status?: string;
          priority?: string;
          category?: string | null;
          notes?: string | null;
          start_date?: string;
          start_time?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          day_of_week?: string | null;
          prayer_block?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      prayer_times: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          fajr: string;
          sunrise: string | null;
          dhuhr: string;
          asr: string;
          maghrib: string;
          isha: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          fajr?: string;
          sunrise?: string | null;
          dhuhr?: string;
          asr?: string;
          maghrib?: string;
          isha?: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          fajr?: string;
          sunrise?: string | null;
          dhuhr?: string;
          asr?: string;
          maghrib?: string;
          isha?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prayer_times_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
