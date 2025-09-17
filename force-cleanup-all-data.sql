-- 強制的にすべてのデータを削除して10件ずつに設定
-- SupabaseのSQL Editorで実行してください

-- 1. すべてのテーブルを完全にクリア
TRUNCATE TABLE scenarios RESTART IDENTITY CASCADE;
TRUNCATE TABLE staff RESTART IDENTITY CASCADE;

-- 2. シナリオテーブルに10件だけ挿入
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

-- 3. スタッフテーブルに10件だけ挿入
INSERT INTO staff (
    name, 
    line_name, 
    x_account, 
    role, 
    stores, 
    ng_days, 
    want_to_learn, 
    available_scenarios, 
    notes, 
    phone, 
    email, 
    availability, 
    experience, 
    special_scenarios, 
    status
) VALUES
('りんな', 'りんな@MMQ', '@rinna_mmq', ARRAY['GM'], ARRAY['馬場', '大久保'], ARRAY['月曜日'], ARRAY['新作シナリオ'], ARRAY['人狼村の惨劇', '雪山の遭難'], 'ベテランGM', '090-1234-5678', 'rinna@mmq.com', ARRAY['平日夜', '土日'], 5, ARRAY['ホラー系'], 'active'),
('マツケン', 'マツケン@MMQ', '@matsuken_mmq', ARRAY['GM', 'マネージャー'], ARRAY['馬場', '別館①'], ARRAY['火曜日'], ARRAY['演技指導'], ARRAY['人狼村の惨劇', '海辺の殺人'], 'マネージャー兼GM', '090-2345-6789', 'matsuken@mmq.com', ARRAY['全日'], 4, ARRAY['コメディ系'], 'active'),
('れいにー', 'れいにー@MMQ', '@rainy_mmq', ARRAY['GM'], ARRAY['大久保', '別館①'], ARRAY['水曜日'], ARRAY['シナリオ制作'], ARRAY['密室の謎', '古城の呪い'], '新人育成担当', '090-3456-7890', 'rainy@mmq.com', ARRAY['平日'], 3, ARRAY['ミステリー系'], 'active'),
('ソラ', 'ソラ@MMQ', '@sora_mmq', ARRAY['GM', 'サポート'], ARRAY['馬場', '大久保'], ARRAY['木曜日'], ARRAY['接客スキル'], ARRAY['漣の向こう側', '学園の秘密'], '接客のプロ', '090-4567-8901', 'sora@mmq.com', ARRAY['土日'], 4, ARRAY['ドラマ系'], 'active'),
('つばめ', 'つばめ@MMQ', '@tsubame_mmq', ARRAY['GM'], ARRAY['別館①'], ARRAY['金曜日'], ARRAY['技術習得'], ARRAY['漣の向こう側', '宇宙船の謎'], 'テクニカル担当', '090-5678-9012', 'tsubame@mmq.com', ARRAY['平日夜'], 3, ARRAY['SF系'], 'active'),
('みずき', 'みずき@MMQ', '@mizuki_mmq', ARRAY['サポート', '事務'], ARRAY['馬場'], ARRAY['土曜日'], ARRAY['企画立案'], ARRAY['学園の秘密', '料理人の秘密'], '事務・企画担当', '090-6789-0123', 'mizuki@mmq.com', ARRAY['平日'], 2, ARRAY['学園系'], 'active'),
('ハルカ', 'ハルカ@MMQ', '@haruka_mmq', ARRAY['サポート'], ARRAY['大久保'], ARRAY['日曜日'], ARRAY['写真撮影'], ARRAY['海辺の殺人', '図書館の怪事件'], '写真・SNS担当', '090-7890-1234', 'haruka@mmq.com', ARRAY['土日'], 1, ARRAY['カジュアル系'], 'active'),
('ユウト', 'ユウト@MMQ', '@yuto_mmq', ARRAY['GM'], ARRAY['別館①'], ARRAY[], ARRAY['音響技術'], ARRAY['雪山の遭難', '宇宙船の謎'], '音響・照明担当', '090-8901-2345', 'yuto@mmq.com', ARRAY['全日'], 3, ARRAY['技術系'], 'active'),
('アヤ', 'アヤ@MMQ', '@aya_mmq', ARRAY['企画'], ARRAY['馬場', '大久保'], ARRAY['月曜日'], ARRAY['マーケティング'], ARRAY['料理人の秘密', '図書館の怪事件'], '企画・マーケティング', '090-9012-3456', 'aya@mmq.com', ARRAY['平日'], 2, ARRAY['企画系'], 'active'),
('ケンタ', 'ケンタ@MMQ', '@kenta_mmq', ARRAY['社長'], ARRAY['馬場', '大久保', '別館①'], ARRAY[], ARRAY['経営戦略'], ARRAY[], '代表取締役', '090-0123-4567', 'kenta@mmq.com', ARRAY['全日'], 5, ARRAY['経営系'], 'active');

-- 4. 結果を確認
SELECT 'scenarios' as table_name, COUNT(*) as count FROM scenarios
UNION ALL
SELECT 'staff' as table_name, COUNT(*) as count FROM staff
UNION ALL
SELECT 'schedule_events' as table_name, COUNT(*) as count FROM schedule_events;

-- 5. 成功メッセージ
SELECT 'データクリーンアップ完了！シナリオ10件、スタッフ10件に削減されました。' as message;
