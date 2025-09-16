# 🎯 **Cursor IDE - 緊急プロジェクトクリーンアップ実行指示**

## 📋 **現在の状況確認**
- ✅ React + TypeScript + Tailwind v4 のマーダーミステリー店舗管理システム完成
- ✅ 9タブ構成（スケジュール、予約、スタッフ、シナリオ、店舗、売上、顧客、在庫、ライセンス、開発）
- ✅ 6店舗対応（高田馬場店、別館①、別館②、大久保店、大塚店、埼玉大宮店）
- ✅ Supabase連携、認証機能、全店舗カラーシステム実装済み
- 🚨 **緊急問題**: 100個以上の不要ファイルが散乱、GitHub連携前にクリーンアップ必須

---

## 🧹 **段階別削除実行リスト**

### **Phase 1: 重複App.tsxファイル削除（最優先）**
```bash
# これらのファイルを削除してください
App-AllInOne.tsx
App-Master.tsx
App-SafeVersion-2024-12-20-v2.tsx
App-SafeVersion-2024-12-20.tsx
App-WorkingBranch.tsx
```
**✅ 絶対保持**: `App.tsx`（メインエントリーポイント - 動作確認済み）

### **Phase 2: 大量Markdownファイル一括削除**
```bash
# 以下20個のMarkdownファイルをすべて削除
Attributions.md
BRANCH_MANAGEMENT.md
CHANGELOG.md
CONTRIBUTING.md
DEPLOYMENT_GUIDE.md
DOMAIN_PREPARATION.md
FIGMAMAKE-GITHUB-BRIDGE.md
GITHUB-SYNC-WORKFLOW.md
GITHUB-UPLOAD-CHECKLIST.md
PROJECT_CLEANUP.md
README-Distribution.md
README-GITHUB.md
RESERVATION_SITE_STRUCTURE.md
SAFE_VERSION_NOTES.md
SETUP.md
SUPABASE_INTEGRATION_COMPLETE.md
SUPABASE_SETUP.md
SUPABASE_SETUP_FIXED.md
URGENT-CLEANUP.md
```
**✅ 保持**: `README.md`のみ

### **Phase 3: 開発用スクリプトファイル削除**
```bash
# 以下9個の.jsファイルを削除
cleanup-old-src.js
cleanup-project.js
create-distribution.js
fix-kit-display.js
move-to-src.js
prepare-github-clean.js
prepare-github-upload.js
prepare-github.js
version-manager.js
```

### **Phase 4: 重複設定ファイル削除**
```bash
# distribution用重複ファイルを削除
package-distribution.json
tsconfig-distribution.json
vite.config-distribution.ts
index-distribution.html
```

### **Phase 5: 不要フォルダ削除（重要）**
```bash
# 以下フォルダを丸ごと削除
DL/                    # バックアップフォルダ（100MB以上）
src/                   # 古いsrcフォルダ（重複）
LICENSE/               # なぜかフォルダになっている
sql/                   # 開発用SQLファイル
hooks/                 # 未使用React hooks
guidelines/            # 空のガイドライン
```

### **Phase 6: セキュリティ・一時ファイル削除**
```bash
# セキュリティリスク・一時ファイルを削除
VERSIONS.json
temp-delete-marker.txt
temp_scenario_check.txt
env.local              # APIキー漏洩リスク
```

---

## 📁 **クリーンアップ後の最終ファイル構造（目標）**

```
mmq-admin-system/                    # 🎯 30個程度のファイルに削減
├── 📄 App.tsx                      # ✅ メインアプリケーション
├── 📄 main.tsx                     # ✅ Reactエントリーポイント
├── 📄 index.html                   # ✅ HTMLテンプレート
├── 📄 package.json                 # ✅ 依存関係管理
├── 📄 tsconfig.json                # ✅ TypeScript設定
├── 📄 tsconfig.node.json           # ✅ Node用TypeScript設定
├── 📄 vite.config.ts               # ✅ Viteビルド設定
├── 📄 postcss.config.js            # ✅ PostCSS設定
├── 📄 tailwind.config.js           # ✅ Tailwind CSS設定
├── 📄 README.md                    # ✅ プロジェクト説明
├── 📄 env.example                  # ✅ 環境変数テンプレート
├── 📄 netlify.toml                 # ✅ Netlify設定
├── 📄 vercel.json                  # ✅ Vercel設定
├── 📁 components/                  # ✅ Reactコンポーネント（30個）
│   ├── ui/                         # ShadCN UIコンポーネント
│   ├── figma/                      # Figma連携コンポーネント  
│   ├── ScheduleManager.tsx         # スケジュール管理
│   ├── ReservationManager.tsx      # 予約管理
│   ├── StaffManager.tsx            # スタッフ管理
│   ├── ScenarioManager.tsx         # シナリオ管理
│   ├── StoreManager.tsx            # 店舗管理
│   ├── SalesManager.tsx            # 売上管理
│   ├── CustomerManager.tsx         # 顧客管理
│   ├── InventoryManager.tsx        # 在庫管理
│   ├── LicenseManager.tsx          # ライセンス管理
│   ├── DevelopmentManager.tsx      # 開発管理
│   └── (その他ダイアログ・UI)
├── 📁 contexts/                    # ✅ Context API（5個）
│   ├── StoreContext.tsx            # 店舗データ管理
│   ├── StaffContext.tsx            # スタッフデータ管理
│   ├── ScenarioContext.tsx         # シナリオデータ管理
│   ├── EditHistoryContext.tsx      # 編集履歴管理
│   └── SupabaseContext.tsx         # Supabase連携
├── 📁 lib/                         # ✅ ライブラリ設定
│   └── supabase.ts                 # Supabase接続設定
├── 📁 utils/                       # ✅ ユーティリティ
│   ├── dataStorage.ts              # データストレージ
│   └── supabaseMigration.ts        # Supabaseマイグレーション
└── 📁 styles/                      # ✅ スタイルシート
    └── globals.css                 # Tailwind v4グローバルCSS
```

---

## 🔒 **絶対に削除禁止ファイル・フォルダ（動作に必須）**

### **🚨 保護対象リスト**
```
🔐 App.tsx                         # メインアプリケーション
🔐 main.tsx                        # Reactエントリーポイント
🔐 index.html                      # HTMLテンプレート
🔐 package.json                    # 依存関係・ビルド設定
🔐 tsconfig.json                   # TypeScript設定
🔐 tsconfig.node.json              # Node用TypeScript
🔐 vite.config.ts                  # Viteビルド設定
🔐 postcss.config.js               # PostCSS設定
🔐 tailwind.config.js              # Tailwind設定
🔐 README.md                       # プロジェクト説明
🔐 env.example                     # 環境変数テンプレート
🔐 netlify.toml                    # Netlify設定
🔐 vercel.json                     # Vercel設定
🔐 components/ フォルダ全体         # 全UIコンポーネント
🔐 contexts/ フォルダ全体          # 全Context API
🔐 lib/ フォルダ全体               # ライブラリ設定
🔐 utils/ フォルダ全体             # ユーティリティ関数
🔐 styles/ フォルダ全体            # スタイルシート
```

---

## 🎯 **Cursorでの実行手順（段階的削除）**

### **🚀 Step 1: 重複App.tsx削除（最優先）**
```bash
# 以下5個のファイルを削除
App-AllInOne.tsx
App-Master.tsx  
App-SafeVersion-2024-12-20-v2.tsx
App-SafeVersion-2024-12-20.tsx
App-WorkingBranch.tsx
```
**確認**: `App.tsx`が残っていることを確認

### **📄 Step 2: Markdown文書一括削除**
```bash
# 以下20個の.mdファイルを削除（README.md除く）
Attributions.md BRANCH_MANAGEMENT.md CHANGELOG.md CONTRIBUTING.md
DEPLOYMENT_GUIDE.md DOMAIN_PREPARATION.md FIGMAMAKE-GITHUB-BRIDGE.md
GITHUB-SYNC-WORKFLOW.md GITHUB-UPLOAD-CHECKLIST.md PROJECT_CLEANUP.md
README-Distribution.md README-GITHUB.md RESERVATION_SITE_STRUCTURE.md
SAFE_VERSION_NOTES.md SETUP.md SUPABASE_INTEGRATION_COMPLETE.md
SUPABASE_SETUP.md SUPABASE_SETUP_FIXED.md URGENT-CLEANUP.md
```

### **⚙️ Step 3: 開発スクリプト削除**
```bash
# 以下9個の.jsファイルを削除
cleanup-old-src.js cleanup-project.js create-distribution.js
fix-kit-display.js move-to-src.js prepare-github-clean.js
prepare-github-upload.js prepare-github.js version-manager.js
```

### **🗂️ Step 4: 重複設定ファイル削除**
```bash
# distribution用重複ファイルを削除
package-distribution.json
tsconfig-distribution.json
vite.config-distribution.ts
index-distribution.html
```

### **📁 Step 5: 大型フォルダ削除（重要）**
```bash
# 以下フォルダを丸ごと削除
DL/            # 100MB以上のバックアップフォルダ
src/           # 古いsrcフォルダ（重複）
LICENSE/       # フォルダ化されたライセンス
sql/           # SQL開発ファイル
hooks/         # 未使用Reactフック
guidelines/    # 空のガイドライン
```

### **🧹 Step 6: 一時・リスクファイル削除**
```bash
# 最終クリーンアップ
VERSIONS.json
temp-delete-marker.txt
temp_scenario_check.txt
env.local                  # APIキー漏洩リスク
```

### **✅ Step 7: 削除後検証**
```bash
# 必須チェック
npm run build              # ビルド成功確認
npm run dev                # 開発サーバー起動確認
```

---

## 🚨 **削除実行前の安全確認**

### **📋 実行前チェックリスト**
- [ ] **Git commit作成**: 削除前に現在状態を保存
- [ ] **保護ファイル確認**: 削除対象に必須ファイルが含まれていない
- [ ] **段階実行**: 一度に全削除せず、フェーズ別に実行

### **⚠️ 注意事項**
1. **App.tsx以外のAppファイルのみ削除**
2. **components/, contexts/, lib/, utils/, styles/フォルダは絶対保持**
3. **package.json, tsconfig.json等の設定ファイルは保持**
4. **削除前に必ずGitコミット**

---

## 📊 **削除完了後の検証チェックリスト**

### **🎯 数値目標**
- [ ] **ファイル数**: 120個以上 → 30個以下に削減
- [ ] **プロジェクト容量**: 大幅削減（DLフォルダで-100MB以上）
- [ ] **ビルド時間**: 高速化

### **🔧 機能確認**
- [ ] **ビルド成功**: `npm run build` エラーなし
- [ ] **開発サーバー**: `npm run dev` 正常起動
- [ ] **タブ動作**: 9つのタブすべて正常表示
- [ ] **Supabase接続**: データベース連携正常
- [ ] **認証機能**: パスワード保護正常

### **📦 GitHub準備完了確認**
- [ ] **不要ファイル除去**: .gitignoreで除外設定
- [ ] **セキュリティ**: env.local削除でAPIキー保護
- [ ] **最適化**: 最小限のファイル構成
- [ ] **デプロイ準備**: netlify.toml, vercel.json保持

---

## 🎊 **完了時の期待される結果**

### **✅ 達成目標**
🚀 **パフォーマンス向上**: ファイル数削減でビルド高速化
🧹 **プロジェクト整理**: クリーンな構造でメンテナンス性向上
🔐 **セキュリティ強化**: 不要なAPIキー・設定ファイル除去
📦 **GitHub最適化**: アップロード準備完了
🚀 **デプロイ準備**: Netlify/Vercel連携最適化

### **🎯 次のステップ**
1. **GitHub新規リポジトリ作成**: mmq-admin-system
2. **初回プッシュ**: クリーンアップ済みコード
3. **Netlify/Vercelデプロイ**: 自動デプロイ設定
4. **本番運用開始**: マーダーミステリー店舗管理開始

---

## 📝 **進捗報告・問題発生時**

**このCursor.mdファイルを更新して進捗・問題を報告してください：**

```markdown
## 🔄 削除進捗レポート
- [ ] Phase 1: 重複App.tsx削除
- [ ] Phase 2: Markdown削除  
- [ ] Phase 3: スクリプト削除
- [ ] Phase 4: 設定ファイル削除
- [ ] Phase 5: フォルダ削除
- [ ] Phase 6: 一時ファイル削除
- [ ] Phase 7: 検証完了

## ⚠️ 問題・エラー報告
（何か問題があればここに記載）

## ✅ 完了報告
（クリーンアップ完了時にここで報告）
```