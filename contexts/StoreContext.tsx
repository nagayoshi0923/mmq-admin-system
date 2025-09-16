import React, { createContext, useContext } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';

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
  // usePersistedStateで統一されたLocalStorage操作
  const [stores, setStores] = usePersistedState<Store[]>(
    'murderMystery_stores', 
    initialStores,
    {
      onError: (error, operation) => {
        console.error(`店舗データの${operation === 'read' ? '読み込み' : '保存'}に失敗:`, error);
      }
    }
  );
  
  const [kitTransferHistory, setKitTransferHistory] = usePersistedState<KitTransferHistory[]>(
    'murderMystery_kitTransferHistory',
    [],
    {
      onError: (error, operation) => {
        console.error(`キット移動履歴の${operation === 'read' ? '読み込み' : '保存'}に失敗:`, error);
      }
    }
  );

  const addStore = (store: Store) => {
    setStores(prev => [...prev, store]);
  };

  const updateStore = (updatedStore: Store) => {
    setStores(prev => prev.map(store => 
      store.id === updatedStore.id ? updatedStore : store
    ));
  };

  const removeStore = (storeId: string) => {
    setStores(prev => prev.filter(store => store.id !== storeId));
  };

  const addPerformanceKit = (storeId: string, kit: Omit<PerformanceKit, 'id'>) => {
    const newKit: PerformanceKit = {
      ...kit,
      id: `kit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setStores(prev => prev.map(store => {
      if (store.id === storeId) {
        return {
          ...store,
          performanceKits: [...store.performanceKits, newKit]
        };
      }
      return store;
    }));
  };

  const updatePerformanceKit = (storeId: string, updatedKit: PerformanceKit) => {
    setStores(prev => prev.map(store => {
      if (store.id === storeId) {
        return {
          ...store,
          performanceKits: store.performanceKits.map(kit => 
            kit.id === updatedKit.id ? updatedKit : kit
          )
        };
      }
      return store;
    }));
  };

  const removePerformanceKit = (storeId: string, kitId: string) => {
    setStores(prev => prev.map(store => {
      if (store.id === storeId) {
        return {
          ...store,
          performanceKits: store.performanceKits.filter(kit => kit.id !== kitId)
        };
      }
      return store;
    }));
  };

  const transferKit = (transfer: Omit<KitTransferHistory, 'id'>) => {
    const newTransfer: KitTransferHistory = {
      ...transfer,
      id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setKitTransferHistory(prev => [...prev, newTransfer]);
  };

  const updateTransferStatus = (transferId: string, status: KitTransferHistory['status'], receivedBy?: string) => {
    setKitTransferHistory(prev => prev.map(transfer => {
      if (transfer.id === transferId) {
        return {
          ...transfer,
          status,
          ...(receivedBy && { receivedBy })
        };
      }
      return transfer;
    }));

    // 転送完了時にキットの所在地を更新
    if (status === 'completed') {
      const transfer = kitTransferHistory.find(t => t.id === transferId);
      if (transfer) {
        // 元の店舗からキットを削除
        removePerformanceKit(transfer.fromStoreId, transfer.performanceKitId);
        
        // 移動先の店舗にキットを追加
        const kit = stores
          .find(s => s.id === transfer.fromStoreId)
          ?.performanceKits.find(k => k.id === transfer.performanceKitId);
        
        if (kit) {
          addPerformanceKit(transfer.toStoreId, kit);
        }
      }
    }
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