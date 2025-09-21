import { createClient } from '@supabase/supabase-js';

// 環境変数の取得（未設定の場合はダミー値を使用）
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Supabaseクライアントの作成（環境変数が正しく設定されていない場合でも動作）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabaseが正しく設定されているかチェック
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key' &&
         supabaseUrl.includes('supabase.co');
};

// データベースの型定義
export interface Database {
  public: {
    Tables: {
      // スタッフテーブル
      staff: {
        Row: {
          id: string;
          name: string;
          line_name: string;
          x_account: string | null;
          role: string[];
          stores: string[];
          ng_days: string[];
          want_to_learn: string[];
          available_scenarios: string[];
          notes: string | null;
          phone: string | null;
          email: string | null;
          availability: string[];
          experience: number;
          special_scenarios: string[];
          status: 'active' | 'inactive' | 'on-leave';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          line_name: string;
          x_account?: string | null;
          role: string[];
          stores: string[];
          ng_days?: string[];
          want_to_learn?: string[];
          available_scenarios?: string[];
          notes?: string | null;
          phone?: string | null;
          email?: string | null;
          availability?: string[];
          experience?: number;
          special_scenarios?: string[];
          status?: 'active' | 'inactive' | 'on-leave';
        };
        Update: {
          id?: string;
          name?: string;
          line_name?: string;
          x_account?: string | null;
          role?: string[];
          stores?: string[];
          ng_days?: string[];
          want_to_learn?: string[];
          available_scenarios?: string[];
          notes?: string | null;
          phone?: string | null;
          email?: string | null;
          availability?: string[];
          experience?: number;
          special_scenarios?: string[];
          status?: 'active' | 'inactive' | 'on-leave';
        };
      };

      // シナリオテーブル
      scenarios: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          author: string;
          license_amount: number;
          duration: number;
          player_count_min: number;
          player_count_max: number;
          difficulty: number;
          available_gms: string[];
          rating: number;
          play_count: number;
          status: 'available' | 'maintenance' | 'retired';
          required_props: string[];
          props: { name: string; cost: number; costType: 'per_play' | 'one_time' }[];
          genre: string[];
          production_cost: number;
          production_cost_items: { name: string; cost: number }[];
          revenue: number;
          gm_fee: number;
          miscellaneous_expenses: number;
          license_rate_override: number;
          participation_fee: number;
          notes: string | null;
          has_pre_reading: boolean;
          release_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          author: string;
          license_amount?: number;
          duration: number;
          player_count_min: number;
          player_count_max: number;
          difficulty: number;
          available_gms?: string[];
          rating?: number;
          play_count?: number;
          status?: 'available' | 'maintenance' | 'retired';
          required_props?: string[];
          props?: { name: string; cost: number; costType: 'per_play' | 'one_time' }[];
          genre?: string[];
          production_cost?: number;
          production_cost_items?: { name: string; cost: number }[];
          revenue?: number;
          gm_fee?: number;
          miscellaneous_expenses?: number;
          license_rate_override?: number;
          participation_fee?: number;
          notes?: string | null;
          has_pre_reading?: boolean;
          release_date?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          author?: string;
          license_amount?: number;
          duration?: number;
          player_count_min?: number;
          player_count_max?: number;
          difficulty?: number;
          available_gms?: string[];
          rating?: number;
          play_count?: number;
          status?: 'available' | 'maintenance' | 'retired';
          required_props?: string[];
          props?: { name: string; cost: number; costType: 'per_play' | 'one_time' }[];
          genre?: string[];
          production_cost?: number;
          production_cost_items?: { name: string; cost: number }[];
          revenue?: number;
          gm_fee?: number;
          miscellaneous_expenses?: number;
          license_rate_override?: number;
          participation_fee?: number;
          notes?: string | null;
          has_pre_reading?: boolean;
          release_date?: string | null;
        };
      };

      // 店舗テーブル
      stores: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          address: string;
          phone_number: string;
          email: string;
          opening_date: string;
          manager_name: string;
          status: 'active' | 'temporarily_closed' | 'closed';
          capacity: number;
          rooms: number;
          notes: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          address: string;
          phone_number: string;
          email: string;
          opening_date: string;
          manager_name: string;
          status?: 'active' | 'temporarily_closed' | 'closed';
          capacity: number;
          rooms: number;
          notes?: string | null;
          color: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string;
          address?: string;
          phone_number?: string;
          email?: string;
          opening_date?: string;
          manager_name?: string;
          status?: 'active' | 'temporarily_closed' | 'closed';
          capacity?: number;
          rooms?: number;
          notes?: string | null;
          color?: string;
        };
      };

      // 公演キットテーブル
      performance_kits: {
        Row: {
          id: string;
          scenario_id: string;
          scenario_title: string;
          kit_number: number;
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
          last_used: string | null;
          notes: string | null;
          store_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scenario_id: string;
          scenario_title: string;
          kit_number: number;
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
          last_used?: string | null;
          notes?: string | null;
          store_id: string;
        };
        Update: {
          id?: string;
          scenario_id?: string;
          scenario_title?: string;
          kit_number?: number;
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
          last_used?: string | null;
          notes?: string | null;
          store_id?: string;
        };
      };

      // スケジュールイベントテーブル
      schedule_events: {
        Row: {
          id: string;
          date: string;
          venue: string;
          scenario: string;
          gms: string[];
          start_time: string;
          end_time: string;
          category: 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';
          reservation_info: string | null;
          notes: string | null;
          is_cancelled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          venue: string;
          scenario: string;
          gms?: string[];
          start_time: string;
          end_time: string;
          category: 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';
          reservation_info?: string | null;
          notes?: string | null;
          is_cancelled?: boolean;
        };
        Update: {
          id?: string;
          date?: string;
          venue?: string;
          scenario?: string;
          gms?: string[];
          start_time?: string;
          end_time?: string;
          category?: 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';
          reservation_info?: string | null;
          notes?: string | null;
          is_cancelled?: boolean;
        };
      };

      // シナリオ給料テーブル
      scenario_salaries: {
        Row: {
          id: string;
          scenario_title: string;
          role: 'GM' | 'サポート';
          base_salary: number;
          bonus_rate: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scenario_title: string;
          role: 'GM' | 'サポート';
          base_salary: number;
          bonus_rate?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          scenario_title?: string;
          role?: 'GM' | 'サポート';
          base_salary?: number;
          bonus_rate?: number;
          is_active?: boolean;
        };
      };

      // スタッフ出勤記録テーブル
      staff_attendance: {
        Row: {
          id: string;
          staff_id: string;
          event_id: string;
          scenario_title: string;
          role: 'GM' | 'サポート';
          date: string;
          venue: string;
          start_time: string;
          end_time: string;
          salary_amount: number;
          status: 'pending' | 'approved' | 'paid';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          event_id: string;
          scenario_title: string;
          role: 'GM' | 'サポート';
          date: string;
          venue: string;
          start_time: string;
          end_time: string;
          salary_amount: number;
          status?: 'pending' | 'approved' | 'paid';
          notes?: string | null;
        };
        Update: {
          id?: string;
          staff_id?: string;
          event_id?: string;
          scenario_title?: string;
          role?: 'GM' | 'サポート';
          date?: string;
          venue?: string;
          start_time?: string;
          end_time?: string;
          salary_amount?: number;
          status?: 'pending' | 'approved' | 'paid';
          notes?: string | null;
        };
      };

      // 編集履歴テーブル
      edit_history: {
        Row: {
          id: string;
          timestamp: string;
          user: string;
          action: 'create' | 'update' | 'delete';
          target: string;
          summary: string;
          category: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory' | 'store';
          changes: {
            field: string;
            oldValue?: string;
            newValue: string;
          }[];
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp: string;
          user: string;
          action: 'create' | 'update' | 'delete';
          target: string;
          summary: string;
          category: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory' | 'store';
          changes: {
            field: string;
            oldValue?: string;
            newValue: string;
          }[];
        };
        Update: {
          id?: string;
          timestamp?: string;
          user?: string;
          action?: 'create' | 'update' | 'delete';
          target?: string;
          summary?: string;
          category?: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory';
          changes?: {
            field: string;
            oldValue?: string;
            newValue: string;
          }[];
        };
      };

      // ライセンス計算テーブル
      license_calculations: {
        Row: {
          id: string;
          scenario_title: string;
          author: string;
          email: string;
          discord_channel: string | null;
          license_rate: number;
          contact_method: 'email' | 'discord';
          calculated_at: string;
          sent_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scenario_title: string;
          author: string;
          email: string;
          discord_channel?: string | null;
          license_rate: number;
          contact_method: 'email' | 'discord';
          calculated_at: string;
          sent_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          scenario_title?: string;
          author?: string;
          email?: string;
          discord_channel?: string | null;
          license_rate?: number;
          contact_method?: 'email' | 'discord';
          calculated_at?: string;
          sent_at?: string | null;
          notes?: string | null;
        };
      };

      // シナリオ作者テーブル
      scenario_authors: {
        Row: {
          id: string;
          scenario_title: string;
          author: string;
          email: string;
          discord_channel: string | null;
          license_rate: number;
          contact_method: 'email' | 'discord';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scenario_title: string;
          author: string;
          email: string;
          discord_channel?: string | null;
          license_rate: number;
          contact_method: 'email' | 'discord';
        };
        Update: {
          id?: string;
          scenario_title?: string;
          author?: string;
          email?: string;
          discord_channel?: string | null;
          license_rate?: number;
          contact_method?: 'email' | 'discord';
        };
      };

      // 在庫アイテムテーブル
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: 'props' | 'equipment' | 'costume' | 'furniture' | 'other';
          quantity: number;
          unit: string;
          min_stock: number;
          current_location: string;
          status: 'available' | 'in_use' | 'maintenance' | 'disposed';
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
          purchase_date: string | null;
          purchase_price: number | null;
          next_maintenance: string | null;
          notes: string | null;
          supplier: string | null;
          used_in_scenarios: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'props' | 'equipment' | 'costume' | 'furniture' | 'other';
          quantity: number;
          unit: string;
          min_stock: number;
          current_location: string;
          status: 'available' | 'in_use' | 'maintenance' | 'disposed';
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
          purchase_date?: string | null;
          purchase_price?: number | null;
          next_maintenance?: string | null;
          notes?: string | null;
          supplier?: string | null;
          used_in_scenarios?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'props' | 'equipment' | 'costume' | 'furniture' | 'other';
          quantity?: number;
          unit?: string;
          min_stock?: number;
          current_location?: string;
          status?: 'available' | 'in_use' | 'maintenance' | 'disposed';
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
          purchase_date?: string | null;
          purchase_price?: number | null;
          next_maintenance?: string | null;
          notes?: string | null;
          supplier?: string | null;
          used_in_scenarios?: string[];
        };
      };

      // 在庫移動記録テーブル
      stock_movements: {
        Row: {
          id: string;
          item_id: string;
          type: 'in' | 'out' | 'transfer' | 'adjustment';
          quantity: number;
          date: string;
          from_location: string | null;
          to_location: string | null;
          reason: string;
          performed_by: string;
          related_scenario: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          type: 'in' | 'out' | 'transfer' | 'adjustment';
          quantity: number;
          date: string;
          from_location?: string | null;
          to_location?: string | null;
          reason: string;
          performed_by: string;
          related_scenario?: string | null;
        };
        Update: {
          id?: string;
          item_id?: string;
          type?: 'in' | 'out' | 'transfer' | 'adjustment';
          quantity?: number;
          date?: string;
          from_location?: string | null;
          to_location?: string | null;
          reason?: string;
          performed_by?: string;
          related_scenario?: string | null;
        };
      };

      // 顧客テーブル
      customers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          birthday: string | null;
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          address: string | null;
          notes: string | null;
          total_visits: number;
          last_visit: string | null;
          preferred_scenarios: string[];
          status: 'active' | 'inactive' | 'blacklisted';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          birthday?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          address?: string | null;
          notes?: string | null;
          total_visits?: number;
          last_visit?: string | null;
          preferred_scenarios?: string[];
          status?: 'active' | 'inactive' | 'blacklisted';
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          birthday?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          address?: string | null;
          notes?: string | null;
          total_visits?: number;
          last_visit?: string | null;
          preferred_scenarios?: string[];
          status?: 'active' | 'inactive' | 'blacklisted';
        };
      };

      // 売上記録テーブル
      sales_records: {
        Row: {
          id: string;
          date: string;
          customer_id: string | null;
          customer_name: string;
          scenario_title: string;
          venue: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer' | 'other';
          staff_id: string | null;
          staff_name: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          customer_id?: string | null;
          customer_name: string;
          scenario_title: string;
          venue: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer' | 'other';
          staff_id?: string | null;
          staff_name: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          customer_id?: string | null;
          customer_name?: string;
          scenario_title?: string;
          venue?: string;
          amount?: number;
          payment_method?: 'cash' | 'card' | 'transfer' | 'other';
          staff_id?: string | null;
          staff_name?: string;
          notes?: string | null;
        };
      };

      // スタッフ出勤可能時間テーブル
      staff_availability: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          date: string;
          morning: boolean;
          afternoon: boolean;
          evening: boolean;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          date: string;
          morning: boolean;
          afternoon: boolean;
          evening: boolean;
          submitted_at: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          date?: string;
          morning?: boolean;
          afternoon?: boolean;
          evening?: boolean;
          submitted_at?: string;
        };
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
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];