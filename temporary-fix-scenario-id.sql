-- 一時的な修正: scenario_idカラムを追加するだけの簡単なSQL
-- これだけを先に実行して、フロントエンドのエラーを解決

-- schedule_eventsテーブルにscenario_idカラムを追加
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS scenario_id TEXT;

-- 結果確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'schedule_events' 
AND column_name = 'scenario_id';
