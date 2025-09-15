import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SupabaseMigration } from '../utils/supabaseMigration';

interface SupabaseContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  migrationStatus: {
    staff: boolean;
    scenarios: boolean;
    stores: boolean;
    editHistory: boolean;
    lastMigration: string | null;
  };
  migrateToSupabase: () => Promise<void>;
  testConnection: () => Promise<void>;
  enableRealtime: boolean;
  setEnableRealtime: (enabled: boolean) => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState(SupabaseMigration.getMigrationStatus());
  const [enableRealtime, setEnableRealtime] = useState(true);

  // 初期接続テスト
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Supabaseが設定されているかチェック
      if (!isSupabaseConfigured()) {
        setIsConnected(false);
        setError('Supabase環境変数が設定されていません。SUPABASE_SETUP.mdを参照してください。');
        console.warn('⚠️ Supabase環境変数未設定 - ローカルストレージのみで動作します');
        setIsLoading(false);
        return;
      }

      const result = await SupabaseMigration.testConnection();
      
      if (result.success) {
        setIsConnected(true);
        setError(null);
        console.log('✅ Supabase接続成功');
        
        // 自動移行チェック
        const status = SupabaseMigration.getMigrationStatus();
        if (!status.staff || !status.scenarios || !status.stores || !status.editHistory) {
          console.log('未移行データが検出されました。自動移行を実行します...');
          await migrateToSupabase();
        }
      } else {
        setIsConnected(false);
        setError(result.error || 'Supabase接続に失敗しました');
        console.error('❌ Supabase接続失敗:', result.error);
      }
    } catch (error) {
      setIsConnected(false);
      setError(error instanceof Error ? error.message : '接続エラー');
      console.error('❌ Supabase接続エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateToSupabase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Supabaseデータ移行を開始...');
      
      const result = await SupabaseMigration.migrateAllData();
      
      if (result.success) {
        setMigrationStatus(SupabaseMigration.getMigrationStatus());
        setError(null);
        console.log('✅ 全データの移行が完了しました！');
        
        // 移行完了の通知
        const totalCount = Object.values(result.results).reduce((sum, r) => sum + r.count, 0);
        console.log(`📊 移行されたデータ: 合計${totalCount}件`);
        console.log('- スタッフ:', result.results.staff.count, '件');
        console.log('- シナリオ:', result.results.scenarios.count, '件');
        console.log('- 店舗:', result.results.stores.count, '件');
        console.log('- 編集履歴:', result.results.editHistory.count, '件');
        
      } else {
        const failedMigrations = Object.entries(result.results)
          .filter(([_, r]) => !r.success)
          .map(([name, r]) => `${name}: ${r.error}`)
          .join(', ');
        
        setError(`移行に失敗: ${failedMigrations}`);
        console.error('❌ データ移行に失敗:', result.results);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '移行エラー');
      console.error('❌ データ移行エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SupabaseContext.Provider value={{
      isConnected,
      isLoading,
      error,
      migrationStatus,
      migrateToSupabase,
      testConnection,
      enableRealtime,
      setEnableRealtime
    }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}