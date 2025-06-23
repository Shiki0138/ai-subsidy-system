// 業務改善助成金API
import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { businessImprovementSubsidyService, BusinessImprovementApplicationSchema } from '../services/businessImprovementSubsidyService';
import { logger } from '../config/logger';

const router = express.Router();
const prisma = new PrismaClient();

// 申請資格チェック用スキーマ
const EligibilityCheckSchema = z.object({
  companyInfo: z.object({
    name: z.string(),
    industry: z.string(),
    employeeCount: z.number(),
    currentMinimumWage: z.number(),
    regionalMinimumWage: z.number(),
    address: z.string(),
    businessType: z.string(),
    yearlyRevenue: z.number().optional(),
  })
});

// 補助金額計算用スキーマ
const SubsidyCalculationSchema = z.object({
  course: z.enum(['30', '45', '60', '90']),
  totalCost: z.number(),
  hasProductivityRequirement: z.boolean().optional(),
});

/**
 * GET /api/business-improvement-subsidy/info
 * 業務改善助成金の基本情報を取得
 */
router.get('/info', async (req, res) => {
  try {
    const subsidyProgram = await prisma.subsidyProgram.findFirst({
      where: {
        name: '業務改善助成金',
        isActive: true,
      },
      include: {
        guidelines: {
          where: { status: 'ACTIVE' },
          orderBy: { publishedAt: 'desc' },
          take: 1,
        },
        documents: {
          where: { isLatest: true },
          orderBy: { type: 'asc' },
        },
      },
    });

    if (!subsidyProgram) {
      return res.status(404).json({
        success: false,
        error: '業務改善助成金のプログラムが見つかりません',
      });
    }

    res.json({
      success: true,
      data: {
        program: subsidyProgram,
        courses: [
          {
            name: '30円コース',
            wageIncrease: 30,
            maxAmount: 1200000,
            subsidyRate: 75,
            subsidyRateWithProductivity: 90,
          },
          {
            name: '45円コース',
            wageIncrease: 45,
            maxAmount: 1800000,
            subsidyRate: 80,
            subsidyRateWithProductivity: 90,
          },
          {
            name: '60円コース',
            wageIncrease: 60,
            maxAmount: 3000000,
            subsidyRate: 80,
            subsidyRateWithProductivity: 90,
          },
          {
            name: '90円コース',
            wageIncrease: 90,
            maxAmount: 6000000,
            subsidyRate: 80,
            subsidyRateWithProductivity: 90,
          },
        ],
        deadlines: {
          applicationEnd: '2024年12月27日',
          projectEnd: '2025年1月31日',
        },
      },
    });
  } catch (error) {
    logger.error('業務改善助成金情報取得エラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * POST /api/business-improvement-subsidy/check-eligibility
 * 申請資格をチェック
 */
router.post('/check-eligibility', validateRequest(EligibilityCheckSchema), async (req, res) => {
  try {
    const { companyInfo } = req.body;
    
    const eligibility = await businessImprovementSubsidyService.checkEligibility(companyInfo);
    
    res.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    logger.error('申請資格チェックエラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * POST /api/business-improvement-subsidy/calculate
 * 補助金額を計算
 */
router.post('/calculate', validateRequest(SubsidyCalculationSchema), async (req, res) => {
  try {
    const { course, totalCost, hasProductivityRequirement = false } = req.body;
    
    const calculation = businessImprovementSubsidyService.calculateSubsidyAmount(
      course,
      totalCost,
      hasProductivityRequirement
    );
    
    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    logger.error('補助金額計算エラー', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '計算エラーが発生しました',
    });
  }
});

/**
 * POST /api/business-improvement-subsidy/generate
 * 申請書を生成
 */
router.post('/generate', authMiddleware, validateRequest(BusinessImprovementApplicationSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const applicationData = req.body;
    
    // 入力データの検証
    const validatedData = BusinessImprovementApplicationSchema.parse(applicationData);
    
    // 申請書生成
    const result = await businessImprovementSubsidyService.generateApplication(
      userId,
      validatedData
    );
    
    logger.info('業務改善助成金申請書生成完了', {
      userId,
      applicationId: result.applicationId,
      documentCount: result.documents.length,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('申請書生成エラー', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '入力データに不備があります',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * GET /api/business-improvement-subsidy/applications
 * ユーザーの業務改善助成金申請一覧を取得
 */
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const subsidyProgram = await prisma.subsidyProgram.findFirst({
      where: {
        name: '業務改善助成金',
        isActive: true,
      },
    });
    
    if (!subsidyProgram) {
      return res.status(404).json({
        success: false,
        error: '業務改善助成金のプログラムが見つかりません',
      });
    }
    
    const applications = await prisma.application.findMany({
      where: {
        userId,
        subsidyProgramId: subsidyProgram.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        status: true,
        progress: true,
        estimatedScore: true,
        wordCount: true,
        pdfUrl: true,
        createdAt: true,
        updatedAt: true,
        subsidyProgram: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    logger.error('申請一覧取得エラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * GET /api/business-improvement-subsidy/applications/:id
 * 特定の申請書の詳細を取得
 */
router.get('/applications/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const application = await prisma.application.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subsidyProgram: true,
      },
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: '申請書が見つかりません',
      });
    }
    
    // 業務改善助成金でない場合はエラー
    if (application.subsidyProgram.name !== '業務改善助成金') {
      return res.status(400).json({
        success: false,
        error: '指定された申請書は業務改善助成金のものではありません',
      });
    }
    
    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('申請詳細取得エラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * POST /api/business-improvement-subsidy/applications/:id/score
 * 申請書をスコアリング
 */
router.post('/applications/:id/score', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    // 申請書の所有者確認
    const application = await prisma.application.findFirst({
      where: {
        id,
        userId,
      },
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: '申請書が見つかりません',
      });
    }
    
    // スコアリング実行
    const score = await businessImprovementSubsidyService.scoreApplication(id);
    
    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    logger.error('申請書スコアリングエラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * GET /api/business-improvement-subsidy/templates
 * 申請書テンプレートを取得
 */
router.get('/templates', async (req, res) => {
  try {
    const subsidyProgram = await prisma.subsidyProgram.findFirst({
      where: {
        name: '業務改善助成金',
        isActive: true,
      },
    });
    
    if (!subsidyProgram) {
      return res.status(404).json({
        success: false,
        error: '業務改善助成金のプログラムが見つかりません',
      });
    }
    
    const templates = await prisma.promptTemplate.findMany({
      where: {
        subsidyProgramId: subsidyProgram.id,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('テンプレート取得エラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

/**
 * GET /api/business-improvement-subsidy/success-cases
 * 業務改善助成金の成功事例を取得
 */
router.get('/success-cases', async (req, res) => {
  try {
    const { industry, companySize, page = 1, limit = 10 } = req.query;
    
    const where: any = {
      subsidyProgram: '業務改善助成金',
      isVerified: true,
      isPublic: true,
    };
    
    if (industry) {
      where.industry = industry;
    }
    
    if (companySize) {
      where.companySize = companySize;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const [cases, total] = await Promise.all([
      prisma.adoptedCase.findMany({
        where,
        orderBy: {
          publishedDate: 'desc',
        },
        take: Number(limit),
        skip: offset,
      }),
      prisma.adoptedCase.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('成功事例取得エラー', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
});

export default router;