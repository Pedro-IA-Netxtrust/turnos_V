export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          employee_code: string;
          first_name: string;
          last_name: string;
          area_id: string;
          position: string | null;
          fte_percentage: number;
          is_active: boolean;
          hire_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_code: string;
          first_name: string;
          last_name: string;
          area_id: string;
          position?: string | null;
          fte_percentage?: number;
          is_active?: boolean;
          hire_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_code?: string;
          first_name?: string;
          last_name?: string;
          area_id?: string;
          position?: string | null;
          fte_percentage?: number;
          is_active?: boolean;
          hire_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_patterns: {
        Row: {
          id: string;
          area_id: string;
          name: string;
          hours_sun: number;
          hours_mon: number;
          hours_tue: number;
          hours_wed: number;
          hours_thu: number;
          hours_fri: number;
          hours_sat: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          area_id: string;
          name: string;
          hours_sun?: number;
          hours_mon?: number;
          hours_tue?: number;
          hours_wed?: number;
          hours_thu?: number;
          hours_fri?: number;
          hours_sat?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          area_id?: string;
          name?: string;
          hours_sun?: number;
          hours_mon?: number;
          hours_tue?: number;
          hours_wed?: number;
          hours_thu?: number;
          hours_fri?: number;
          hours_sat?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_targets: {
        Row: {
          id: string;
          area_id: string;
          year: number;
          month: number;
          pattern_id: string;
          target_hours: number;
          computed_fte_hours: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          area_id: string;
          year: number;
          month: number;
          pattern_id: string;
          target_hours: number;
          computed_fte_hours?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          area_id?: string;
          year?: number;
          month?: number;
          pattern_id?: string;
          target_hours?: number;
          computed_fte_hours?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      planning_daily: {
        Row: {
          id: string;
          employee_id: string;
          plan_date: string;
          status: 'P' | 'T' | 'V' | 'L';
          hours_worked: number;
          notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          plan_date: string;
          status?: 'P' | 'T' | 'V' | 'L';
          hours_worked?: number;
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_id?: string;
          plan_date?: string;
          status?: 'P' | 'T' | 'V' | 'L';
          hours_worked?: number;
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'ADMIN' | 'SUPERVISOR' | 'VIEWER';
          area_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'ADMIN' | 'SUPERVISOR' | 'VIEWER';
          area_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'ADMIN' | 'SUPERVISOR' | 'VIEWER';
          area_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data: Json | null;
          new_data: Json | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: number;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data?: Json | null;
          new_data?: Json | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          table_name?: string;
          record_id?: string;
          action?: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data?: Json | null;
          new_data?: Json | null;
          changed_by?: string | null;
          changed_at?: string;
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
      attendance_status: 'P' | 'T' | 'V' | 'L';
      user_role: 'ADMIN' | 'SUPERVISOR' | 'VIEWER';
      audit_action: 'INSERT' | 'UPDATE' | 'DELETE';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
