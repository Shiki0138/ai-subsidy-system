import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
import { adoptedCasesService } from '../services/adoptedCasesService';
import { logger } from '../config/logger';

const router = express.Router();

// レート制限
const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 5, // 最大5回のインポート
  message: { 
    error: 'Too many import requests. Please try again later.',
    retryAfter: 60 
  },
});

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100回の検索
  message: { 
    error: 'Too many search requests. Please try again later.',
    retryAfter: 15 
  },
});

// バリデーション
const importValidation = [
  body('targetSites')
    .optional()
    .isArray()
    .withMessage('Target sites must be an array')
    .custom((sites) => {
      if (sites && sites.length > 10) {
        throw new Error('Maximum 10 target sites allowed');
      }
      return true;
    }),
  body('targetSites.*')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Each target site must be a valid URL')
];

const searchValidation = [
  query('industry')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Industry must be 1-50 characters'),
  query('companySize')
    .optional()
    .isIn(['小規模', '中規模', '大規模'])
    .withMessage('Company size must be 小規模, 中規模, or 大規模'),
  query('subsidyType')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subsidy type must be 1-100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

/**
 * 採択事例一括インポート
 */
router.post('/import',
  authenticateToken,
  importLimiter,
  importValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { targetSites } = req.body;
      const userId = req.user?.userId;

      // 管理者権限チェック
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required for importing cases'
        });
      }

      logger.info('📥 Starting adopted cases import', {
        targetSites: targetSites?.length || 'default',
        userId,
        ip: req.ip
      });

      // インポート実行
      const result = await adoptedCasesService.importAdoptedCases(targetSites);

      logger.info('✅ Adopted cases import completed', {
        ...result,
        userId
      });

      res.json({
        success: true,
        message: 'Adopted cases import completed',
        data: {
          summary: {
            totalCases: result.totalCases,
            newCases: result.newCases,
            updatedCases: result.updatedCases,
            failedCases: result.failedCases
          },
          errors: result.errors,
          importedCases: result.importedCases.slice(0, 10) // 最初の10件のみ返す
        }
      });

    } catch (error) {
      logger.error('❌ Adopted cases import failed', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Import failed',
        message: error.message
      });
    }
  }
);

/**
 * 企業プロフィールに基づく類似事例検索
 */
router.get('/similar',
  authenticateToken,
  searchLimiter,
  searchValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.userId;
      const { industry, companySize, subsidyType, limit = 10 } = req.query;

      logger.info('🔍 Searching for similar adopted cases', {
        userId,
        industry,
        companySize,
        subsidyType,
        limit
      });

      // ユーザーの企業プロフィール取得
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          companyName: true,
          industry: true,
          businessDescription: true,
          employeeCount: true,
          annualRevenue: true,
          address: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }

      // 検索条件をオーバーライド
      const searchProfile = {
        ...user,
        industry: industry || user.industry,
        employeeCount: companySize || user.employeeCount
      };

      // 類似事例検索
      const similarCases = await adoptedCasesService.findSimilarCases(
        searchProfile,
        subsidyType as string,
        parseInt(limit as string)
      );

      logger.info('✅ Similar cases search completed', {
        userId,
        foundCases: similarCases.length,
        topScore: similarCases[0]?.similarityScore || 0
      });

      res.json({
        success: true,
        data: {
          profile: {
            companyName: user.companyName,
            industry: searchProfile.industry,
            employeeCount: searchProfile.employeeCount
          },
          similarCases: similarCases.map(result => ({
            ...result.case,
            similarityScore: Math.round(result.similarityScore * 100), // パーセンテージ
            matchingFactors: result.matchingFactors,
            applicabilityReason: result.applicabilityReason,
            // 機密情報は除外
            achievements: result.case.achievements?.slice(0, 3),
            keySuccessFactors: result.case.keySuccessFactors?.slice(0, 3)
          })),
          searchCriteria: {
            industry: searchProfile.industry,
            companySize: searchProfile.employeeCount,
            subsidyType
          }
        }
      });

    } catch (error) {
      logger.error('❌ Similar cases search failed', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message
      });
    }
  }
);

/**
 * 特定事例の詳細取得
 */
router.get('/:caseId',
  authenticateToken,
  searchLimiter,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const userId = req.user?.userId;

      logger.info('📄 Fetching case details', {
        caseId,
        userId
      });

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const adoptedCase = await prisma.adoptedCase.findUnique({
        where: { id: caseId },
        select: {
          id: true,
          subsidyProgram: true,
          companyName: true,
          projectTitle: true,
          projectDescription: true,
          industry: true,
          companySize: true,
          investmentAmount: true,
          subsidyAmount: true,
          implementationPeriod: true,
          expectedResults: true,
          achievements: true,
          keySuccessFactors: true,
          lessonsLearned: true,
          applicableScenarios: true,
          publishedDate: true,
          createdAt: true
        }
      });

      if (!adoptedCase) {
        return res.status(404).json({
          success: false,
          error: 'Adopted case not found'
        });
      }

      // JSON文字列をパース
      const parsedCase = {
        ...adoptedCase,
        achievements: JSON.parse(adoptedCase.achievements as string),
        keySuccessFactors: JSON.parse(adoptedCase.keySuccessFactors as string),
        lessonsLearned: JSON.parse(adoptedCase.lessonsLearned as string),
        applicableScenarios: JSON.parse(adoptedCase.applicableScenarios as string)
      };

      logger.info('✅ Case details fetched', {
        caseId,
        projectTitle: parsedCase.projectTitle,
        userId
      });

      res.json({
        success: true,
        data: {
          case: parsedCase
        }
      });

    } catch (error) {
      logger.error('❌ Case details fetch failed', {
        caseId: req.params.caseId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch case details'
      });
    }
  }
);

/**
 * 採択事例一覧取得（ページネーション付き）
 */
router.get('/',
  authenticateToken,
  searchLimiter,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('industry')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Industry filter must be 1-50 characters'),
    query('subsidyProgram')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Subsidy program filter must be 1-100 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const industry = req.query.industry as string;
      const subsidyProgram = req.query.subsidyProgram as string;

      const skip = (page - 1) * limit;

      logger.info('📋 Fetching adopted cases list', {
        userId,
        page,
        limit,
        industry,
        subsidyProgram
      });

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // フィルター条件構築
      const where: any = {};
      if (industry) {
        where.industry = { contains: industry, mode: 'insensitive' };
      }
      if (subsidyProgram) {
        where.subsidyProgram = { contains: subsidyProgram, mode: 'insensitive' };
      }

      // 総数取得
      const totalCount = await prisma.adoptedCase.count({ where });

      // データ取得
      const cases = await prisma.adoptedCase.findMany({
        where,
        select: {
          id: true,
          subsidyProgram: true,
          companyName: true,
          projectTitle: true,
          projectDescription: true,
          industry: true,
          companySize: true,
          investmentAmount: true,
          subsidyAmount: true,
          implementationPeriod: true,
          publishedDate: true
        },
        orderBy: { publishedDate: 'desc' },
        skip,
        take: limit
      });

      const totalPages = Math.ceil(totalCount / limit);

      logger.info('✅ Adopted cases list fetched', {
        userId,
        totalCount,
        page,
        totalPages,
        returnedCount: cases.length
      });

      res.json({
        success: true,
        data: {
          cases,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            industry,
            subsidyProgram
          }
        }
      });

    } catch (error) {
      logger.error('❌ Adopted cases list fetch failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch adopted cases'
      });
    }
  }
);

/**
 * 事例の統計情報取得
 */
router.get('/stats/overview',
  authenticateToken,
  searchLimiter,
  async (req, res) => {
    try {
      const userId = req.user?.userId;

      logger.info('📊 Fetching cases statistics', { userId });

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // 統計データ取得
      const [
        totalCases,
        industryStats,
        subsidyProgramStats,
        avgInvestment,
        avgSubsidy
      ] = await Promise.all([
        // 総事例数
        prisma.adoptedCase.count(),
        
        // 業界別統計
        prisma.adoptedCase.groupBy({
          by: ['industry'],
          _count: { industry: true },
          orderBy: { _count: { industry: 'desc' } },
          take: 10
        }),
        
        // 補助金プログラム別統計
        prisma.adoptedCase.groupBy({
          by: ['subsidyProgram'],
          _count: { subsidyProgram: true },
          orderBy: { _count: { subsidyProgram: 'desc' } },
          take: 10
        }),
        
        // 平均投資額
        prisma.adoptedCase.aggregate({
          _avg: { investmentAmount: true }
        }),
        
        // 平均補助金額
        prisma.adoptedCase.aggregate({
          _avg: { subsidyAmount: true }
        })
      ]);

      const stats = {
        overview: {
          totalCases,
          avgInvestmentAmount: Math.round(avgInvestment._avg.investmentAmount || 0),
          avgSubsidyAmount: Math.round(avgSubsidy._avg.subsidyAmount || 0),
          avgSubsidyRate: avgInvestment._avg.investmentAmount 
            ? Math.round((avgSubsidy._avg.subsidyAmount / avgInvestment._avg.investmentAmount) * 100)
            : 0
        },
        industryDistribution: industryStats.map(stat => ({
          industry: stat.industry,
          count: stat._count.industry,
          percentage: Math.round((stat._count.industry / totalCases) * 100)
        })),
        subsidyProgramDistribution: subsidyProgramStats.map(stat => ({
          program: stat.subsidyProgram,
          count: stat._count.subsidyProgram,
          percentage: Math.round((stat._count.subsidyProgram / totalCases) * 100)
        }))
      };

      logger.info('✅ Cases statistics fetched', {
        userId,
        totalCases,
        industriesCount: industryStats.length,
        programsCount: subsidyProgramStats.length
      });

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('❌ Cases statistics fetch failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
);

export default router;