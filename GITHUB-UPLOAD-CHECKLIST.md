# 🚀 GitHub アップロード チェックリスト

## ✅ **アップロード必須ファイル**

### **📁 ルートファイル**
```bash
✅ App.tsx                    # メインアプリケーション
✅ package.json               # 依存関係定義
✅ vite.config.ts            # Viteビルド設定
✅ tsconfig.json             # TypeScript設定
✅ tsconfig.node.json        # TypeScript Node設定
✅ index.html                # エントリーポイント
✅ vercel.json               # Vercelデプロイ設定
✅ netlify.toml              # Netlifyデプロイ設定
✅ .gitignore                # Git除外設定
✅ README-GITHUB.md          # GitHub用README
```

### **📁 重要フォルダ（完全にアップロード）**
```bash
✅ components/               # 全UIコンポーネント
✅ contexts/                 # React Context
✅ styles/                   # CSS・スタイル
✅ lib/                      # ライブラリ設定
✅ hooks/                    # カスタムフック
✅ sql/                      # データベース設定
✅ utils/                    # ユーティリティ関数
```

## ❌ **アップロード除外ファイル**

### **🗑️ バックアップファイル**
```bash
❌ App-AllInOne.tsx
❌ App-Master.tsx
❌ App-SafeVersion-*.tsx
❌ App-WorkingBranch.tsx
```

### **🗑️ 不要ドキュメント**
```bash
❌ Attributions.md
❌ BRANCH_MANAGEMENT.md
❌ CHANGELOG.md
❌ CONTRIBUTING.md
❌ DOMAIN_PREPARATION.md
❌ PROJECT_CLEANUP.md
❌ README-Distribution.md
❌ README.md (古いバージョン)
❌ RESERVATION_SITE_STRUCTURE.md
❌ SAFE_VERSION_NOTES.md
❌ SETUP.md
❌ SUPABASE_*.md
❌ URGENT-CLEANUP.md
❌ VERSIONS.json
```

### **🗑️ スクリプト・一時ファイル**
```bash
❌ *.js (全スクリプトファイル)
❌ temp-*.txt
❌ *-distribution.*
❌ index-distribution.html
❌ package-distribution.json
❌ tsconfig-distribution.json
❌ vite.config-distribution.ts
```

### **🗑️ 古いsrcフォルダ**
```bash
❌ src/ (完全除外)
```

### **🗑️ 環境・ビルドファイル**
```bash
❌ env.local
❌ env.example
❌ node_modules/ (自動除外)
❌ dist/ (自動除外)
```

### **🗑️ LICENSEフォルダ内コンポーネント**
```bash
❌ LICENSE/Code-component-*.tsx
```

## 📊 **アップロード後のフォルダ構造**

```
murder-mystery-admin/
├── App.tsx                  ✅
├── package.json             ✅
├── vite.config.ts           ✅
├── tsconfig.json            ✅
├── tsconfig.node.json       ✅
├── index.html               ✅
├── vercel.json              ✅
├── netlify.toml             ✅
├── .gitignore               ✅
├── README.md                ✅ (GitHub用)
├── components/              ✅ (全ファイル)
├── contexts/                ✅ (全ファイル)
├── styles/                  ✅ (全ファイル)
├── lib/                     ✅ (全ファイル)
├── hooks/                   ✅ (全ファイル)
├── sql/                     ✅ (全ファイル)
└── utils/                   ✅ (全ファイル)
```

## 🎯 **推定ファイル数**

- **現在**: 100+ ファイル
- **アップロード**: 約60-70ファイル
- **除外**: 約30-40ファイル

## 📝 **アップロード前チェック**

1. ✅ App.tsx が最新版であること確認
2. ✅ package.json に必要依存関係がすべて含まれること確認  
3. ✅ .gitignore が正しく設定されること確認
4. ✅ README-GITHUB.md を README.md にリネーム
5. ✅ env.local を除外（環境変数は後でVercelで設定）

## 🚀 **次のステップ**

このチェックリストに従ってファイルを選別し、GitHubにアップロードしましょう！