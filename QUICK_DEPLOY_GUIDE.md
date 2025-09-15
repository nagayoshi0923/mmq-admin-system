# 🚀 **mmq-store-admin 即座デプロイガイド**

## ⚡ **Vercel重複エラー解決完了！**

**新しいプロジェクト名**: `mmq-store-admin`
**正式名称**: Murder Mystery Quarters Store Admin
**バージョン**: v2.0.0

---

## 🔥 **3ステップ即座デプロイ（5分完了）**

### **Step 1: GitHubリポジトリ作成 (2分)**

1. **GitHub新規リポジトリ作成**
   ```
   リポジトリ名: mmq-store-admin
   説明: 🎭 Murder Mystery Store Admin - 企業レベル店舗管理システム
   Public/Private: お好みで選択
   ```

2. **ファイルアップロード**
   ```
   - 「uploading an existing file」をクリック
   - DLフォルダの全ファイルをドラッグ&ドロップ
   - Commit message: "🎭 MMQ Store Admin v2.0 - Complete Management System"
   - [Commit changes] をクリック
   ```

### **Step 2: Vercelデプロイ (2分)**

1. **Vercel連携**
   ```
   - https://vercel.com にアクセス
   - [Start Deploying] → GitHubでログイン
   - [New Project] をクリック
   - 作成したリポジトリを選択
   - [Import] をクリック
   ```

2. **自動設定確認**
   ```
   ✅ Framework: Vite (自動検出)
   ✅ Build Command: npm run build
   ✅ Output Directory: dist
   ✅ Install Command: npm install
   ```

3. **環境変数（Supabase使用時のみ）**
   ```
   VITE_SUPABASE_URL: [あなたのSupabaseプロジェクトURL]
   VITE_SUPABASE_ANON_KEY: [Supabaseの匿名キー]
   ```

4. **デプロイ実行**
   ```
   [Deploy] をクリック → 約2-3分で完了
   ```

### **Step 3: 動作確認 (1分)**

1. **基本機能確認**
   ```
   ✅ サイトアクセス
   ✅ ログイン（パスワード: 0909）
   ✅ 10タブ切り替え
   ✅ Supabaseステータス表示
   ```

---

## 🎯 **生成されるURL例**

```
https://mmq-store-admin-abc123.vercel.app
```

## 🔧 **Netlify代替デプロイ**

```bash
1. https://netlify.com → [New site from Git]
2. GitHubリポジトリ選択
3. Build command: npm run build
4. Publish directory: dist
5. 環境変数設定（Supabase使用時）
6. [Deploy site] をクリック
```

## 🏷️ **独自ドメイン設定**

**Vercel:**
```
Project → Settings → Domains → Add Domain
例: admin.yourdomain.com
```

**Netlify:**
```
Site settings → Domain management → Add custom domain
```

---

## ✅ **完成確認チェックリスト**

### **🎭 管理機能**
- [ ] 📅 スケジュール管理
- [ ] 🎫 予約管理
- [ ] 👥 スタッフ管理
- [ ] 📚 シナリオ管理
- [ ] 🏪 店舗管理
- [ ] 💰 売上管理
- [ ] 👤 顧客管理
- [ ] 📦 在庫管理
- [ ] 📄 ライセンス管理
- [ ] 💻 開発管理

### **🔒 セキュリティ**
- [ ] 管理者認証（パスワード: 0909）
- [ ] 8時間セッション管理
- [ ] 機密情報保護
- [ ] HTTPS/SSL暗号化

### **📊 Supabase機能**
- [ ] 🟢 リアルタイム接続状態
- [ ] クラウドデータ同期
- [ ] データ整合性監視

---

## 🎉 **デプロイ成功！**

**🌍 あなたのマーダーミステリー店舗管理システムが世界公開されました！**

**📱 本格的な店舗運営管理をお楽しみください** 🎭✨

---

**🚀 推奨次ステップ:**
1. 管理者パスワードを「0909」から変更
2. Supabase接続設定（高度な機能用）
3. 独自ドメイン設定
4. チーム招待・権限設定