-- シナリオテーブルのサンプルデータ
-- SupabaseのSQL Editorで実行してください

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
('漣の向こう側', '感動的なストーリー重視作品', 'ドラマ制作', 2800, 300, 4, 4, 4, ARRAY['ソラ', 'つばめ'], 4.8, 8, 'available', ARRAY['写真', '手紙'], ARRAY['ドラマ', 'ミステリー'], 'GM研修推奨', true, '2023-05-10');
