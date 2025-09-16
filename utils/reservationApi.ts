import { supabase } from '../lib/supabase';
import { realtimeSync } from './realtimeSync';
import {
  Reservation,
  Customer,
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationFilters,
  ApiResponse,
  PaginatedResponse,
  ReservationStats,
  AvailableTimeSlot
} from '../types/reservation';

/**
 * 予約サイト用のAPI関数集
 * 管理ツールと予約サイトの両方で使用可能
 */
export class ReservationAPI {
  
  /**
   * 新規予約を作成
   */
  static async createReservation(request: CreateReservationRequest): Promise<ApiResponse<Reservation>> {
    try {
      // 1. 顧客情報の処理（新規作成または既存顧客の取得）
      let customer: Customer;
      
      if (request.customer.id) {
        // 既存顧客の場合
        const { data: existingCustomer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', request.customer.id)
          .single();
          
        if (customerError || !existingCustomer) {
          return { success: false, error: '顧客情報が見つかりません' };
        }
        customer = existingCustomer;
      } else {
        // 新規顧客の場合
        const customerNumber = await this.generateCustomerNumber();
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            customer_number: customerNumber,
            name: request.customer.name,
            email: request.customer.email,
            phone: request.customer.phone,
            line_name: request.customer.line_name,
            total_visits: 0,
            total_spent: 0,
            status: 'active'
          })
          .select()
          .single();
          
        if (customerError || !newCustomer) {
          return { success: false, error: '顧客情報の作成に失敗しました' };
        }
        customer = newCustomer;
      }

      // 2. 料金計算
      const optionsPrice = request.options?.reduce((sum, option) => sum + option.price, 0) || 0;
      const totalPrice = request.base_price + optionsPrice;

      // 3. 予約データの作成
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          title: request.title,
          scenario_id: request.scenario_id,
          store_id: request.store_id,
          customer_id: customer.id,
          requested_datetime: request.requested_datetime,
          participant_count: request.participant_count,
          participant_names: request.participant_names,
          base_price: request.base_price,
          options_price: optionsPrice,
          total_price: totalPrice,
          final_price: totalPrice,
          payment_status: 'pending',
          status: 'pending',
          customer_notes: request.customer_notes,
          special_requests: request.special_requests,
          reservation_source: request.reservation_source || 'website'
        })
        .select()
        .single();

      if (reservationError || !reservation) {
        return { success: false, error: '予約の作成に失敗しました' };
      }

      // 4. オプションの追加
      if (request.options && request.options.length > 0) {
        const optionInserts = request.options.map(option => ({
          reservation_id: reservation.id,
          option_name: option.name,
          option_value: option.value,
          additional_price: option.price
        }));

        await supabase
          .from('reservation_options')
          .insert(optionInserts);
      }

      // 5. 履歴の記録
      await this.addReservationHistory(
        reservation.id,
        'システム',
        'status_change',
        null,
        'pending',
        '新規予約が作成されました'
      );

      // 6. リアルタイム通知
      await realtimeSync.notifyReservationChange(
        reservation.id,
        'created',
        reservation
      );

      return { success: true, data: reservation };

    } catch (error) {
      console.error('予約作成エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '予約作成に失敗しました' 
      };
    }
  }

  /**
   * 予約情報を更新
   */
  static async updateReservation(
    reservationId: string, 
    request: UpdateReservationRequest,
    updatedBy: string = 'システム'
  ): Promise<ApiResponse<Reservation>> {
    try {
      // 現在の予約情報を取得
      const { data: currentReservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (fetchError || !currentReservation) {
        return { success: false, error: '予約が見つかりません' };
      }

      // 更新データの準備
      const updateData: any = { ...request };
      
      // キャンセルの場合は時刻を記録
      if (request.status === 'cancelled' && currentReservation.status !== 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      // 予約情報を更新
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError || !updatedReservation) {
        return { success: false, error: '予約の更新に失敗しました' };
      }

      // 変更履歴の記録
      for (const [key, newValue] of Object.entries(request)) {
        const oldValue = currentReservation[key];
        if (oldValue !== newValue) {
          await this.addReservationHistory(
            reservationId,
            updatedBy,
            this.getChangeType(key),
            String(oldValue),
            String(newValue),
            `${key}が更新されました`
          );
        }
      }

      // リアルタイム通知
      await realtimeSync.notifyReservationChange(
        reservationId,
        'updated',
        updatedReservation
      );

      return { success: true, data: updatedReservation };

    } catch (error) {
      console.error('予約更新エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '予約更新に失敗しました' 
      };
    }
  }

  /**
   * 予約をキャンセル
   */
  static async cancelReservation(
    reservationId: string, 
    reason: string,
    cancelledBy: string = 'システム'
  ): Promise<ApiResponse<Reservation>> {
    return this.updateReservation(reservationId, {
      status: 'cancelled',
      cancellation_reason: reason
    }, cancelledBy);
  }

  /**
   * 予約一覧を取得（フィルタリング・ページネーション対応）
   */
  static async getReservations(
    filters: ReservationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Reservation>> {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            customer_number
          ),
          stores (
            id,
            name,
            short_name
          ),
          scenarios (
            id,
            title,
            duration
          )
        `, { count: 'exact' });

      // フィルタリング
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters.scenario_id) {
        query = query.eq('scenario_id', filters.scenario_id);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.payment_status && filters.payment_status.length > 0) {
        query = query.in('payment_status', filters.payment_status);
      }
      if (filters.date_from) {
        query = query.gte('requested_datetime', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('requested_datetime', filters.date_to);
      }
      if (filters.reservation_number) {
        query = query.ilike('reservation_number', `%${filters.reservation_number}%`);
      }
      if (filters.staff_id) {
        query = query.contains('assigned_staff', [filters.staff_id]);
      }

      // ページネーション
      const offset = (page - 1) * limit;
      query = query
        .order('requested_datetime', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      };

    } catch (error) {
      console.error('予約一覧取得エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '予約一覧の取得に失敗しました' 
      };
    }
  }

  /**
   * 特定の予約を取得
   */
  static async getReservation(reservationId: string): Promise<ApiResponse<Reservation>> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customers (*),
          stores (*),
          scenarios (*),
          reservation_options (*),
          reservation_history (*)
        `)
        .eq('id', reservationId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (error) {
      console.error('予約取得エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '予約の取得に失敗しました' 
      };
    }
  }

  /**
   * 利用可能な時間スロットを取得
   */
  static async getAvailableTimeSlots(
    storeId: string,
    date: string,
    scenarioId?: string
  ): Promise<ApiResponse<AvailableTimeSlot[]>> {
    try {
      // 基本的な営業時間スロット（9:00-22:00、1時間間隔）
      const slots: AvailableTimeSlot[] = [];
      const targetDate = new Date(date);
      
      for (let hour = 9; hour <= 21; hour++) {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, 0, 0, 0);
        
        // 既存の予約をチェック
        const { data: existingReservations } = await supabase
          .from('reservations')
          .select('*')
          .eq('store_id', storeId)
          .gte('requested_datetime', slotTime.toISOString())
          .lt('requested_datetime', new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString())
          .in('status', ['pending', 'confirmed']);

        const isAvailable = !existingReservations || existingReservations.length === 0;
        
        slots.push({
          datetime: slotTime.toISOString(),
          available: isAvailable,
          reason: isAvailable ? undefined : '既に予約が入っています',
          remaining_capacity: isAvailable ? 1 : 0
        });
      }

      return { success: true, data: slots };

    } catch (error) {
      console.error('利用可能時間取得エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '利用可能時間の取得に失敗しました' 
      };
    }
  }

  /**
   * 予約統計情報を取得
   */
  static async getReservationStats(
    storeId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<ReservationStats>> {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          scenarios (title)
        `);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      if (dateFrom) {
        query = query.gte('requested_datetime', dateFrom);
      }
      if (dateTo) {
        query = query.lte('requested_datetime', dateTo);
      }

      const { data: reservations, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      if (!reservations) {
        return { success: false, error: 'データが取得できませんでした' };
      }

      // 統計情報の計算
      const stats: ReservationStats = {
        total_reservations: reservations.length,
        confirmed_reservations: reservations.filter(r => r.status === 'confirmed').length,
        pending_reservations: reservations.filter(r => r.status === 'pending').length,
        cancelled_reservations: reservations.filter(r => r.status === 'cancelled').length,
        total_revenue: reservations.reduce((sum, r) => sum + r.final_price, 0),
        confirmed_revenue: reservations
          .filter(r => r.status === 'confirmed')
          .reduce((sum, r) => sum + r.final_price, 0),
        average_price: reservations.length > 0 
          ? reservations.reduce((sum, r) => sum + r.final_price, 0) / reservations.length 
          : 0,
        popular_scenarios: [],
        busy_time_slots: []
      };

      return { success: true, data: stats };

    } catch (error) {
      console.error('統計情報取得エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '統計情報の取得に失敗しました' 
      };
    }
  }

  // ユーティリティメソッド

  /**
   * 顧客番号を生成
   */
  private static async generateCustomerNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 今日作成された顧客数を取得
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lt('created_at', `${dateStr}T23:59:59Z`);

    const sequence = String((count || 0) + 1).padStart(4, '0');
    return `${dateStr}${sequence}`;
  }

  /**
   * 予約履歴を追加
   */
  private static async addReservationHistory(
    reservationId: string,
    changedBy: string,
    changeType: 'status_change' | 'datetime_change' | 'staff_assignment' | 'payment_update' | 'notes_update',
    oldValue: string | null,
    newValue: string,
    notes?: string
  ): Promise<void> {
    await supabase
      .from('reservation_history')
      .insert({
        reservation_id: reservationId,
        changed_by: changedBy,
        change_type: changeType,
        old_value: oldValue,
        new_value: newValue,
        notes
      });
  }

  /**
   * 変更タイプを判定
   */
  private static getChangeType(fieldName: string): 'status_change' | 'datetime_change' | 'staff_assignment' | 'payment_update' | 'notes_update' {
    if (fieldName === 'status') return 'status_change';
    if (fieldName.includes('datetime')) return 'datetime_change';
    if (fieldName.includes('staff')) return 'staff_assignment';
    if (fieldName.includes('payment')) return 'payment_update';
    return 'notes_update';
  }
}
