/**
 * 型安全性を向上させる型ガード関数集
 * ランタイムでの型チェックとTypeScriptの型推論を組み合わせ
 */

// =============================================================================
// 基本的な型ガード
// =============================================================================

/**
 * 値がnullまたはundefinedでないことを確認
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 値が文字列で、空でないことを確認
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 値が数値で、有限であることを確認
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * 値が配列であることを確認
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 値がオブジェクトで、nullでないことを確認
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 値が日付オブジェクトで、有効であることを確認
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// =============================================================================
// アプリケーション固有の型ガード
// =============================================================================

/**
 * Staff型の型ガード
 */
export interface StaffTypeGuard {
  id: string;
  name: string;
  role: string[];
  stores: string[];
  contact: {
    phone: string;
    email: string;
  };
  availableScenarios: string[];
  joinDate: string;
  status: 'active' | 'inactive' | 'on_leave';
}

export function isValidStaff(value: unknown): value is StaffTypeGuard {
  if (!isObject(value)) return false;
  
  const staff = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(staff.id) &&
    isNonEmptyString(staff.name) &&
    isArray(staff.role) &&
    staff.role.every(r => isNonEmptyString(r)) &&
    isArray(staff.stores) &&
    staff.stores.every(s => isNonEmptyString(s)) &&
    isObject(staff.contact) &&
    isNonEmptyString((staff.contact as any).phone) &&
    isNonEmptyString((staff.contact as any).email) &&
    isArray(staff.availableScenarios) &&
    staff.availableScenarios.every(s => isNonEmptyString(s)) &&
    isNonEmptyString(staff.joinDate) &&
    (staff.status === 'active' || staff.status === 'inactive' || staff.status === 'on_leave')
  );
}

/**
 * Scenario型の型ガード
 */
export interface ScenarioTypeGuard {
  id: string;
  title: string;
  author: string;
  players: number;
  duration: number;
  difficulty: number;
  genre: string;
  description: string;
  requiredItems: string[];
  notes: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export function isValidScenario(value: unknown): value is ScenarioTypeGuard {
  if (!isObject(value)) return false;
  
  const scenario = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(scenario.id) &&
    isNonEmptyString(scenario.title) &&
    isNonEmptyString(scenario.author) &&
    isValidNumber(scenario.players) &&
    scenario.players > 0 &&
    isValidNumber(scenario.duration) &&
    scenario.duration > 0 &&
    isValidNumber(scenario.difficulty) &&
    scenario.difficulty >= 1 && scenario.difficulty <= 5 &&
    isNonEmptyString(scenario.genre) &&
    typeof scenario.description === 'string' &&
    isArray(scenario.requiredItems) &&
    scenario.requiredItems.every(item => isNonEmptyString(item)) &&
    typeof scenario.notes === 'string' &&
    (scenario.status === 'active' || scenario.status === 'inactive' || scenario.status === 'maintenance') &&
    isNonEmptyString(scenario.createdAt) &&
    isNonEmptyString(scenario.updatedAt)
  );
}

/**
 * Store型の型ガード
 */
export interface StoreTypeGuard {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  capacity: number;
  rooms: number;
  color: string;
  kits: Array<{
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    quantity: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    lastChecked: string;
    notes: string;
  }>;
}

export function isValidStore(value: unknown): value is StoreTypeGuard {
  if (!isObject(value)) return false;
  
  const store = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(store.id) &&
    isNonEmptyString(store.name) &&
    isNonEmptyString(store.shortName) &&
    isNonEmptyString(store.address) &&
    isNonEmptyString(store.phone) &&
    isNonEmptyString(store.email) &&
    isNonEmptyString(store.manager) &&
    isValidNumber(store.capacity) &&
    store.capacity > 0 &&
    isValidNumber(store.rooms) &&
    store.rooms > 0 &&
    isNonEmptyString(store.color) &&
    isArray(store.kits) &&
    store.kits.every(kit => isValidKit(kit))
  );
}

function isValidKit(value: unknown): boolean {
  if (!isObject(value)) return false;
  
  const kit = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(kit.id) &&
    isNonEmptyString(kit.scenarioId) &&
    isNonEmptyString(kit.scenarioTitle) &&
    isValidNumber(kit.quantity) &&
    kit.quantity >= 0 &&
    (kit.condition === 'excellent' || kit.condition === 'good' || 
     kit.condition === 'fair' || kit.condition === 'poor') &&
    isNonEmptyString(kit.lastChecked) &&
    typeof kit.notes === 'string'
  );
}

// =============================================================================
// LocalStorage データの型ガード
// =============================================================================

/**
 * LocalStorageから取得したデータの型安全性を確保
 */
export function parseLocalStorageData<T>(
  key: string,
  validator: (value: unknown) => value is T,
  defaultValue: T
): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    const parsed = JSON.parse(item);
    
    if (validator(parsed)) {
      return parsed;
    } else {
      console.warn(`Invalid data format in localStorage for key: ${key}`);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Failed to parse localStorage data for key: ${key}`, error);
    return defaultValue;
  }
}

/**
 * 配列データの型ガード
 */
export function isValidArray<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is T[] {
  if (!isArray(value)) return false;
  return value.every(itemValidator);
}

// =============================================================================
// API レスポンスの型ガード
// =============================================================================

/**
 * API レスポンスの基本構造を確認
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function isValidApiResponse<T>(
  value: unknown,
  dataValidator?: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value)) return false;
  
  const response = value as Record<string, unknown>;
  
  const hasValidStructure = typeof response.success === 'boolean' &&
    (response.error === undefined || typeof response.error === 'string') &&
    (response.message === undefined || typeof response.message === 'string');
  
  if (!hasValidStructure) return false;
  
  // データの検証（提供されている場合）
  if (dataValidator && response.data !== undefined) {
    return dataValidator(response.data);
  }
  
  return true;
}

// =============================================================================
// フォームデータの型ガード
// =============================================================================

/**
 * フォーム入力値の型安全性を確保
 */
export function validateFormField<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  fieldName: string
): { isValid: true; value: T } | { isValid: false; error: string } {
  if (validator(value)) {
    return { isValid: true, value };
  } else {
    return { 
      isValid: false, 
      error: `Invalid value for field: ${fieldName}` 
    };
  }
}

/**
 * 必須フィールドの検証
 */
export function validateRequiredField(
  value: unknown,
  fieldName: string
): { isValid: true; value: string } | { isValid: false; error: string } {
  if (isNonEmptyString(value)) {
    return { isValid: true, value };
  } else {
    return { 
      isValid: false, 
      error: `${fieldName} is required and must be a non-empty string` 
    };
  }
}

/**
 * 数値フィールドの検証
 */
export function validateNumberField(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): { isValid: true; value: number } | { isValid: false; error: string } {
  if (!isValidNumber(value)) {
    return { 
      isValid: false, 
      error: `${fieldName} must be a valid number` 
    };
  }
  
  if (min !== undefined && value < min) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${min}` 
    };
  }
  
  if (max !== undefined && value > max) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at most ${max}` 
    };
  }
  
  return { isValid: true, value };
}

// =============================================================================
// 型変換ユーティリティ
// =============================================================================

/**
 * 安全な型変換
 */
export function safeParseInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function safeParseFloat(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function safeToString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * 配列の安全な取得
 */
export function safeGetArray<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T,
  defaultValue: T[] = []
): T[] {
  if (isValidArray(value, itemValidator)) {
    return value;
  }
  return defaultValue;
}

/**
 * オブジェクトプロパティの安全な取得
 */
export function safeGetProperty<T>(
  obj: unknown,
  key: string,
  validator: (value: unknown) => value is T,
  defaultValue: T
): T {
  if (isObject(obj) && key in obj) {
    const value = obj[key];
    if (validator(value)) {
      return value;
    }
  }
  return defaultValue;
}
