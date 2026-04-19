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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
