-- シナリオ管理用テーブルを作成
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author TEXT NOT NULL,
  license_amount INTEGER DEFAULT 2500,
  duration INTEGER NOT NULL, -- 所要時間（分）
  player_count JSONB DEFAULT '{"min": 3, "max": 6}', -- {min: number, max: number}
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) NOT NULL,
  available_gms TEXT[] DEFAULT '{}',
  rating DECIMAL(3,1) DEFAULT 4.0,
  play_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'archived')),
  required_props TEXT[] DEFAULT '{}',
  genre TEXT[] DEFAULT '{}',
  notes TEXT,
  has_pre_reading BOOLEAN DEFAULT false,
  release_date DATE,
  production_cost INTEGER DEFAULT 0, -- 制作費（円）
  depreciation INTEGER DEFAULT 0, -- 減価償却（円）
  revenue INTEGER DEFAULT 0, -- 売上（円）
  gm_fee INTEGER DEFAULT 0, -- GM代（円）
  miscellaneous_expenses INTEGER DEFAULT 0, -- 雑費（円）
  license_rate_override DECIMAL(5,2) DEFAULT 0, -- ライセンス率の例外（%）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_scenarios_title ON scenarios(title);
CREATE INDEX IF NOT EXISTS idx_scenarios_author ON scenarios(author);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存のトリガーを削除してから再作成
DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at 
    BEFORE UPDATE ON scenarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) を有効化
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成（開発用：全ユーザーが全操作可能）
CREATE POLICY "Allow all operations for all users" ON scenarios
    FOR ALL USING (true);

-- コメントを追加
COMMENT ON TABLE scenarios IS 'シナリオ管理テーブル';
COMMENT ON COLUMN scenarios.id IS 'シナリオの一意ID';
COMMENT ON COLUMN scenarios.title IS 'シナリオタイトル';
COMMENT ON COLUMN scenarios.description IS 'シナリオの説明';
COMMENT ON COLUMN scenarios.author IS '作者名';
COMMENT ON COLUMN scenarios.license_amount IS 'ライセンス料（円）';
COMMENT ON COLUMN scenarios.duration IS '所要時間（分）';
COMMENT ON COLUMN scenarios.player_count IS 'プレイ人数（最小・最大）';
COMMENT ON COLUMN scenarios.difficulty IS 'GM難易度（1-5）';
COMMENT ON COLUMN scenarios.available_gms IS '対応可能なGMのリスト';
COMMENT ON COLUMN scenarios.rating IS '評価（0.0-5.0）';
COMMENT ON COLUMN scenarios.play_count IS '公演回数';
COMMENT ON COLUMN scenarios.status IS 'ステータス（available/unavailable/archived）';
COMMENT ON COLUMN scenarios.required_props IS '必要小道具のリスト';
COMMENT ON COLUMN scenarios.genre IS 'ジャンルのリスト';
COMMENT ON COLUMN scenarios.notes IS '備考';
COMMENT ON COLUMN scenarios.has_pre_reading IS '事前読み込みの有無';
COMMENT ON COLUMN scenarios.release_date IS 'リリース日';
COMMENT ON COLUMN scenarios.production_cost IS '制作費（円）';
COMMENT ON COLUMN scenarios.depreciation IS '減価償却（円）';
COMMENT ON COLUMN scenarios.revenue IS '売上（円）';
COMMENT ON COLUMN scenarios.gm_fee IS 'GM代（円）';
COMMENT ON COLUMN scenarios.miscellaneous_expenses IS '雑費（円）';
COMMENT ON COLUMN scenarios.license_rate_override IS 'ライセンス率の例外（%）';
COMMENT ON COLUMN scenarios.created_at IS '作成日時';
COMMENT ON COLUMN scenarios.updated_at IS '更新日時';
