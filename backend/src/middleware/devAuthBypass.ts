/**
 * 開発用認証バイパスミドルウェア
 * 開発環境でのみ使用し、全てのリクエストに対してテストユーザーを自動設定
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import logger from '../config/logger';

// 開発用テストユーザー
const TEST_USER = {
  id: 'dev-user-001',
  email: 'dev@ai-subsidy.test',
  role: 'user',
  companyName: '開発テスト株式会社',
  userId: 'dev-user-001' // applications.tsとの互換性のため
};

/**
 * 開発環境でのみ動作する認証バイパス
 */
export function devAuthBypass(req: Request, res: Response, next: NextFunction): void {
  // 本番環境では絶対に使用しない
  if (process.env.NODE_ENV === 'production') {
    logger.error('開発用認証バイパスが本番環境で呼び出されました！');
    return res.status(500).json({ error: 'Security configuration error' });
  }

  // 開発環境でのみ実行
  if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true') {
    // AuthenticatedRequestにテストユーザー情報を設定
    (req as AuthenticatedRequest).user = TEST_USER;
    
    // ログ出力（1回だけ）
    if (!req.headers['x-auth-bypass-logged']) {
      logger.info('🔓 開発用認証バイパス有効 - テストユーザーで自動ログイン', {
        user: TEST_USER,
        path: req.path
      });
      req.headers['x-auth-bypass-logged'] = 'true';
    }
    
    return next();
  }

  // それ以外の場合は認証エラー
  res.status(401).json({ 
    error: 'Authentication required',
    message: '認証が必要です。開発環境ではDISABLE_AUTH=trueを設定してください。'
  });
}

/**
 * 条件付き認証ミドルウェア
 * 開発環境では認証をバイパス、本番環境では通常の認証を使用
 */
export function conditionalAuth(authMiddleware: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true') {
      return devAuthBypass(req, res, next);
    }
    return authMiddleware(req, res, next);
  };
}