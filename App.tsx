import { useState, lazy, Suspense, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

import { ScenarioProvider } from './contexts/ScenarioContext';
import { StaffProvider } from './contexts/StaffContext';
import { StoreProvider } from './contexts/StoreContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { EditHistoryProvider } from './contexts/EditHistoryContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
// 最適化されたアイコンインポート
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Users from 'lucide-react/dist/esm/icons/users';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import Package from 'lucide-react/dist/esm/icons/package';
import Code from 'lucide-react/dist/esm/icons/code';
import Store from 'lucide-react/dist/esm/icons/store';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import { Toaster } from './components/ui/sonner';
import { DataIntegrityMonitor } from './components/DataIntegrityMonitor';
import { SupabaseStatus } from './components/SupabaseStatus';
import { AdminAuthGuard } from './components/AdminAuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

// Lazy load components for better performance
const ScheduleManager = lazy(() => import('./components/ScheduleManager').then(module => ({ default: module.ScheduleManager })));
const StaffManager = lazy(() => import('./components/StaffManager').then(module => ({ default: module.StaffManager })));
const StaffDashboard = lazy(() => import('./components/StaffDashboard').then(module => ({ default: module.StaffDashboard })));
const ScenarioManager = lazy(() => import('./components/ScenarioManager').then(module => ({ default: module.ScenarioManager })));
const StoreManager = lazy(() => import('./components/StoreManager').then(module => ({ default: module.StoreManager })));
const ReservationManager = lazy(() => import('./components/ReservationManager').then(module => ({ default: module.ReservationManager })));
const SalesManager = lazy(() => import('./components/SalesManager').then(module => ({ default: module.SalesManager })));
const CustomerManager = lazy(() => import('./components/CustomerManager').then(module => ({ default: module.CustomerManager })));
const InventoryManager = lazy(() => import('./components/InventoryManager').then(module => ({ default: module.InventoryManager })));
const LicenseManager = lazy(() => import('./components/LicenseManager').then(module => ({ default: module.LicenseManager })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2">読み込み中...</span>
  </div>
);

// タブ名とハッシュのマッピング
const TAB_ROUTES = {
  'schedule': '#schedule',
  'reservations': '#reservations',
  'staff': '#staff',
  'staff-dashboard': '#staff-dashboard',
  'scenarios': '#scenarios',
  'stores': '#stores',
  'sales': '#sales',
  'customers': '#customers',
  'inventory': '#inventory',
  'licenses': '#licenses',
  'development': '#development'
} as const;

const HASH_TO_TAB = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tab, hash]) => [hash, tab])
);

export default function App() {
  // URLハッシュからデフォルトタブを決定
  const getDefaultTab = () => {
    const hash = window.location.hash;
    // スタッフダッシュボードのハッシュをチェック
    if (hash.startsWith('#staff-dashboard/')) {
      return 'staff-dashboard';
    }
    return HASH_TO_TAB[hash] || 'schedule';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);
  
  // スタッフIDを取得
  const getStaffIdFromHash = () => {
    const hash = window.location.hash;
    const match = hash.match(/#staff-dashboard\/(.+)/);
    return match ? match[1] : null;
  };

  const [staffId, setStaffId] = useState(getStaffIdFromHash);

  // グローバルエラーハンドラーを設定（一時的に無効化）
  // useEffect(() => {
  //   setupGlobalErrorHandlers();
  // }, []);

  // ハッシュ変更の監視とタブ切り替え
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      // スタッフダッシュボードのハッシュをチェック
      if (hash.startsWith('#staff-dashboard/')) {
        setActiveTab('staff-dashboard');
        const newStaffId = getStaffIdFromHash();
        setStaffId(newStaffId);
      } else {
        const tab = HASH_TO_TAB[hash];
        if (tab) {
          setActiveTab(tab);
          setStaffId(null);
        }
      }
    };

    // popstateイベントでブラウザの戻る/進むボタンに対応
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // タブ変更時にハッシュを更新
  const handleTabChange = (tab: string) => {
    const hash = TAB_ROUTES[tab as keyof typeof TAB_ROUTES];
    if (hash) {
      window.history.replaceState(null, '', hash);
    }
    setActiveTab(tab);
  };

  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <AdminAuthGuard>
          <ScenarioProvider>
            <StaffProvider>
              <StoreProvider>
                <ScheduleProvider>
                  <EditHistoryProvider>
              <div className="min-h-screen bg-background">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="min-h-screen">
              <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h1 className="flex items-center gap-2">
                      <BarChart3 className="w-6 h-6" />
                      マーダーミステリー店舗管理システム
                    </h1>
                    
                    <div className="flex items-center gap-4">
                      <TabsList className="grid grid-cols-10 w-fit">
                      <TabsTrigger value="schedule" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        スケジュール
                      </TabsTrigger>
                      <TabsTrigger value="reservations" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        予約管理
                      </TabsTrigger>
                      <TabsTrigger value="staff" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        スタッフ
                      </TabsTrigger>
                      <TabsTrigger value="scenarios" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        シナリオ
                      </TabsTrigger>
                      <TabsTrigger value="stores" className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        店舗管理
                      </TabsTrigger>
                      <TabsTrigger value="sales" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        売上管理
                      </TabsTrigger>
                      <TabsTrigger value="customers" className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        顧客管理
                      </TabsTrigger>
                      <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        在庫管理
                      </TabsTrigger>
                      <TabsTrigger value="licenses" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        ライセンス
                      </TabsTrigger>
                      <TabsTrigger value="development" className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        開発
                      </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                </div>
              </header>

              <main className="container mx-auto px-4 py-6">
                <TabsContent value="schedule">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ScheduleManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="reservations">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ReservationManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="staff">
                  <Suspense fallback={<LoadingSpinner />}>
                    <StaffManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="staff-dashboard">
                  <Suspense fallback={<LoadingSpinner />}>
                    {staffId ? (
                      <StaffDashboard 
                        staffId={staffId} 
                        staffName="スタッフ" 
                        onBack={() => setActiveTab('staff')}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        スタッフが選択されていません
                      </div>
                    )}
                  </Suspense>
                </TabsContent>

                <TabsContent value="scenarios">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ScenarioManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="stores">
                  <Suspense fallback={<LoadingSpinner />}>
                    <StoreManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="sales">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SalesManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="customers">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CustomerManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="inventory">
                  <Suspense fallback={<LoadingSpinner />}>
                    <InventoryManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="licenses">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LicenseManager />
                  </Suspense>
                </TabsContent>

                <TabsContent value="development">
                  <div className="text-center py-8 text-muted-foreground">
                    開発管理機能は準備中です
                  </div>
                </TabsContent>
              </main>
            </Tabs>
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 3000,
            }}
          />
          <DataIntegrityMonitor />
          <SupabaseStatus />
                  </EditHistoryProvider>
                </ScheduleProvider>
              </StoreProvider>
            </StaffProvider>
          </ScenarioProvider>
      </AdminAuthGuard>
    </SupabaseProvider>
    </ErrorBoundary>
  );
}