// 予約サイトと管理ツール間で共有する型定義

// 顧客情報の型
export interface Customer {
  id: string;
  customer_number: string;
  name: string;
  email?: string;
  phone?: string;
  line_name?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'not_specified';
  postal_code?: string;
  address?: string;
  membership_number?: string;
  total_visits: number;
  total_spent: number;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  updated_at: string;
}

// 予約情報の型
export interface Reservation {
  id: string;
  reservation_number: string;
  reservation_page_id?: string;
  title: string;
  scenario_id?: string;
  store_id: string;
  customer_id: string;
  
  // 予約日時情報
  requested_datetime: string;
  actual_datetime?: string;
  duration?: number;
  
  // 参加者情報
  participant_count: number;
  participant_names?: string[];
  
  // スタッフ情報
  assigned_staff?: string[];
  gm_staff?: string;
  
  // 料金情報
  base_price: number;
  options_price: number;
  total_price: number;
  discount_amount: number;
  final_price: number;
  
  // 支払い情報
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: string;
  payment_datetime?: string;
  
  // ステータス管理
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  
  // 追加情報
  customer_notes?: string;
  staff_notes?: string;
  special_requests?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  
  // 外部システム連携
  external_reservation_id?: string;
  reservation_source: string;
  
  created_at: string;
  updated_at: string;
}

// 予約オプションの型
export interface ReservationOption {
  id: string;
  reservation_id: string;
  option_name: string;
  option_value?: string;
  additional_price: number;
  created_at: string;
}

// 予約履歴の型
export interface ReservationHistory {
  id: string;
  reservation_id: string;
  changed_by: string;
  change_type: 'status_change' | 'datetime_change' | 'staff_assignment' | 'payment_update' | 'notes_update';
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_at: string;
}

// 予約作成時のリクエスト型
export interface CreateReservationRequest {
  title: string;
  scenario_id?: string;
  store_id: string;
  requested_datetime: string;
  participant_count: number;
  participant_names?: string[];
  
  // 顧客情報（新規または既存）
  customer: {
    id?: string; // 既存顧客の場合
    name: string;
    email?: string;
    phone?: string;
    line_name?: string;
  };
  
  // 料金情報
  base_price: number;
  options?: {
    name: string;
    value?: string;
    price: number;
  }[];
  
  // 追加情報
  customer_notes?: string;
  special_requests?: string;
  reservation_source?: string;
}

// 予約更新時のリクエスト型
export interface UpdateReservationRequest {
  requested_datetime?: string;
  participant_count?: number;
  participant_names?: string[];
  assigned_staff?: string[];
  gm_staff?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  customer_notes?: string;
  staff_notes?: string;
  special_requests?: string;
  cancellation_reason?: string;
}

// 予約検索・フィルタリング用の型
export interface ReservationFilters {
  store_id?: string;
  scenario_id?: string;
  status?: string[];
  payment_status?: string[];
  date_from?: string;
  date_to?: string;
  customer_name?: string;
  reservation_number?: string;
  staff_id?: string;
}

// API レスポンス用の型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 予約統計情報の型
export interface ReservationStats {
  total_reservations: number;
  confirmed_reservations: number;
  pending_reservations: number;
  cancelled_reservations: number;
  total_revenue: number;
  confirmed_revenue: number;
  average_price: number;
  popular_scenarios: {
    scenario_id: string;
    scenario_title: string;
    count: number;
  }[];
  busy_time_slots: {
    hour: number;
    count: number;
  }[];
}

// Webhook通知用の型
export interface WebhookPayload {
  type: 'reservation_change' | 'customer_update' | 'staff_assignment';
  changeType: 'created' | 'updated' | 'cancelled' | 'completed';
  reservationId?: string;
  customerId?: string;
  data: any;
  timestamp: string;
  source: 'admin' | 'reservation';
}

// 予約サイト用の設定型
export interface ReservationSiteConfig {
  site_name: string;
  site_url: string;
  contact_email: string;
  contact_phone: string;
  business_hours: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  booking_rules: {
    advance_booking_days: number;
    cancellation_deadline_hours: number;
    max_participants_per_booking: number;
    require_phone: boolean;
    require_email: boolean;
  };
  payment_settings: {
    require_advance_payment: boolean;
    accepted_methods: string[];
    cancellation_fee_percentage: number;
  };
}

// エラー型
export interface ReservationError {
  code: string;
  message: string;
  details?: any;
}

// 予約可能時間スロットの型
export interface AvailableTimeSlot {
  datetime: string;
  available: boolean;
  reason?: string; // 利用不可の理由
  remaining_capacity?: number;
  assigned_staff?: string[];
}

// 予約確認メール用のデータ型
export interface ReservationEmailData {
  reservation: Reservation;
  customer: Customer;
  store: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  scenario?: {
    title: string;
    description?: string;
    duration: number;
  };
}
