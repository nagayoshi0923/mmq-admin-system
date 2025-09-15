# 🚀 マーダーミステリー店舗管理システム デプロイガイド

## 📋 概要
このガイドでは、マーダーミステリー店舗管理システムをGitHub経由でVercel/Netlifyにデプロイする手順を説明します。

## 🎯 必要な準備
- GitHubアカウント
- Vercel または Netlify アカウント
- Supabase プロジェクト（オプション）

## 🔥 Step 1: GitHubリポジトリ作成

### 1.1 GitHubで新しいリポジトリを作成
```bash
1. GitHub（https://github.com）にログイン
2. 右上の「+」→「New repository」をクリック
3. Repository name: murder-mystery-store-management
4. Description: マーダーミステリー店舗管理システム
5. Public または Private を選択
6. 「Create repository」をクリック
```

### 1.2 DLフォルダをGitHubにアップロード

**方法A: GitHub Desktop使用**
```bash
1. GitHub Desktopをダウンロード・インストール
2. 「Clone a repository from the Internet」→「URL」
3. リポジトリURLを入力してClone
4. DLフォルダの全ファイルをクローンしたフォルダにコピー
5. 「Commit to main」→「Publish branch」
```

**方法B: コマンドライン使用**
```bash
# DLフォルダで実行
cd DL
git init
git add .
git commit -m "Initial commit: Murder Mystery Store Management System"
git branch -M main
git remote add origin https://github.com/[あなたのユーザー名]/murder-mystery-store-management.git
git push -u origin main
```

**方法C: GitHub Web UI（簡単）**
```bash
1. 作成したリポジトリページで「uploading an existing file」をクリック
2. DLフォルダの全ファイルをドラッグ&ドロップ
3. Commit message: "Initial commit"
4. 「Commit changes」をクリック
```

## 🎯 Step 2: Vercelデプロイ

### 2.1 Vercelアカウント作成・ログイン
```bash
1. https://vercel.com にアクセス
2. 「Start Deploying」または「Sign Up」
3. GitHubアカウントでログイン
```

### 2.2 プロジェクトをインポート
```bash
1. Vercel ダッシュボードで「New Project」
2. GitHubリポジトリを選択
3. 「murder-mystery-store-management」を選択
4. 「Import」をクリック
```

### 2.3 ビルド設定（自動検出）
```json
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2.4 環境変数設定（Supabase使用時）
```bash
Environment Variables:
- VITE_SUPABASE_URL: [SupabaseプロジェクトURL]
- VITE_SUPABASE_ANON_KEY: [Supabaseの匿名キー]
```

### 2.5 デプロイ実行
```bash
1. 「Deploy」をクリック
2. 約2-3分でデプロイ完了
3. 生成されたURLでアクセス可能
   例: https://murder-mystery-store-management.vercel.app
```

## 🌐 Step 3: Netlifyデプロイ（代替案）

### 3.1 Netlifyアカウント作成
```bash
1. https://www.netlify.com にアクセス
2. 「Start building for free」
3. GitHubアカウントでログイン
```

### 3.2 新しいサイト作成
```bash
1. 「New site from Git」をクリック
2. 「GitHub」を選択
3. リポジトリを選択: murder-mystery-store-management
```

### 3.3 ビルド設定
```bash
Build command: npm run build
Publish directory: dist
```

### 3.4 環境変数設定
```bash
1. Site settings → Environment variables
2. 環境変数を追加：
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
```

### 3.5 デプロイ実行
```bash
1. 「Deploy site」をクリック
2. 約2-3分でデプロイ完了
3. 生成されたURL例: https://amazing-cupcake-123456.netlify.app
```

## 🏷️ Step 4: 独自ドメイン設定

### 4.1 Vercelで独自ドメイン
```bash
1. プロジェクト → Settings → Domains
2. 「Add」で独自ドメインを入力
3. DNS設定を指示通りに更新
4. SSL証明書が自動で設定される
```

### 4.2 Netlifyで独自ドメイン
```bash
1. Site settings → Domain management
2. 「Add custom domain」
3. ドメイン名を入力
4. DNS設定を指示通りに更新
```

## ⚡ Step 5: 自動デプロイ設定

### 5.1 GitHubプッシュで自動デプロイ
```bash
✅ Vercel/Netlify共通で自動設定済み
- mainブランチにプッシュで自動デプロイ
- プレビューURLも自動生成
- デプロイ履歴も保存
```

## 🔧 トラブルシューティング

### よくあるエラーと解決法

**Build Error: Module not found**
```bash
解決法:
1. package.jsonの依存関係を確認
2. npm install で再インストール
3. importパスを相対パスに修正
```

**Environment Variables not working**
```bash
解決法:
1. 変数名がVITE_で始まっているか確認
2. Vercel/Netlifyで環境変数が正しく設定されているか確認
3. デプロイ後にサイトを再デプロイ
```

**Supabase Connection Error**
```bash
解決法:
1. Supabase URLとキーが正しいか確認
2. Supabase RLSポリシーを確認
3. ネットワーク設定を確認
```

## 🎉 デプロイ成功確認

以下の機能が正常動作すれば成功：

### ✅ 基本機能
- [ ] ログイン画面表示（パスワード「0909」）
- [ ] 10個のタブ切り替え
- [ ] リアルタイムステータス表示

### ✅ 各管理機能
- [ ] スケジュール管理
- [ ] スタッフ管理
- [ ] シナリオ管理
- [ ] 店舗管理
- [ ] 予約・売上・顧客・在庫管理
- [ ] ライセンス・開発管理

### ✅ データ機能
- [ ] LocalStorageデータ保存
- [ ] Supabase接続（設定時）
- [ ] データ同期状態表示

## 🚀 本番運用推奨設定

### セキュリティ強化
```bash
1. 管理者パスワードを「0909」から変更
2. Supabase RLSポリシー設定
3. HTTPS強制有効化
4. CORS設定適正化
```

### パフォーマンス最適化
```bash
1. CDN活用（Vercel/Netlify標準）
2. 画像最適化有効化
3. キャッシュ設定最適化
4. 監視ツール設定
```

## 📞 サポート

問題が発生した場合：
1. GitHub Issuesで報告
2. Vercel/Netlifyのドキュメント確認
3. コミュニティフォーラム活用

---

**🎭 マーダーミステリー店舗管理システム v2.0**
**本格的な店舗運営を支援する企業レベル管理システム**