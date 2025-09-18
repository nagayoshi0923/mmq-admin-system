# FigmaMake統合チェックリスト

FigmaMakeプロトタイプを予約サイトプロジェクトに統合する際の完全チェックリストです。

## 📋 Phase 1: FigmaMakeプロトタイプの準備

### ✅ プロトタイプ完成確認
- [ ] 全ての画面が完成している
- [ ] コンポーネント構造が整理されている
- [ ] レスポンシブデザインが考慮されている
- [ ] 必要な機能が全て含まれている
- [ ] デザインシステムが統一されている

### ✅ 必要な画面・機能
- [ ] トップページ（シナリオ一覧）
- [ ] シナリオ詳細ページ
- [ ] 予約フォーム
- [ ] 顧客情報入力フォーム
- [ ] 予約確認ページ
- [ ] 予約完了ページ
- [ ] 予約履歴・管理ページ
- [ ] エラーページ

## 📋 Phase 2: プロジェクトセットアップ

### ✅ 自動セットアップスクリプトの実行
```bash
# 管理ツールディレクトリで実行
./scripts/setup-reservation-project.sh [プロジェクト名] [管理ツールのパス]

# 例:
./scripts/setup-reservation-project.sh mmq-reservation-site ../mmq-admin-system
```

### ✅ セットアップ後の確認
- [ ] プロジェクトディレクトリが作成されている
- [ ] 必要な依存関係がインストールされている
- [ ] 共有ファイルがコピーされている
- [ ] 環境変数テンプレートが作成されている
- [ ] 基本的なディレクトリ構造ができている

## 📋 Phase 3: 環境変数の設定

### ✅ .env.localファイルの編集
```env
# 必須設定項目
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SYSTEM_TYPE=reservation
VITE_API_SECRET_KEY=your-shared-secret-key
VITE_ENABLE_REALTIME=true
```

### ✅ 設定値の確認
- [ ] 管理ツールと同じSupabase URLを使用
- [ ] 管理ツールと同じAnon Keyを使用
- [ ] システムタイプが 'reservation' に設定
- [ ] 共有シークレットキーが設定されている
- [ ] リアルタイム同期が有効化されている

## 📋 Phase 4: 接続テスト

### ✅ 基本接続の確認
```bash
# 開発サーバーを起動
npm run dev

# 別ターミナルで接続テストを実行
npm run test:connection
```

### ✅ 接続テスト結果の確認
- [ ] Supabase接続が成功している
- [ ] リアルタイム同期が動作している
- [ ] 管理ツールとの通信が成功している
- [ ] コンソールにエラーが出ていない

## 📋 Phase 5: FigmaMakeコンポーネントの統合

### ✅ コンポーネントファイルの配置
```
src/components/
├── ui/                    # 既存の共有UIコンポーネント
├── reservation/           # FigmaMakeから生成されたコンポーネント
│   ├── ScenarioCard.tsx
│   ├── ReservationForm.tsx
│   ├── TimeSlotPicker.tsx
│   ├── CustomerForm.tsx
│   └── ReservationSummary.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Navigation.tsx
└── pages/
    ├── HomePage.tsx
    ├── ScenarioDetailPage.tsx
    ├── ReservationPage.tsx
    └── ConfirmationPage.tsx
```

### ✅ FigmaMakeコンポーネントの修正
- [ ] importパスを正しく設定
- [ ] 共有UIコンポーネントを使用
- [ ] TypeScript型定義を追加
- [ ] propsの型定義を追加
- [ ] 不要なスタイルを削除（Tailwindに統一）

### ✅ 機能の統合
- [ ] 静的データを動的データに変更
- [ ] API呼び出しを実装
- [ ] フォーム送信処理を実装
- [ ] エラーハンドリングを追加
- [ ] ローディング状態を追加

## 📋 Phase 6: 予約機能の実装

### ✅ シナリオ一覧・検索機能
```typescript
// hooks/useScenarios.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useScenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // シナリオ取得ロジック
}
```

### ✅ 空き時間確認機能
```typescript
// hooks/useAvailability.ts
import { ReservationAPI } from '../utils/reservationApi';

export function useAvailability(storeId: string, date: string) {
  // 空き時間取得ロジック
}
```

### ✅ 予約作成機能
```typescript
// hooks/useReservation.ts
import { ReservationAPI } from '../utils/reservationApi';
import { realtimeSync } from '../utils/realtimeSync';

export function useReservation() {
  const createReservation = async (data) => {
    // 予約作成 + 管理ツール通知
  };
}
```

### ✅ 実装確認項目
- [ ] シナリオ一覧が正しく表示される
- [ ] 検索・フィルタリングが動作する
- [ ] 空き時間が正しく表示される
- [ ] 予約フォームが正常に動作する
- [ ] 顧客情報が正しく保存される
- [ ] 予約確認画面が表示される
- [ ] 予約完了後に管理ツールに通知される

## 📋 Phase 7: リアルタイム同期の実装

### ✅ 同期設定の確認
```typescript
// App.tsx
useEffect(() => {
  startSync(['reservations', 'customers', 'scenarios', 'stores']);
  
  onTableChange('reservations', (event) => {
    if (event.source === 'admin') {
      // 管理ツールからの更新処理
    }
  });
}, []);
```

### ✅ 同期テスト
- [ ] 管理ツールで予約を作成 → 予約サイトに反映される
- [ ] 予約サイトで予約を作成 → 管理ツールに反映される
- [ ] スタッフ情報の更新が同期される
- [ ] シナリオ情報の更新が同期される
- [ ] 店舗情報の更新が同期される

## 📋 Phase 8: UI/UXの最適化

### ✅ レスポンシブデザイン
- [ ] モバイル表示が正しく動作する
- [ ] タブレット表示が正しく動作する
- [ ] デスクトップ表示が正しく動作する
- [ ] 各画面サイズで操作しやすい

### ✅ ユーザビリティ
- [ ] ナビゲーションが分かりやすい
- [ ] フォーム入力が簡単
- [ ] エラーメッセージが分かりやすい
- [ ] 成功メッセージが適切に表示される
- [ ] ローディング状態が分かりやすい

### ✅ アクセシビリティ
- [ ] キーボード操作が可能
- [ ] スクリーンリーダー対応
- [ ] 色のコントラストが適切
- [ ] フォーカス状態が分かりやすい

## 📋 Phase 9: テスト・デバッグ

### ✅ 機能テスト
- [ ] 全ての予約フローが正常動作する
- [ ] エラーケースが適切に処理される
- [ ] バリデーションが正しく動作する
- [ ] データの整合性が保たれる

### ✅ 統合テスト
- [ ] 管理ツールとの連携が正常動作する
- [ ] リアルタイム同期が安定している
- [ ] データベースの操作が正しい
- [ ] 外部API連携が動作する

### ✅ パフォーマンステスト
- [ ] ページ読み込み速度が適切
- [ ] 大量データでも動作する
- [ ] メモリリークがない
- [ ] ネットワークエラーに対応できる

## 📋 Phase 10: デプロイ準備

### ✅ 本番環境設定
- [ ] 本番用環境変数を設定
- [ ] デバッグモードを無効化
- [ ] ログレベルを適切に設定
- [ ] セキュリティ設定を確認

### ✅ デプロイ設定
- [ ] netlify.tomlが正しく設定されている
- [ ] ビルドコマンドが正しい
- [ ] 環境変数がホスティングサービスに設定されている
- [ ] リダイレクト設定が正しい

### ✅ 本番テスト
- [ ] 本番環境で全機能が動作する
- [ ] 管理ツールとの連携が動作する
- [ ] SSL証明書が正しく設定されている
- [ ] パフォーマンスが適切

## 📋 Phase 11: 運用・メンテナンス

### ✅ 監視設定
- [ ] エラーログの監視
- [ ] パフォーマンス監視
- [ ] 接続状態の監視
- [ ] 同期状態の監視

### ✅ バックアップ・復旧
- [ ] データベースバックアップ
- [ ] 設定ファイルのバックアップ
- [ ] 復旧手順の確認
- [ ] 障害対応手順の整備

## 🎯 完了確認

全てのチェック項目が完了したら：

1. **最終テスト**を実行
2. **ドキュメント**を更新
3. **運用チーム**に引き継ぎ
4. **ユーザー**にリリース通知

---

このチェックリストに従って作業することで、FigmaMakeプロトタイプから完全に機能する予約サイトへの統合が確実に完了します。

