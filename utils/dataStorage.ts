// データストレージのユーティリティ関数

export interface StorageStatus {
  hasData: boolean;
  lastSaved: Date | null;
  dataSize: number;
}

export interface StorageUsage {
  used: number;
  total: number;
  percentage: number;
}

export class DataStorage {
  private getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  getStorageUsage(): StorageUsage {
    const used = this.getStorageSize();
    const total = 10 * 1024 * 1024; // 10MB 推定上限
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }

  hasData(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  getLastSavedTime(key: string): Date | null {
    const metaKey = `${key}_meta`;
    const meta = localStorage.getItem(metaKey);
    if (meta) {
      try {
        const { lastSaved } = JSON.parse(meta);
        return new Date(lastSaved);
      } catch (error) {
        console.warn(`Failed to parse meta for ${key}:`, error);
      }
    }
    return null;
  }

  setLastSavedTime(key: string): void {
    const metaKey = `${key}_meta`;
    const meta = {
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(metaKey, JSON.stringify(meta));
  }

  getData<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get data for ${key}:`, error);
      return null;
    }
  }

  setData<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.setLastSavedTime(key);
      return true;
    } catch (error) {
      console.error(`Failed to save data for ${key}:`, error);
      return false;
    }
  }

  removeData(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_meta`);
  }

  getStatus(key: string): StorageStatus {
    const data = localStorage.getItem(key);
    return {
      hasData: data !== null,
      lastSaved: this.getLastSavedTime(key),
      dataSize: data ? data.length : 0
    };
  }

  backup(): string {
    const backup: { [key: string]: string } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('murder-mystery-') || key?.startsWith('murderMystery_')) {
        backup[key] = localStorage.getItem(key) || '';
      }
    }
    return JSON.stringify(backup);
  }

  restore(backupJson: string): boolean {
    try {
      const backup = JSON.parse(backupJson);
      Object.keys(backup).forEach(key => {
        localStorage.setItem(key, backup[key]);
      });
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }
}

export const dataStorage = new DataStorage();

// 起動時のヘルスチェック
export function performStartupHealthCheck(): boolean {
  const criticalKeys = [
    'murder-mystery-scenarios',
    'murder-mystery-staff',
    'murderMystery_stores'
  ];

  const issues: string[] = [];
  
  criticalKeys.forEach(key => {
    const status = dataStorage.getStatus(key);
    if (!status.hasData) {
      issues.push(`${key}: データが見つかりません`);
    } else if (status.dataSize < 100) {
      issues.push(`${key}: データサイズが異常に小さいです (${status.dataSize} bytes)`);
    }
  });

  if (issues.length > 0) {
    console.warn('データ整合性チェックで問題が検出されました:', issues);
    return false;
  }

  console.log('データ整合性チェック: 正常');
  return true;
}