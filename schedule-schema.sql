-- スケジュールテーブルのスキーマ
-- 既存のsupabase-schema.sqlに追加するためのSQL

-- スケジュールイベントテーブル
CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    venue TEXT NOT NULL,
    scenario TEXT NOT NULL,
    gms TEXT[] DEFAULT '{}',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('オープン公演', '貸切公演', 'GMテスト', 'テストプレイ', '出張公演')),
    reservation_info TEXT,
    notes TEXT,
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_venue ON schedule_events(venue);
CREATE INDEX IF NOT EXISTS idx_schedule_events_scenario ON schedule_events(scenario);
CREATE INDEX IF NOT EXISTS idx_schedule_events_category ON schedule_events(category);
CREATE INDEX IF NOT EXISTS idx_schedule_events_gms ON schedule_events USING GIN(gms);

-- RLS (Row Level Security) の設定
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーが読み取り可能
CREATE POLICY "Enable read access for all users" ON schedule_events
    FOR SELECT USING (true);

-- 全てのユーザーが挿入可能
CREATE POLICY "Enable insert for all users" ON schedule_events
    FOR INSERT WITH CHECK (true);

-- 全てのユーザーが更新可能
CREATE POLICY "Enable update for all users" ON schedule_events
    FOR UPDATE USING (true);

-- 全てのユーザーが削除可能
CREATE POLICY "Enable delete for all users" ON schedule_events
    FOR DELETE USING (true);

-- リアルタイム機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE schedule_events;
