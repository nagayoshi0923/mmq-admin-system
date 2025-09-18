# FigmaMakeプロジェクト同期ガイド

このドキュメントは、ローカルプロジェクトで行った変更をFigmaMakeプロジェクトに反映するための詳細な手順書です。

## 🔧 修正が必要なファイルと変更内容

### 1. 依存関係の修正

#### `package.json`
**問題**: FigmaMakeが生成したimportパスにバージョン番号が含まれている
**修正**: 以下の依存関係からバージョン番号を削除

```json
{
  "dependencies": {
    // 修正前: "lucide-react@0.487.0": "^0.487.0"
    // 修正後:
    "lucide-react": "^0.487.0",
    
    // 修正前: "@radix-ui/react-accordion@1.2.3": "^1.2.3"
    // 修正後:
    "@radix-ui/react-accordion": "^1.2.3",
    
    // 同様に以下のパッケージも修正:
    "@radix-ui/react-alert-dialog": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-dialog": "^1.1.3",
    "@radix-ui/react-dropdown-menu": "^2.1.3",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-popover": "^1.1.3",
    "@radix-ui/react-scroll-area": "^1.2.1",
    "@radix-ui/react-select": "^2.1.3",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.3",
    "@radix-ui/react-tooltip": "^1.1.4",
    "react-day-picker": "^8.10.1",
    "react-hook-form": "^7.54.0",
    "embla-carousel-react": "^8.5.1",
    "recharts": "^2.15.0",
    "vaul": "^1.1.1",
    "input-otp": "^1.4.1",
    "react-resizable-panels": "^2.1.7",
    "sonner": "^1.7.1"
  }
}
```

### 2. UIコンポーネントのimport修正

#### `components/ui/` 内の全ファイル
**問題**: importパスにバージョン番号が含まれている
**修正方法**: 以下のコマンドで一括修正

```bash
# lucide-reactの修正
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "lucide-react@[^"]*"/from "lucide-react"/g' {} \;

# @radix-ui系の修正
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "@radix-ui\/\([^@]*\)@[^"]*"/from "@radix-ui\/\1"/g' {} \;

# その他のパッケージ
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "react-day-picker@[^"]*"/from "react-day-picker"/g' {} \;
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "embla-carousel-react@[^"]*"/from "embla-carousel-react"/g' {} \;
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "vaul@[^"]*"/from "vaul"/g' {} \;
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "input-otp@[^"]*"/from "input-otp"/g' {} \;
find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "react-resizable-panels@[^"]*"/from "react-resizable-panels"/g' {} \;
```

### 3. 特定ファイルの修正

#### `index.html`
**問題**: スクリプトのsrcパスが間違っている
```html
<!-- 修正前 -->
<script type="module" src="/src/main.tsx"></script>

<!-- 修正後 -->
<script type="module" src="/main.tsx"></script>
```

#### `components/DataPersistenceStatus.tsx`
**問題**: sonnerのimportパスにバージョン番号
```typescript
// 修正前
import { toast } from 'sonner@2.0.3';

// 修正後
import { toast } from 'sonner';
```

### 4. TypeScript型定義の修正

#### `contexts/EditHistoryContext.tsx`
**問題**: categoryの型定義が不完全
```typescript
export interface EditHistoryEntry {
  // 修正前
  category: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory';
  
  // 修正後
  category: 'staff' | 'scenario' | 'schedule' | 'reservation' | 'sales' | 'customer' | 'inventory' | 'store' | 'license';
}
```

#### `components/StaffManager.tsx`
**問題**: Staff.roleの型が配列として扱われていない
```typescript
// 修正箇所1: 編集履歴での値の処理
{ field: '役割', newValue: safeStaffData.role.join(', ') }
{ field: '役割', oldValue: staffData.role.join(', '), newValue: '削除済み' }

// 修正箇所2: 役割チェックの条件
// 修正前
if (member.role === 'GM' || member.role === 'マネージャー')
// 修正後
if (member.role.includes('GM') || member.role.includes('マネージャー'))

// 修正箇所3: 連絡先情報のアクセス
// 修正前
alert(`${member.name}の連絡先:\n電話: ${member.phoneNumber}\nメール: ${member.email}`);
// 修正後
alert(`${member.name}の連絡先:\n電話: ${member.contact.phone}\nメール: ${member.contact.email}`);
```

#### `components/StaffDialog.tsx`
**問題**: ローカルのStaff interfaceが競合、役割選択がsingle select
```typescript
// 修正1: ローカルinterface Staffを削除（importされたものを使用）

// 修正2: 役割選択をcheckboxに変更
<div className="space-y-2">
  {roleOptions.map((roleOption) => (
    <div key={roleOption} className="flex items-center space-x-2">
      <Checkbox
        id={roleOption}
        checked={formData.role.includes(roleOption)}
        onCheckedChange={(checked) => {
          if (checked) {
            setFormData(prev => ({ ...prev, role: [...prev.role, roleOption] }));
          } else {
            setFormData(prev => ({ ...prev, role: prev.role.filter(r => r !== roleOption) }));
          }
        }}
      />
      <Label htmlFor={roleOption}>{roleOption}</Label>
    </div>
  ))}
</div>

// 修正3: 条件分岐の更新
{(formData.role.includes('GM') || formData.role.includes('マネージャー') || formData.role.includes('企画')) && (
  // シナリオ選択UI
)}
```

#### `components/InventoryManager.tsx`
**問題**: usedInScenariosプロパティが不足
```typescript
// モックデータに以下を追加
{
  id: '4',
  name: 'A4コピー用紙',
  // ... 他のプロパティ
  supplier: 'オフィス用品店',
  usedInScenarios: [] // この行を追加
},
{
  id: '5',
  name: 'マイクロフォン',
  // ... 他のプロパティ
  notes: '定期点検必要',
  usedInScenarios: [] // この行を追加
}
```

#### `components/ReservationManager.tsx`
**問題**: タイポとcategory不足
```typescript
// 修正1: タイポ修正
// 修正前
'予約モ': '',
// 修正後
'予約メモ': '',

// 修正2: EditHistoryEntryのimport追加
import { EditHistoryEntry } from '../contexts/EditHistoryContext';

// 修正3: category追加
const historyEntry: EditHistoryEntry = {
  // ...
  category: 'reservation',
  // ...
};
```

#### `components/SalesManager.tsx`
**問題**: 型アサーションが不足
```typescript
// 修正箇所
setSalesRecords(initialSalesRecords as SalesRecord[]);
```

#### `components/ScenarioManager.tsx`
**問題**: プロパティアクセスエラーと文字化け
```typescript
// 修正1: プロパティアクセス
// 修正前
<div key={entry.store.id} className="text-xs">
  {entry.store.name}: {entry.kits.length}キット
</div>
// 修正後
<div key={entry.storeId} className="text-xs">
  {entry.storeName}: {entry.kits.length}キット
</div>

// 修正2: 文字化け修正
// 修正前
title="クリックし���編集"
// 修正後
title="クリックして編集"
```

#### `components/LicenseManager.tsx`
**問題**: 型ガードが不足
```typescript
const filteredScenarios = useMemo(() => {
  if (!availableScenarios || !Array.isArray(availableScenarios)) {
    return [];
  }
  return availableScenarios
    .map(scenario => typeof scenario === 'string' ? scenario : scenario.title)
    .filter((title): title is string => title && title.trim() !== '') // 型ガード追加
    .filter((title, index, self) => self.indexOf(title) === index);
}, [availableScenarios]);
```

#### `components/StoreDialog.tsx`
**問題**: 必須プロパティが不足
```typescript
const storeData: StoreType = {
  // ... 既存のプロパティ
  performanceKits: formData.performanceKits || [],
  color: '#3B82F6', // デフォルト色を追加
  shortName: formData.name!.substring(0, 2) // 名前の最初の2文字を追加
};
```

### 5. UIコンポーネントの特殊修正

#### `components/ui/calendar.tsx`
**問題**: DayPickerのcomponentsプロパティの型エラー
```typescript
components={{
  Chevron: ({ orientation, className, ...props }) => (
    orientation === "left" ?
      <ChevronLeft className={cn("size-4", className)} {...props} /> :
      <ChevronRight className={cn("size-4", className)} {...props} />
  ),
} as any} // 型アサーション追加
```

#### `components/ui/input-otp.tsx`
**問題**: inputOTPContextの型エラー
```typescript
const { char, hasFakeCaret, isActive } = (inputOTPContext as any)?.slots[index] ?? {}; // 型アサーション追加
```

### 6. 重複プロパティの修正

#### `contexts/ScenarioContext.tsx`
**問題**: licenseAmountプロパティの重複
```typescript
// モックデータから重複するlicenseAmountプロパティを削除
// 各シナリオオブジェクトでlicenseAmountが2回定義されている場合は1つに統合
```

### 7. 設定ファイルの修正

#### `postcss.config.js`
**問題**: ES Module形式への変更
```javascript
// 修正前
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

// 修正後
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### `tailwind.config.js` (新規作成)
```javascript
module.exports = {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### `styles/globals.css`
**問題**: Tailwind CSS v4の記法をv3に変更
```css
/* 修正前 */
@import "tailwindcss";

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}

/* 修正後 */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-gray-200 outline-gray-400/50;
  }
  
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
```

#### `vite.config.ts`
**問題**: エイリアスパスとTailwind CSS v4プラグイン
```typescript
// 修正前
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ...
})

// 修正後
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()], // tailwindcssプラグイン削除
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'), // ./srcから./に変更
    },
  },
  // ...
})
```

### 8. 不足ファイルの作成

#### `components/StaffScheduleDialog.tsx` (新規作成)
```typescript
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export function StaffScheduleDialog({ isOpen, onClose, staffId }: {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スタッフスケジュール: {staffId}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>この機能は現在開発中です。</p>
          <p>スタッフID: {staffId}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### `hooks/useSupabaseData.ts` (新規作成)
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseData<T>(options: {
  table: string;
  realtime?: boolean;
  fallbackKey?: string;
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    // 実装は必要に応じて追加
  };

  useEffect(() => {
    // 基本的な実装
    setLoading(false);
  }, []);

  return { data, loading, error, refetch };
}
```

## 🚀 適用手順

1. **依存関係の修正**
   ```bash
   npm install
   ```

2. **一括import修正**
   ```bash
   # UIコンポーネントのimport修正
   find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "lucide-react@[^"]*"/from "lucide-react"/g' {} \;
   find components/ui/ -name "*.tsx" -exec sed -i '' 's/from "@radix-ui\/\([^@]*\)@[^"]*"/from "@radix-ui\/\1"/g' {} \;
   ```

3. **個別ファイル修正**
   - 上記の各ファイルを順次修正

4. **ビルドテスト**
   ```bash
   npm run build
   ```

5. **型チェック**
   ```bash
   npx tsc --noEmit
   ```

## ✅ 修正完了確認

全ての修正が完了すると：
- TypeScriptエラー: 0個
- ビルド: 成功
- 開発サーバー: 正常起動

これらの変更により、FigmaMakeプロジェクトがローカル環境と同じ状態になり、正常にビルド・デプロイできるようになります。
