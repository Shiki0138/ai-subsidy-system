/**
 * 開発用認証ルート
 * 開発環境でのみ有効な簡易認証エンドポイント
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const router = express.Router();
const prisma = new PrismaClient();

// 開発環境チェックミドルウェア
const devOnlyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
};

// 全てのルートに開発環境チェックを適用
router.use(devOnlyMiddleware);

/**
 * GET /api/dev-auth/auto-login
 * 開発用自動ログイン（テストユーザーで即座にログイン）
 */
router.get('/auto-login', async (req, res) => {
  try {
    logger.info('🔓 開発用自動ログイン実行');

    // テストユーザーを取得または作成
    let user = await prisma.user.findUnique({
      where: { email: 'dev@ai-subsidy.test' }
    });

    if (!user) {
      // テストユーザーが存在しない場合は作成
      user = await prisma.user.create({
        data: {
          email: 'dev@ai-subsidy.test',
          passwordHash: 'hashed-password', // 実際には使用しない
          companyName: '開発テスト株式会社',
          representativeName: '開発 太郎',
          phone: '03-0000-0000',
          address: '東京都千代田区開発町1-1-1',
          businessType: 'ソフトウェア開発',
          employeeCount: 10,
          role: 'USER'
        }
      });
      logger.info('テストユーザーを作成しました');
    }

    // JWTトークンを生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' } // 開発用は7日間有効
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: '開発用自動ログイン成功',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('開発用自動ログインエラー:', error);
    res.status(500).json({ 
      error: 'Auto login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/dev-auth/current-user
 * 現在のユーザー情報を取得（認証不要）
 */
router.get('/current-user', async (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'dev-user-001',
      email: 'dev@ai-subsidy.test',
      companyName: '開発テスト株式会社',
      role: 'user'
    }
  });
});

/**
 * POST /api/dev-auth/quick-login
 * 開発用クイックログイン（メールアドレスのみで即ログイン）
 */
router.post('/quick-login', async (req, res) => {
  try {
    const { email = 'dev@ai-subsidy.test' } = req.body;

    // ユーザーを取得または作成
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const companyName = email.split('@')[0] + '株式会社';
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: 'hashed-password',
          companyName,
          representativeName: '開発者',
          phone: '00-0000-0000',
          address: '開発環境',
          businessType: '開発テスト',
          employeeCount: 1,
          role: 'USER'
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('クイックログインエラー:', error);
    res.status(500).json({ error: 'Quick login failed' });
  }
});

/**
 * DELETE /api/dev-auth/reset-data
 * 開発用データリセット
 */
router.delete('/reset-data', async (req, res) => {
  try {
    if (process.env.ALLOW_DATA_RESET !== 'true') {
      return res.status(403).json({ 
        error: 'Data reset not allowed',
        hint: 'Set ALLOW_DATA_RESET=true in .env.development' 
      });
    }

    // テストユーザー以外のデータを削除
    await prisma.$transaction([
      prisma.application.deleteMany({
        where: { 
          user: { 
            email: { not: 'dev@ai-subsidy.test' } 
          } 
        }
      }),
      prisma.uploadedFile.deleteMany({
        where: { 
          user: { 
            email: { not: 'dev@ai-subsidy.test' } 
          } 
        }
      }),
      prisma.user.deleteMany({
        where: { 
          email: { not: 'dev@ai-subsidy.test' } 
        }
      })
    ]);

    logger.info('開発データをリセットしました');
    res.json({ 
      success: true, 
      message: 'Development data reset complete' 
    });

  } catch (error) {
    logger.error('データリセットエラー:', error);
    res.status(500).json({ error: 'Data reset failed' });
  }
});

export default router;