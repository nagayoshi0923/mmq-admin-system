# 予約サイト連携ガイド

このガイドでは、MMQ管理ツールと予約サイトを連携させるための手順を説明します。

## 📋 概要

予約サイトと管理ツールは以下の方法で連携します：

1. **共有Supabaseデータベース** - 両システムが同じデータベースを参照
2. **リアルタイム同期** - Supabaseのリアルタイム機能で即座に同期
3. **Webhook通知** - 重要な変更を相互に通知
4. **共有型定義** - TypeScriptの型定義を共有してデータ整合性を保証

## 🚀 セットアップ手順

### 1. データベーススキーマの追加

管理ツールのSupabaseプロジェクトに予約関連のテーブルを追加します：

```bash
# SupabaseダッシュボードのSQL Editorで以下のファイルを実行
./reservation-site-schema.sql
```

### 2. 環境変数の設定

#### 管理ツール側（現在のプロジェクト）
```env
# 既存の設定に追加
VITE_SYSTEM_TYPE=admin
VITE_SYSTEM_NAME=MMQ Admin System
VITE_API_SECRET_KEY=your-shared-secret-key
VITE_RESERVATION_WEBHOOK_URL=https://your-reservation-site.netlify.app/api/webhook
VITE_ENABLE_REALTIME=true
```

#### 予約サイト側（新規作成するサイト）
```env
# Supabase設定（管理ツールと同じ）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# システム識別
VITE_SYSTEM_TYPE=reservation
VITE_SYSTEM_NAME=MMQ Reservation Site

# API連携
VITE_API_SECRET_KEY=your-shared-secret-key
VITE_ADMIN_WEBHOOK_URL=https://your-admin-system.netlify.app/api/webhook

# リアルタイム同期
VITE_ENABLE_REALTIME=true
VITE_SYNC_TABLES=reservations,customers,staff,scenarios,stores
```

### 3. 共有ファイルのコピー

予約サイトプロジェクトに以下のファイルをコピーします：

```
予約サイトプロジェクト/
├── lib/
│   └── supabase.ts              # Supabaseクライアント設定
├── types/
│   └── reservation.ts           # 共有型定義
├── utils/
│   ├── realtimeSync.ts         # リアルタイム同期
│   └── reservationApi.ts       # 予約API関数
└── shared-env.example          # 環境変数テンプレート
```

### 4. 予約サイトでの実装例

#### 基本的な予約作成フォーム

```tsx
import { useState } from 'react';
import { ReservationAPI } from '../utils/reservationApi';
import { CreateReservationRequest } from '../types/reservation';

export function ReservationForm() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (formData: CreateReservationRequest) => {
    setLoading(true);
    
    try {
      const result = await ReservationAPI.createReservation(formData);
      
      if (result.success) {
        alert('予約が完了しました！');
        // 予約完了ページへリダイレクト
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      alert('予約処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // フォームのJSX...
}
```

#### リアルタイム同期の設定

```tsx
import { useEffect } from 'react';
import { useRealtimeSync } from '../utils/realtimeSync';

export function ReservationSite() {
  const { startSync, onTableChange } = useRealtimeSync();
  
  useEffect(() => {
    // リアルタイム同期を開始
    startSync(['reservations', 'customers', 'staff', 'scenarios', 'stores']);
    
    // 予約変更の監視
    onTableChange('reservations', (event) => {
      console.log('予約が更新されました:', event);
      // UIの更新処理
    });
    
    return () => {
      // クリーンアップは自動で行われます
    };
  }, []);

  // コンポーネントのJSX...
}
```

## 🔄 データ同期の仕組み

### リアルタイム同期

1. **Supabaseリアルタイム機能**
   - データベースの変更を即座に検知
   - WebSocket接続で低遅延通信
   - 両システムで同時に更新を受信

2. **同期対象テーブル**
   - `reservations` - 予約情報
   - `customers` - 顧客情報
   - `staff` - スタッフ情報
   - `scenarios` - シナリオ情報
   - `stores` - 店舗情報

### Webhook通知

重要な変更（新規予約、キャンセル等）は追加でWebhook通知を送信：

```typescript
// 予約作成時の通知例
await realtimeSync.notifyReservationChange(
  reservation.id,
  'created',
  reservation
);
```

## 📊 データフロー図

```
予約サイト                    Supabase                    管理ツール
    │                          │                          │
    ├─ 新規予約作成 ──────────→ │ ──────────────────────→ │ リアルタイム更新
    │                          │                          │
    │ ←──────────────────────── │ ←─ スタッフ割り当て ───── │
    │                          │                          │
    ├─ 予約変更 ────────────────→ │ ──────────────────────→ │ 通知受信
    │                          │                          │
    │ ←──────────────────────── │ ←─ ステータス更新 ─────── │
```

## 🔧 カスタマイズ可能な設定

### 1. 同期間隔の調整

```env
# デフォルト: 30秒
VITE_SYNC_INTERVAL=30000
```

### 2. 通知設定

```env
# 新規予約通知
VITE_NOTIFY_NEW_RESERVATION=true
VITE_NOTIFY_RESERVATION_CHANGE=true
VITE_NOTIFY_CANCELLATION=true

# 通知先
VITE_ADMIN_EMAIL=admin@your-domain.com
```

### 3. セキュリティ設定

```env
# CORS設定
VITE_ALLOWED_ORIGINS=https://your-admin-system.netlify.app,https://your-reservation-site.netlify.app

# JWT設定
VITE_JWT_SECRET=your-jwt-secret-key
VITE_JWT_EXPIRES_IN=24h
```

## 🛠️ 開発・デバッグ

### デバッグモードの有効化

```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### モックデータの使用

```env
VITE_ENABLE_MOCK_DATA=true
```

### 接続テスト

```typescript
import { supabase } from './lib/supabase';
import { realtimeSync } from './utils/realtimeSync';

// Supabase接続テスト
const testConnection = async () => {
  const { data, error } = await supabase.from('stores').select('count');
  console.log('接続テスト:', error ? 'エラー' : '成功');
};

// リアルタイム同期テスト
const testSync = async () => {
  await realtimeSync.startSync(['reservations']);
  console.log('同期テスト:', realtimeSync.isConnected() ? '成功' : 'エラー');
};
```

## 📱 予約サイトの推奨構成

### 基本ページ構成

```
予約サイト/
├── pages/
│   ├── index.tsx              # トップページ
│   ├── scenarios/
│   │   └── [id].tsx          # シナリオ詳細・予約フォーム
│   ├── reservation/
│   │   ├── confirm.tsx       # 予約確認
│   │   └── complete.tsx      # 予約完了
│   └── customer/
│       └── reservations.tsx  # 予約履歴
├── components/
│   ├── ReservationForm.tsx   # 予約フォーム
│   ├── ScenarioCard.tsx      # シナリオカード
│   ├── TimeSlotPicker.tsx    # 時間選択
│   └── CustomerForm.tsx      # 顧客情報入力
└── hooks/
    ├── useReservation.ts     # 予約関連フック
    └── useAvailability.ts    # 空き状況フック
```

### 必要な機能

1. **シナリオ一覧・検索**
2. **空き時間確認**
3. **予約フォーム**
4. **顧客情報管理**
5. **予約確認・変更・キャンセル**
6. **メール通知**

## 🚨 注意事項

1. **環境変数の管理**
   - 本番環境では必ず適切な値を設定
   - シークレットキーは安全に管理

2. **データベースアクセス権限**
   - RLSポリシーを適切に設定
   - 匿名アクセスは必要最小限に

3. **エラーハンドリング**
   - ネットワークエラーに対する適切な処理
   - ユーザーフレンドリーなエラーメッセージ

4. **パフォーマンス**
   - 大量データの場合はページネーション実装
   - 適切なインデックス設定

## 📞 サポート

連携に関する質問や問題が発生した場合は、以下の情報を含めてお問い合わせください：

- エラーメッセージ
- 実行環境（ブラウザ、OS等）
- 再現手順
- 期待する動作

---

このガイドに従って設定することで、予約サイトと管理ツールがリアルタイムで連携し、効率的な予約管理システムを構築できます。
