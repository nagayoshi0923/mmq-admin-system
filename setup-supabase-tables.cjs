#!/usr/bin/env node

// Supabaseテーブル作成スクリプト
// このスクリプトを実行してSupabaseにテーブルを作成します

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数から設定を読み込み
const supabaseUrl = 'https://lgyhbagdfdyycerijtmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneWhiYWdkZmR5eWNlcmlqdG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjA5ODMsImV4cCI6MjA3Mjg5Njk4M30.J4o6O65dr4EwM4Ak1fq5qE479EFMpLT4rOxuHQfRQC4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Supabaseのテーブル状況を確認中...');
  
  const tables = ['staff', 'scenarios', 'schedule_events', 'stores', 'performance_kits', 'edit_history'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}テーブル: ${error.message}`);
      } else {
        console.log(`✅ ${table}テーブル: 存在します (${data.length}件のサンプルデータ)`);
      }
    } catch (err) {
      console.log(`❌ ${table}テーブル: ${err.message}`);
    }
  }
}

async function createSampleData() {
  console.log('\n📝 サンプルデータを作成中...');
  
  // サンプルスタッフデータ
  const sampleStaff = {
    name: 'りんな',
    line_name: 'りんな',
    x_account: '@rinna_gm',
    role: ['GM'],
    stores: ['馬場'],
    ng_days: [],
    want_to_learn: [],
    available_scenarios: ['ゲームマスター殺人事件'],
    notes: 'メインGM',
    phone: '',
    email: '',
    availability: ['平日夜', '週末'],
    experience: 5,
    special_scenarios: [],
    status: 'active'
  };

  try {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .insert(sampleStaff)
      .select();
    
    if (staffError) {
      console.log('❌ スタッフデータ作成エラー:', staffError.message);
    } else {
      console.log('✅ サンプルスタッフデータを作成しました');
    }
  } catch (err) {
    console.log('❌ スタッフデータ作成エラー:', err.message);
  }

  // サンプルシナリオデータ
  const sampleScenario = {
    title: 'ゲームマスター殺人事件',
    description: 'ゲーム内でGMが殺される衝撃の展開。メタ要素満載の革新的シナリオ。',
    author: 'クインズワルツ',
    license_amount: 2500,
    duration: 480,
    player_count_min: 5,
    player_count_max: 7,
    difficulty: 4,
    available_gms: ['りんな'],
    rating: 4.9,
    play_count: 15,
    status: 'available',
    required_props: ['GM席', 'メタ演出道具', '衝撃演出セット'],
    genre: ['ミステリー'],
    notes: '',
    has_pre_reading: false,
    release_date: '2023-01-01'
  };

  try {
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .insert(sampleScenario)
      .select();
    
    if (scenarioError) {
      console.log('❌ シナリオデータ作成エラー:', scenarioError.message);
    } else {
      console.log('✅ サンプルシナリオデータを作成しました');
    }
  } catch (err) {
    console.log('❌ シナリオデータ作成エラー:', err.message);
  }
}

async function main() {
  console.log('🚀 Supabaseテーブル設定スクリプトを開始します\n');
  
  await checkTables();
  
  console.log('\n📋 次の手順を実行してください:');
  console.log('1. Supabase管理画面 (https://supabase.com/dashboard) にアクセス');
  console.log('2. プロジェクトを選択');
  console.log('3. 左メニューの "SQL Editor" をクリック');
  console.log('4. supabase-schema.sql の内容をコピー&ペーストして実行');
  console.log('5. このスクリプトを再実行してテーブルの作成を確認');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nテーブルが作成済みの場合、サンプルデータを作成しますか？ (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await createSampleData();
    }
    
    console.log('\n✅ 完了しました！');
    rl.close();
  });
}

main().catch(console.error);
