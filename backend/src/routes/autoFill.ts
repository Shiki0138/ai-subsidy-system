import express from 'express';
import { body, validationResult } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
import { autoFillService } from '../services/autoFillService';
import { websiteExtractService } from '../services/websiteExtractService';
import { adoptedCasesService } from '../services/adoptedCasesService';
import { logger } from '../config/logger';

const router = express.Router();

// レート制限
const autoFillLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20, // 最大20回の自動入力
  message: { 
    error: 'Too many auto-fill requests. Please try again later.',
    retryAfter: 60 
  },
});

const websiteExtractLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10, // 最大10回のWebサイト抽出
  message: { 
    error: 'Too many website extraction requests. Please try again later.',
    retryAfter: 60 
  },
});

// バリデーション
const autoFillValidation = [
  body('subsidyGuidelineId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Subsidy guideline ID is required'),
  body('companyProfileId')
    .optional()
    .isString()
    .withMessage('Company profile ID must be a string')
];

const websiteExtractValidation = [
  body('websiteUrl')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Valid website URL is required')
    .custom((value) => {
      // セキュリティ: 内部ネットワークアドレスをブロック
      const url = new URL(value);
      const hostname = url.hostname;
      
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        throw new Error('Internal network addresses are not allowed');
      }
      
      return true;
    })
];

/**
 * 自動入力提案生成
 */
router.post('/suggestions',
  authenticateToken,
  autoFillLimiter,
  autoFillValidation,
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

      const { subsidyGuidelineId, companyProfileId } = req.body;
      const userId = req.user?.userId;
      const profileId = companyProfileId || userId;

      logger.info('🤖 Generating auto-fill suggestions', {
        subsidyGuidelineId,
        profileId,
        userId
      });

      // 自動入力提案生成
      const suggestions = await autoFillService.generateAutoFillSuggestions(
        profileId,
        subsidyGuidelineId
      );

      // 類似事例も取得
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const userProfile = await prisma.user.findUnique({
        where: { id: profileId },
        select: {
          companyName: true,
          industry: true,
          businessDescription: true,
          employeeCount: true,
          annualRevenue: true
        }
      });

      let similarCases = [];
      if (userProfile) {
        try {
          similarCases = await adoptedCasesService.findSimilarCases(
            userProfile,
            undefined,
            5 // 最大5件
          );
        } catch (error) {
          logger.warn('⚠️ Failed to fetch similar cases', { error: error.message });
        }
      }

      logger.info('✅ Auto-fill suggestions generated', {
        suggestionsCount: suggestions.length,
        similarCasesCount: similarCases.length,
        userId
      });

      res.json({
        success: true,
        data: {
          suggestions: suggestions.map(suggestion => ({
            ...suggestion,
            confidence: Math.round(suggestion.confidence)
          })),
          similarCases: similarCases.slice(0, 3).map(result => ({
            projectTitle: result.case.projectTitle,
            companyName: result.case.companyName,
            industry: result.case.industry,
            keyPoints: result.case.keySuccessFactors?.slice(0, 2),
            similarityScore: Math.round(result.similarityScore * 100),
            applicabilityReason: result.applicabilityReason
          })),
          metadata: {
            generatedAt: new Date(),
            profileId,
            subsidyGuidelineId
          }
        }
      });

    } catch (error) {
      logger.error('❌ Auto-fill suggestions generation failed', {
        subsidyGuidelineId: req.body.subsidyGuidelineId,
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate auto-fill suggestions',
        message: error.message
      });
    }
  }
);

/**
 * Webサイトからの企業データ抽出
 */
router.post('/extract-website',
  authenticateToken,
  websiteExtractLimiter,
  websiteExtractValidation,
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

      const { websiteUrl } = req.body;
      const userId = req.user?.userId;

      logger.info('🌐 Extracting website data', {
        websiteUrl,
        userId
      });

      // Webサイトからデータ抽出
      const extractionResult = await websiteExtractService.extractCompanyData(websiteUrl);

      // データベースに保存
      await websiteExtractService.saveCompanyData(userId, extractionResult);

      logger.info('✅ Website data extraction completed', {
        websiteUrl,
        confidence: extractionResult.confidence,
        companyName: extractionResult.extractedData.companyName,
        userId
      });

      res.json({
        success: true,
        message: 'Website data extracted successfully',
        data: {
          extractedData: {
            ...extractionResult.extractedData,
            // 機密情報をマスク
            contactInfo: {
              ...extractionResult.extractedData.contactInfo,
              phone: extractionResult.extractedData.contactInfo.phone ? 
                     extractionResult.extractedData.contactInfo.phone.replace(/\d{4}$/, '****') : 
                     undefined
            }
          },
          confidence: extractionResult.confidence,
          lastUpdated: extractionResult.lastUpdated,
          extractionMethod: extractionResult.extractionMethod,
          improvements: this.generateImprovementSuggestions(extractionResult.confidence)
        }
      });

    } catch (error) {
      logger.error('❌ Website data extraction failed', {
        websiteUrl: req.body.websiteUrl,
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Website data extraction failed',
        message: error.message
      });
    }
  }
);

/**
 * 抽出データの更新チェック
 */
router.get('/check-updates',
  authenticateToken,
  autoFillLimiter,
  async (req, res) => {
    try {
      const userId = req.user?.userId;

      logger.info('🔄 Checking for data updates', { userId });

      // 更新が必要かチェック
      const needsUpdate = await websiteExtractService.checkForUpdates(userId);

      if (needsUpdate) {
        // 既存データを取得
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { 
            website: true, 
            extractedData: true, 
            updatedAt: true 
          }
        });

        if (user?.website) {
          // 新しいデータを抽出
          const newExtractionResult = await websiteExtractService.extractCompanyData(user.website);
          
          // 変更点を比較
          const changes = await websiteExtractService.compareWithExistingData(
            userId, 
            newExtractionResult.extractedData
          );

          res.json({
            success: true,
            data: {
              needsUpdate: true,
              lastUpdated: user.updatedAt,
              changes,
              newData: newExtractionResult.extractedData,
              confidence: newExtractionResult.confidence
            }
          });
        } else {
          res.json({
            success: true,
            data: {
              needsUpdate: false,
              message: 'No website registered for updates'
            }
          });
        }
      } else {
        res.json({
          success: true,
          data: {
            needsUpdate: false,
            message: 'Data is up to date'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Update check failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Update check failed'
      });
    }
  }
);

/**
 * 学習機能実行
 */
router.post('/learn-from-history',
  authenticateToken,
  autoFillLimiter,
  async (req, res) => {
    try {
      const userId = req.user?.userId;

      logger.info('📚 Learning from application history', { userId });

      // 過去の申請実績から学習
      await autoFillService.learnFromPastApplications(userId);

      res.json({
        success: true,
        message: 'Learning from past applications completed'
      });

    } catch (error) {
      logger.error('❌ Learning from history failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Learning from history failed'
      });
    }
  }
);

/**
 * 改善提案生成
 */
function generateImprovementSuggestions(confidence: number): string[] {
  const suggestions: string[] = [];

  if (confidence < 70) {
    suggestions.push('会社概要ページの情報をより詳細に記載することをお勧めします');
    suggestions.push('事業内容の説明をより具体的にしてください');
  }

  if (confidence < 50) {
    suggestions.push('企業の実績や沿革を充実させてください');
    suggestions.push('連絡先情報を明確に記載してください');
  }

  if (confidence < 30) {
    suggestions.push('ウェブサイト全体の構造化とSEO対策をお勧めします');
  }

  if (suggestions.length === 0) {
    suggestions.push('企業情報は十分に抽出されています');
  }

  return suggestions;
}

export default router;