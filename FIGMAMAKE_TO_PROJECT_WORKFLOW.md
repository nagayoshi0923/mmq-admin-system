# FigmaMake → 別プロジェクト連携ワークフロー

FigmaMakeで作成したプロトタイプを別プロジェクトとして開発し、MMQ管理ツールと連携させるための完全ワークフローです。

## 🎯 概要

```
FigmaMakeプロトタイプ
        ↓
新規プロジェクト作成（予約サイト）
        ↓
共有ファイル・設定のコピー
        ↓
連携テスト・デバッグ
        ↓
本番デプロイ・運用
```

## 📝 Phase 1: FigmaMakeプロトタイプの準備

### 1.1 FigmaMakeでの作業完了後

```bash
# FigmaMakeプロジェクトのエクスポート
# Cursorに持ってくる前に以下を確認：

✅ デザインが完成している
✅ コンポーネント構造が整理されている  
✅ 必要な画面・機能が全て含まれている
✅ レスポンシブ対応が考慮されている
```

### 1.2 プロトタイプの分析

FigmaMakeプロトタイプをCursorに持ってきた際に確認すべき点：

```typescript
// 必要な機能の確認リスト
const requiredFeatures = [
  'シナリオ一覧・検索',
  '空き時間確認',
  '予約フォーム',
  '顧客情報入力',
  '予約確認・変更',
  'キャンセル機能',
  'メール通知',
  'レスポンシブ対応'
];
```

## 🚀 Phase 2: 新規プロジェクト作成

### 2.1 プロジェクト初期化

```bash
# 新しいプロジェクトディレクトリを作成
mkdir mmq-reservation-site
cd mmq-reservation-site

# 必要に応じてViteプロジェクトを初期化
npm create vite@latest . -- --template react-ts
npm install
```

### 2.2 依存関係のインストール

```bash
# 管理ツールと同じ依存関係をインストール
npm install @supabase/supabase-js
npm install @radix-ui/react-* # 必要なRadix UIコンポーネント
npm install lucide-react
npm install tailwindcss
npm install class-variance-authority
npm install clsx tailwind-merge

# 予約サイト特有の依存関係
npm install react-hook-form
npm install @hookform/resolvers
npm install zod
npm install date-fns
```

## 📁 Phase 3: 共有ファイルの設定

### 3.1 管理ツールから必要ファイルをコピー

```bash
# 予約サイトプロジェクトで実行
# 管理ツールプロジェクトのパスを適切に設定

# 共有ライブラリファイル
cp ../mmq-admin-system/lib/supabase.ts ./src/lib/
cp ../mmq-admin-system/types/reservation.ts ./src/types/
cp ../mmq-admin-system/utils/realtimeSync.ts ./src/utils/
cp ../mmq-admin-system/utils/reservationApi.ts ./src/utils/

# UIコンポーネント（必要な分のみ）
cp -r ../mmq-admin-system/components/ui ./src/components/

# 設定ファイル
cp ../mmq-admin-system/shared-env.example ./.env.example
cp ../mmq-admin-system/tailwind.config.js ./
cp ../mmq-admin-system/postcss.config.js ./
```

### 3.2 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local

# 予約サイト用の設定に変更
```

```env
# .env.local（予約サイト用）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# システム識別（重要！）
VITE_SYSTEM_TYPE=reservation
VITE_SYSTEM_NAME=MMQ Reservation Site

# 管理ツールとの連携
VITE_API_SECRET_KEY=your-shared-secret-key
VITE_ADMIN_WEBHOOK_URL=https://your-admin-system.netlify.app/api/webhook

# リアルタイム同期
VITE_ENABLE_REALTIME=true
VITE_SYNC_TABLES=reservations,customers,staff,scenarios,stores

# デバッグ設定
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=info
```

### 3.3 型定義の更新

```typescript
// src/lib/supabase.ts を予約サイト用に調整
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/reservation'; // 共有型定義を使用

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 予約サイト用の追加設定
export const isReservationSite = () => {
  return import.meta.env.VITE_SYSTEM_TYPE === 'reservation';
};
```

## 🔧 Phase 4: FigmaMakeコードの統合

### 4.1 FigmaMakeコンポーネントの配置

```
src/
├── components/
│   ├── ui/                    # 共有UIコンポーネント
│   ├── reservation/           # FigmaMakeから生成されたコンポーネント
│   │   ├── ScenarioCard.tsx
│   │   ├── ReservationForm.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   └── CustomerForm.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── pages/
│   ├── index.tsx             # トップページ
│   ├── scenarios/
│   │   └── [id].tsx         # シナリオ詳細
│   └── reservation/
│       ├── form.tsx         # 予約フォーム
│       ├── confirm.tsx      # 予約確認
│       └── complete.tsx     # 予約完了
└── hooks/
    ├── useReservation.ts    # 予約関連ロジック
    └── useScenarios.ts      # シナリオ取得ロジック
```

### 4.2 FigmaMakeコンポーネントの機能統合

```typescript
// components/reservation/ReservationForm.tsx
import { useState } from 'react';
import { ReservationAPI } from '../../utils/reservationApi';
import { CreateReservationRequest } from '../../types/reservation';

// FigmaMakeで生成されたUIコンポーネントに機能を追加
export function ReservationForm({ scenarioId, storeId }: Props) {
  const [loading, setLoading] = useState(false);
  
  // FigmaMakeのフォーム送信処理を実際のAPI呼び出しに変更
  const handleSubmit = async (formData: CreateReservationRequest) => {
    setLoading(true);
    
    try {
      const result = await ReservationAPI.createReservation(formData);
      
      if (result.success) {
        // 予約完了ページへリダイレクト
        router.push(`/reservation/complete?id=${result.data.id}`);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('予約処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // FigmaMakeで生成されたJSXをそのまま使用
  return (
    // FigmaMakeのJSX + 上記のロジック
  );
}
```

## 🔄 Phase 5: リアルタイム連携の実装

### 5.1 リアルタイム同期の初期化

```typescript
// src/App.tsx または main.tsx
import { useEffect } from 'react';
import { useRealtimeSync } from './utils/realtimeSync';

function App() {
  const { startSync, onTableChange } = useRealtimeSync();
  
  useEffect(() => {
    // 予約サイト起動時にリアルタイム同期を開始
    startSync(['reservations', 'customers', 'scenarios', 'stores']);
    
    // 管理ツールからの更新を監視
    onTableChange('reservations', (event) => {
      if (event.source === 'admin') {
        console.log('管理ツールから予約が更新されました:', event);
        // 必要に応じてUIを更新
      }
    });
    
    onTableChange('scenarios', (event) => {
      console.log('シナリオ情報が更新されました:', event);
      // シナリオ一覧の再取得など
    });
    
  }, []);

  return <Router>...</Router>;
}
```

### 5.2 予約作成時の管理ツール通知

```typescript
// hooks/useReservation.ts
import { ReservationAPI } from '../utils/reservationApi';
import { realtimeSync } from '../utils/realtimeSync';

export function useReservation() {
  const createReservation = async (data: CreateReservationRequest) => {
    // 予約作成
    const result = await ReservationAPI.createReservation(data);
    
    if (result.success) {
      // 管理ツールに即座に通知
      await realtimeSync.notifyReservationChange(
        result.data.id,
        'created',
        result.data
      );
      
      console.log('✅ 新規予約が管理ツールに通知されました');
    }
    
    return result;
  };

  return { createReservation };
}
```

## 🧪 Phase 6: テスト・デバッグ

### 6.1 接続テスト

```typescript
// src/utils/connectionTest.ts
import { supabase } from '../lib/supabase';
import { realtimeSync } from './realtimeSync';

export async function testConnections() {
  console.log('🔍 接続テストを開始...');
  
  // Supabase接続テスト
  try {
    const { data, error } = await supabase.from('stores').select('count');
    console.log('✅ Supabase接続:', error ? '❌ エラー' : '✅ 成功');
  } catch (error) {
    console.error('❌ Supabase接続エラー:', error);
  }
  
  // リアルタイム同期テスト
  try {
    await realtimeSync.startSync(['reservations']);
    console.log('✅ リアルタイム同期:', realtimeSync.isConnected() ? '✅ 成功' : '❌ エラー');
  } catch (error) {
    console.error('❌ リアルタイム同期エラー:', error);
  }
  
  // 管理ツールとの通信テスト
  try {
    await realtimeSync.notifyReservationChange('test', 'created', { test: true });
    console.log('✅ 管理ツール通知: ✅ 成功');
  } catch (error) {
    console.error('❌ 管理ツール通知エラー:', error);
  }
}

// 開発時に実行
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  testConnections();
}
```

### 6.2 デバッグ用コンポーネント

```typescript
// components/debug/ConnectionStatus.tsx
import { useState, useEffect } from 'react';
import { useRealtimeSync } from '../../utils/realtimeSync';

export function ConnectionStatus() {
  const { isConnected } = useRealtimeSync();
  const [lastSync, setLastSync] = useState<string>('');
  
  if (import.meta.env.VITE_DEBUG_MODE !== 'true') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
      <div>Supabase: {isConnected() ? '🟢' : '🔴'}</div>
      <div>最終同期: {lastSync}</div>
    </div>
  );
}
```

## 🚀 Phase 7: デプロイ・運用

### 7.1 デプロイ設定

```bash
# Netlifyデプロイの場合
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 環境変数をNetlifyダッシュボードで設定
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# VITE_API_SECRET_KEY
# etc...
```

### 7.2 本番環境での確認事項

```typescript
// 本番デプロイ前チェックリスト
const productionChecklist = [
  '✅ 環境変数が正しく設定されている',
  '✅ Supabase接続が成功する',
  '✅ リアルタイム同期が動作する',
  '✅ 管理ツールとの通信が成功する',
  '✅ 予約作成・更新・キャンセルが正常動作する',
  '✅ メール通知が送信される',
  '✅ エラーハンドリングが適切に動作する',
  '✅ レスポンシブデザインが正しく表示される'
];
```

## 📋 Phase 8: 運用・メンテナンス

### 8.1 監視・ログ

```typescript
// utils/monitoring.ts
export function logReservationEvent(event: string, data: any) {
  if (import.meta.env.PROD) {
    // 本番環境では外部ログサービスに送信
    console.log(`[RESERVATION] ${event}:`, data);
  } else {
    console.log(`[DEV] ${event}:`, data);
  }
}
```

### 8.2 定期的な同期確認

```typescript
// utils/healthCheck.ts
export async function performHealthCheck() {
  const results = {
    supabase: false,
    realtime: false,
    adminConnection: false
  };
  
  try {
    // 各種接続の確認
    // 結果をログに記録
  } catch (error) {
    console.error('ヘルスチェック失敗:', error);
  }
  
  return results;
}

// 定期実行（5分間隔）
setInterval(performHealthCheck, 5 * 60 * 1000);
```

## 🎯 まとめ

このワークフローに従うことで：

1. **FigmaMakeプロトタイプ** → **機能的な予約サイト** への変換
2. **管理ツールとのリアルタイム連携** の実現
3. **安定した運用** の確保

が可能になります。

各フェーズで問題が発生した場合は、デバッグ機能を活用して原因を特定し、適切に対処してください。
