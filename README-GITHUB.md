# 🎭 マーダーミステリー店舗管理システム

企業レベルのマーダーミステリー店舗運営を支援する総合管理システムです。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?logo=supabase)

## 🚀 **主な機能**

### 📅 **スケジュール管理**
- 6店舗×3時間帯での公演スケジュール管理
- 公演間インターバル警告機能
- 5種類の公演カテゴリの色分け表示
- リアルタイム残席数表示

### 🎭 **シナリオ管理**
- カテゴリ別シナリオ分類（本格、ライト、ホラー、コメディ、その他）
- 詳細情報・レビュー管理
- 料金・時間・難易度設定

### 👥 **スタッフ管理**
- スタッフ情報・シフト管理
- スキル・経験値管理
- スケジュール割り当て

### 🏪 **店舗管理**
- 6店舗の統合管理（高田馬場店、別館①、別館②、大久保店、大塚店、埼玉大宮店）
- 店舗別設定・統一カラーシステム
- アクセス情報・設備管理

### 💰 **売上管理**
- 詳細な売上分析・レポート
- 店舗別・期間別・カテゴリ別分析
- インタラクティブグラフ・チャート

### 👤 **顧客管理**
- 顧客情報・予約履歴管理
- セグメント分析・マーケティング支援
- パスワード保護機能

### 📦 **在庫管理**
- キット管理・店舗間移動
- 在庫レベル監視・アラート
- 自動発注提案

### 💳 **予約管理**
- ストアーズAPI連携
- 自動予約同期・管理
- キャンセル・変更対応

### ⚖️ **ライセンス管理**
- シナリオライセンス追跡
- 契約・更新管理

### 🔧 **開発管理**
- システム情報・バージョン管理
- パフォーマンス監視

## 🛠️ **技術仕様**

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS v4
- **UI ライブラリ**: shadcn/ui
- **状態管理**: React Context API
- **データベース**: Supabase (PostgreSQL)
- **リアルタイム**: Supabase Realtime
- **認証**: カスタム AdminAuthGuard
- **デプロイ**: Vercel / Netlify 対応

## 🚀 **セットアップ**

### **1. リポジトリのクローン**
```bash
git clone https://github.com/your-username/murder-mystery-admin.git
cd murder-mystery-admin
```

### **2. 依存関係のインストール**
```bash
npm install
```

### **3. 環境変数の設定**
```bash
# .env.local ファイルを作成
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **4. 開発サーバー起動**
```bash
npm run dev
```

アクセス: `http://localhost:5173`

## 🌐 **デプロイ**

### **Vercel デプロイ**
1. [Vercel](https://vercel.com) でGitHubリポジトリに接続
2. 環境変数を設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 自動デプロイ実行

### **Netlify デプロイ**
1. [Netlify](https://netlify.com) でリポジトリを接続
2. ビルド設定確認: `npm run build`
3. 環境変数を設定
4. デプロイ実行

## 🔐 **セキュリティ機能**

- **AdminAuthGuard**: 管理者認証システム
- **セッション管理**: 8時間自動ログアウト
- **パスワード保護**: 機密情報アクセス制御（デフォルト: 0909）
- **環境変数管理**: 設定情報の安全な管理
- **HTTPS/SSL**: 暗号化通信対応

## 📊 **Supabase統合**

- **🟢 リアルタイム同期**: 複数ユーザー対応
- **クラウドバックアップ**: 自動データ保護
- **データ整合性**: 競合回避・履歴追跡
- **Row Level Security**: 企業レベルセキュリティ

## 🎯 **管理対象店舗**

- 🏪 **高田馬場店** (メイン店舗)
- 🏪 **別館①** (追加スペース)
- 🏪 **別館②** (追加スペース)
- 🏪 **大久保店** (支店)
- 🏪 **大塚店** (支店)
- 🏪 **埼玉大宮店** (地方店舗)

## 📱 **レスポンシブ対応**

- デスクトップ・タブレット・モバイル対応
- 管理業務に最適化されたUI/UX
- 高速ローディング・Lazy Loading対応

## 🔗 **統合プラットフォーム**

このシステムは管理者向けです。顧客向け予約サイトとの統合も可能:
- 同一Supabaseデータベース共有
- リアルタイム双方向同期
- 完全統合プラットフォーム構築

## 📋 **環境要件**

- **Node.js**: 18.0.0 以上
- **npm**: 9.0.0 以上
- **Supabase**: プロジェクト必須

## 🤝 **貢献**

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. Pull Requestを開く

## 📄 **ライセンス**

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

---

**企業レベルのマーダーミステリー運営を革新する総合管理システム** 🎭✨

**開発**: FigmaMake + React + Supabase  
**最終更新**: 2025年1月15日