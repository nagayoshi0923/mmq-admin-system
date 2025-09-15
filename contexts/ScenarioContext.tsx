import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// StaffContextとの循環参照を避けるため、ここで簡単な関数を作成
let staffUpdateFunction: ((staffName: string, scenarioTitle: string, action: 'add' | 'remove') => void) | null = null;

export const setStaffUpdateFunction = (fn: (staffName: string, scenarioTitle: string, action: 'add' | 'remove') => void) => {
  staffUpdateFunction = fn;
};

export interface Scenario {
  id: string;
  title: string;
  description: string;
  author: string;
  licenseAmount: number; // ライセンス料（円）
  duration: number; // 分
  playerCount: {
    min: number;
    max: number;
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
  availableGMs: string[]; // 対応可能GM
  rating: number;
  playCount: number;
  status: 'available' | 'maintenance' | 'retired';
  requiredProps: string[];
  genre: string[]; // 追加: ジャンル
  notes?: string;
  hasPreReading: boolean; // 事前読み込みの有無
  releaseDate?: string; // リリース日（YYYY-MM-DD形式）
}

// モックデータ
const mockScenarios: Scenario[] = [
  {
    id: '1',
    title: 'グロリアメモリーズ',
    description: 'オープンの場合は事前読込なし。馬場・大塚限定���の公演。',
    author: 'クインズワルツ',
    licenseAmount: 3000,
    duration: 600, // 10時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう', 'みずき'],
    rating: 4.5,
    playCount: 15,
    status: 'available',
    requiredProps: ['Keynoteなし', 'ネタバレ注意なし'],
    genre: ['ミステリー'],
    hasPreReading: false,
    releaseDate: '2023-03-15'
  },
  {
    id: '2',
    title: 'マーダー・オブ・パイレーツ',
    description: '馬場・大塚限定での海賊テーマ作品。',
    author: 'クインズワルツ',
    licenseAmount: 3000,
    duration: 600, // 10時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 8,
    status: 'maintenance',
    requiredProps: ['準備中'],
    genre: ['ミステリー'],
    hasPreReading: true,
    releaseDate: '2023-06-20'
  },
  {
    id: '3',
    title: 'BrightChoice',
    description: '馬場・大塚推奨のミステリー作品。',
    author: 'クインズワルツ',
    licenseAmount: 2500,
    duration: 540, // 9時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['Remia（れみあ）', 'みずき'],
    rating: 4.5,
    playCount: 22,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    releaseDate: '2022-12-10'
  }
];

interface ScenarioContextType {
  scenarios: Scenario[];
  addScenario: (scenario: Scenario) => void;
  updateScenario: (scenario: Scenario) => void;
  updateScenarios: (scenarios: Scenario[]) => void;
  removeScenario: (id: string) => void;
  getAvailableScenarios: () => Scenario[];
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInitialSync, setHasInitialSync] = useState(false);

  // データ永続化 - localStorage から初期データを読み込み
  useEffect(() => {
    const savedScenarios = localStorage.getItem('murder-mystery-scenarios');
    if (savedScenarios) {
      try {
        const parsed = JSON.parse(savedScenarios);
        // データマイグレーション: availableGMs プロパティがない場合は空配列で初期化
        const migratedScenarios = parsed.map((scenario: any) => ({
          ...scenario,
          availableGMs: scenario.availableGMs || [],
          hasPreReading: scenario.hasPreReading !== undefined ? scenario.hasPreReading : false,
          licenseAmount: scenario.licenseAmount !== undefined ? scenario.licenseAmount : 2500, // デフォルトライセンス料
          releaseDate: scenario.releaseDate || undefined // リリース日
        }));
        setScenarios(migratedScenarios);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load scenarios data:', error);
        setScenarios(mockScenarios);
        setIsInitialized(true);
      }
    } else {
      setScenarios(mockScenarios);
      setIsInitialized(true);
    }
  }, []);

  // 初期化後にスタッフとの同期を行う（一度だけ）
  useEffect(() => {
    if (isInitialized && !hasInitialSync && staffUpdateFunction && scenarios.length > 0) {
      console.log('初期化時のシナリオ-スタッフ同期を実行中...', scenarios.length, 'シナリオを処理');
      
      // 少し遅延を入れてStaffContextの初期化を待つ
      const timer = setTimeout(() => {
        scenarios.forEach(scenario => {
          // Null チェックを追加
          const availableGMs = scenario.availableGMs || [];
          if (availableGMs.length > 0) {
            console.log(`シナリオ「${scenario.title}」のGM同期:`, availableGMs);
            availableGMs.forEach(gmName => {
              staffUpdateFunction!(gmName, scenario.title, 'add');
            });
          }
        });
        setHasInitialSync(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, hasInitialSync, scenarios]);

  // データ永続化 - scenarios が変更されるたびに localStorage に保存
  useEffect(() => {
    if (scenarios.length > 0) {
      try {
        localStorage.setItem('murder-mystery-scenarios', JSON.stringify(scenarios));
        // 成功時にバックアップも作成
        const timestamp = new Date().toISOString();
        localStorage.setItem(`murder-mystery-scenarios_backup_${timestamp}`, JSON.stringify(scenarios));
        
        // 古いバックアップを削除（最新5個まで保持）
        const backupKeys = Object.keys(localStorage)
          .filter(key => key.startsWith('murder-mystery-scenarios_backup_'))
          .sort((a, b) => b.localeCompare(a))
          .slice(5);
        backupKeys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('シナリオデータの保存に失敗しました:', error);
      }
    }
  }, [scenarios]);

  const getAvailableScenarios = useCallback(() => {
    return scenarios.filter(scenario => scenario.status === 'available');
  }, [scenarios]);

  const addScenario = useCallback((scenario: Scenario) => {
    setScenarios(prev => [...prev, scenario]);
    
    // スタッフとの連携: 新規シナリオの対応GMにシナリオを追加
    if (staffUpdateFunction) {
      const availableGMs = scenario.availableGMs || [];
      if (availableGMs.length > 0) {
        availableGMs.forEach(gmName => {
          staffUpdateFunction!(gmName, scenario.title, 'add');
        });
      }
    }
  }, []);

  const updateScenario = useCallback((scenario: Scenario) => {
    setScenarios(prev => {
      const oldScenario = prev.find(s => s.id === scenario.id);
      const newScenarios = prev.map(s => s.id === scenario.id ? scenario : s);
      
      // スタッフとの連携: 対応GMが変更された場合
      if (oldScenario && staffUpdateFunction) {
        // Null チェックとデフォルト値を追加
        const oldAvailableGMs = oldScenario.availableGMs || [];
        const newAvailableGMs = scenario.availableGMs || [];
        
        // 追加されたGM
        const addedGMs = newAvailableGMs.filter(gm => !oldAvailableGMs.includes(gm));
        // 削除されたGM
        const removedGMs = oldAvailableGMs.filter(gm => !newAvailableGMs.includes(gm));
        
        // 追加されたGMにシナリオを追加
        addedGMs.forEach(gmName => {
          staffUpdateFunction!(gmName, scenario.title, 'add');
        });
        
        // 削除されたGMからシナリオを削除
        removedGMs.forEach(gmName => {
          staffUpdateFunction!(gmName, scenario.title, 'remove');
        });
      }
      
      return newScenarios;
    });
  }, []);

  const updateScenarios = useCallback((scenarios: Scenario[]) => {
    setScenarios(scenarios);
  }, []);

  const removeScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <ScenarioContext.Provider value={{ scenarios, addScenario, updateScenario, updateScenarios, removeScenario, getAvailableScenarios }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenarios() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenarios must be used within a ScenarioProvider');
  }
  return context;
}