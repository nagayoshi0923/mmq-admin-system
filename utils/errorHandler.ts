import { toast } from 'sonner';

// エラーの種類を定義
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  BUSINESS = 'business',
  UNKNOWN = 'unknown'
}

// エラーの重要度を定義
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 統一されたエラー情報の型
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  context?: Record<string, any>;
  originalError?: Error;
  timestamp: Date;
  component?: string;
  action?: string;
}

// エラーログの型
export interface ErrorLog extends AppError {
  id: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

class ErrorHandler {
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100; // メモリ使用量制限

  /**
   * エラーを処理し、適切な通知を表示
   */
  handle(error: AppError): void {
    // エラーログに記録
    this.logError(error);

    // ユーザーへの通知
    this.notifyUser(error);

    // 開発環境でのコンソール出力
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.type.toUpperCase()} Error`);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Context:', error.context);
      console.error('Original Error:', error.originalError);
      console.groupEnd();
    }

    // 重要なエラーの場合は追加処理
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(error);
    }
  }

  /**
   * 一般的なエラーから AppError を作成
   */
  createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    userMessage: string,
    context?: Record<string, any>,
    originalError?: Error,
    component?: string,
    action?: string
  ): AppError {
    return {
      type,
      severity,
      message,
      userMessage,
      context,
      originalError,
      timestamp: new Date(),
      component,
      action
    };
  }

  /**
   * 一般的なJavaScriptエラーを AppError に変換
   */
  fromError(
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    context?: Record<string, any>,
    component?: string,
    action?: string
  ): AppError {
    return this.createError(
      type,
      severity,
      error.message,
      userMessage || this.getDefaultUserMessage(type),
      { ...context, stack: error.stack },
      error,
      component,
      action
    );
  }

  /**
   * バリデーションエラーを作成
   */
  validation(
    field: string,
    value: any,
    rule: string,
    component?: string
  ): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      `Validation failed for ${field}: ${rule}`,
      `${field}の入力値が正しくありません`,
      { field, value, rule },
      undefined,
      component,
      'validation'
    );
  }

  /**
   * ネットワークエラーを作成
   */
  network(
    url: string,
    method: string,
    status?: number,
    response?: any,
    component?: string
  ): AppError {
    return this.createError(
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      `Network error: ${method} ${url} ${status ? `(${status})` : ''}`,
      'ネットワークエラーが発生しました。しばらく後でお試しください。',
      { url, method, status, response },
      undefined,
      component,
      'network_request'
    );
  }

  /**
   * ストレージエラーを作成
   */
  storage(
    operation: 'read' | 'write' | 'delete',
    key: string,
    originalError?: Error,
    component?: string
  ): AppError {
    return this.createError(
      ErrorType.STORAGE,
      ErrorSeverity.MEDIUM,
      `Storage ${operation} failed for key: ${key}`,
      'データの保存に失敗しました。ブラウザの設定をご確認ください。',
      { operation, key },
      originalError,
      component,
      'storage_operation'
    );
  }

  /**
   * 権限エラーを作成
   */
  permission(
    resource: string,
    action: string,
    component?: string
  ): AppError {
    return this.createError(
      ErrorType.PERMISSION,
      ErrorSeverity.HIGH,
      `Permission denied: ${action} on ${resource}`,
      'この操作を実行する権限がありません。',
      { resource, action },
      undefined,
      component,
      'permission_check'
    );
  }

  /**
   * ビジネスロジックエラーを作成
   */
  business(
    rule: string,
    details: string,
    userMessage: string,
    component?: string,
    context?: Record<string, any>
  ): AppError {
    return this.createError(
      ErrorType.BUSINESS,
      ErrorSeverity.MEDIUM,
      `Business rule violation: ${rule} - ${details}`,
      userMessage,
      context,
      undefined,
      component,
      'business_rule'
    );
  }

  /**
   * エラーログを取得
   */
  getLogs(filter?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    component?: string;
    since?: Date;
  }): ErrorLog[] {
    let logs = [...this.errorLogs];

    if (filter) {
      if (filter.type) {
        logs = logs.filter(log => log.type === filter.type);
      }
      if (filter.severity) {
        logs = logs.filter(log => log.severity === filter.severity);
      }
      if (filter.component) {
        logs = logs.filter(log => log.component === filter.component);
      }
      if (filter.since) {
        logs = logs.filter(log => log.timestamp >= filter.since!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * エラーログをクリア
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  /**
   * エラー統計を取得
   */
  getStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    byComponent: Record<string, number>;
  } {
    const stats = {
      total: this.errorLogs.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byComponent: {} as Record<string, number>
    };

    // 初期化
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // 集計
    this.errorLogs.forEach(log => {
      stats.byType[log.type]++;
      stats.bySeverity[log.severity]++;
      if (log.component) {
        stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
      }
    });

    return stats;
  }

  private logError(error: AppError): void {
    const errorLog: ErrorLog = {
      ...error,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLogs.push(errorLog);

    // ログ数制限
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs);
    }

    // LocalStorageに保存（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      try {
        const recentLogs = this.errorLogs.slice(-20); // 最新20件のみ保存
        localStorage.setItem('app-error-logs', JSON.stringify(recentLogs));
      } catch (e) {
        // LocalStorage保存失敗は無視
      }
    }
  }

  private notifyUser(error: AppError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        toast.info(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, toastOptions);
        break;
    }
  }

  private handleCriticalError(error: AppError): void {
    // 重要なエラーの場合の追加処理
    // 例: 外部サービスへの通知、自動リロード、フォールバック処理など
    console.error('🚨 CRITICAL ERROR:', error);
    
    // 必要に応じて自動リロードやフォールバック処理を実装
    if (error.type === ErrorType.STORAGE && error.context?.operation === 'read') {
      // ストレージ読み込みエラーの場合、デフォルト値で継続
      toast.error('データの読み込みに失敗しました。デフォルト設定で継続します。', {
        duration: 10000
      });
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.VALIDATION]: '入力内容をご確認ください',
      [ErrorType.NETWORK]: 'ネットワークエラーが発生しました',
      [ErrorType.STORAGE]: 'データの保存に失敗しました',
      [ErrorType.PERMISSION]: '権限がありません',
      [ErrorType.BUSINESS]: '処理を完了できませんでした',
      [ErrorType.UNKNOWN]: '予期しないエラーが発生しました'
    };
    return messages[type];
  }

  private getToastDuration(severity: ErrorSeverity): number {
    const durations = {
      [ErrorSeverity.LOW]: 3000,
      [ErrorSeverity.MEDIUM]: 5000,
      [ErrorSeverity.HIGH]: 8000,
      [ErrorSeverity.CRITICAL]: 10000
    };
    return durations[severity];
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // 実際のアプリケーションではユーザーIDを取得
    return 'anonymous';
  }

  private getSessionId(): string {
    // セッションIDを取得または生成
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  }
}

// シングルトンインスタンス
export const errorHandler = new ErrorHandler();

// React Error Boundary用のエラーハンドラー
export const handleReactError = (error: Error, errorInfo: { componentStack: string }) => {
  const appError = errorHandler.fromError(
    error,
    ErrorType.UNKNOWN,
    ErrorSeverity.HIGH,
    'アプリケーションエラーが発生しました。ページを再読み込みしてください。',
    { componentStack: errorInfo.componentStack },
    'React',
    'render'
  );
  
  errorHandler.handle(appError);
};

// グローバルエラーハンドラーの設定
export const setupGlobalErrorHandlers = () => {
  // 未処理のエラー
  window.addEventListener('error', (event) => {
    const appError = errorHandler.fromError(
      event.error || new Error(event.message),
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      '予期しないエラーが発生しました',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      },
      'Global',
      'unhandled_error'
    );
    
    errorHandler.handle(appError);
  });

  // 未処理のPromise拒否
  window.addEventListener('unhandledrejection', (event) => {
    const appError = errorHandler.fromError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      '非同期処理でエラーが発生しました',
      { reason: event.reason },
      'Global',
      'unhandled_promise_rejection'
    );
    
    errorHandler.handle(appError);
  });
};

// 便利な関数をエクスポート
export const handleError = (error: AppError) => errorHandler.handle(error);
export const createError = errorHandler.createError.bind(errorHandler);
export const fromError = errorHandler.fromError.bind(errorHandler);
export const validationError = errorHandler.validation.bind(errorHandler);
export const networkError = errorHandler.network.bind(errorHandler);
export const storageError = errorHandler.storage.bind(errorHandler);
export const permissionError = errorHandler.permission.bind(errorHandler);
export const businessError = errorHandler.business.bind(errorHandler);
