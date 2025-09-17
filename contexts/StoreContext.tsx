import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';

export interface PerformanceKit {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  kitNumber: number; // 同一シナリオで複数キットがある場合の番号
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  lastUsed?: string;
  notes?: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  openingDate: string;
  managerName: string;
  status: 'active' | 'temporarily_closed' | 'closed';
  performanceKits: PerformanceKit[];
  capacity: number; // 最大収容人数
  rooms: number; // 部屋数
  notes?: string;
  color: string; // 店舗識別色
  shortName: string; // スケジュール管理で使用する短縮名
}

export interface KitTransferHistory {
  id: string;
  performanceKitId: string;
  fromStoreId: string;
  toStoreId: string;
  transferDate: string;
  reason: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  transferredBy: string;
  receivedBy?: string;
  notes?: string;
}

interface StoreContextType {
  stores: Store[];
  kitTransferHistory: KitTransferHistory[];
  addStore: (store: Store) => void;
  updateStore: (store: Store) => void;
  removeStore: (storeId: string) => void;
  addPerformanceKit: (storeId: string, kit: Omit<PerformanceKit, 'id'>) => void;
  updatePerformanceKit: (storeId: string, kit: PerformanceKit) => void;
  removePerformanceKit: (storeId: string, kitId: string) => void;
  transferKit: (transfer: Omit<KitTransferHistory, 'id'>) => void;
  updateTransferStatus: (transferId: string, status: KitTransferHistory['status'], receivedBy?: string) => void;
  getStoreKits: (storeId: string) => PerformanceKit[];
  getKitsByScenario: (scenarioId: string) => { storeId: string; storeName: string; kits: PerformanceKit[]; color: string }[];
  getStoreByName: (storeName: string) => Store | undefined;
  getStoreColor: (storeName: string) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// 初期店舗データ（ScheduleManagerの店舗リストと対応）
const initialStores: Store[] = [
  {
    id: 'store_takadanobaba',
    name: '高田馬場店',
    shortName: '馬場',
    address: '東京都新宿区高田馬場1-1-1',
    phoneNumber: '03-1234-5678',
    email: 'takadanobaba@murdermysterytokyo.com',
    openingDate: '2020-01-15',
    managerName: '田中 太郎',
    status: 'active',
    performanceKits: [],
    capacity: 12,
    rooms: 2,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'store_bekkan1',
    name: '別館①',
    shortName: '別館①',
    address: '東京都新宿区高田馬場2-2-2',
    phoneNumber: '03-2234-5678',
    email: 'bekkan1@murdermysterytokyo.com',
    openingDate: '2021-03-10',
    managerName: '佐藤 花子',
    status: 'active',
    performanceKits: [],
    capacity: 8,
    rooms: 1,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    id: 'store_bekkan2',
    name: '別館②',
    shortName: '別館②',
    address: '東京都新宿区高田馬場3-3-3',
    phoneNumber: '03-3234-5678',
    email: 'bekkan2@murdermysterytokyo.com',
    openingDate: '2021-06-20',
    managerName: '鈴木 次郎',
    status: 'active',
    performanceKits: [],
    capacity: 10,
    rooms: 1,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'store_okubo',
    name: '大久保店',
    shortName: '大久保',
    address: '東京都新宿区大久保1-1-1',
    phoneNumber: '03-4234-5678',
    email: 'okubo@murdermysterytokyo.com',
    openingDate: '2020-08-01',
    managerName: '山田 三郎',
    status: 'active',
    performanceKits: [],
    capacity: 15,
    rooms: 3,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    id: 'store_otsuka',
    name: '大塚店',
    shortName: '大塚',
    address: '東京都豊島区大塚1-1-1',
    phoneNumber: '03-5234-5678',
    email: 'otsuka@murdermysterytokyo.com',
    openingDate: '2022-02-15',
    managerName: '田村 美香',
    status: 'active',
    performanceKits: [],
    capacity: 18,
    rooms: 3,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    id: 'store_omiya',
    name: '埼玉大宮店',
    shortName: '埼玉大宮',
    address: '埼玉県さいたま市大宮区大宮1-1-1',
    phoneNumber: '048-1234-5678',
    email: 'omiya@murdermysterytokyo.com',
    openingDate: '2022-10-01',
    managerName: '小林 健一',
    status: 'active',
    performanceKits: [],
    capacity: 20,
    rooms: 4,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Supabaseから店舗データを取得
  const {
    data: supabaseStores,
    loading: storesLoading,
    error: storesError,
    insert: insertStore,
    update: updateStoreData,
    delete: deleteStore,
    refetch: refetchStores
  } = useSupabaseData<any>({
    table: 'stores',
    realtime: true,
    orderBy: { column: 'name', ascending: true }
  });

  // Supabaseからキットデータを取得
  const {
    data: supabaseKits,
    loading: kitsLoading,
    error: kitsError,
    insert: insertKit,
    update: updateKitData,
    delete: deleteKit,
    refetch: refetchKits
  } = useSupabaseData<any>({
    table: 'performance_kits',
    realtime: true,
    orderBy: { column: 'created_at', ascending: true }
  });

  // 店舗データとキットデータを結合してアプリケーション形式に変換
  const stores = useMemo(() => {
    if (!Array.isArray(supabaseStores) || !Array.isArray(supabaseKits)) {
      return [];
    }

    return supabaseStores.map((dbStore: any) => {
      // この店舗のキットを取得
      const storeKits = supabaseKits
        .filter((kit: any) => kit.store_id === dbStore.id)
        .map((kit: any) => ({
          id: kit.id,
          scenarioId: kit.scenario_id,
          scenarioTitle: kit.scenario_title,
          kitNumber: kit.kit_number,
          condition: kit.condition || 'excellent',
          lastUsed: kit.last_used,
          notes: kit.notes
        }));

      return {
        id: dbStore.id,
        name: dbStore.name,
        address: dbStore.address,
        phoneNumber: dbStore.phone_number,
        email: dbStore.email,
        openingDate: dbStore.opening_date,
        managerName: dbStore.manager_name,
        status: dbStore.status,
        performanceKits: storeKits,
        capacity: dbStore.capacity,
        rooms: dbStore.rooms,
        notes: dbStore.notes,
        color: dbStore.color,
        shortName: dbStore.short_name
      };
    });
  }, [supabaseStores, supabaseKits]);

  // キット移動履歴（今回は簡略化してローカルのみ）
  const kitTransferHistory: KitTransferHistory[] = [];

  const addStore = async (store: Store) => {
    try {
      const dbStoreData = {
        name: store.name,
        address: store.address,
        phone_number: store.phoneNumber,
        email: store.email,
        opening_date: store.openingDate,
        manager_name: store.managerName,
        status: store.status,
        capacity: store.capacity,
        rooms: store.rooms,
        notes: store.notes,
        color: store.color,
        short_name: store.shortName
      };
      await insertStore(dbStoreData);
    } catch (error) {
      console.error('店舗追加エラー:', error);
    }
  };

  const updateStore = async (updatedStore: Store) => {
    try {
      const dbStoreData = {
        name: updatedStore.name,
        address: updatedStore.address,
        phone_number: updatedStore.phoneNumber,
        email: updatedStore.email,
        opening_date: updatedStore.openingDate,
        manager_name: updatedStore.managerName,
        status: updatedStore.status,
        capacity: updatedStore.capacity,
        rooms: updatedStore.rooms,
        notes: updatedStore.notes,
        color: updatedStore.color,
        short_name: updatedStore.shortName
      };
      await updateStoreData(updatedStore.id, dbStoreData);
    } catch (error) {
      console.error('店舗更新エラー:', error);
    }
  };

  const removeStore = async (storeId: string) => {
    try {
      await deleteStore(storeId);
    } catch (error) {
      console.error('店舗削除エラー:', error);
    }
  };

  const addPerformanceKit = async (storeId: string, kit: Omit<PerformanceKit, 'id'>) => {
    try {
      const dbKitData = {
        scenario_id: kit.scenarioId,
        scenario_title: kit.scenarioTitle,
        kit_number: kit.kitNumber,
        condition: kit.condition,
        last_used: kit.lastUsed,
        notes: kit.notes,
        store_id: storeId
      };
      await insertKit(dbKitData);
    } catch (error) {
      console.error('キット追加エラー:', error);
    }
  };

  const updatePerformanceKit = async (storeId: string, updatedKit: PerformanceKit) => {
    try {
      const dbKitData = {
        scenario_id: updatedKit.scenarioId,
        scenario_title: updatedKit.scenarioTitle,
        kit_number: updatedKit.kitNumber,
        condition: updatedKit.condition,
        last_used: updatedKit.lastUsed,
        notes: updatedKit.notes,
        store_id: storeId
      };
      await updateKitData(updatedKit.id, dbKitData);
    } catch (error) {
      console.error('キット更新エラー:', error);
    }
  };

  const removePerformanceKit = async (storeId: string, kitId: string) => {
    try {
      await deleteKit(kitId);
    } catch (error) {
      console.error('キット削除エラー:', error);
    }
  };

  const transferKit = (transfer: Omit<KitTransferHistory, 'id'>) => {
    // キット移動履歴は今回簡略化
    console.log('キット移動:', transfer);
  };

  const updateTransferStatus = (transferId: string, status: KitTransferHistory['status'], receivedBy?: string) => {
    // キット移動履歴は今回簡略化
    console.log('移動ステータス更新:', transferId, status);
  };

  const getStoreKits = (storeId: string): PerformanceKit[] => {
    const store = stores.find(s => s.id === storeId);
    return store?.performanceKits || [];
  };

  const getKitsByScenario = (scenarioId: string) => {
    return stores.map(store => ({
      storeId: store.id,
      storeName: store.name,
      kits: store.performanceKits.filter(kit => kit.scenarioId === scenarioId),
      color: store.color
    })).filter(entry => entry.kits.length > 0);
  };

  const getStoreByName = (storeName: string): Store | undefined => {
    return stores.find(store => store.name === storeName || store.shortName === storeName);
  };

  const getStoreColor = (storeName: string): string => {
    const store = getStoreByName(storeName);
    return store?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <StoreContext.Provider value={{
      stores,
      kitTransferHistory,
      addStore,
      updateStore,
      removeStore,
      addPerformanceKit,
      updatePerformanceKit,
      removePerformanceKit,
      transferKit,
      updateTransferStatus,
      getStoreKits,
      getKitsByScenario,
      getStoreByName,
      getStoreColor
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStores() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
}