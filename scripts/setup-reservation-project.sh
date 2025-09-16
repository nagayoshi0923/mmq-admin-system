#!/bin/bash

# FigmaMakeプロトタイプから予約サイトプロジェクトを作成するセットアップスクリプト
# 使用方法: ./setup-reservation-project.sh [プロジェクト名] [管理ツールのパス]

set -e

# 色付きログ用の関数
log_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 引数の確認
PROJECT_NAME=${1:-"mmq-reservation-site"}
ADMIN_TOOL_PATH=${2:-"../mmq-admin-system"}

log_info "予約サイトプロジェクトのセットアップを開始します"
log_info "プロジェクト名: $PROJECT_NAME"
log_info "管理ツールパス: $ADMIN_TOOL_PATH"

# 管理ツールの存在確認
if [ ! -d "$ADMIN_TOOL_PATH" ]; then
    log_error "管理ツールのパスが見つかりません: $ADMIN_TOOL_PATH"
    exit 1
fi

# プロジェクトディレクトリの作成
log_info "プロジェクトディレクトリを作成中..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Viteプロジェクトの初期化
log_info "Viteプロジェクトを初期化中..."
npm create vite@latest . -- --template react-ts --yes

# 依存関係のインストール
log_info "基本依存関係をインストール中..."
npm install

log_info "追加依存関係をインストール中..."
npm install \
    @supabase/supabase-js \
    @radix-ui/react-dialog \
    @radix-ui/react-dropdown-menu \
    @radix-ui/react-label \
    @radix-ui/react-select \
    @radix-ui/react-separator \
    @radix-ui/react-slot \
    @radix-ui/react-switch \
    @radix-ui/react-tabs \
    @radix-ui/react-toast \
    lucide-react \
    class-variance-authority \
    clsx \
    tailwind-merge \
    react-hook-form \
    @hookform/resolvers \
    zod \
    date-fns

# 開発依存関係のインストール
log_info "開発依存関係をインストール中..."
npm install -D \
    tailwindcss \
    postcss \
    autoprefixer \
    @types/node

# Tailwind CSSの初期化
log_info "Tailwind CSSを初期化中..."
npx tailwindcss init -p

# ディレクトリ構造の作成
log_info "ディレクトリ構造を作成中..."
mkdir -p src/{components/{ui,reservation,layout,debug},pages/{scenarios,reservation,customer},hooks,utils,types,lib}

# 管理ツールから共有ファイルをコピー
log_info "管理ツールから共有ファイルをコピー中..."

# 必須ファイルのコピー
cp "$ADMIN_TOOL_PATH/lib/supabase.ts" "src/lib/" 2>/dev/null || log_warning "supabase.ts が見つかりません"
cp "$ADMIN_TOOL_PATH/types/reservation.ts" "src/types/" 2>/dev/null || log_warning "reservation.ts が見つかりません"
cp "$ADMIN_TOOL_PATH/utils/realtimeSync.ts" "src/utils/" 2>/dev/null || log_warning "realtimeSync.ts が見つかりません"
cp "$ADMIN_TOOL_PATH/utils/reservationApi.ts" "src/utils/" 2>/dev/null || log_warning "reservationApi.ts が見つかりません"

# UIコンポーネントのコピー
if [ -d "$ADMIN_TOOL_PATH/components/ui" ]; then
    cp -r "$ADMIN_TOOL_PATH/components/ui" "src/components/"
    log_success "UIコンポーネントをコピーしました"
else
    log_warning "UIコンポーネントディレクトリが見つかりません"
fi

# 設定ファイルのコピー
cp "$ADMIN_TOOL_PATH/shared-env.example" ".env.example" 2>/dev/null || log_warning "shared-env.example が見つかりません"
cp "$ADMIN_TOOL_PATH/tailwind.config.js" "./" 2>/dev/null || log_warning "tailwind.config.js が見つかりません"
cp "$ADMIN_TOOL_PATH/postcss.config.js" "./" 2>/dev/null || log_warning "postcss.config.js が見つかりません"

# 環境変数ファイルの作成
log_info "環境変数ファイルを作成中..."
cat > .env.local << EOF
# 予約サイト用環境変数
# 管理ツールと同じSupabase設定を使用してください

# Supabase設定
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
VITE_ENABLE_MOCK_DATA=false

# 通知設定
VITE_NOTIFY_NEW_RESERVATION=true
VITE_ADMIN_EMAIL=admin@your-domain.com
EOF

# package.jsonの更新
log_info "package.jsonを更新中..."
cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test:connection": "node -e \"import('./src/utils/connectionTest.js').then(m => m.testConnections())\""
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@supabase/supabase-js": "^2.38.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "tailwind-merge": "^2.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.9.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  }
}
EOF

# Tailwind設定の更新
log_info "Tailwind設定を更新中..."
cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOF

# グローバルCSSの作成
log_info "グローバルCSSを作成中..."
cat > src/index.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

# 基本的なApp.tsxの作成
log_info "基本的なApp.tsxを作成中..."
cat > src/App.tsx << EOF
import { useEffect } from 'react';
import { useRealtimeSync } from './utils/realtimeSync';
import './index.css';

function App() {
  const { startSync, onTableChange } = useRealtimeSync();

  useEffect(() => {
    // リアルタイム同期を開始
    startSync(['reservations', 'customers', 'scenarios', 'stores']);
    
    // 管理ツールからの更新を監視
    onTableChange('reservations', (event) => {
      if (event.source === 'admin') {
        console.log('管理ツールから予約が更新されました:', event);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">MMQ予約サイト</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl mb-4">予約サイトのセットアップが完了しました！</h2>
          <p className="text-muted-foreground mb-4">
            FigmaMakeで作成したコンポーネントをここに配置してください。
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              次のステップ：<br/>
              1. .env.localファイルに正しい環境変数を設定<br/>
              2. FigmaMakeコンポーネントを統合<br/>
              3. 予約機能の実装
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
EOF

# 接続テスト用ファイルの作成
log_info "接続テスト用ファイルを作成中..."
cat > src/utils/connectionTest.ts << EOF
import { supabase } from '../lib/supabase';
import { realtimeSync } from './realtimeSync';

export async function testConnections() {
  console.log('🔍 接続テストを開始...');
  
  // Supabase接続テスト
  try {
    const { data, error } = await supabase.from('stores').select('count');
    console.log('✅ Supabase接続:', error ? '❌ エラー' : '✅ 成功');
    if (error) console.error('Supabaseエラー:', error);
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
}

// 開発時に自動実行
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  setTimeout(testConnections, 1000);
}
EOF

# README.mdの作成
log_info "README.mdを作成中..."
cat > README.md << EOF
# $PROJECT_NAME

MMQ管理ツールと連携する予約サイトです。

## セットアップ

1. 環境変数の設定
\`\`\`bash
cp .env.example .env.local
# .env.localファイルを編集して正しい値を設定
\`\`\`

2. 依存関係のインストール
\`\`\`bash
npm install
\`\`\`

3. 開発サーバーの起動
\`\`\`bash
npm run dev
\`\`\`

## 管理ツールとの連携

このプロジェクトは以下の方法でMMQ管理ツールと連携します：

- **共有Supabaseデータベース**: 同じデータベースを参照
- **リアルタイム同期**: 予約の作成・更新を即座に同期
- **Webhook通知**: 重要な変更を相互に通知

## 開発ガイド

詳細な開発ガイドは \`FIGMAMAKE_TO_PROJECT_WORKFLOW.md\` を参照してください。

## 接続テスト

\`\`\`bash
npm run test:connection
\`\`\`

## デプロイ

Netlifyまたは他のホスティングサービスにデプロイできます。
環境変数を適切に設定してください。
EOF

# Netlify設定ファイルの作成
log_info "Netlify設定ファイルを作成中..."
cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# 依存関係の再インストール
log_info "依存関係を再インストール中..."
npm install

log_success "予約サイトプロジェクトのセットアップが完了しました！"
log_info "次のステップ:"
log_info "1. .env.localファイルを編集して環境変数を設定"
log_info "2. npm run dev でサーバーを起動"
log_info "3. FigmaMakeコンポーネントを統合"
log_info "4. 予約機能を実装"

echo ""
log_info "プロジェクトディレクトリ: $(pwd)"
log_info "開発サーバー起動: npm run dev"
log_info "接続テスト: npm run test:connection"
EOF

