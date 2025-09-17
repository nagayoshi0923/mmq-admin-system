import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setStaffUpdateFunction, setStaffBatchSyncFunction } from './ScenarioContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { isValidStaff, isValidArray, parseLocalStorageData, safeGetArray } from '../utils/typeGuards';

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

// モックデータは削除済み - Supabaseからのデータを使用
const mockStaff: Staff[] = [];

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
    // fallbackKey: 'murder-mystery-staff', // ローカルストレージを無効化
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