import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, RefreshCw, Calendar, User, Clock, CheckCircle, AlertTriangle, Wifi, WifiOff, Mail, Phone, CreditCard, Users, Search, Filter } from 'lucide-react';
import { EditHistoryEntry } from '../contexts/EditHistoryContext';


interface StoresReservation {
  // 基本情報
  '予約番号': string;
  '予約ページID': string;
  'タイトル': string;
  '申込日時': string;
  '希望の予約日時': string;
  'メニュー': string;
  'オプション': string;
  '担当スタッフ': string;
  '金額': number;
  
  // 顧客情報
  '予約者の氏名': string;
  '顧客番号': string;
  '顧客名': string;
  'メールアドレス': string;
  '電話番号': string;
  '会員番号': string;
  '誕生日': string;
  '性別': string;
  '郵便番号': string;
  '住所': string;
  '人数': number;
  
  // ステータス関連
  'ステータス': string;
  '来客日時': string;
  'キャンセル日時': string;
  '最終更新日時': string;
  
  // 追加情報
  'アンケート': string;
  '顧客メモ': string;
  '支払ステータス': string;
  '支払方法': string;
  '商品ID': string;
  '商品の購入日': string;
  '回数券の残回数': number;
  '商品の支払方法': string;
  '予約経路': string;
  '予約金額': number;
  'かんざしポイント利用料': number;
  'かんざし支払金額': number;
  '予約メモ': string;
  
  // 店舗情報
  'merchant-public-id': string;
  'merchant-display-name': string;
}

interface ApiStatus {
  connected: boolean;
  lastSync: string | null;
  nextSync: string | null;
  errorCount: number;
}

// モックデータ（実際のAPIレスポンスの構造を想定）
const mockReservations: StoresReservation[] = [
  {
    '予約番号': '50040298',
    '予約ページID': '523546',
    'タイトル': '【大塚店貸切予約枠】',
    '申込日時': '2025-05-26T17:20:00Z',
    '希望の予約日時': '2025-09-23T09:00:00Z',
    'メニュー': '',
    'オプション': '',
    '担当スタッフ': '',
    '金額': 0,
    
    // 顧客情報
    '予約者の氏名': '秋山 真琴',
    '顧客番号': '19640810',
    '顧客名': '秋山 真琴',
    'メールアドレス': 'unjyou@gmail.com',
    '電話番号': '8034442026',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-05-26T17:20:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'その他',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'その他',
    '予約経路': '',
    '予約金額': 0,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '50251196',
    '予約ページID': '810541',
    'タイトル': '【大久保店貸切予約枠】',
    '申込日時': '2025-08-30T16:30:00Z',
    '希望の予約日時': '2025-09-25T19:00:00Z',
    'メニュー': '',
    'オプション': '',
    '担当スタッフ': '',
    '金額': 0,
    
    // 顧客情報
    '予約者の氏名': 'GMテスト・箱開け会・その他企画',
    '顧客番号': '17677543',
    '顧客名': 'GMテスト・箱開け会・その他企画',
    'メールアドレス': '',
    '電話番号': '',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-08-30T16:30:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': 'ボドゲ、人狼も含む',
    '支払ステータス': '完了',
    '支払方法': 'その他',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'その他',
    '予約経路': '',
    '予約金額': 0,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '50444791',
    '予約ページID': '1601990',
    'タイトル': '【高田馬場仮設店】妖怪たちと月夜の刀（特別出張公演）',
    '申込日時': '2025-08-29T19:45:00Z',
    '希望の予約日時': '2025-09-19T14:30:00Z',
    'メニュー': '',
    'オプション': '',
    '担当スタッフ': '',
    '金額': 5500,
    
    // 顧客情報
    '予約者の氏名': '及川 睦久',
    '顧客番号': '4765241',
    '顧客名': '及川 睦久',
    'メールアドレス': 'magic111fire.ice@icloud.com',
    '電話番号': '9040186208',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-08-29T19:45:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 5500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '50721258',
    '予約ページID': '1947628',
    'タイトル': '【高田馬場店】ゲームマスター殺人事件（GM：りんな）',
    '申込日時': '2025-09-05T09:27:00Z',
    '希望の予約日時': '2025-09-05T14:00:00Z',
    'メニュー': '',
    'オプション': 'りんな',
    '担当スタッフ': 'りんな',
    '金額': 4000,
    
    // 顧客情報
    '予約者の氏名': '村上 統治',
    '顧客番号': '9824333',
    '顧客名': '村上 統治',
    'メールアドレス': 'the_ghostaddress@yahoo.co.jp',
    '電話番号': '9076238027',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '2025-09-05T13:56:00Z',
    'キャンセル日時': '',
    '最終更新日時': '2025-09-05T09:27:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 4000,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '50968041',
    '予約ページID': '1601990',
    'タイトル': '【高田馬場仮設店】妖怪たちと月夜の刀（特別出張公演）',
    '申込日時': '2025-08-29T18:01:00Z',
    '希望の予約日時': '2025-09-23T14:30:00Z',
    'メニュー': '',
    'オプション': '',
    '担当スタッフ': '',
    '金額': 5500,
    
    // 顧客情報
    '予約者の氏名': '佐畑 亜美',
    '顧客番号': '26574828',
    '顧客名': '佐畑 亜美',
    'メールアドレス': 'ami.s2001@icloud.com',
    '電話番号': '8050972487',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'cancelled',
    '来客日時': '',
    'キャンセル日時': '2025-08-29T19:52:00Z',
    '最終更新日時': '2025-08-29T19:52:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': 'キャンセル',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 5500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '51958237',
    '予約ページID': '439688',
    'タイトル': '【大久保店】黒い森の『獣』?汝が人殺しなりや？ Part1.',
    '申込日時': '2025-08-25T23:36:00Z',
    '希望の予約日時': '2025-09-03T12:30:00Z',
    'メニュー': '',
    'オプション': 'マツケン、れいにー',
    '担当スタッフ': 'マツケン、れいにー',
    '金額': 5000,
    
    // 顧客情報
    '予約者の氏名': '武居 聖樹',
    '顧客番号': '23044793',
    '顧客名': '武居 聖樹',
    'メールアドレス': 'engeofficial@yahoo.co.jp',
    '電話番号': '7036300124',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '2025-09-03T13:43:00Z',
    'キャンセル日時': '',
    '最終更新日時': '2025-08-25T23:36:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 5000,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '52160528',
    '予約ページID': '2810232',
    'タイトル': '【高田馬場仮設店】ツグミドリ',
    '申込日時': '2025-09-02T02:32:00Z',
    '希望の予約日時': '2025-09-07T09:00:00Z',
    'メニュー': '',
    'オプション': 'りえぞー、マツケン、りんな、ソラ',
    '担当スタッフ': 'りえぞー、マツケン、りんな、ソラ',
    '金額': 4500,
    
    // 顧客情報
    '予約者の氏名': '丸山 もえ',
    '顧客番号': '26970692',
    '顧客名': '丸山 もえ',
    'メールアドレス': 'brilliantblue66@gmail.com',
    '電話番号': '9059191350',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '2025-09-07T08:55:00Z',
    'キャンセル日時': '',
    '最終更新日時': '2025-09-02T02:32:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 4500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '52328169',
    '予約ページID': '4761153',
    'タイトル': '【埼玉大宮店】燔祭のジェミニ',
    '申込日時': '2025-08-16T22:42:00Z',
    '希望の予約日時': '2025-09-20T14:30:00Z',
    'メニュー': '',
    'オプション': '八継ジノ',
    '担当スタッフ': '八継ジノ',
    '金額': 4500,
    
    // 顧客情報
    '予約者の氏名': '北村 朱音',
    '顧客番号': '26999408',
    '顧客名': '北村 朱音',
    'メールアドレス': 'kuppalos@yahoo.co.jp',
    '電話番号': '8019520701',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-08-16T22:42:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 4500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '53365727',
    '予約ページID': '1601990',
    'タイトル': '【高田馬場仮設店】妖怪たちと月夜の刀（特別出張公演）',
    '申込日時': '2025-08-29T18:18:00Z',
    '希望の予約日時': '2025-09-23T14:30:00Z',
    'メニュー': '',
    'オプション': '',
    '担当スタッフ': '',
    '金額': 5500,
    
    // 顧客情報
    '予約者の氏名': '羽鳥 彩乃',
    '顧客番号': '22020539',
    '顧客名': '羽鳥 彩乃',
    'メールアドレス': 'hayachor17@gmail.com',
    '電話番号': '9051959986',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 2,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-08-29T18:18:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 11000,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '54842263',
    '予約ページID': '3153290',
    'タイトル': '【大塚店】 超特急の呪いの館で撮れ高足りてますか？',
    '申込日時': '2025-08-19T19:52:00Z',
    '希望の予約日時': '2025-09-26T19:00:00Z',
    'メニュー': '',
    'オプション': 'ソラ、キュウ',
    '担当スタッフ': 'ソラ、キュウ',
    '金額': 5000,
    
    // 顧客情報
    '予約者の氏名': '岩谷 亮兵',
    '顧客番号': '19756358',
    '顧客名': '岩谷 亮兵',
    'メールアドレス': 'copa_do_mundo_taca_do_mundo@docomo.ne.jp',
    '電話番号': '9071663784',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-09-09T19:01:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': 'おだくらさん、えんどうさん、まとのさんの男性3人組',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 4500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '54955216',
    '予約ページID': '4252490',
    'タイトル': '【大久保店】赤鬼が泣いた夜',
    '申込日時': '2025-09-01T20:59:00Z',
    '希望の予約日時': '2025-09-02T19:30:00Z',
    'メニュー': '',
    'オプション': 'つばめ',
    '担当スタッフ': 'つばめ',
    '金額': 4500,
    
    // 顧客情報
    '予約者の氏名': '大江 誠',
    '顧客番号': '4570744',
    '顧客名': '大江 誠',
    'メールアドレス': 'x27c5327e6jukx@t.vodafone.ne.jp',
    '電話番号': '9065144806',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '2025-09-02T19:22:00Z',
    'キャンセル日時': '',
    '最終更新日時': '2025-09-01T20:59:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 4500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '53973205',
    '予約ページID': '3153290',
    'タイトル': '【大塚店】 超特急の呪いの館で撮れ高足りてますか？',
    '申込日時': '2025-08-22T15:03:00Z',
    '希望の予約日時': '2025-09-26T19:00:00Z',
    'メニュー': '',
    'オプション': 'ソラ、キュウ',
    '担当スタッフ': 'ソラ、キュウ',
    '金額': 5000,
    
    // 顧客情報
    '予約者の氏名': '並木 里紗',
    '顧客番号': '25251127',
    '顧客名': '並木 里紗',
    'メールアドレス': 'kana.na0833@gmail.com',
    '電話番号': '8020610324',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-08-22T15:03:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': '',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 5000,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  },
  {
    '予約番号': '55386758',
    '予約ページID': '1076160',
    'タイトル': '【大久保店】漣の向こう側',
    '申込日時': '2025-09-02T23:25:00Z',
    '希望の予約日時': '2025-09-18T14:30:00Z',
    'メニュー': '',
    'オプション': 'つばめ',
    '担当スタッフ': 'つばめ',
    '金額': 4500,
    
    // 顧客情報
    '予約者の氏名': '藤田 豊',
    '顧客番号': '24353560',
    '顧客名': '藤田 豊',
    'メールアドレス': '09050960474@docomo.ne.jp',
    '電話番号': '9050960474',
    '会員番号': '',
    '誕生日': '',
    '性別': '',
    '郵便番号': '',
    '住所': '',
    '人数': 1,
    
    // ステータス関連
    'ステータス': 'confirmed',
    '来客日時': '',
    'キャンセル日時': '',
    '最終更新日時': '2025-09-02T23:25:00Z',
    
    // 追加情報
    'アンケート': '',
    '顧客メモ': 'youさん',
    '支払ステータス': '完了',
    '支払方法': 'ウェブページ',
    '商品ID': '',
    '商品の購入日': '',
    '回数券の残回数': 0,
    '商品の支払方法': 'ウェブページ',
    '予約経路': 'ウェブページ',
    '予約金額': 4500,
    'かんざしポイント利用料': 0,
    'かんざし支払金額': 0,
    '予約メモ': '',
    
    // 店舗情報
    'merchant-public-id': 'queens-waltz',
    'merchant-display-name': 'クインズワルツ'
  }
];

const statusColors = {
  'confirmed': 'bg-green-100 text-green-800',
  'pending': 'bg-yellow-100 text-yellow-800', 
  'cancelled': 'bg-red-100 text-red-800'
};

const statusLabels = {
  'confirmed': '確定',
  'pending': '保留中',
  'cancelled': 'キャンセル'
};

const paymentStatusColors = {
  '完了': 'bg-green-100 text-green-800',
  '未完了': 'bg-red-100 text-red-800',
  '処理中': 'bg-yellow-100 text-yellow-800',
  'キャンセル': 'bg-gray-100 text-gray-800'
};

export function ReservationManager() {
  const [reservations, setReservations] = useState<StoresReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('ec9d6266-c966-4254-8326-7b28229fd7af');
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    connected: false,
    lastSync: null,
    nextSync: null,
    errorCount: 0
  });
  const [autoSync, setAutoSync] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 編集履歴の状態
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([
    {
      id: '1',
      timestamp: '2025-01-09T16:30:00Z',
      user: 'システム',
      action: 'create',
      target: 'ストアーズ予約連携',
      summary: 'ストアーズ予約APIとの連携を開始しました',
      category: 'reservation',
      changes: [
        { field: 'API連携', newValue: '有効' },
        { field: '取得件数', newValue: '4件' }
      ]
    }
  ]);

  // 日付フィルタ用の状態
  const [targetDate, setTargetDate] = useState('2025-08-30');

  // フィルタリングされた予約データ
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = searchTerm === '' || 
      reservation.タイトル.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.顧客名.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.予約番号.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.ステータス === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ストアーズ予約APIから予約情報を取得する関数
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);

    try {
      // モックデータでシミュレート（実際のAPI接続はCORSの制限により現在無効）
      await new Promise(resolve => setTimeout(resolve, 1500)); // API呼び出しのシミュレート
      
      // 実際のAPI呼び出しはCORSの制限によりコメントアウト
      // const apiUrl = new URL('https://stores.jp/api/reservations');
      // if (targetDate) {
      //   apiUrl.searchParams.append('date', targetDate);
      //   apiUrl.searchParams.append('start_date', targetDate);
      //   apiUrl.searchParams.append('end_date', targetDate);
      // }
      // 
      // const response = await fetch(apiUrl.toString(), {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json',
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      // }
      // 
      // const data = await response.json();
      // const transformedData = Array.isArray(data) ? data : (data.data || data.reservations || []);
      
      // 現在はモックデータを使用
      const transformedData = mockReservations;
      
      setReservations(transformedData);
      setApiStatus(prev => ({
        ...prev,
        connected: false, // モックデータ使用のため false
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分後
        errorCount: 0
      }));

      // 編集履歴に追加
      const historyEntry: EditHistoryEntry = {
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'システム',
        action: 'update',
        target: 'ストアーズ予約データ',
        summary: `予約情報を更新しました（${transformedData.length}件取得）`,
        category: 'reservation',
        changes: [
          { field: '取得件数', newValue: `${transformedData.length}件` },
          { field: '最終更新', newValue: new Date().toLocaleString('ja-JP') },
          { field: 'データソース', newValue: 'モック（デモ用）' },
          { field: '対象日', newValue: targetDate }
        ]
      };

      setEditHistory(prev => [historyEntry, ...prev]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予約情報の取得に失敗しました';
      console.error('API接続エラー:', err);
      
      // フォールバック: モックデータを使用
      setReservations(mockReservations);
      setError(`API接続に失敗しました（CORS制限）。デモ用のモックデータを表示しています。`);
      setApiStatus(prev => ({
        ...prev,
        connected: false,
        errorCount: prev.errorCount + 1
      }));
      
      // モックデータ使用の履歴を追加
      const historyEntry: EditHistoryEntry = {
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'システム',
        action: 'update',
        target: 'ストアーズ予約データ（フォールバック）',
        summary: `API接続失敗によりモックデータを表示（${mockReservations.length}件）`,
        category: 'reservation',
        changes: [
          { field: 'エラー', newValue: 'CORS制限によりAPI接続不可' },
          { field: 'データソース', newValue: 'モック（デモ用）' }
        ]
      };

      setEditHistory(prev => [historyEntry, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  // 自動同期の設定
  useEffect(() => {
    if (autoSync && apiKey) {
      fetchReservations();
      const interval = setInterval(fetchReservations, 5 * 60 * 1000); // 5分ごと
      return () => clearInterval(interval);
    }
  }, [autoSync, apiKey]);

  // コンポーネント初期化時に予約情報を取得
  useEffect(() => {
    if (apiKey) {
      fetchReservations();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>ストアーズ予約管理</h2>
        <div className="flex gap-4 items-center">
          <Button 
            onClick={fetchReservations} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '取得中...' : 'デモデータ更新'}
          </Button>
        </div>
      </div>

      {/* API接続ステータス */}
      <Card className={`border-l-4 ${apiStatus.connected ? 'border-l-green-500' : 'border-l-orange-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {apiStatus.connected ? (
              <><Wifi className="w-5 h-5 text-green-500" />API接続状況: 正常</>
            ) : (
              <><WifiOff className="w-5 h-5 text-orange-500" />デモモード（モックデータ使用中）</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>💡 開発者向け情報:</strong> 
              実際のストアーズ予約APIとの接続はCORS（Cross-Origin Resource Sharing）制限により、
              ブラウザから直接アクセスできません。本番環境では以下の対応が必要です：
            </p>
            <ul className="text-xs text-orange-700 mt-2 ml-4 space-y-1">
              <li>• バックエンドサーバーでAPIプロキシを実装</li>
              <li>• ストアーズ予約側でCORS設定を許可</li>
              <li>• Next.js等のサーバーサイド機能を使用</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">最終同期</span>
              </div>
              <p className="text-sm font-medium">
                {apiStatus.lastSync ? new Date(apiStatus.lastSync).toLocaleString('ja-JP') : '未同期'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">データソース</span>
              </div>
              <p className="text-sm font-medium text-orange-600">
                モックデータ（デモ用）
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">API試行回数</span>
              </div>
              <p className="text-sm font-medium">
                {apiStatus.errorCount}回
                {apiStatus.errorCount > 0 && (
                  <span className="text-orange-500 ml-2">
                    <AlertTriangle className="w-3 h-3 inline" />
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API設定 */}
      <Card>
        <CardHeader>
          <CardTitle>API設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">ストアーズ予約 APIキー</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="APIキーを入力してください"
                  className="flex-1"
                />
                <Button 
                  onClick={() => setAutoSync(!autoSync)} 
                  variant={autoSync ? "default" : "outline"}
                  size="sm"
                >
                  {autoSync ? '自動同期: ON' : '自動同期: OFF'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                APIキーはストアーズ予約の管理画面から取得できます。現在はデモモードで動作中です。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">取得対象日（デモ用）</Label>
              <div className="flex gap-2">
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={fetchReservations}
                  disabled={loading}
                  size="sm"
                >
                  デモデータ取得
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                デモ用のモックデータを表示します（設定した日付は履歴に記録されます）
              </p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>



      {/* 検索・フィルタエリア */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="予約番号、タイトル、顧客名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="confirmed">確定</SelectItem>
                  <SelectItem value="pending">保留中</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                カード
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                テーブル
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* リアルタイム予約データ表示エリア */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                リアルタイム予約データ
                {reservations.length > 0 && (
                  <Badge variant="secondary">{reservations.length}件</Badge>
                )}
                {apiStatus.connected && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    同期中
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ストアーズ予約APIから取得した最新の予約情報です
              </p>
            </div>

          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>予約情報を取得中...</span>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>予約情報が見つかりませんでした</p>
              <p className="text-xs mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? '検索条件を変更してください' 
                  : 'APIキーを確認するか、手動で同期してください'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 取得データの概要 */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">取得データ概要</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">総予約数:</span>
                    <span className="font-medium ml-2">{reservations.length}件</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">確定予約:</span>
                    <span className="font-medium ml-2 text-green-600">
                      {reservations.filter(r => r.ステータス === 'confirmed').length}件
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">保留中:</span>
                    <span className="font-medium ml-2 text-yellow-600">
                      {reservations.filter(r => r.ステータス === 'pending').length}件
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">総売上:</span>
                    <span className="font-medium ml-2">
                      ¥{reservations.filter(r => r.ステータス === 'confirmed').reduce((sum, r) => sum + r.金額, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>対象日: {targetDate}</span>
                    <span>データソース: {apiStatus.connected ? '実API' : 'モック'}</span>
                    {apiStatus.lastSync && (
                      <span>最終取得: {new Date(apiStatus.lastSync).toLocaleTimeString('ja-JP')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 予約詳細テーブル */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>予約番号</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead>希望の予約日時</TableHead>
                    <TableHead>人数</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>顧客名</TableHead>
                    <TableHead>連絡先</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>支払方法</TableHead>
                    <TableHead>メモ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.予約番号}>
                      <TableCell>
                        <span className="font-medium">{reservation.予約番号}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{reservation.タイトル}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div>{new Date(reservation.希望の予約日時).toLocaleDateString('ja-JP')}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(reservation.希望の予約日時).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span>{reservation.人数}名</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[reservation.ステータス]}>
                          {statusLabels[reservation.ステータス]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{reservation.顧客名}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {reservation.メールアドレス && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs">{reservation.メールアドレス}</span>
                            </div>
                          )}
                          {reservation.電話番号 && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs">{reservation.電話番号}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">¥{reservation.金額.toLocaleString()}</span>
                          <Badge className={`ml-2 ${paymentStatusColors[reservation.支払ステータス]}`} variant="outline">
                            {reservation.支払ステータス}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{reservation.支払方法}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-xs">
                          {reservation.顧客メモ && (
                            <div className="text-xs text-blue-700 bg-blue-50 p-1 rounded">
                              {reservation.顧客メモ}
                            </div>
                          )}
                          {reservation.予約メモ && (
                            <div className="text-xs text-gray-700 bg-gray-50 p-1 rounded">
                              {reservation.予約メモ}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">総予約数</p>
                <p className="text-lg font-medium">{reservations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">確定予約</p>
                <p className="text-lg font-medium">
                  {reservations.filter(r => r.ステータス === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">保留中</p>
                <p className="text-lg font-medium">
                  {reservations.filter(r => r.ステータス === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">確定売上</p>
                <p className="text-lg font-medium">
                  ¥{reservations.filter(r => r.ステータス === 'confirmed').reduce((sum, r) => sum + r.金額, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}