/**
 * ユーザープロフィール管理API
 * プロフィール更新、統計情報、パスワード変更
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, logger } from '../index';
import { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError,
  NotFoundError 
} from '../middleware/errorHandler';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// すべてのルートに認証を適用
router.use(authenticate);

// バリデーションスキーマ
const updateProfileSchema = z.object({
  companyName: z.string().min(1, '会社名は必須です').max(100).optional(),
  representativeName: z.string().min(1, '代表者名は必須です').max(50).optional(),
  businessType: z.string().min(1, '業種は必須です').max(50).optional(),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  employeeCount: z.number().int().min(1).max(10000).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'パスワードは英大文字、英小文字、数字、記号を含む必要があります'),
  confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

/**
 * プロフィール情報の取得
 * GET /api/users/profile
 */
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      companyName: true,
      representativeName: true,
      businessType: true,
      foundedYear: true,
      employeeCount: true,
      address: true,
      phone: true,
      website: true,
      description: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      updatedAt: true,
    }
  });

  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  res.json({
    message: 'プロフィール情報を取得しました',
    data: user
  });
}));

/**
 * プロフィール情報の更新
 * PUT /api/users/profile
 */
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const validatedData = updateProfileSchema.parse(req.body);

  // 空の値をnullに変換
  const updateData = Object.fromEntries(
    Object.entries(validatedData).map(([key, value]) => [
      key, 
      value === '' ? null : value
    ])
  );

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      companyName: true,
      representativeName: true,
      businessType: true,
      foundedYear: true,
      employeeCount: true,
      address: true,
      phone: true,
      website: true,
      description: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      updatedAt: true,
    }
  });

  logger.info('User profile updated', {
    userId,
    email: updatedUser.email,
    updateFields: Object.keys(validatedData),
    ip: req.ip
  });

  res.json({
    message: 'プロフィールを更新しました',
    data: updatedUser
  });
}));

/**
 * ユーザー統計情報の取得
 * GET /api/users/stats
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  // 並列でデータを取得して高速化
  const [
    totalApplications,
    draftApplications,
    generatingApplications,
    completedApplications,
    submittedApplications,
    aiUsageCount,
    recentActivity
  ] = await Promise.all([
    // 総申請書数
    prisma.application.count({
      where: { userId }
    }),
    
    // 下書き申請書数
    prisma.application.count({
      where: { userId, status: 'DRAFT' }
    }),
    
    // AI生成中申請書数
    prisma.application.count({
      where: { userId, status: 'GENERATING' }
    }),
    
    // 完成申請書数
    prisma.application.count({
      where: { userId, status: 'COMPLETED' }
    }),
    
    // 提出済み申請書数
    prisma.application.count({
      where: { userId, status: 'SUBMITTED' }
    }),
    
    // AI使用回数（今月）
    prisma.aiUsageLog.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    
    // 最近のアクティビティ
    prisma.application.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        subsidyProgram: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })
  ]);

  // 今月のAI使用量とコスト計算
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const monthlyAiUsage = await prisma.aiUsageLog.findMany({
    where: {
      userId,
      createdAt: { gte: firstDayOfMonth }
    },
    select: {
      inputTokens: true,
      outputTokens: true,
      estimatedCost: true,
      model: true
    }
  });

  const monthlyStats = monthlyAiUsage.reduce((acc, usage) => {
    acc.totalCost += usage.estimatedCost || 0;
    acc.totalTokens += (usage.inputTokens || 0) + (usage.outputTokens || 0);
    acc.apiCalls += 1;
    return acc;
  }, { totalCost: 0, totalTokens: 0, apiCalls: 0 });

  const stats = {
    applications: {
      total: totalApplications,
      draft: draftApplications,
      generating: generatingApplications,
      completed: completedApplications,
      submitted: submittedApplications,
      inProgress: draftApplications + generatingApplications
    },
    aiUsage: {
      monthlyUsage: aiUsageCount,
      totalCost: monthlyStats.totalCost,
      totalTokens: monthlyStats.totalTokens,
      apiCalls: monthlyStats.apiCalls
    },
    recentActivity,
    performance: {
      averageGenerationTime: '28秒', // TODO: 実際の計算
      successRate: totalApplications > 0 ? (completedApplications / totalApplications * 100).toFixed(1) : '0',
      monthlyActiveApplications: draftApplications + generatingApplications + completedApplications
    }
  };

  res.json({
    message: 'ユーザー統計情報を取得しました',
    data: stats
  });
}));

/**
 * パスワード変更
 * PUT /api/users/password
 */
router.put('/password', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

  // 現在のユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // 現在のパスワードを確認
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    logger.warn('Password change attempt with invalid current password', {
      userId,
      email: user.email,
      ip: req.ip
    });
    throw new ValidationError('現在のパスワードが正しくありません');
  }

  // 新しいパスワードをハッシュ化
  const saltRounds = parseInt(process.env.SALT_ROUNDS || '12');
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // パスワード更新
  await prisma.user.update({
    where: { id: userId },
    data: { 
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    }
  });

  // セキュリティのため、既存のセッションを全て無効化
  await prisma.userSession.deleteMany({
    where: { userId }
  });

  logger.info('User password changed successfully', {
    userId,
    email: user.email,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json({
    message: 'パスワードを変更しました。セキュリティのため再ログインが必要です。',
    requireReauth: true
  });
}));

/**
 * アカウント削除要求
 * DELETE /api/users/account
 */
router.delete('/account', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { password } = z.object({
    password: z.string().min(1, 'パスワードを入力してください')
  }).parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      companyName: true
    }
  });

  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // パスワード確認
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    logger.warn('Account deletion attempt with invalid password', {
      userId,
      email: user.email,
      ip: req.ip
    });
    throw new ValidationError('パスワードが正しくありません');
  }

  // トランザクションでデータ削除
  await prisma.$transaction(async (tx) => {
    // 関連データを順番に削除
    await tx.aiUsageLog.deleteMany({ where: { userId } });
    await tx.userSession.deleteMany({ where: { userId } });
    await tx.application.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  logger.info('User account deleted', {
    userId,
    email: user.email,
    companyName: user.companyName,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json({
    message: 'アカウントを削除しました'
  });
}));

export default router;