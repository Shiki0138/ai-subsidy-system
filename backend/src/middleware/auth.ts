import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '認証トークンが必要です'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: 'user' // デフォルトロール
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'トークンが無効です'
    });
  }
};

// 開発環境用の簡易認証（本番では削除）
export const devAuthBypass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境では固定ユーザーを使用
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'user'
    };
    return next();
  }
  
  return authenticateToken(req, res, next);
};