# 📥 GitHub アップロード用 DL フォルダ ガイド

## 🎯 **概要**

このDLフォルダには、GitHubにアップロードするために必要なファイルのみが含まれています。不要なファイル・バックアップファイル・一時ファイルは除外されています。

## 📁 **含まれているファイル（現在）**

### **✅ メインファイル**
- `App.tsx` - メインアプリケーション
- `main.tsx` - エントリーポイント
- `package.json` - 依存関係定義（クリーンアップ済み）
- `vite.config.ts` - Viteビルド設定
- `tsconfig.json` - TypeScript設定
- `tsconfig.node.json` - TypeScript Node設定
- `index.html` - HTMLエントリーポイント

### **✅ 設定ファイル**
- `vercel.json` - Vercelデプロイ設定
- `netlify.toml` - Netlifyデプロイ設定
- `.gitignore` - Git除外設定
- `README.md` - GitHub用README

### **✅ スタイル**
- `styles/globals.css` - Tailwind v4設定

## 📁 **まだ必要なフォルダ（手動コピー必要）**

以下のフォルダを元のプロジェクトからDLフォルダにコピーしてください：

### **🔥 最優先（動作に必須）**
```bash
components/
├── ui/ (shadcn UIコンポーネント全体)
├── AdminAuthGuard.tsx
├── SupabaseStatus.tsx
├── DataIntegrityMonitor.tsx
└── figma/ImageWithFallback.tsx
```

### **🚀 高優先（主要機能）**
```bash
contexts/
├── SupabaseContext.tsx
├── ScenarioContext.tsx
├── StaffContext.tsx
├── StoreContext.tsx
└── EditHistoryContext.tsx
```

### **⚙️ 中優先（基盤機能）**
```bash
lib/
└── supabase.ts

hooks/
├── usePersistentData.ts
└── useSupabaseData.ts

utils/
├── dataStorage.ts
└── supabaseMigration.ts

sql/
└── create_tables.sql
```

### **📋 低優先（全機能）**
```bash
components/ (残りの全コンポーネント)
├── ScheduleManager.tsx
├── StaffManager.tsx
├── ScenarioManager.tsx
├── StoreManager.tsx
├── ReservationManager.tsx
├── SalesManager.tsx
├── CustomerManager.tsx
├── InventoryManager.tsx
├── LicenseManager.tsx
├── DevelopmentManager.tsx
└── その他全ダイアログ・コンポーネント
```

## 🚀 **GitHub アップロード手順**

### **Phase 1: コア機能でテスト**
1. 現在のDLフォルダ内容をGitHubにアップロード
2. Vercelでビルドテスト
3. 基本動作確認

### **Phase 2: 段階的拡張**
1. components/ui/ フォルダを追加
2. contexts/ フォルダを追加
3. lib/, hooks/, utils/ フォルダを追加
4. 全コンポーネントを追加

## 📊 **ファイル数**

- **現在のDL**: 約15ファイル（基本構成）
- **完全版DL**: 約70-80ファイル（全機能）
- **除外済み**: 約40-50ファイル（バックアップ・一時ファイル等）

## 🔧 **手動コピー方法**

### **FigmaMakeから**
1. 左側ファイルツリーで必要フォルダを確認
2. 各ファイルの内容をコピー
3. DLフォルダ内に同じ構造で作成

### **ローカル環境で**
1. FigmaMakeプロジェクトをダウンロード
2. 必要フォルダをDLフォルダにコピー
3. 不要ファイルを削除

## ✅ **完成後の確認**

GitHubアップロード前に確認：
- [ ] App.tsx が最新版
- [ ] package.json に必要依存関係が全て含まれている
- [ ] .env.local が含まれていない（除外されている）
- [ ] components/ui/ フォルダが完全
- [ ] contexts/ フォルダが完全
- [ ] README.md が適切

## 🎉 **完成予想**

このDLフォルダをGitHubにアップロードすると：
- ✅ Vercelで即座にビルド・デプロイ可能
- ✅ 全10タブ機能が動作
- ✅ Supabaseリアルタイム同期
- ✅ AdminAuthGuard認証
- ✅ 企業レベル管理システム完成！

**独自ドメインでのプロフェッショナル運用準備完了！** 🎭✨