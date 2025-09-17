-- edit_historyテーブルのスキーマを更新
-- 1. user_nameカラムをuserにリネーム
-- 2. categoryのCHECK制約に'store'を追加

-- まず既存のCHECK制約を削除
ALTER TABLE edit_history DROP CONSTRAINT IF EXISTS edit_history_category_check;

-- categoryカラムのCHECK制約を'store'を含めて再作成
ALTER TABLE edit_history ADD CONSTRAINT edit_history_category_check 
CHECK (category IN ('staff', 'scenario', 'schedule', 'reservation', 'sales', 'customer', 'inventory', 'store'));

-- user_nameカラムが存在する場合はuserにリネーム
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'edit_history' AND column_name = 'user_name') THEN
        ALTER TABLE edit_history RENAME COLUMN user_name TO "user";
    END IF;
END $$;

-- userカラムが存在しない場合は作成
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'edit_history' AND column_name = 'user') THEN
        ALTER TABLE edit_history ADD COLUMN "user" TEXT NOT NULL DEFAULT 'システム';
    END IF;
END $$;
