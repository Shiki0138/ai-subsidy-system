/**
 * 開発環境用認証ミドルウェア
 * セッション無しでJWTのみでの認証をサポート
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

// リクエストオブジェクトにユーザー情報を追加
export interface DevAuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    companyName: string;
    userId: string;
  };
}

/**
 * 開発環境用JWT認証ミドルウェア（セッション無し）
 */
export async function devAuthenticate(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '認証トークンが必要です'
      });
    }
    
    // JWTトークン検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    
    // デコードされたトークンからユーザーIDを取得
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '無効なトークンです'
      });
    }
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        companyName: true,
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'ユーザーが見つかりません'
      });
    }
    
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'アカウントが無効化されています'
      });
    }
    
    // リクエストオブジェクトにユーザー情報を追加
    (req as DevAuthenticatedRequest).user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName || '',
    };
    
    logger.info('開発認証成功', {
      userId: user.id,
      email: user.email,
      endpoint: req.path
    });
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('無効なJWTトークン', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({
        success: false,
        error: '無効な認証トークンです'
      });
    } else {
      logger.error('認証エラー', error);
      return res.status(500).json({
        success: false,
        error: '認証処理中にエラーが発生しました'
      });
    }
  }
}

export default devAuthenticate;