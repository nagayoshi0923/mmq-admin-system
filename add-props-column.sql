-- シナリオテーブルにpropsカラムを追加
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS props JSONB DEFAULT '[]';

-- 既存のデータを更新（空の配列で初期化）
UPDATE scenarios SET props = '[]' WHERE props IS NULL;

-- カラムにNOT NULL制約を追加
ALTER TABLE scenarios ALTER COLUMN props SET NOT NULL;
