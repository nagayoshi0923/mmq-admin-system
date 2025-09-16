-- 予約サイト用追加テーブル
-- 既存のsupabase-schema.sqlに追加するテーブル定義

-- 顧客テーブル
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    line_name TEXT,
    birthday DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'not_specified')),
    postal_code TEXT,
    address TEXT,
    membership_number TEXT,
    total_visits INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約テーブル
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_number TEXT UNIQUE NOT NULL,
    reservation_page_id TEXT,
    title TEXT NOT NULL,
    scenario_id UUID REFERENCES scenarios(id),
    store_id UUID REFERENCES stores(id) NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    
    -- 予約日時情報
    requested_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_datetime TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- 分単位
    
    -- 参加者情報
    participant_count INTEGER NOT NULL DEFAULT 1,
    participant_names TEXT[],
    
    -- スタッフ情報
    assigned_staff TEXT[], -- スタッフIDの配列
    gm_staff TEXT, -- メインGMのスタッフID
    
    -- 料金情報
    base_price INTEGER NOT NULL DEFAULT 0,
    options_price INTEGER DEFAULT 0,
    total_price INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    final_price INTEGER NOT NULL DEFAULT 0,
    
    -- 支払い情報
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    payment_datetime TIMESTAMP WITH TIME ZONE,
    
    -- ステータス管理
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- 追加情報
    customer_notes TEXT, -- 顧客からの要望・メモ
    staff_notes TEXT, -- スタッフ用メモ
    special_requests TEXT, -- 特別な要求
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- 外部システム連携
    external_reservation_id TEXT, -- ストアーズなど外部システムのID
    reservation_source TEXT DEFAULT 'website', -- 予約経路
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約オプションテーブル
CREATE TABLE IF NOT EXISTS reservation_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    option_name TEXT NOT NULL,
    option_value TEXT,
    additional_price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約履歴テーブル（ステータス変更の追跡）
CREATE TABLE IF NOT EXISTS reservation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    changed_by TEXT NOT NULL, -- ユーザー名またはシステム
    change_type TEXT NOT NULL CHECK (change_type IN ('status_change', 'datetime_change', 'staff_assignment', 'payment_update', 'notes_update')),
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

CREATE INDEX IF NOT EXISTS idx_reservations_reservation_number ON reservations(reservation_number);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_store_id ON reservations(store_id);
CREATE INDEX IF NOT EXISTS idx_reservations_scenario_id ON reservations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_reservations_requested_datetime ON reservations(requested_datetime);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX IF NOT EXISTS idx_reservations_external_id ON reservations(external_reservation_id);

CREATE INDEX IF NOT EXISTS idx_reservation_options_reservation_id ON reservation_options(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_history_reservation_id ON reservation_history(reservation_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_history ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー
CREATE POLICY "Allow all operations for authenticated users" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON reservation_options FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON reservation_history FOR ALL USING (true);

-- 匿名ユーザー（予約サイト）用のポリシー
CREATE POLICY "Allow anonymous read access" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON reservation_options FOR SELECT USING (true);

CREATE POLICY "Allow anonymous write access" ON customers FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON reservations FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON reservation_options FOR INSERT USING (true);
CREATE POLICY "Allow anonymous write access" ON reservation_history FOR INSERT USING (true);

CREATE POLICY "Allow anonymous update access" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON reservations FOR UPDATE USING (true);

-- 更新時刻の自動更新トリガー
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 予約番号の自動生成関数
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- 今日の日付をベースにした予約番号を生成
    SELECT COALESCE(MAX(CAST(SUBSTRING(reservation_number FROM 9) AS INTEGER)), 0) + 1
    INTO counter
    FROM reservations 
    WHERE reservation_number LIKE TO_CHAR(NOW(), 'YYYYMMDD') || '%';
    
    new_number := TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 予約番号自動生成トリガー
CREATE OR REPLACE FUNCTION set_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reservation_number IS NULL OR NEW.reservation_number = '' THEN
        NEW.reservation_number := generate_reservation_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reservation_number_trigger 
    BEFORE INSERT ON reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION set_reservation_number();
