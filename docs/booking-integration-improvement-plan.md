# 🎯 予約サイト連携対応 改善計画書

## 📋 概要

マーダーミステリー店舗管理システムを予約サイト連携に対応させるための包括的な改善計画です。

## 🎯 目標

1. **予約サイトとの安全な連携**: 管理システムで作成した公演データを予約サイトで表示
2. **データ整合性の確保**: リアルタイム同期とデータ不整合の防止
3. **パフォーマンス最適化**: 大量データ処理と高速レスポンス
4. **保守性の向上**: コードの可読性と拡張性の向上
5. **スケーラビリティ**: 将来的な機能拡張に対応

## 🔍 現状分析

### 主要な問題点

#### 1. データベース設計の問題
- **scenariosテーブルの肥大化**: 22カラムに及ぶ巨大テーブル
- **正規化不足**: 財務情報、道具情報、基本情報が混在
- **JSONBカラムの乱用**: 構造化データが非正規化
- **拡張性の欠如**: 新機能追加時のテーブル構造変更が必要

#### 2. コンポーネントの肥大化
- **ScenarioManager.tsx**: 1,749行の巨大コンポーネント
- **ScenarioDialog.tsx**: 1,173行の複雑なダイアログ
- **単一責任原則違反**: 1つのコンポーネントに複数の責任

#### 3. データアクセス層の欠如
- **直接Supabase操作**: Context層で直接データベース操作
- **テスト困難**: ビジネスロジックとデータアクセスが密結合
- **再利用性の欠如**: 共通処理の重複

## 🚀 改善戦略

### Phase 1: データアクセス層の構築 (2-3週間)

#### 1.1 Repository Pattern の導入
```typescript
// lib/data-access/BaseRepository.ts
export abstract class BaseRepository<T> {
  protected tableName: string;
  
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(filters?: FilterOptions): Promise<T[]>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

// lib/data-access/ScenarioRepository.ts
export class ScenarioRepository extends BaseRepository<Scenario> {
  // シナリオ固有のデータ操作
  async findAvailableScenarios(): Promise<Scenario[]>;
  async findScenariosByGenre(genre: string): Promise<Scenario[]>;
  async updatePlayCount(scenarioId: string): Promise<void>;
}
```

#### 1.2 データ変換層の作成
```typescript
// lib/data-access/mappers/ScenarioMapper.ts
export class ScenarioMapper {
  static toDomain(dbScenario: DbScenario): Scenario;
  static toDatabase(scenario: Scenario): DbScenario;
  static toBookingApi(scenario: Scenario): BookingScenario;
}
```

### Phase 2: データベース設計の正規化 (1-2週間)

#### 2.1 テーブル分割
```sql
-- 基本情報テーブル
CREATE TABLE scenarios (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    duration INTEGER NOT NULL,
    player_count_min INTEGER NOT NULL,
    player_count_max INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    genre TEXT[] DEFAULT '{}',
    has_pre_reading BOOLEAN DEFAULT false,
    release_date DATE,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 財務情報テーブル（分離）
CREATE TABLE scenario_financials (
    id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    license_amount INTEGER DEFAULT 2500,
    production_cost INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0,
    gm_fee INTEGER DEFAULT 0,
    miscellaneous_expenses INTEGER DEFAULT 0,
    license_rate_override DECIMAL(5,2),
    participation_fee INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 道具テーブル（正規化）
CREATE TABLE scenario_props (
    id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    cost_type TEXT NOT NULL CHECK (cost_type IN ('per_play', 'one_time')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 制作費項目テーブル（正規化）
CREATE TABLE scenario_production_costs (
    id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約サイト連携用ビュー
CREATE VIEW booking_scenarios AS
SELECT 
    s.id,
    s.title,
    s.description,
    s.author,
    s.duration,
    s.player_count_min,
    s.player_count_max,
    s.difficulty,
    s.genre,
    s.has_pre_reading,
    s.status,
    sf.participation_fee,
    sf.license_amount
FROM scenarios s
LEFT JOIN scenario_financials sf ON s.id = sf.scenario_id
WHERE s.status = 'available';
```

#### 2.2 インデックス最適化
```sql
-- 予約サイト用インデックス
CREATE INDEX idx_scenarios_status_genre ON scenarios(status, genre);
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX idx_scenarios_player_count ON scenarios(player_count_min, player_count_max);

-- 財務情報用インデックス
CREATE INDEX idx_scenario_financials_scenario_id ON scenario_financials(scenario_id);
CREATE INDEX idx_scenario_financials_participation_fee ON scenario_financials(participation_fee);
```

### Phase 3: 状態管理の最適化 (1-2週間)

#### 3.1 Context分割
```typescript
// contexts/ScenarioContext.tsx - 基本情報のみ
export interface ScenarioContextType {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  findScenario: (id: string) => Scenario | undefined;
  createScenario: (data: CreateScenarioData) => Promise<Scenario>;
  updateScenario: (id: string, data: UpdateScenarioData) => Promise<Scenario>;
  deleteScenario: (id: string) => Promise<void>;
}

// contexts/ScenarioFinancialsContext.tsx - 財務情報
export interface ScenarioFinancialsContextType {
  financials: ScenarioFinancials[];
  loading: boolean;
  error: string | null;
  updateFinancials: (scenarioId: string, data: UpdateFinancialsData) => Promise<void>;
  calculateMetrics: (scenarioId: string) => ScenarioMetrics;
}

// contexts/ScenarioPropsContext.tsx - 道具情報
export interface ScenarioPropsContextType {
  props: ScenarioProps[];
  loading: boolean;
  error: string | null;
  addProp: (scenarioId: string, prop: CreatePropData) => Promise<void>;
  updateProp: (propId: string, data: UpdatePropData) => Promise<void>;
  deleteProp: (propId: string) => Promise<void>;
}
```

#### 3.2 カスタムフックの作成
```typescript
// hooks/useScenario.ts
export function useScenario(scenarioId: string) {
  const { scenarios } = useScenarios();
  const { financials } = useScenarioFinancials();
  const { props } = useScenarioProps();
  
  const scenario = useMemo(() => {
    const base = scenarios.find(s => s.id === scenarioId);
    const financial = financials.find(f => f.scenarioId === scenarioId);
    const scenarioProps = props.filter(p => p.scenarioId === scenarioId);
    
    return base ? {
      ...base,
      financials: financial,
      props: scenarioProps
    } : null;
  }, [scenarioId, scenarios, financials, props]);
  
  return { scenario, loading, error };
}
```

### Phase 4: コンポーネント分割 (2-3週間)

#### 4.1 ScenarioManager分割
```
components/scenario/
├── ScenarioManager.tsx              // メインコンポーネント
├── ScenarioTable/
│   ├── ScenarioTable.tsx            // テーブル表示
│   ├── ScenarioTableHeader.tsx      // ヘッダー
│   ├── ScenarioTableRow.tsx         // 行表示
│   ├── ScenarioTableFilters.tsx     // フィルター
│   └── ScenarioTablePagination.tsx  // ページネーション
├── ScenarioMetrics/
│   ├── ScenarioMetrics.tsx          // メトリクス表示
│   ├── ScenarioMetricsCard.tsx      // メトリクスカード
│   └── ScenarioMetricsChart.tsx     // チャート表示
├── ScenarioActions/
│   ├── ScenarioActions.tsx          // アクションボタン
│   ├── ScenarioCreateButton.tsx     // 作成ボタン
│   ├── ScenarioEditButton.tsx       // 編集ボタン
│   └── ScenarioDeleteButton.tsx     // 削除ボタン
└── hooks/
    ├── useScenarioTable.ts          // テーブル状態管理
    ├── useScenarioFilters.ts        // フィルター状態管理
    ├── useScenarioMetrics.ts        // メトリクス計算
    └── useScenarioActions.ts        // アクション処理
```

#### 4.2 ScenarioDialog分割
```
components/scenario/dialog/
├── ScenarioDialog.tsx               // メインダイアログ
├── ScenarioBasicInfo.tsx            // 基本情報タブ
├── ScenarioFinancials.tsx           // 財務情報タブ
├── ScenarioProps.tsx                // 道具情報タブ
├── ScenarioProductionCosts.tsx      // 制作費タブ
└── hooks/
    ├── useScenarioForm.ts           // フォーム状態管理
    ├── useScenarioValidation.ts     // バリデーション
    └── useScenarioSubmit.ts         // 送信処理
```

### Phase 5: 予約サイト連携API (1-2週間)

#### 5.1 API設計
```typescript
// lib/api/booking-api.ts
export class BookingApi {
  // 予約サイト用のシナリオ一覧取得
  async getAvailableScenarios(filters?: BookingFilters): Promise<BookingScenario[]>;
  
  // 特定シナリオの詳細取得
  async getScenarioDetails(scenarioId: string): Promise<BookingScenarioDetails>;
  
  // 予約可能日時取得
  async getAvailableSlots(scenarioId: string, date: string): Promise<TimeSlot[]>;
  
  // 予約作成
  async createReservation(reservation: CreateReservationData): Promise<Reservation>;
  
  // 予約状況更新
  async updateReservationStatus(reservationId: string, status: ReservationStatus): Promise<void>;
}
```

#### 5.2 データ同期
```typescript
// lib/sync/BookingSync.ts
export class BookingSync {
  // リアルタイム同期
  async syncScenarios(): Promise<void>;
  
  // 予約データ同期
  async syncReservations(): Promise<void>;
  
  // 在庫状況同期
  async syncInventory(): Promise<void>;
  
  // エラー処理
  async handleSyncError(error: Error): Promise<void>;
}
```

## 📊 予約サイト連携で必要なデータ

### 1. シナリオ情報
```typescript
interface BookingScenario {
  id: string;
  title: string;
  description: string;
  author: string;
  duration: number; // 時間
  playerCountMin: number;
  playerCountMax: number;
  difficulty: number; // 1-5
  genre: string[];
  hasPreReading: boolean;
  participationFee: number;
  status: 'available' | 'maintenance' | 'retired';
  releaseDate: string;
  rating: number;
  playCount: number;
}
```

### 2. スケジュール情報
```typescript
interface BookingSchedule {
  id: string;
  scenarioId: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  availableSlots: number;
  bookedSlots: number;
  gms: string[];
  category: 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';
  isAvailable: boolean;
}
```

### 3. 店舗情報
```typescript
interface BookingStore {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phoneNumber: string;
  email: string;
  capacity: number;
  rooms: number;
  status: 'active' | 'temporarily_closed' | 'closed';
  color: string;
}
```

## 🔧 実装手順

### Week 1-2: データアクセス層構築
1. **BaseRepository作成**
2. **ScenarioRepository実装**
3. **Mapper層作成**
4. **既存Contextの段階的移行**

### Week 3-4: データベース正規化
1. **新しいテーブル設計**
2. **データ移行スクリプト作成**
3. **インデックス最適化**
4. **ビュー作成**

### Week 5-6: 状態管理最適化
1. **Context分割**
2. **カスタムフック作成**
3. **メモ化最適化**
4. **エラーハンドリング改善**

### Week 7-9: コンポーネント分割
1. **ScenarioManager分割**
2. **ScenarioDialog分割**
3. **共通コンポーネント作成**
4. **テスト追加**

### Week 10-11: 予約サイト連携
1. **BookingApi実装**
2. **データ同期機能**
3. **エラー処理**
4. **監視機能**

## 📈 期待される効果

### パフォーマンス改善
- **クエリ速度**: 50-70%向上
- **メモリ使用量**: 30-50%削減
- **初期読み込み**: 40-60%高速化

### 開発効率向上
- **新機能追加**: 70%高速化
- **バグ修正**: 50%高速化
- **テスト作成**: 80%高速化

### 保守性向上
- **コード可読性**: 大幅向上
- **拡張性**: 新機能追加が容易
- **チーム開発**: 並行開発が可能

## ⚠️ リスク管理

### 1. データ整合性
- **移行中のバックアップ**: 毎日自動バックアップ
- **ロールバック手順**: 詳細な手順書作成
- **段階的移行**: 機能ごとに段階的に移行

### 2. パフォーマンス
- **負荷テスト**: 各段階で負荷テスト実施
- **監視**: リアルタイム監視システム
- **アラート**: 異常時の自動アラート

### 3. 開発リスク
- **並行開発**: 機能ブランチでの並行開発
- **コードレビュー**: 全変更のコードレビュー
- **テスト**: 自動テストの充実

## 📋 チェックリスト

### Phase 1: データアクセス層
- [ ] BaseRepository作成
- [ ] ScenarioRepository実装
- [ ] Mapper層作成
- [ ] 既存Context移行
- [ ] 単体テスト作成

### Phase 2: データベース正規化
- [ ] 新テーブル設計
- [ ] データ移行スクリプト
- [ ] インデックス最適化
- [ ] ビュー作成
- [ ] パフォーマンステスト

### Phase 3: 状態管理最適化
- [ ] Context分割
- [ ] カスタムフック作成
- [ ] メモ化最適化
- [ ] エラーハンドリング
- [ ] 統合テスト

### Phase 4: コンポーネント分割
- [ ] ScenarioManager分割
- [ ] ScenarioDialog分割
- [ ] 共通コンポーネント
- [ ] UIテスト
- [ ] アクセシビリティテスト

### Phase 5: 予約サイト連携
- [ ] BookingApi実装
- [ ] データ同期機能
- [ ] エラー処理
- [ ] 監視機能
- [ ] 本番テスト

## 🎯 成功指標

### 技術指標
- **ページ読み込み時間**: 3秒以内
- **API応答時間**: 500ms以内
- **エラー率**: 0.1%以下
- **テストカバレッジ**: 80%以上

### ビジネス指標
- **予約サイト連携**: 100%正常動作
- **データ整合性**: 99.9%以上
- **開発効率**: 50%以上向上
- **保守コスト**: 30%以上削減

---

**作成日**: 2024年12月19日  
**更新日**: 2024年12月19日  
**作成者**: AI Assistant  
**承認者**: [承認者名]
