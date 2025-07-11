/**
 * API関連の型定義
 */

// 標準APIレスポンス
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    version?: string
    requestId?: string
  }
}

// ページネーション情報
export interface PaginationInfo {
  page: number
  perPage: number
  total: number
  totalPages: number
}

// ページネーション付きレスポンス
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationInfo
}

// APIエラーコード
export enum ApiErrorCode {
  // 認証関連
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // バリデーション
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // リソース関連
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // サーバーエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // レート制限
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // その他
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// APIレスポンスビルダー
export class ApiResponseBuilder {
  static success<T>(data: T, metadata?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }
  }
  
  static error(
    code: ApiErrorCode | string,
    message: string,
    details?: any
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  }
  
  static paginated<T>(
    data: T[],
    pagination: PaginationInfo
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  }
}