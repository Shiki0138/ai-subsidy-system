/**
 * エラーハンドリングユーティリティ
 * 本番環境でのエラーを適切に処理
 */

import { IS_PRODUCTION } from '@/config/environment'
import toast from 'react-hot-toast'

// エラータイプ定義
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  API = 'API',
  UNKNOWN = 'UNKNOWN'
}

// エラークラス
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// エラーハンドリング関数
export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error in ${context || 'Unknown context'}:`, error)

  // AppErrorの場合はそのまま返す
  if (error instanceof AppError) {
    return error
  }

  // ネットワークエラー
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      'ネットワークエラーが発生しました。接続を確認してください。',
      ErrorType.NETWORK,
      'NETWORK_ERROR'
    )
  }

  // Supabaseエラー
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    
    // 認証エラー
    if (supabaseError.code?.includes('auth')) {
      return new AppError(
        'ログインが必要です',
        ErrorType.AUTH,
        supabaseError.code
      )
    }
    
    // その他のSupabaseエラー
    return new AppError(
      supabaseError.message || 'データベースエラーが発生しました',
      ErrorType.API,
      supabaseError.code
    )
  }

  // 一般的なErrorオブジェクト
  if (error instanceof Error) {
    return new AppError(
      IS_PRODUCTION ? 'エラーが発生しました' : error.message,
      ErrorType.UNKNOWN
    )
  }

  // 不明なエラー
  return new AppError(
    '予期せぬエラーが発生しました',
    ErrorType.UNKNOWN
  )
}

// ユーザー向けエラー表示
export function showError(error: AppError | string) {
  const message = typeof error === 'string' ? error : error.message
  
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
  })
}

// 成功メッセージ表示
export function showSuccess(message: string) {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  })
}

// API呼び出しのラッパー
export async function apiCall<T>(
  fn: () => Promise<T>,
  options?: {
    context?: string
    showErrorToast?: boolean
    fallbackValue?: T
  }
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const appError = handleError(error, options?.context)
    
    if (options?.showErrorToast !== false) {
      showError(appError)
    }
    
    return options?.fallbackValue ?? null
  }
}

// 再試行機能付きAPI呼び出し
export async function apiCallWithRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    retryDelay?: number
    context?: string
  }
): Promise<T | null> {
  const maxRetries = options?.maxRetries ?? 3
  const retryDelay = options?.retryDelay ?? 1000
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) {
        const appError = handleError(error, options?.context)
        showError(appError)
        return null
      }
      
      // 待機してリトライ
      await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
    }
  }
  
  return null
}