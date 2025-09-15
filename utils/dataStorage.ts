// データ永続化のユーティリティ関数

interface StorageOptions {
  compressionEnabled?: boolean;
  backupEnabled?: boolean;
  maxBackups?: number;
}

export class DataStorage {
  private static instance: DataStorage;
  private options: StorageOptions;

  constructor(options: StorageOptions = {}) {
    this.options = {
      compressionEnabled: false,
      backupEnabled: true,
      maxBackups: 5,
      ...options
    };
  }

  static getInstance(options?: StorageOptions): DataStorage {
    if (!DataStorage.instance) {
      DataStorage.instance = new DataStorage(options);
    }
    return DataStorage.instance;
  }

  // データの保存
  saveData<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      
      // メインデータを保存
      localStorage.setItem(key, serializedData);
      
      // バックアップの作成
      if (this.options.backupEnabled) {
        this.createBackup(key, serializedData);
      }
      
      // 最終保存時刻を記録
      localStorage.setItem(`${key}_lastSaved`, new Date().toISOString());
      
    } catch (error) {
      console.error(`データ保存エラー (${key}):`, error);
      this.handleStorageError(key, error);
    }
  }

  // データの読み込み
  loadData<T>(key: string, defaultData?: T): T | null {
    try {
      const data = localStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data) as T;
      }
      
      // メインデータがない場合、バックアップから復元
      if (this.options.backupEnabled) {
        const backupData = this.restoreFromBackup<T>(key);
        if (backupData) {
          console.warn(`メインデータ不在のため、バックアップから復元: ${key}`);
          this.saveData(key, backupData); // メインデータとして保存し直す
          return backupData;
        }
      }
      
      return defaultData || null;
      
    } catch (error) {
      console.error(`データ読み込みエラー (${key}):`, error);
      
      // エラー時はバックアップから復元を試行
      if (this.options.backupEnabled) {
        const backupData = this.restoreFromBackup<T>(key);
        if (backupData) {
          console.warn(`読み込みエラーのため、バックアップから復元: ${key}`);
          return backupData;
        }
      }
      
      return defaultData || null;
    }
  }

  // バックアップの作成
  private createBackup(key: string, data: string): void {
    try {
      const timestamp = new Date().toISOString();
      const backupKey = `${key}_backup_${timestamp}`;
      
      localStorage.setItem(backupKey, data);
      
      // 古いバックアップを削除
      this.cleanOldBackups(key);
      
    } catch (error) {
      console.warn(`バックアップ作成エラー (${key}):`, error);
    }
  }

  // バックアップからの復元
  private restoreFromBackup<T>(key: string): T | null {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${key}_backup_`))
        .sort((a, b) => b.localeCompare(a)); // 新しい順にソート
      
      for (const backupKey of backupKeys) {
        try {
          const backupData = localStorage.getItem(backupKey);
          if (backupData) {
            return JSON.parse(backupData) as T;
          }
        } catch (parseError) {
          console.warn(`バックアップ解析エラー (${backupKey}):`, parseError);
          continue;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`バックアップ復元エラー (${key}):`, error);
      return null;
    }
  }

  // 古いバックアップの削除
  private cleanOldBackups(key: string): void {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${key}_backup_`))
        .sort((a, b) => b.localeCompare(a)); // 新しい順にソート
      
      // 最大バックアップ数を超えた分を削除
      if (backupKeys.length > this.options.maxBackups!) {
        const keysToDelete = backupKeys.slice(this.options.maxBackups!);
        keysToDelete.forEach(k => localStorage.removeItem(k));
      }
      
    } catch (error) {
      console.warn(`バックアップクリーンアップエラー (${key}):`, error);
    }
  }

  // ストレージエラーの処理
  private handleStorageError(key: string, error: any): void {
    // ストレージ容量不足の場合
    if (error.name === 'QuotaExceededError') {
      console.warn(`ストレージ容量不足 (${key})。古いデータを削除します。`);
      this.cleanupStorage();
    }
  }

  // ストレージのクリーンアップ
  private cleanupStorage(): void {
    try {
      // 古いバックアップを削除
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.includes('_backup_'))
        .sort((a, b) => a.localeCompare(b)); // 古い順にソート
      
      // 最も古いバックアップから削除
      const keysToDelete = backupKeys.slice(0, Math.ceil(backupKeys.length * 0.3));
      keysToDelete.forEach(k => localStorage.removeItem(k));
      
      console.log(`${keysToDelete.length}個の古いバックアップを削除しました。`);
      
    } catch (error) {
      console.error('ストレージクリーンアップエラー:', error);
    }
  }

  // データの存在確認
  hasData(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  // データの削除
  removeData(key: string): void {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_lastSaved`);
      
      // 関連するバックアップも削除
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${key}_backup_`));
      backupKeys.forEach(k => localStorage.removeItem(k));
      
    } catch (error) {
      console.error(`データ削除エラー (${key}):`, error);
    }
  }

  // 最終保存時刻の取得
  getLastSavedTime(key: string): Date | null {
    try {
      const timestamp = localStorage.getItem(`${key}_lastSaved`);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error(`最終保存時刻取得エラー (${key}):`, error);
      return null;
    }
  }

  // ストレージ使用量の取得
  getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // 5MBを上限として仮定
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
      
    } catch (error) {
      console.error('ストレージ使用量取得エラー:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // 健全性チェック
  healthCheck(): { status: 'healthy' | 'warning' | 'error'; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // localStorage が利用可能かチェック
      const testKey = '_health_check_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
    } catch (error) {
      issues.push('localStorageが利用できません');
    }
    
    // 使用量チェック
    const usage = this.getStorageUsage();
    if (usage.percentage > 80) {
      issues.push(`ストレージ使用量が ${usage.percentage.toFixed(1)}% です`);
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                   issues.length === 1 ? 'warning' : 'error';
    
    return { status, issues };
  }
}

// グローバルインスタンスの作成
export const dataStorage = DataStorage.getInstance({
  compressionEnabled: false,
  backupEnabled: true,
  maxBackups: 3
});

// データ復元ユーティリティ
export const restoreAllData = () => {
  const keys = ['murder-mystery-scenarios', 'murder-mystery-staff', 'murderMystery_stores', 'murder-mystery-edit-history'];
  
  keys.forEach(key => {
    if (!dataStorage.hasData(key)) {
      console.warn(`${key} のデータが見つかりません。バックアップから復元を試行します。`);
      dataStorage.loadData(key);
    }
  });
};

// ページロード時にデータの健全性をチェック
export const performStartupHealthCheck = () => {
  const healthCheck = dataStorage.healthCheck();
  
  if (healthCheck.status !== 'healthy') {
    console.warn('データストレージの健全性チェックで問題が検出されました:', healthCheck.issues);
    
    if (healthCheck.issues.some(issue => issue.includes('localStorage'))) {
      console.error('重大: localStorageが利用できません。データの永続化ができません。');
      return false;
    }
  }
  
  return true;
};