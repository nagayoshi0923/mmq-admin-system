import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';

// StaffContextとの循環参照を避けるため、ここで簡単な関数を作成
let staffUpdateFunction: ((staffName: string, scenarioTitle: string, action: 'add' | 'remove') => void) | null = null;
let staffBatchSyncFunction: ((scenarioGMMap: { [scenarioTitle: string]: string[] }) => void) | null = null;

export const setStaffUpdateFunction = (fn: (staffName: string, scenarioTitle: string, action: 'add' | 'remove') => void) => {
  staffUpdateFunction = fn;
};

export const setStaffBatchSyncFunction = (fn: (scenarioGMMap: { [scenarioTitle: string]: string[] }) => void) => {
  staffBatchSyncFunction = fn;
};

export interface Scenario {
  id: string;
  title: string;
  description: string;
  author: string;
  licenseAmount: number; // ライセンス料（円）
  duration: number; // 分
  playerCount: {
    min: number;
    max: number;
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
  availableGMs: string[]; // 対応可能GM
  rating: number;
  playCount: number;
  status: 'available' | 'maintenance' | 'retired';
  requiredProps: string[];
  genre: string[]; // 追加: ジャンル
  notes?: string;
  hasPreReading: boolean; // 事前読み込みの有無
  releaseDate?: string; // リリース日（YYYY-MM-DD形式）
  productionCost?: number; // 制作費（円）
  revenue?: number; // 売上（円）
  gmFee?: number; // GM代（円）
  miscellaneousExpenses?: number; // 雑費（円）
  licenseRateOverride?: number; // ライセンス率の例外（%）
  participationFee?: number; // 参加費（円）
}

// モックデータは削除済み - Supabaseからのデータを使用
const mockScenarios: Scenario[] = [
  // 大量のモックデータを削除しました
  // Supabaseからのデータを使用します
  /*{
    id: '1',
    title: 'グロリアメモリーズ',
    description: 'オープンの場合は事前読込なし。馬場・大塚限定での公演。',
    author: 'クインズワルツ',
    licenseAmount: 3000,
    duration: 600, // 10時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう', 'みずき'],
    rating: 4.5,
    playCount: 15,
    status: 'available',
    requiredProps: ['Keynoteなし', 'ネタバレ注意なし'],
    genre: ['ミステリー'],
    hasPreReading: false,
    releaseDate: '2023-03-15'
  },
  {
    id: '2',
    title: 'マーダー・オブ・パイレーツ',
    description: '馬場・大塚限定での海賊テーマ作品。',
    author: 'クインズワルツ',
    licenseAmount: 3000,
    duration: 600, // 10時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 8,
    status: 'maintenance',
    requiredProps: ['準備中'],
    genre: ['ミステリー'],
    hasPreReading: true,
    releaseDate: '2023-06-20'
  },
  {
    id: '3',
    title: 'BrightChoice',
    description: '馬場・大塚推奨のミステリー作品。',
    author: 'クインズワルツ',
    duration: 540, // 9時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['Remia（れみあ）', 'みずき'],
    rating: 4.5,
    playCount: 22,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    releaseDate: '2022-12-10',
    licenseAmount: 2500
  },
  {
    id: '4',
    title: '裁くもの、裁かれるもの',
    description: '馬場・大塚推奨の法廷テーマ作品。',
    author: 'クインズワルツ',
    duration: 540, // 9時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['れいにー', 'みずき'],
    rating: 4.0,
    playCount: 18,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '5',
    title: '星',
    description: '準備中の作品。',
    author: 'クインズワルツ',
    duration: 540, // 9時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['りえぞー'],
    rating: 4.5,
    playCount: 5,
    status: 'maintenance',
    requiredProps: ['準備中'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '6',
    title: '清流館の秘宝',
    description: '現在公演中止中の作品。',
    author: 'クインズワルツ',
    duration: 540, // 9時間
    playerCount: { min: 3, max: 4 },
    difficulty: 2,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 3.5,
    playCount: 12,
    status: 'retired',
    requiredProps: ['現在公演中止'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '7',
    title: 'BBA',
    description: '高田馬場・大塚店限定の人気作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 5, max: 5 },
    difficulty: 4,
    availableGMs: ['れいにー', 'みずき', 'りえぞー'],
    rating: 5.0,
    playCount: 35,
    status: 'available',
    requiredProps: ['Keynoteあり', 'ハッシュタグ案内あり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '8',
    title: 'DearmyD',
    description: '感動系のミステリー作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 5 },
    difficulty: 3,
    availableGMs: ['Remia（れみあ）', 'みずき'],
    rating: 5.0,
    playCount: 28,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '9',
    title: 'アンフィスバエナと聖女の祈り',
    description: '高田馬場・大塚店限定。同時刻複数店舗での公演は契約上NG。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ぽんちゃん'],
    rating: 4.5,
    playCount: 20,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '10',
    title: 'ウロボロスの眠り',
    description: 'ループ系のテーマを扱った作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 15,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '11',
    title: 'クリエイターズハイ',
    description: 'クリエイター業界をテーマにした作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 3, max: 4 },
    difficulty: 3,
    availableGMs: ['りえぞー'],
    rating: 4.5,
    playCount: 18,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '12',
    title: 'フェイクドナー',
    description: '臓器移植をテーマにしたシリアスな作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 3, max: 4 },
    difficulty: 3,
    availableGMs: ['えりん'],
    rating: 4.5,
    playCount: 25,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '13',
    title: '或ル胡蝶ノ夢',
    description: '馬場or大塚推奨の幻想的な作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 5.0,
    playCount: 30,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '14',
    title: '花街リグレット',
    description: '花街を舞台にした大正ロマン作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 22,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '15',
    title: '銀世界のアシアト',
    description: '5月まで限定公演の冬��ーマ作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 18,
    status: 'available',
    requiredProps: ['Keynoteあり', '期間限定'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '16',
    title: '黒と白の狭間に',
    description: '二元論をテーマにした哲学的作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 3, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 20,
    status: 'available',
    requiredProps: ['Keynoteあり', '床が綺麗なところ'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '17',
    title: '女皇の書架',
    description: '図書館を舞台にした知的な作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 3, max: 4 },
    difficulty: 4,
    availableGMs: ['えりん'],
    rating: 4.5,
    playCount: 25,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '18',
    title: '機巧人形の心臓',
    description: 'スチームパンク世界の機械人形をテーマにした作品。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 5 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 12,
    status: 'available',
    requiredProps: ['機械人形', '歯車セット', 'スチーム演出'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '19',
    title: 'inthebox〜長い熱病',
    description: '密室系の心理サスペンス作品。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 5, max: 6 },
    difficulty: 5,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 5.5,
    playCount: 8,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '20',
    title: 'アオハループ',
    description: '青春ループ系の感動作品。馬場・大塚店限定。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 4, max: 5 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 32,
    status: 'available',
    requiredProps: ['Keynoteあり', 'ハッシュタグ案内あり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '21',
    title: 'ツグミドリ',
    description: '鳥をモチーフにした神秘的なファンタジーミステリー。美しい世界観の中に隠された真実。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 3, max: 4 },
    difficulty: 3,
    availableGMs: ['八継じの', 'みずき', 'りえぞー'],
    rating: 4.5,
    playCount: 21,
    status: 'available',
    requiredProps: ['鳥の羽根', '森の音効果', 'ファンタジー装飾'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '22',
    title: '鬼哭館の殺人事件',
    description: '和風ホラーの古典的な館もの作品。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 4, max: 5 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 35,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '23',
    title: '季節マーダー／アニクシィ',
    description: '季節をテーマにしたマーダーミステリー。高田馬場・大塚推奨。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 3, max: 4 },
    difficulty: 2,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 28,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '24',
    title: '殺神罪',
    description: '神を殺すというテーマの重厚な作品。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 4, max: 4 },
    difficulty: 5,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 5.0,
    playCount: 18,
    status: 'available',
    requiredProps: ['Keynoteあり', '3キット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '25',
    title: '燔祭のジェミニ',
    description: '双子にまつわる悲劇的な物語。心理的な恐怖と家族の絆がテーマの重厚なシナリオ。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 3, max: 4 },
    difficulty: 4,
    availableGMs: ['八継じの', 'みずき'],
    rating: 4.5,
    playCount: 19,
    status: 'available',
    requiredProps: ['双子の写真', '祭りの装飾', '火の演出'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '26',
    title: '5DIVE',
    description: 'ダイビングをテーマにした海洋ミステリー。高田馬場・大塚店限定。',
    author: 'クインズワルツ',
    duration: 360, // 6時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 5.0,
    playCount: 15,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '27',
    title: 'モノクローム',
    description: 'メイン・サブGM制の複雑な作品。高田馬場・大塚店限定。',
    author: 'クインズワルツ',
    duration: 360, // 6時間
    playerCount: { min: 4, max: 4 },
    difficulty: 5,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 5.0,
    playCount: 25,
    status: 'available',
    requiredProps: ['Keynoteあり', 'ハッシュタグ案内あり', '2GM制'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '28',
    title: 'この闇をあなたと',
    description: '感動的なラブストーリー要素のあるミステリー。高田馬場・大塚推奨。',
    author: 'クインズワルツ',
    duration: 360, // 6時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 30,
    status: 'available',
    requiredProps: ['Keynoteあり'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '29',
    title: 'GM殺人事件',
    description: 'GM自身が被害者になる特殊なメタミステリー。',
    author: 'クインズワルツ',
    duration: 300, // 5時間
    playerCount: { min: 3, max: 3 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 22,
    status: 'available',
    requiredProps: ['Keynoteあり', '各GMキット有り'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '30',
    title: 'あるマーダーミステリーについて',
    description: 'マーダーミステリー自体をテーマにしたメタ作品。',
    author: 'クインズワルツ',
    duration: 300, // 5時間
    playerCount: { min: 3, max: 3 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.0,
    playCount: 20,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '31',
    title: '流年',
    description: '時の流れをテーマにした壮大なミステリー。長い年月をかけて紡がれる物語。',
    author: 'クインズワルツ',
    duration: 300, // 5時間
    playerCount: { min: 5, max: 6 },
    difficulty: 5,
    availableGMs: ['松井（まつい）', 'れいにー', 'みずき', 'りえぞー', 'えりん'],
    rating: 5.0,
    playCount: 15,
    status: 'available',
    requiredProps: ['年表', '時代衣装', '長編演出セット'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '32',
    title: '黒い森の獣part1',
    description: '人狼ゲーム要素を取り入れた推理シナリオ。疑心暗鬼の中で真実を見つけ出せ。',
    author: 'クインズワルツ',
    duration: 300, // 5時間
    playerCount: { min: 4, max: 5 },
    difficulty: 4,
    availableGMs: ['松井（まつい）', 'れいにー'],
    rating: 4.5,
    playCount: 25,
    status: 'available',
    requiredProps: ['森の背景', '獣の鳴き声', '投票箱'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '33',
    title: 'エンドロールは流れない',
    description: '映画をテーマにしたメタ的な作品。',
    author: 'クインズワルツ',
    duration: 240, // 4時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 28,
    status: 'available',
    requiredProps: ['Keynoteあり', '2キット'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '34',
    title: '超特急の呪いの館で撮れ高足りてますか？',
    description: 'コメディ要素満載の軽快なホラーミステリー。笑いと驚きが詰まった楽しいシナリオ。',
    author: 'クインズワルツ',
    duration: 540, // 9時間
    playerCount: { min: 3, max: 4 },
    difficulty: 2,
    availableGMs: ['きゅう', 'ソラ', 'ほがらか'],
    rating: 5.0,
    playCount: 45,
    status: 'available',
    requiredProps: ['館の模型', 'カメラ小道具', 'コメディ演出セット'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '35',
    title: '妖怪たちと月夜の刀',
    description: '妖怪たちが織りなす幻想的な和風ホラー。月明かりの下で繰り広げられる超自然的な謎。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 4, max: 4 },
    difficulty: 3,
    availableGMs: ['きゅう', '松井（まつい）', 'ぽんちゃん'],
    rating: 4.0,
    playCount: 32,
    status: 'available',
    requiredProps: ['和室セット', '刀レプリカ', '月光演出'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '36',
    title: 'ゲームマスター殺人事件',
    description: 'ゲーム内でGMが殺される衝撃の展開。メタ要素満載の革新的シナリオ。',
    author: 'クインズワルツ',
    duration: 480, // 8時間
    playerCount: { min: 5, max: 7 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう', 'Remia（れみあ）', 'ぽんちゃん'],
    rating: 4.9,
    playCount: 15,
    status: 'available',
    requiredProps: ['GM席', 'メタ演出道具', '衝撃演出セット'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  },
  {
    id: '37',
    title: '漣の向こう側',
    description: '水をテーマにした幻想的なミステリー。波紋のように広がる謎と真実。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 3, max: 3 },
    difficulty: 3,
    availableGMs: ['つばめ', 'Remia（れみあ）', 'しらやま', 'えりん'],
    rating: 4.5,
    playCount: 26,
    status: 'available',
    requiredProps: ['水の演出', '波紋エフェクト', '幻想装飾'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '38',
    title: '月光の偽桜',
    description: '桜をモチーフにした美しく切ないミステリー。月明かりの下で咲く偽りの桜の真実。',
    author: 'クインズワ���ツ',
    duration: 420, // 7時間
    playerCount: { min: 3, max: 4 },
    difficulty: 3,
    availableGMs: ['ソラ', 'つばめ', 'Remia（れみあ）', 'しらやま'],
    rating: 4.5,
    playCount: 18,
    status: 'available',
    requiredProps: ['桜の装飾', '月光演出', '季節感演出'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '39',
    title: 'ENIGMACODE廃棄ミライの犠牲者たち',
    description: 'サイバーパンクな未来世界でのハイテクミステリー。暗号と陰謀に満ちた近未来。',
    author: 'クインズワルツ',
    duration: 420, // 7時間
    playerCount: { min: 4, max: 4 },
    difficulty: 4,
    availableGMs: ['ソラ', 'きゅう'],
    rating: 4.5,
    playCount: 9,
    status: 'available',
    requiredProps: ['未来装飾', 'ハイテク小道具', 'サイバー演出'],
    genre: ['ミステリー'],
    hasPreReading: true,
    licenseAmount: 2500
  },
  {
    id: '40',
    title: '赤鬼が泣いた夜',
    description: '日本の昔話をモチーフにした感動的なシナリオ。鬼と人間の心温まる交流。',
    author: 'クインズワルツ',
    duration: 300, // 5時間
    playerCount: { min: 3, max: 3 },
    difficulty: 2,
    availableGMs: ['つばめ', 'しらやま'],
    rating: 4.5,
    playCount: 33,
    status: 'available',
    requiredProps: ['鬼の面', '和風背景', '感動演出セット'],
    genre: ['ミステリー'],
    hasPreReading: false,
    licenseAmount: 2500
  }*/
];

interface ScenarioContextType {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  addScenario: (scenario: Scenario) => Promise<{ data: Scenario | null; error: string | null }>;
  updateScenario: (scenario: Scenario) => Promise<{ data: Scenario | null; error: string | null }>;
  updateScenarios: (scenarios: Scenario[]) => void;
  removeScenario: (id: string) => Promise<{ error: string | null }>;
  getAvailableScenarios: () => Scenario[];
  refetch: () => Promise<void>;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  // Supabase連携
  const {
    data: supabaseScenarios,
    loading,
    error,
    insert,
    update,
    delete: deleteScenario,
    refetch
  } = useSupabaseData<Scenario>({
    table: 'scenarios',
    realtime: true,
    // fallbackKey: 'murder-mystery-scenarios', // ローカルストレージを無効化
    orderBy: { column: 'title', ascending: true }
  });

  // 安全なSupabaseデータ処理とデータ変換（useMemoで最適化）
  const scenarios = useMemo(() => {
    return Array.isArray(supabaseScenarios) 
      ? supabaseScenarios.map((scenario: any) => {
          // 安全なデータ変換
          const safeScenario = {
            id: scenario.id || '',
            title: scenario.title || '',
            description: scenario.description || '',
            author: scenario.author || '',
            duration: scenario.duration || 180,
            difficulty: scenario.difficulty || 1,
            rating: scenario.rating || 0,
            status: scenario.status || 'available',
            notes: scenario.notes || '',
            // Supabaseの構造をローカル構造に変換
            playerCount: {
              min: scenario.player_count_min || 1,
              max: scenario.player_count_max || 1
            },
            // 配列フィールドの安全な変換（スネークケース統一）
            availableGMs: Array.isArray(scenario.available_gms) ? scenario.available_gms : [],
            requiredProps: Array.isArray(scenario.required_props) ? scenario.required_props : [],
            genre: Array.isArray(scenario.genre) ? scenario.genre : [],
            // その他のフィールドマッピング（スネークケース統一）
            hasPreReading: scenario.has_pre_reading || false,
            licenseAmount: scenario.license_amount || 2500,
            playCount: scenario.play_count || 0,
            releaseDate: scenario.release_date || undefined,
            productionCost: scenario.production_cost || 0,
            revenue: scenario.revenue || 0,
            gmFee: scenario.gm_fee || 0,
            miscellaneousExpenses: scenario.miscellaneous_expenses || 0,
            licenseRateOverride: scenario.license_rate_override || 0,
            participationFee: scenario.participation_fee || 0
          };
          return safeScenario;
        })
      : [];
  }, [supabaseScenarios]);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInitialSync, setHasInitialSync] = useState(false);

  // 初期化処理
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 初期化後にスタッフとの同期を行う（バッチ処理・重複実行防止）
  useEffect(() => {
    let isMounted = true;
    
    if (isInitialized && !hasInitialSync && staffBatchSyncFunction && scenarios.length > 0 && isMounted) {
      // console.log('初期化時のシナリオ-スタッフ同期を実行中...', scenarios.length, 'シナリオを処理');
      
      // 少し遅延を入れてStaffContextの初期化を待つ
      const timer = setTimeout(() => {
        if (isMounted) {
          // バッチ処理用のマップを作成
          const scenarioGMMap: { [scenarioTitle: string]: string[] } = {};
          
          scenarios.forEach(scenario => {
            const availableGMs = scenario.availableGMs || [];
            if (availableGMs.length > 0) {
              scenarioGMMap[scenario.title] = availableGMs;
            }
          });
          
          // バッチで一括同期
          staffBatchSyncFunction(scenarioGMMap);
          setHasInitialSync(true);
        }
      }, 100);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [isInitialized, hasInitialSync, scenarios]);

  // データ永続化 - scenarios が変更されるたびに localStorage に保存
  useEffect(() => {
    if (scenarios.length > 0) {
      try {
        localStorage.setItem('murder-mystery-scenarios', JSON.stringify(scenarios));
        // 成功時にバックアップも作成
        const timestamp = new Date().toISOString();
        localStorage.setItem(`murder-mystery-scenarios_backup_${timestamp}`, JSON.stringify(scenarios));
        
        // 古いバックアップを削除（最新5個まで保持）
        const backupKeys = Object.keys(localStorage)
          .filter(key => key.startsWith('murder-mystery-scenarios_backup_'))
          .sort((a, b) => b.localeCompare(a))
          .slice(5);
        backupKeys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('シナリオデータの保存に失敗しました:', error);
      }
    }
  }, [scenarios]);

  const getAvailableScenarios = useCallback(() => {
    return scenarios.filter(scenario => scenario.status === 'available');
  }, [scenarios]);

  // 作者名の表記揺れチェック
  const checkAuthorNameVariations = useCallback((inputAuthor: string) => {
    if (!Array.isArray(scenarios)) return null;
    
    const existingAuthors = scenarios.map(s => s.author).filter(Boolean);
    const normalizedInput = inputAuthor.trim().toLowerCase();
    
    // 完全一致チェック
    const exactMatch = existingAuthors.find(author => 
      author.toLowerCase() === normalizedInput
    );
    if (exactMatch) return { type: 'exact', author: exactMatch };
    
    // 表記揺れチェック（簡易版）
    const variations = existingAuthors.filter(author => {
      const normalized = author.toLowerCase();
      // スペースの有無、記号の違いなどを考慮
      const cleanInput = normalizedInput.replace(/[^\w]/g, '');
      const cleanAuthor = normalized.replace(/[^\w]/g, '');
      return cleanInput === cleanAuthor && cleanInput.length > 2;
    });
    
    if (variations.length > 0) {
      return { type: 'variation', authors: variations };
    }
    
    return null;
  }, [scenarios]);

  const addScenario = useCallback(async (scenario: Scenario) => {
    try {
      // 作者名の表記揺れチェック
      const authorCheck = checkAuthorNameVariations(scenario.author);
      if (authorCheck) {
        if (authorCheck.type === 'exact') {
          throw new Error(`作者名「${authorCheck.author}」は既に登録されています。`);
        } else if (authorCheck.type === 'variation') {
          throw new Error(`類似の作者名が見つかりました: ${authorCheck.authors.join(', ')}。表記を統一してください。`);
        }
      }

      // ローカル構造をSupabase構造に変換（スネークケース統一）
      const supabaseScenario = {
        title: scenario.title,
        description: scenario.description,
        author: scenario.author,
        license_amount: scenario.licenseAmount,
        duration: scenario.duration,
        player_count_min: scenario.playerCount.min,
        player_count_max: scenario.playerCount.max,
        difficulty: scenario.difficulty,
        available_gms: scenario.availableGMs || [],
        rating: scenario.rating,
        play_count: scenario.playCount,
        status: scenario.status,
        required_props: scenario.requiredProps || [],
        genre: scenario.genre || [],
        notes: scenario.notes,
        has_pre_reading: scenario.hasPreReading,
        release_date: scenario.releaseDate,
        production_cost: scenario.productionCost || 0,
        revenue: scenario.revenue || 0,
        gm_fee: scenario.gmFee || 0,
        miscellaneous_expenses: scenario.miscellaneousExpenses || 0,
        license_rate_override: scenario.licenseRateOverride || 0,
        participation_fee: scenario.participationFee || 0
      };
      
      const result = await insert(supabaseScenario as any);
      console.log('シナリオをSupabaseに追加しました:', scenario.title);
      
      // スタッフとの連携: 新規シナリオの対応GMにシナリオを追加
      if (staffUpdateFunction) {
        const availableGMs = scenario.availableGMs || [];
        if (availableGMs.length > 0) {
          availableGMs.forEach(gmName => {
            staffUpdateFunction!(gmName, scenario.title, 'add');
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('シナリオ追加エラー:', error);
      return { data: null, error: error instanceof Error ? error.message : 'シナリオ追加に失敗しました' };
    }
  }, [insert, checkAuthorNameVariations]);

  const updateScenario = useCallback(async (scenario: Scenario) => {
    try {
      // ローカル構造をSupabase構造に変換（スネークケース統一）
      const supabaseScenario = {
        title: scenario.title,
        description: scenario.description,
        author: scenario.author,
        license_amount: scenario.licenseAmount,
        duration: scenario.duration,
        player_count_min: scenario.playerCount.min,
        player_count_max: scenario.playerCount.max,
        difficulty: scenario.difficulty,
        available_gms: scenario.availableGMs || [],
        rating: scenario.rating,
        play_count: scenario.playCount,
        status: scenario.status,
        required_props: scenario.requiredProps || [],
        genre: scenario.genre || [],
        notes: scenario.notes,
        has_pre_reading: scenario.hasPreReading,
        release_date: scenario.releaseDate,
        production_cost: scenario.productionCost || 0,
        revenue: scenario.revenue || 0,
        gm_fee: scenario.gmFee || 0,
        miscellaneous_expenses: scenario.miscellaneousExpenses || 0,
        license_rate_override: scenario.licenseRateOverride || 0,
        participation_fee: scenario.participationFee || 0
      };
      
      const result = await update(scenario.id, supabaseScenario as any);
      console.log('シナリオをSupabaseで更新しました:', scenario.title);
      
      // スタッフとの連携: 対応GMが変更された場合
      const oldScenario = scenarios.find(s => s.id === scenario.id);
      if (oldScenario && staffUpdateFunction) {
        // Null チェックとデフォルト値を追加
        const oldAvailableGMs = oldScenario.availableGMs || [];
        const newAvailableGMs = scenario.availableGMs || [];
        
        // 追加されたGM
        const addedGMs = newAvailableGMs.filter(gm => !oldAvailableGMs.includes(gm));
        // 削除されたGM
        const removedGMs = oldAvailableGMs.filter(gm => !newAvailableGMs.includes(gm));
        
        // 追加されたGMにシナリオを追加
        addedGMs.forEach(gmName => {
          staffUpdateFunction!(gmName, scenario.title, 'add');
        });
        
        // 削除されたGMからシナリオを削除
        removedGMs.forEach(gmName => {
          staffUpdateFunction!(gmName, scenario.title, 'remove');
        });
      }
      
      return result;
    } catch (error) {
      console.error('シナリオ更新エラー:', error);
      return { data: null, error: error instanceof Error ? error.message : 'シナリオ更新に失敗しました' };
    }
  }, [update, scenarios]);

  const updateScenarios = useCallback((scenarios: Scenario[]) => {
    // この関数は後方互換性のために残しますが、通常は使用しません
    console.warn('updateScenarios is deprecated. Use individual operations instead.');
  }, []);

  const removeScenario = useCallback(async (id: string) => {
    try {
      const result = await deleteScenario(id);
      console.log('シナリオをSupabaseから削除しました:', id);
      return result;
    } catch (error) {
      console.error('シナリオ削除エラー:', error);
      return { error: error instanceof Error ? error.message : 'シナリオ削除に失敗しました' };
    }
  }, [deleteScenario]);

  return (
    <ScenarioContext.Provider value={{ 
      scenarios, 
      loading, 
      error, 
      addScenario, 
      updateScenario, 
      updateScenarios, 
      removeScenario, 
      getAvailableScenarios,
      refetch
    }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenarios() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenarios must be used within a ScenarioProvider');
  }
  return context;
}