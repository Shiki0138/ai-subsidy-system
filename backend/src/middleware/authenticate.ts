/**
 * 認証ミドルウェア
 * JWTトークンによるリクエスト認証
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, logger } from '../index';
import { AuthenticationError, AuthorizationError } from './errorHandler';

// リクエストオブジェクトにユーザー情報を追加
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    companyName: string;
    userId: string; // applications.tsとの互換性のため
  };
}

/**
 * JWT認証ミドルウェア
 */
export async function authenticate(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AuthenticationError('認証トークンが必要です');
    }
    
    // JWTトークン検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // セッション確認
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            companyName: true,
          }
        }
      }
    });
    
    if (!session || session.expiresAt < new Date()) {
      // 期限切れセッション削除
      if (session) {
        await prisma.userSession.delete({ where: { token } });
      }
      throw new AuthenticationError('セッションが期限切れです');
    }
    
    if (session.user.status !== 'ACTIVE') {
      throw new AuthenticationError('アカウントが無効化されています');
    }
    
    // リクエストオブジェクトにユーザー情報を追加
    (req as AuthenticatedRequest).user = {
      id: session.user.id,
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      companyName: session.user.companyName || '',
    };
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next(new AuthenticationError('無効な認証トークンです'));
    } else {
      next(error);
    }
  }
}

/**
 * 管理者権限チェックミドルウェア
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user;
  
  if (!user) {
    throw new AuthenticationError('認証が必要です');
  }
  
  if (user.role !== 'ADMIN') {
    logger.warn('Unauthorized admin access attempt', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      path: req.path
    });
    throw new AuthorizationError('管理者権限が必要です');
  }
  
  next();
}

/**
 * ユーザー権限チェック（自分のリソースのみアクセス可能）
 */
export function requireOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user;
  const targetUserId = req.params.userId || req.body.userId;
  
  if (!user) {
    throw new AuthenticationError('認証が必要です');
  }
  
  // 管理者は全リソースにアクセス可能
  if (user.role === 'ADMIN') {
    return next();
  }
  
  // 自分のリソースのみアクセス可能
  if (targetUserId && targetUserId !== user.id) {
    logger.warn('Unauthorized resource access attempt', {
      userId: user.id,
      targetUserId,
      ip: req.ip,
      path: req.path
    });
    throw new AuthorizationError('このリソースにアクセスする権限がありません');
  }
  
  next();
}

/**
 * オプショナル認証（認証されていなくてもOK）
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            companyName: true,
          }
        }
      }
    });
    
    if (session && session.expiresAt >= new Date() && session.user.status === 'ACTIVE') {
      (req as AuthenticatedRequest).user = {
        id: session.user.id,
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyName: session.user.companyName || '',
      };
    }
    
    next();
    
  } catch (error) {
    // 認証エラーでも処理を続行
    next();
  }
}

export default {
  authenticate,
  requireAdmin,
  requireOwnership,
  optionalAuthenticate
};