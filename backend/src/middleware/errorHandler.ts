/**
 * エラーハンドリングミドルウェア
 * セキュリティを考慮した統一的なエラー処理
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import winston from 'winston';

// エラーレスポンス型定義
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

// カスタムエラークラス
export class AppError extends Error {
  statusCode: number;
  code?: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// バリデーションエラークラス
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// 認証エラークラス
export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

// 認可エラークラス
export class AuthorizationError extends AppError {
  constructor(message: string = 'アクセス権限がありません') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

// リソース未発見エラークラス
export class NotFoundError extends AppError {
  constructor(resource: string = 'リソース') {
    super(`${resource}が見つかりません`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

// 競合エラークラス
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

// レート制限エラークラス
export class RateLimitError extends AppError {
  constructor(message: string = 'リクエスト制限に達しました') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * エラーメッセージのサニタイズ
 * 本番環境では機密情報を除去
 */
function sanitizeErrorMessage(error: Error): string {
  if (process.env.NODE_ENV === 'production') {
    // 本番環境では詳細なエラー情報を隠す
    if (error instanceof AppError && error.isOperational) {
      return error.message;
    }
    return 'サーバーエラーが発生しました';
  }
  return error.message;
}

/**
 * Prismaエラーの処理
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] || ['フィールド'];
      return new ConflictError(`${target.join(', ')}は既に使用されています`);
    
    case 'P2025':
      // Record not found
      return new NotFoundError('データ');
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('関連するデータが存在しません');
    
    case 'P2014':
      // Required relation violation
      return new ValidationError('必要な関連データが不足しています');
    
    default:
      return new AppError(
        process.env.NODE_ENV === 'production' 
          ? 'データベースエラーが発生しました'
          : error.message,
        500,
        'DATABASE_ERROR'
      );
  }
}

/**
 * Zodバリデーションエラーの処理
 */
function handleZodError(error: ZodError): ValidationError {
  const messages = error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  return new ValidationError(
    `入力データが不正です: ${messages.join(', ')}`,
    error.errors
  );
}

/**
 * メインエラーハンドラー
 */
export function errorHandler(logger: winston.Logger) {
  return (error: Error, req: Request, res: Response, next: NextFunction): void => {
    let appError: AppError;

    // エラータイプに応じた処理
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      appError = handlePrismaError(error);
    } else if (error instanceof ZodError) {
      appError = handleZodError(error);
    } else {
      // 予期しないエラー
      appError = new AppError(
        sanitizeErrorMessage(error),
        500,
        'INTERNAL_SERVER_ERROR',
        false
      );
    }

    // エラーログの記録
    const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
    logger.log(logLevel, 'API Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: appError.code,
        statusCode: appError.statusCode
      },
      request: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.get('user-agent'),
          'x-forwarded-for': req.get('x-forwarded-for')
        },
        body: req.method !== 'GET' ? req.body : undefined
      },
      user: (req as any).user?.id || 'anonymous'
    });

    // エラーレスポンスの作成
    const errorResponse: ErrorResponse = {
      error: {
        message: sanitizeErrorMessage(appError),
        code: appError.code,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.stack
        })
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: appError.statusCode
    };

    res.status(appError.statusCode).json(errorResponse);
  };
}

/**
 * 404エラーハンドラー
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    error: {
      message: 'リクエストされたリソースが見つかりません',
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode: 404
  };

  res.status(404).json(errorResponse);
}

/**
 * 非同期エラーハンドリングのヘルパー
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * エラー応答のヘルパー関数
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  message: string,
  code?: string
): void {
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code
    },
    timestamp: new Date().toISOString(),
    path: res.req.path,
    method: res.req.method,
    statusCode
  };

  res.status(statusCode).json(errorResponse);
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sendErrorResponse,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};