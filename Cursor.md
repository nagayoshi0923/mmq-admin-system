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

---

## 🚨 **緊急バグ修正: 本番環境でダイアログ背景透明化問題**

### **🔍 問題の詳細**
- **症状**: 本番環境でダイアログ・プルダウンメニューの背景が透明になる
- **影響範囲**: ShadCN UIのDialog, Popover, Select, DropdownMenu等
- **原因**: Tailwind v4のCSS変数が本番ビルドで正しく適用されていない

### **🛠️ 修正手順**

#### **Step 1: globals.cssの背景色変数を強化**
```css
/* styles/globals.css の :root セクションに追加 */
:root {
  /* 既存の変数を維持しつつ、以下を追加・強化 */
  --popover: #ffffff;
  --popover-foreground: #0f0f0f;
  --card: #ffffff;
  --card-foreground: #0f0f0f;
  
  /* ダイアログ・オーバーレイ専用変数を追加 */
  --dialog-background: #ffffff;
  --dialog-foreground: #0f0f0f;
  --overlay-background: rgba(0, 0, 0, 0.8);
}

.dark {
  --popover: #1a1a1a;
  --popover-foreground: #fafafa;
  --card: #1a1a1a;
  --card-foreground: #fafafa;
  
  --dialog-background: #1a1a1a;
  --dialog-foreground: #fafafa;
  --overlay-background: rgba(0, 0, 0, 0.9);
}
```

#### **Step 2: ShadCN UIコンポーネントの背景を明示的に設定**
以下のコンポーネントファイルで背景色を明示的に設定：

**`components/ui/dialog.tsx`**
```tsx
// DialogContent に bg-popover を追加
<DialogPrimitive.Content
  className={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-popover p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
    className
  )}
/>
```

**`components/ui/popover.tsx`**
```tsx
// PopoverContent に bg-popover を追加
<PopoverPrimitive.Content
  className={cn(
    "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    className
  )}
/>
```

**`components/ui/select.tsx`**
```tsx
// SelectContent に bg-popover を追加
<SelectPrimitive.Content
  className={cn(
    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    position === "popper" &&
      "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
    className
  )}
/>
```

#### **Step 3: ビルド設定でCSS変数を保持**
**`postcss.config.js`を更新**
```js
export default {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'cssnano': {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        // CSS変数を保持
        reduceIdents: false,
        zindex: false
      }]
    }
  }
}
```

#### **Step 4: 修正後の動作確認**
```bash
# 開発環境で確認
npm run dev

# 本番ビルドで確認
npm run build
npm run preview

# 各UIコンポーネントの背景色を確認
# - ダイアログ
# - セレクトボックス
# - ポップオーバー
# - ドロップダウンメニュー
```

---

## 📝 **進捗報告・問題発生時**

**このCursor.mdファイルを更新して進捗・問題を報告してください：**

### **🔄 クリーンアップ進捗**
- [ ] Phase 1: 重複App.tsx削除
- [ ] Phase 2: Markdown削除  
- [ ] Phase 3: スクリプト削除
- [ ] Phase 4: 設定ファイル削除
- [ ] Phase 5: フォルダ削除
- [ ] Phase 6: 一時ファイル削除
- [ ] Phase 7: 検証完了

### **🐛 バグ修正進捗**
- [ ] Step 1: globals.css背景色変数強化
- [ ] Step 2: UIコンポーネント背景明示化
- [ ] Step 3: ビルド設定更新
- [ ] Step 4: 本番環境動作確認

### **⚠️ 問題・エラー報告**
（何か問題があればここに記載）

### **✅ 完了報告**
（修正完了時にここで報告）