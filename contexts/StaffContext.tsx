import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setStaffUpdateFunction, setStaffBatchSyncFunction } from './ScenarioContext';
import { useSupabaseData } from '../hooks/useSupabaseData';

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
  loading: boolean;
  error: string | null;
  addStaff: (staff: Staff) => Promise<{ success: boolean; error?: string }>;
  updateStaff: (staff: Staff) => Promise<{ success: boolean; error?: string }>;
  removeStaff: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateStaffList: (staffList: Staff[]) => void;
  addScenarioToStaff: (staffName: string, scenarioTitle: string) => void;
  removeScenarioFromStaff: (staffName: string, scenarioTitle: string) => void;
  batchSyncScenarios: (scenarioGMMap: { [scenarioTitle: string]: string[] }) => void;
  refetch: () => Promise<void>;
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
    id: '2',
    name: '江波（えなみん）',
    lineName: 'えな',
    xAccount: '',
    role: ['企画'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['企画制作', 'シフト管理', 'GM指導'],
    notes: '制作企画・監修・シフト作成業務',
    contact: {
      phone: '090-0000-0002',
      email: 'enami@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 5,
    specialScenarios: ['企画制作', 'シフト管理', 'GM指導'],
    status: 'active'
  },
  {
    id: '3',
    name: 'さく',
    lineName: '奈倉さき',
    xAccount: '',
    role: ['事務'],
    stores: ['全店舗'],
    ngDays: ['土', '日'],
    wantToLearn: [],
    availableScenarios: [],
    notes: '事務',
    contact: {
      phone: '090-0000-0003',
      email: 'saku@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金'],
    experience: 2,
    specialScenarios: ['事務処理', '運営サポート'],
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
    id: '5',
    name: '八継じの',
    lineName: 'やぎ',
    xAccount: '',
    role: ['マネージャー', 'GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['燔祭のジェミニ', '漣の向こう側', 'ツグミドリ'],
    notes: 'マネージャー',
    contact: {
      phone: '090-0000-0005',
      email: 'jino@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 3,
    specialScenarios: ['店舗管理', 'スタッフ管理', 'GM'],
    status: 'active'
  },
  {
    id: '6',
    name: 'つばめ',
    lineName: 'あかり',
    xAccount: '',
    role: ['マネージャー', 'GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['漣の向こう側', '月光の偽桜', '赤鬼が泣いた夜'],
    notes: 'マネージャー',
    contact: {
      phone: '090-0000-0006',
      email: 'tsubame@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 3,
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
  },
  {
    id: '8',
    name: '松井（まつい）',
    lineName: 'マツケン',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['妖怪たちと月夜の刀', '黒い森の獣part1', 'ツグミドリ', '流年'],
    notes: '',
    contact: {
      phone: '090-0000-0008',
      email: 'matsui@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 2,
    specialScenarios: ['多数のシナリオ対応'],
    status: 'active'
  },
  {
    id: '9',
    name: 'れいにー',
    lineName: 'Reine',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['黒い森の獣part1', 'ツグミドリ', '流年'],
    notes: '4月以降会社の様子見',
    contact: {
      phone: '090-0000-0009',
      email: 'reine@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 2,
    specialScenarios: ['裁くもの、裁かれるもの', 'BBA', 'その他多数'],
    status: 'active'
  },
  {
    id: '10',
    name: 'Remia（れみあ）',
    lineName: '田端亮哉',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['ゲームマスター殺人事件', '漣の向こう側', '月光の偽桜'],
    notes: '',
    contact: {
      phone: '090-0000-0010',
      email: 'remia@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 2,
    specialScenarios: ['BrightChoice', 'DearmyD', 'その他多数'],
    status: 'active'
  },
  {
    id: '11',
    name: 'みずき',
    lineName: 'MizuKi',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['ツグミドリ', '燔祭のジェミニ', '流年'],
    notes: 'シフトは前々月の後半に発表',
    contact: {
      phone: '090-0000-0011',
      email: 'mizuki@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 3,
    specialScenarios: ['BBA', 'Recollection', 'その他多数'],
    status: 'active'
  },
  {
    id: '12',
    name: 'りえぞー',
    lineName: '渡辺りえぞー',
    xAccount: '',
    role: ['GM'],
    stores: ['大宮'],
    ngDays: ['水曜昼', '金曜昼', '月曜夜'],
    wantToLearn: [],
    availableScenarios: ['ツグミドリ', '流年'],
    notes: '大宮店のみ公演終了22時半希望',
    contact: {
      phone: '090-0000-0012',
      email: 'riezo@queens-waltz.com'
    },
    availability: ['火', '木', '土', '日'],
    experience: 2,
    specialScenarios: ['星', 'BBA', 'クリエイターズハイ'],
    status: 'active'
  },
  {
    id: '13',
    name: 'えりん',
    lineName: 'みほ（えりん）',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: ['平日昼'],
    wantToLearn: [],
    availableScenarios: ['流年', '漣の向こう側'],
    notes: '',
    contact: {
      phone: '090-0000-0013',
      email: 'erin@queens-waltz.com'
    },
    availability: ['平日夜', '土', '日'],
    experience: 2,
    specialScenarios: ['フェイクドナー', '女皇の書架', 'その他多数'],
    status: 'active'
  },
  {
    id: '14',
    name: 'ぽんちゃん',
    lineName: ':）pon．',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: ['水曜', '金夜', '土日祝'],
    wantToLearn: [],
    availableScenarios: ['ゲームマスター殺人事件', '妖怪たちと月夜の刀'],
    notes: '',
    contact: {
      phone: '090-0000-0014',
      email: 'pon@queens-waltz.com'
    },
    availability: ['月', '火', '木', '平日昼'],
    experience: 2,
    specialScenarios: ['Iwillex-', 'アンフィスバエナと聖女の祈り', 'その他多数'],
    status: 'active'
  },
  {
    id: '15',
    name: 'ほがらか',
    lineName: '鶴田',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: [],
    wantToLearn: [],
    availableScenarios: ['超特急の呪いの館で撮れ高足りてますか？'],
    notes: '自作のみのGM',
    contact: {
      phone: '090-0000-0015',
      email: 'hogaraka@queens-waltz.com'
    },
    availability: ['月', '火', '水', '木', '金', '土', '日'],
    experience: 3,
    specialScenarios: ['自作シナリオ', 'クロノフォビア'],
    status: 'active'
  },
  {
    id: '16',
    name: 'しらやま',
    lineName: 'まつだゆいか',
    xAccount: '',
    role: ['GM'],
    stores: ['全店舗'],
    ngDays: ['月曜1日', '火〜土朝昼', '金曜夜は△'],
    wantToLearn: [],
    availableScenarios: ['漣の向こう側', '赤鬼が泣いた夜', '月光の偽桜'],
    notes: '自作のみのGM',
    contact: {
      phone: '090-0000-0016',
      email: 'shirayama@queens-waltz.com'
    },
    availability: ['日', '月夜', '火夜', '水夜', '木夜', '土夜'],
    experience: 2,
    specialScenarios: ['Recollection', 'リトルワンダー', 'その他多数'],
    status: 'active'
  }
];

interface StaffProviderProps {
  children: ReactNode;
}

export const StaffProvider: React.FC<StaffProviderProps> = ({ children }) => {
  // useSupabaseDataフックを使用
  const {
    data: staff,
    loading,
    error,
    refetch,
    insert,
    update,
    delete: deleteStaff,
    upsert
  } = useSupabaseData<Staff>({
    table: 'staff',
    realtime: true,
    fallbackKey: 'murder-mystery-staff',
    orderBy: { column: 'name', ascending: true }
  });

  // シナリオとスタッフの連携機能
  const addScenarioToStaff = useCallback(async (staffName: string, scenarioTitle: string) => {
    const staffMember = staff.find(s => s.name === staffName);
    if (staffMember && !staffMember.availableScenarios.includes(scenarioTitle)) {
      const updatedStaff = {
        ...staffMember,
        availableScenarios: [...staffMember.availableScenarios, scenarioTitle]
      };
      await update(staffMember.id, updatedStaff);
    }
  }, [staff, update]);

  const removeScenarioFromStaff = useCallback(async (staffName: string, scenarioTitle: string) => {
    const staffMember = staff.find(s => s.name === staffName);
    if (staffMember) {
      const updatedStaff = {
        ...staffMember,
        availableScenarios: staffMember.availableScenarios.filter(scenario => scenario !== scenarioTitle)
      };
      await update(staffMember.id, updatedStaff);
    }
  }, [staff, update]);

  // CRUD操作
  const addStaff = useCallback(async (newStaff: Staff) => {
    try {
      const { data, error: insertError } = await insert(newStaff);
      if (insertError) {
        return { success: false, error: insertError };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [insert]);

  const updateStaff = useCallback(async (updatedStaff: Staff) => {
    try {
      const { data, error: updateError } = await update(updatedStaff.id, updatedStaff);
      if (updateError) {
        return { success: false, error: updateError };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [update]);

  const removeStaff = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await deleteStaff(id);
      if (deleteError) {
        return { success: false, error: deleteError };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [deleteStaff]);

  // バッチ同期関数 - 複数のシナリオを一度に処理
  const batchSyncScenarios = useCallback(async (scenarioGMMap: { [scenarioTitle: string]: string[] }) => {
    // 各スタッフのシナリオを更新
    const updatePromises = staff.map(async (staffMember) => {
      const updatedScenarios = new Set(staffMember.availableScenarios);
      
      // 各シナリオをチェックして、このスタッフがGMかどうか確認
      Object.entries(scenarioGMMap).forEach(([scenarioTitle, gmNames]) => {
        if (gmNames.includes(staffMember.name)) {
          updatedScenarios.add(scenarioTitle);
        }
      });
      
      const newScenarios = Array.from(updatedScenarios);
      
      // シナリオリストが変更された場合のみ更新
      if (JSON.stringify(newScenarios.sort()) !== JSON.stringify(staffMember.availableScenarios.sort())) {
        await update(staffMember.id, {
          ...staffMember,
          availableScenarios: newScenarios
        });
      }
    });
    
    await Promise.all(updatePromises);
  }, [staff, update]);

  // ScenarioContextとの連携機能を初期化（重複実行防止）
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      // console.log('StaffContextの連携機能を初期化中...');
      setStaffUpdateFunction((staffName: string, scenarioTitle: string, action: 'add' | 'remove') => {
        // console.log(`スタッフ更新呼び出し: ${staffName} - ${scenarioTitle} - ${action}`);
        if (action === 'add') {
          addScenarioToStaff(staffName, scenarioTitle);
        } else {
          removeScenarioFromStaff(staffName, scenarioTitle);
        }
      });
      
      // バッチ同期関数も登録
      setStaffBatchSyncFunction(batchSyncScenarios);
    }
    
    return () => {
      isMounted = false;
      setStaffUpdateFunction(() => null);
      setStaffBatchSyncFunction(() => null);
    };
  }, [addScenarioToStaff, removeScenarioFromStaff, batchSyncScenarios]);

  // レガシー関数（後方互換性のため）
  const updateStaffList = useCallback((newStaffList: Staff[]) => {
    // この関数は後方互換性のために残しているが、実際の更新はSupabaseを通じて行う
    console.warn('updateStaffList is deprecated. Use individual CRUD operations instead.');
  }, []);

  return (
    <StaffContext.Provider value={{
      staff,
      loading,
      error,
      addStaff,
      updateStaff,
      removeStaff,
      updateStaffList,
      addScenarioToStaff,
      removeScenarioFromStaff,
      batchSyncScenarios,
      refetch
    }}>
      {children}
    </StaffContext.Provider>
  );
};