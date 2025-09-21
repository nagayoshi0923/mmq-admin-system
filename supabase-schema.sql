-- MMQ Admin System Database Schema
-- Supabase用データベーススキーマ

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- スタッフテーブル
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    line_name TEXT NOT NULL,
    x_account TEXT,
    role TEXT[] DEFAULT '{}',
    stores TEXT[] DEFAULT '{}',
    ng_days TEXT[] DEFAULT '{}',
    want_to_learn TEXT[] DEFAULT '{}',
    available_scenarios TEXT[] DEFAULT '{}',
    notes TEXT,
    phone TEXT,
    email TEXT,
    availability TEXT[] DEFAULT '{}',
    experience INTEGER DEFAULT 0,
    special_scenarios TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- シナリオテーブル
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    license_amount INTEGER DEFAULT 2500,
    duration INTEGER NOT NULL,
    player_count_min INTEGER NOT NULL,
    player_count_max INTEGER NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    available_gms TEXT[] DEFAULT '{}',
    rating DECIMAL(2,1) DEFAULT 0.0,
    play_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'retired')),
    required_props TEXT[] DEFAULT '{}',
    props JSONB DEFAULT '[]',
    genre TEXT[] DEFAULT '{}',
    notes TEXT,
    has_pre_reading BOOLEAN DEFAULT false,
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗テーブル
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    opening_date DATE NOT NULL,
    manager_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'temporarily_closed', 'closed')),
    capacity INTEGER NOT NULL,
    rooms INTEGER NOT NULL,
    notes TEXT,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公演キットテーブル
CREATE TABLE IF NOT EXISTS performance_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    scenario_title TEXT NOT NULL,
    kit_number INTEGER NOT NULL,
    condition TEXT DEFAULT 'excellent' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    last_used DATE,
    notes TEXT,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 編集履歴テーブル
CREATE TABLE IF NOT EXISTS edit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    target TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('staff', 'scenario', 'schedule', 'reservation', 'sales', 'customer', 'inventory', 'store')),
    changes JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_stores ON staff USING GIN(stores);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_genre ON scenarios USING GIN(genre);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_venue ON schedule_events(venue);
CREATE INDEX IF NOT EXISTS idx_schedule_events_scenario ON schedule_events(scenario);
CREATE INDEX IF NOT EXISTS idx_schedule_events_category ON schedule_events(category);
CREATE INDEX IF NOT EXISTS idx_schedule_events_gms ON schedule_events USING GIN(gms);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_performance_kits_scenario ON performance_kits(scenario_id);
CREATE INDEX IF NOT EXISTS idx_performance_kits_store ON performance_kits(store_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_category ON edit_history(category);
CREATE INDEX IF NOT EXISTS idx_edit_history_timestamp ON edit_history(timestamp);

-- Row Level Security (RLS) の有効化
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー（全ユーザーがアクセス可能）
CREATE POLICY "Allow all operations for authenticated users" ON staff FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON scenarios FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON stores FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON performance_kits FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON edit_history FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON schedule_events FOR ALL USING (true);

-- 匿名ユーザーにも読み取り権限を付与（API統合のため）
CREATE POLICY "Allow anonymous read access" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON scenarios FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON stores FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON performance_kits FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON edit_history FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON schedule_events FOR SELECT USING (true);

-- 匿名ユーザーにも書き込み権限を付与（API統合のため）
CREATE POLICY "Allow anonymous write access" ON staff FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON scenarios FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON stores FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON performance_kits FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON edit_history FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON schedule_events FOR INSERT USING (true);

CREATE POLICY "Allow anonymous update access" ON staff FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON scenarios FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON stores FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON performance_kits FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON schedule_events FOR UPDATE USING (true);

-- 匿名ユーザーにも削除権限を付与（API統合のため）
CREATE POLICY "Allow anonymous delete access" ON staff FOR DELETE USING (true);
CREATE POLICY "Allow anonymous delete access" ON scenarios FOR DELETE USING (true);
CREATE POLICY "Allow anonymous delete access" ON stores FOR DELETE USING (true);
CREATE POLICY "Allow anonymous delete access" ON performance_kits FOR DELETE USING (true);
CREATE POLICY "Allow anonymous delete access" ON edit_history FOR DELETE USING (true);
CREATE POLICY "Allow anonymous delete access" ON schedule_events FOR DELETE USING (true);
CREATE POLICY "Allow anonymous update access" ON edit_history FOR UPDATE USING (true);

-- 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_kits_updated_at BEFORE UPDATE ON performance_kits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
