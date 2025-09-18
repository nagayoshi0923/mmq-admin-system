-- すべてのテーブルを修正する包括的なSQLスクリプト

-- 1. 既存のテーブルを削除（依存関係を考慮）
DROP TABLE IF EXISTS staff_availability CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- 2. staffテーブルを正しいスキーマで再作成
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  line_name TEXT,
  x_account TEXT,
  role TEXT,
  stores TEXT[],
  ng_days TEXT[],
  want_to_learn TEXT[],
  available_scenarios TEXT[] DEFAULT '{}',
  notes TEXT,
  phone TEXT,
  email TEXT,
  availability TEXT[],
  experience TEXT,
  special_scenarios TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. staff_availabilityテーブルを正しいスキーマで再作成
CREATE TABLE staff_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  morning BOOLEAN NOT NULL DEFAULT false,
  afternoon BOOLEAN NOT NULL DEFAULT false,
  evening BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. インデックスを作成
CREATE INDEX idx_staff_name ON staff(name);
CREATE INDEX idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_date ON staff_availability(date);
CREATE INDEX idx_staff_availability_staff_date ON staff_availability(staff_id, date);

-- 5. 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガーを作成
CREATE TRIGGER trigger_update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_staff_availability_updated_at
  BEFORE UPDATE ON staff_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. RLSを有効化
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

-- 8. 開発用のポリシーを作成
CREATE POLICY "Enable all operations for all users on staff" ON staff
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for all users on staff_availability" ON staff_availability
  FOR ALL USING (true);

-- 9. サンプルデータを挿入（テスト用）
INSERT INTO staff (name, line_name, role, available_scenarios) VALUES
('テストスタッフ1', 'テストライン1', 'GM', ARRAY['ゲームマスター殺人事件', '漣の向こう側']),
('テストスタッフ2', 'テストライン2', 'GM', ARRAY['妖怪たちと月夜の刀']);

-- 10. テーブル構造を確認
SELECT 'staff table created successfully' as status;
SELECT 'staff_availability table created successfully' as status;
