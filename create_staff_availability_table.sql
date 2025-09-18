-- スタッフ出勤可能時間テーブルを作成
CREATE TABLE IF NOT EXISTS staff_availability (
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

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date ON staff_availability(date);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_date ON staff_availability(staff_id, date);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_staff_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除してから再作成
DROP TRIGGER IF EXISTS trigger_update_staff_availability_updated_at ON staff_availability;
CREATE TRIGGER trigger_update_staff_availability_updated_at
  BEFORE UPDATE ON staff_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_availability_updated_at();

-- RLSを有効化（開発中は無効化、本番で有効化）
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Enable all operations for all users" ON staff_availability;
-- 開発用のポリシー（本番では適切なポリシーに変更）
CREATE POLICY "Enable all operations for all users" ON staff_availability
  FOR ALL USING (true);
