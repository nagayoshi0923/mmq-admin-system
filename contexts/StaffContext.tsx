import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setStaffUpdateFunction } from './ScenarioContext';

export interface Staff {
  id: string;
  name: string;
  lineName: string;
  xAccount: string;
  role: Array<'GM' | 'サポート' | 'マネージャー' | '社長' | '企画' | '事務'>; // 複数選択可能
  stores: string[];
  ngDays: string[];
  wantToLearn: string[];
  availableScenarios: string[]; // 公演可能シナリオ
  notes: string;
  contact: {
    phone: string;
    email: string;
  };
  availability: string[];
  experience: number;
  specialScenarios: string[];
  status: 'active' | 'inactive' | 'on-leave';
}

interface StaffContextType {
  staff: Staff[];
  addStaff: (staff: Staff) => void;
  updateStaff: (staff: Staff) => void;
  removeStaff: (id: string) => void;
  updateStaffList: (staffList: Staff[]) => void;
  addScenarioToStaff: (staffName: string, scenarioTitle: string) => void;
  removeScenarioFromStaff: (staffName: string, scenarioTitle: string) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};

// モックデータ
const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'えいきち',
    lineName: 'まい（えいきち）',
    xAccount: '',
    role: ['社長'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['経営管理', '統括'],
    notes: '社長',
    contact: {
      phone: '090-0000-0001',
      email: 'eikichi@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 10,
    specialScenarios: ['経営管理', '統括'],
    status: 'active'
  },
  {
    id: '4',
    name: 'ソラ',
    lineName: 'きょーくん',
    xAccount: '',
    role: ['マネージャー', 'GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['ゲームマスター殺人事件', '超特急の呪いの館で撮れ高足りてますか？', '月光の偽桜'],
    notes: 'マネージャー',
    contact: {
      phone: '090-0000-0004',
      email: 'sora@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 4,
    specialScenarios: ['店舗管理', 'スタッフ管理', 'GM'],
    status: 'active'
  },
  {
    id: '7',
    name: 'きゅう',
    lineName: 'Kanon👿（Q）',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['超特急の呪いの館で撮れ高足りてますか？', 'ゲームマスター殺人事件', '妖怪たちと月夜の刀'],
    notes: '',
    contact: {
      phone: '090-0000-0007',
      email: 'kyu@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 3,
    specialScenarios: ['多数のシナリオ対応', 'ベテランGM'],
    status: 'active'
  }
];

interface StaffProviderProps {
  children: ReactNode;
}

export const StaffProvider: React.FC<StaffProviderProps> = ({ children }) => {
  const [staff, setStaff] = useState<Staff[]>([]);

  // シナリオとスタッフの連携機能 - useEffectより前に定義
  const addScenarioToStaff = useCallback((staffName: string, scenarioTitle: string) => {
    console.log(`addScenarioToStaff呼び出し: ${staffName} に ${scenarioTitle} を追加`);
    setStaff(prev => prev.map(s => {
      if (s.name === staffName && !s.availableScenarios.includes(scenarioTitle)) {
        console.log(`実際に追加: ${staffName} に ${scenarioTitle}`);
        return {
          ...s,
          availableScenarios: [...s.availableScenarios, scenarioTitle]
        };
      }
      return s;
    }));
  }, []);

  const removeScenarioFromStaff = useCallback((staffName: string, scenarioTitle: string) => {
    console.log(`removeScenarioFromStaff呼び出し: ${staffName} から ${scenarioTitle} を削除`);
    setStaff(prev => prev.map(s => {
      if (s.name === staffName) {
        return {
          ...s,
          availableScenarios: s.availableScenarios.filter(scenario => scenario !== scenarioTitle)
        };
      }
      return s;
    }));
  }, []);

  // LocalStorageからデータを読み込み
  useEffect(() => {
    const savedStaff = localStorage.getItem('murder-mystery-staff');
    if (savedStaff) {
      try {
        const parsedStaff = JSON.parse(savedStaff);
        // データマイグレーション: availableScenarios プロパティがない場合は空配列で初期化
        // roleが文字列の場合は配列に変換
        const migratedStaff = parsedStaff.map((s: any) => ({
          ...s,
          availableScenarios: s.availableScenarios || [],
          role: Array.isArray(s.role) ? s.role : [s.role]
        }));
        setStaff(migratedStaff);
      } catch (error) {
        console.error('Failed to load staff data:', error);
        setStaff(mockStaff);
      }
    } else {
      setStaff(mockStaff);
    }
  }, []);

  // ScenarioContextとの連携機能を初期化
  useEffect(() => {
    console.log('StaffContextの連携機能を初期化中...');
    setStaffUpdateFunction((staffName: string, scenarioTitle: string, action: 'add' | 'remove') => {
      console.log(`スタッフ更新呼び出し: ${staffName} - ${scenarioTitle} - ${action}`);
      if (action === 'add') {
        addScenarioToStaff(staffName, scenarioTitle);
      } else {
        removeScenarioFromStaff(staffName, scenarioTitle);
      }
    });
    return () => {
      setStaffUpdateFunction(() => null);
    };
  }, [addScenarioToStaff, removeScenarioFromStaff]);

  // LocalStorageへデータを保存
  useEffect(() => {
    if (staff.length > 0) {
      localStorage.setItem('murder-mystery-staff', JSON.stringify(staff));
    }
  }, [staff]);

  const addStaff = (newStaff: Staff) => {
    setStaff(prev => [...prev, newStaff]);
  };

  const updateStaff = (updatedStaff: Staff) => {
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
  };

  const removeStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const updateStaffList = (newStaffList: Staff[]) => {
    setStaff(newStaffList);
  };

  return (
    <StaffContext.Provider value={{
      staff,
      addStaff,
      updateStaff,
      removeStaff,
      updateStaffList,
      addScenarioToStaff,
      removeScenarioFromStaff
    }}>
      {children}
    </StaffContext.Provider>
  );
};