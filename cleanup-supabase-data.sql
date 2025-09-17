-- Supabaseのデータを10件ずつに削減
-- SupabaseのSQL Editorで実行してください

-- 1. 既存データをすべて削除
DELETE FROM scenarios;
DELETE FROM staff WHERE id NOT IN (
    SELECT id FROM staff LIMIT 10
);

-- 2. シナリオテーブルに10件のサンプルデータを挿入
INSERT INTO scenarios (
    title, 
    description, 
    author, 
    license_amount, 
    duration, 
    player_count_min, 
    player_count_max, 
    difficulty, 
    available_gms, 
    rating, 
    play_count, 
    status, 
    required_props, 
    genre, 
    notes, 
    has_pre_reading, 
    release_date
) VALUES
('人狼村の惨劇', '人狼をテーマにした本格ミステリー', 'クインズワルツ', 2500, 240, 4, 8, 2, ARRAY['りんな', 'マツケン'], 4.2, 15, 'available', ARRAY['人狼カード'], ARRAY['ミステリー', 'ホラー'], 'テスト用シナリオ', true, '2023-01-15'),
('密室の謎', '古典的な密室殺人事件', 'ミステリー工房', 3000, 180, 3, 6, 3, ARRAY['れいにー'], 4.5, 22, 'available', ARRAY['鍵', '地図'], ARRAY['ミステリー'], '人気シナリオ', false, '2023-03-20'),
('漣の向こう側', '感動的なストーリー重視作品', 'ドラマ制作', 2800, 300, 4, 4, 4, ARRAY['ソラ', 'つばめ'], 4.8, 8, 'available', ARRAY['写真', '手紙'], ARRAY['ドラマ', 'ミステリー'], 'GM研修推奨', true, '2023-05-10'),
('学園の秘密', '学園を舞台にしたミステリー', 'スクール企画', 2200, 180, 5, 7, 2, ARRAY['みずき', 'ソラ'], 4.1, 12, 'available', ARRAY['制服', '教科書'], ARRAY['ミステリー', '学園'], '初心者向け', false, '2023-07-01'),
('古城の呪い', 'ホラー要素のある重厚な作品', 'ゴシック制作', 3500, 360, 4, 6, 4, ARRAY['れいにー', 'つばめ'], 4.6, 18, 'available', ARRAY['古い鍵', 'ろうそく'], ARRAY['ホラー', 'ミステリー'], '上級者向け', true, '2023-09-15'),
('海辺の殺人', '夏の海辺を舞台にした事件', 'サマー企画', 2600, 210, 4, 8, 3, ARRAY['マツケン', 'みずき'], 4.3, 25, 'available', ARRAY['水着', '浮き輪'], ARRAY['ミステリー', 'サマー'], '夏限定', false, '2023-06-01'),
('雪山の遭難', '雪山での密室殺人事件', 'ウィンター制作', 2900, 270, 3, 5, 4, ARRAY['りんな', 'ソラ'], 4.7, 14, 'available', ARRAY['防寒具', '地図'], ARRAY['ミステリー', 'サバイバル'], '冬季推奨', true, '2023-12-01'),
('宇宙船の謎', 'SF要素を含むミステリー', 'スペース企画', 3200, 300, 4, 6, 5, ARRAY['つばめ', 'れいにー'], 4.4, 9, 'available', ARRAY['宇宙服', 'コンピューター'], ARRAY['SF', 'ミステリー'], 'SF好き向け', true, '2024-01-10'),
('料理人の秘密', 'レストランを舞台にした事件', 'グルメ制作', 2400, 180, 5, 8, 2, ARRAY['みずき', 'マツケン'], 4.0, 20, 'available', ARRAY['エプロン', 'レシピ'], ARRAY['ミステリー', 'グルメ'], '料理好き向け', false, '2023-11-20'),
('図書館の怪事件', '静かな図書館での不可解な事件', 'ライブラリー企画', 2300, 150, 3, 6, 2, ARRAY['ソラ', 'りんな'], 4.2, 16, 'available', ARRAY['本', '眼鏡'], ARRAY['ミステリー', '知的'], '読書好き向け', false, '2023-10-05');

-- 3. データ件数を確認
SELECT 'scenarios' as table_name, COUNT(*) as count FROM scenarios
UNION ALL
SELECT 'staff' as table_name, COUNT(*) as count FROM staff
UNION ALL
SELECT 'schedule_events' as table_name, COUNT(*) as count FROM schedule_events;
