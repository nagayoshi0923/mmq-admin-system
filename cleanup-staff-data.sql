-- スタッフデータを10件に削減
-- SupabaseのSQL Editorで実行してください

-- 既存のスタッフデータをすべて削除
DELETE FROM staff;

-- 10件のサンプルスタッフデータを挿入
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

-- データ件数を確認
SELECT COUNT(*) as staff_count FROM staff;
