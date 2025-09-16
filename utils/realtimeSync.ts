import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// リアルタイム同期のイベントタイプ
export type SyncEventType = 'INSERT' | 'UPDATE' | 'DELETE';

// 同期対象テーブル
export type SyncTable = 'reservations' | 'customers' | 'staff' | 'scenarios' | 'stores' | 'edit_history';

// 同期イベントのデータ構造
export interface SyncEvent {
  table: SyncTable;
  eventType: SyncEventType;
  new?: any;
  old?: any;
  timestamp: string;
  source: 'admin' | 'reservation';
}

// 同期イベントのコールバック関数の型
export type SyncCallback = (event: SyncEvent) => void;

class RealtimeSyncManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, SyncCallback[]> = new Map();
  private isConnected: boolean = false;
  private systemType: 'admin' | 'reservation';

  constructor() {
    this.systemType = (import.meta as any).env?.VITE_SYSTEM_TYPE === 'reservation' ? 'reservation' : 'admin';
  }

  /**
   * リアルタイム同期を開始
   */
  async startSync(tables: SyncTable[] = ['reservations', 'customers', 'staff', 'scenarios', 'stores']): Promise<void> {
    try {
      console.log(`🔄 リアルタイム同期を開始 (${this.systemType})`);
      
      for (const table of tables) {
        await this.subscribeToTable(table);
      }
      
      this.isConnected = true;
      console.log('✅ リアルタイム同期が開始されました');
      
    } catch (error) {
      console.error('❌ リアルタイム同期の開始に失敗:', error);
      throw error;
    }
  }

  /**
   * 特定のテーブルの変更を監視
   */
  private async subscribeToTable(table: SyncTable): Promise<void> {
    const channelName = `${table}_changes`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          this.handleDatabaseChange(table, payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 ${table}テーブルの監視を開始`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ ${table}テーブルの監視でエラー発生`);
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * データベース変更イベントの処理
   */
  private handleDatabaseChange(table: SyncTable, payload: any): void {
    const event: SyncEvent = {
      table,
      eventType: payload.eventType as SyncEventType,
      new: payload.new,
      old: payload.old,
      timestamp: new Date().toISOString(),
      source: this.systemType
    };

    // 登録されたコールバック関数を実行
    const tableCallbacks = this.callbacks.get(table) || [];
    tableCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`コールバック実行エラー (${table}):`, error);
      }
    });

    // 全テーブル共通のコールバックも実行
    const globalCallbacks = this.callbacks.get('*') || [];
    globalCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('グローバルコールバック実行エラー:', error);
      }
    });

    console.log(`🔄 ${table} ${payload.eventType}:`, payload.new || payload.old);
  }

  /**
   * 変更イベントのコールバック関数を登録
   */
  onTableChange(table: SyncTable | '*', callback: SyncCallback): void {
    if (!this.callbacks.has(table)) {
      this.callbacks.set(table, []);
    }
    this.callbacks.get(table)!.push(callback);
  }

  /**
   * コールバック関数の登録を解除
   */
  offTableChange(table: SyncTable | '*', callback: SyncCallback): void {
    const callbacks = this.callbacks.get(table);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 同期を停止
   */
  async stopSync(): Promise<void> {
    console.log('🛑 リアルタイム同期を停止中...');
    
    for (const [channelName, channel] of this.channels) {
      await supabase.removeChannel(channel);
      console.log(`📡 ${channelName}の監視を停止`);
    }
    
    this.channels.clear();
    this.callbacks.clear();
    this.isConnected = false;
    
    console.log('✅ リアルタイム同期が停止されました');
  }

  /**
   * 接続状態を取得
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 手動でデータ同期を実行
   */
  async manualSync(table: SyncTable): Promise<void> {
    try {
      console.log(`🔄 ${table}の手動同期を実行中...`);
      
      // 最新データを取得して同期イベントを発火
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const event: SyncEvent = {
          table,
          eventType: 'UPDATE',
          new: data[0],
          timestamp: new Date().toISOString(),
          source: this.systemType
        };

        // コールバックを実行
        const callbacks = this.callbacks.get(table) || [];
        callbacks.forEach(callback => callback(event));
      }

      console.log(`✅ ${table}の手動同期が完了`);
      
    } catch (error) {
      console.error(`❌ ${table}の手動同期に失敗:`, error);
      throw error;
    }
  }

  /**
   * 予約データの変更を他システムに通知
   */
  async notifyReservationChange(
    reservationId: string, 
    changeType: 'created' | 'updated' | 'cancelled',
    data: any
  ): Promise<void> {
    try {
      // Webhook通知の実装
      const webhookUrl = this.systemType === 'admin' 
        ? (import.meta as any).env?.VITE_RESERVATION_WEBHOOK_URL
        : (import.meta as any).env?.VITE_ADMIN_WEBHOOK_URL;

      if (!webhookUrl) {
        console.warn('Webhook URLが設定されていません');
        return;
      }

      const payload = {
        type: 'reservation_change',
        changeType,
        reservationId,
        data,
        timestamp: new Date().toISOString(),
        source: this.systemType
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(import.meta as any).env?.VITE_API_SECRET_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook通知に失敗: ${response.status}`);
      }

      console.log(`📤 予約変更通知を送信: ${changeType} - ${reservationId}`);
      
    } catch (error) {
      console.error('Webhook通知エラー:', error);
      // エラーが発生してもシステムを停止させない
    }
  }
}

// シングルトンインスタンス
export const realtimeSync = new RealtimeSyncManager();

// React Hook用のユーティリティ
export function useRealtimeSync() {
  return {
    startSync: realtimeSync.startSync.bind(realtimeSync),
    stopSync: realtimeSync.stopSync.bind(realtimeSync),
    onTableChange: realtimeSync.onTableChange.bind(realtimeSync),
    offTableChange: realtimeSync.offTableChange.bind(realtimeSync),
    manualSync: realtimeSync.manualSync.bind(realtimeSync),
    notifyReservationChange: realtimeSync.notifyReservationChange.bind(realtimeSync),
    isConnected: realtimeSync.getConnectionStatus.bind(realtimeSync)
  };
}
