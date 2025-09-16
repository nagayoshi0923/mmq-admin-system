import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Scenario } from '../contexts/ScenarioContext';
import { Staff } from '../contexts/StaffContext';
import { Store } from '../contexts/StoreContext';
import { EditHistoryEntry } from '../contexts/EditHistoryContext';

// UUID生成関数
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 既存IDからUUIDへのマッピングを管理
class IDMapper {
  private static mappings: { [key: string]: string } = {};
  
  static getOrCreateUUID(oldId: string, prefix: string = ''): string {
    const key = `${prefix}_${oldId}`;
    if (!this.mappings[key]) {
      this.mappings[key] = generateUUID();
    }
    return this.mappings[key];
  }
  
  static clear() {
    this.mappings = {};
  }
}

// 既存のlocalStorageデータをSupabaseに移行する関数

export class SupabaseMigration {
  
  // 移行状況の管理
  private static migrationKey = 'supabase_migration_status';
  
  static getMigrationStatus(): {
    staff: boolean;
    scenarios: boolean;
    stores: boolean;
    editHistory: boolean;
    lastMigration: string | null;
  } {
    const status = localStorage.getItem(this.migrationKey);
    if (status) {
      try {
        return JSON.parse(status);
      } catch (error) {
        console.error('移行状況の読み込みエラー:', error);
      }
    }
    
    return {
      staff: false,
      scenarios: false,
      stores: false,
      editHistory: false,
      lastMigration: null
    };
  }
  
  static setMigrationStatus(status: Partial<{
    staff: boolean;
    scenarios: boolean;
    stores: boolean;
    editHistory: boolean;
  }>) {
    const current = this.getMigrationStatus();
    const updated = {
      ...current,
      ...status,
      lastMigration: new Date().toISOString()
    };
    localStorage.setItem(this.migrationKey, JSON.stringify(updated));
  }

  // スタッフデータの移行
  static async migrateStaff(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const staffData = localStorage.getItem('murder-mystery-staff');
      if (!staffData) {
        return { success: true, count: 0 };
      }

      const staff: Staff[] = JSON.parse(staffData);
      
      // 既存データをクリア（必要に応じて）
      // await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // データの変換と挿入（IDをUUIDに変換）
      const insertData = staff.map(s => ({
        id: IDMapper.getOrCreateUUID(s.id, 'staff'),
        name: s.name,
        line_name: s.lineName,
        x_account: s.xAccount || null,
        role: s.role,
        stores: s.stores.map(storeId => IDMapper.getOrCreateUUID(storeId, 'store')),
        ng_days: s.ngDays,
        want_to_learn: s.wantToLearn,
        available_scenarios: s.availableScenarios.map(scenarioId => IDMapper.getOrCreateUUID(scenarioId, 'scenario')),
        notes: s.notes || null,
        phone: s.contact?.phone || null,
        email: s.contact?.email || null,
        availability: s.availability,
        experience: s.experience,
        special_scenarios: s.specialScenarios.map(scenarioId => IDMapper.getOrCreateUUID(scenarioId, 'scenario')),
        status: s.status as 'active' | 'inactive' | 'on-leave'
      }));

      const { error } = await supabase
        .from('staff')
        .upsert(insertData, { onConflict: 'id' });

      if (error) {
        console.error('スタッフデータ移行エラー:', error);
        return { success: false, count: 0, error: error.message };
      }

      this.setMigrationStatus({ staff: true });
      console.log(`スタッフデータ移行完了: ${staff.length}件`);
      
      return { success: true, count: staff.length };
      
    } catch (error) {
      console.error('スタッフデータ移行エラー:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : '不明なエラー' 
      };
    }
  }

  // シナリオデータの移行
  static async migrateScenarios(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const scenarioData = localStorage.getItem('murder-mystery-scenarios');
      if (!scenarioData) {
        return { success: true, count: 0 };
      }

      const scenarios: Scenario[] = JSON.parse(scenarioData);
      
      const insertData = scenarios.map(s => ({
        id: IDMapper.getOrCreateUUID(s.id, 'scenario'),
        title: s.title,
        description: s.description || null,
        author: s.author,
        license_amount: s.licenseAmount || 3000,
        duration: s.duration,
        player_count_min: s.playerCount.min,
        player_count_max: s.playerCount.max,
        difficulty: s.difficulty,
        available_gms: s.availableGMs?.map(gmId => IDMapper.getOrCreateUUID(gmId, 'staff')) || [],
        rating: s.rating,
        play_count: s.playCount,
        status: s.status as 'available' | 'maintenance' | 'retired',
        required_props: s.requiredProps || [],
        genre: s.genre || [],
        notes: s.notes || null,
        has_pre_reading: s.hasPreReading || false,
        release_date: s.releaseDate || null
      }));

      const { error } = await supabase
        .from('scenarios')
        .upsert(insertData, { onConflict: 'id' });

      if (error) {
        console.error('シナリオデータ移行エラー:', error);
        console.error('シナリオデータ詳細:', insertData);
        return { success: false, count: 0, error: error.message };
      }

      this.setMigrationStatus({ scenarios: true });
      console.log(`シナリオデータ移行完了: ${scenarios.length}件`);
      
      return { success: true, count: scenarios.length };
      
    } catch (error) {
      console.error('シナリオデータ移行エラー:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : '不明なエラー' 
      };
    }
  }

  // 店舗データの移行
  static async migrateStores(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const storeData = localStorage.getItem('murderMystery_stores');
      if (!storeData) {
        return { success: true, count: 0 };
      }

      const stores: Store[] = JSON.parse(storeData);
      
      const insertData = stores.map(s => ({
        id: IDMapper.getOrCreateUUID(s.id, 'store'),
        name: s.name,
        short_name: s.shortName,
        address: s.address,
        phone_number: s.phoneNumber,
        email: s.email,
        opening_date: s.openingDate,
        manager_name: s.managerName,
        status: s.status as 'active' | 'temporarily_closed' | 'closed',
        capacity: s.capacity,
        rooms: s.rooms,
        notes: s.notes || null,
        color: s.color
      }));

      const { error } = await supabase
        .from('stores')
        .upsert(insertData, { onConflict: 'id' });

      if (error) {
        console.error('店舗データ移行エラー:', error);
        return { success: false, count: 0, error: error.message };
      }

      // 公演キットデータも移行
      for (const store of stores) {
        if (store.performanceKits && store.performanceKits.length > 0) {
          const kitInsertData = store.performanceKits.map(kit => ({
            id: IDMapper.getOrCreateUUID(kit.id, 'kit'),
            scenario_id: IDMapper.getOrCreateUUID(kit.scenarioId, 'scenario'),
            scenario_title: kit.scenarioTitle,
            kit_number: kit.kitNumber,
            condition: kit.condition as 'excellent' | 'good' | 'fair' | 'poor' | 'damaged',
            last_used: kit.lastUsed || null,
            notes: kit.notes || null,
            store_id: IDMapper.getOrCreateUUID(store.id, 'store')
          }));

          const { error: kitError } = await supabase
            .from('performance_kits')
            .upsert(kitInsertData, { onConflict: 'id' });

          if (kitError) {
            console.warn(`店舗 ${store.name} のキットデータ移行で警告:`, kitError);
          }
        }
      }

      this.setMigrationStatus({ stores: true });
      console.log(`店舗データ移行完了: ${stores.length}件`);
      
      return { success: true, count: stores.length };
      
    } catch (error) {
      console.error('店舗データ移行エラー:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : '不明なエラー' 
      };
    }
  }

  // 編集履歴データの移行
  static async migrateEditHistory(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const historyData = localStorage.getItem('murder-mystery-edit-history');
      if (!historyData) {
        return { success: true, count: 0 };
      }

      const history: EditHistoryEntry[] = JSON.parse(historyData);
      
      const insertData = history.map(h => ({
        id: IDMapper.getOrCreateUUID(h.id, 'history'),
        timestamp: h.timestamp,
        user_name: h.user || 'システム',
        action: h.action as 'create' | 'update' | 'delete',
        target: h.target,
        summary: h.summary,
        category: h.category as 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory',
        changes: h.changes
      }));

      const { error } = await supabase
        .from('edit_history')
        .upsert(insertData, { onConflict: 'id' });

      if (error) {
        console.error('編集履歴データ移行エラー:', error);
        return { success: false, count: 0, error: error.message };
      }

      this.setMigrationStatus({ editHistory: true });
      console.log(`編集履歴データ移行完了: ${history.length}件`);
      
      return { success: true, count: history.length };
      
    } catch (error) {
      console.error('編集履歴データ移行エラー:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : '不明なエラー' 
      };
    }
  }

  // 全データの移行実行
  static async migrateAllData(): Promise<{
    success: boolean;
    results: {
      staff: { success: boolean; count: number; error?: string };
      scenarios: { success: boolean; count: number; error?: string };
      stores: { success: boolean; count: number; error?: string };
      editHistory: { success: boolean; count: number; error?: string };
    };
  }> {
    console.log('Supabaseデータ移行を開始します...');
    
    // IDマッピングをクリア
    IDMapper.clear();
    
    const results = {
      staff: await this.migrateStaff(),
      scenarios: await this.migrateScenarios(),
      stores: await this.migrateStores(),
      editHistory: await this.migrateEditHistory()
    };
    
    const allSuccess = Object.values(results).every(r => r.success);
    
    if (allSuccess) {
      console.log('全データの移行が完了しました！');
    } else {
      console.error('一部データの移行に失敗しました:', results);
    }
    
    return {
      success: allSuccess,
      results
    };
  }

  // 接続テスト
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Supabaseが設定されているかチェック
      if (!isSupabaseConfigured()) {
        return { 
          success: false, 
          error: 'Supabase環境変数が設定されていません' 
        };
      }

      const { error } = await supabase
        .from('stores')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '接続テスト失敗' 
      };
    }
  }

  // 移行のリセット（テスト用）
  static resetMigrationStatus() {
    localStorage.removeItem(this.migrationKey);
    console.log('移行状況をリセットしました');
  }

  // 強制的に移行を再実行
  static async forceMigration(): Promise<{
    success: boolean;
    results: {
      staff: { success: boolean; count: number; error?: string };
      scenarios: { success: boolean; count: number; error?: string };
      stores: { success: boolean; count: number; error?: string };
      editHistory: { success: boolean; count: number; error?: string };
    };
  }> {
    console.log('🔄 強制移行を開始します...');
    this.resetMigrationStatus();
    return await this.migrateAllData();
  }
}