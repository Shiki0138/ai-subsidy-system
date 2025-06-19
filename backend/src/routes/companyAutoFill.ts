/**
 * Company Auto-Fill API Routes
 * 企業情報自動入力API
 */

import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generalRateLimit } from '../config/security.js';
import CompanyAutoFillService from '../services/companyAutoFillService.js';
import CorporateNumberAPI from '../services/corporateNumberAPI.js';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Logger for company auto-fill API
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/company-autofill-api.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const autoFillService = new CompanyAutoFillService(logger, prisma);
const corporateAPI = new CorporateNumberAPI(logger);

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// バリデーションスキーマ
const corporateNumberSchema = z.object({
  corporateNumber: z.string().min(13).max(13).regex(/^\d{13}$/, '法人番号は13桁の数字である必要があります')
});

const websiteSchema = z.object({
  website: z.string().url('有効なURLを入力してください')
});

const companyNameSchema = z.object({
  companyName: z.string().min(1, '企業名は必須です').max(100),
  prefecture: z.string().optional()
});

const mixedSearchSchema = z.object({
  corporateNumber: z.string().optional(),
  website: z.string().url().optional(),
  companyName: z.string().optional(),
  prefecture: z.string().optional()
}).refine(data => 
  data.corporateNumber || data.website || data.companyName,
  '少なくとも1つの検索条件（法人番号、ウェブサイト、企業名）を指定してください'
);

/**
 * POST /api/company-autofill/corporate-number
 * 法人番号から企業情報を自動抽出
 */
router.post('/corporate-number',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = corporateNumberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: validation.error.errors,
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { corporateNumber } = validation.data;
      const userId = req.user?.id;

      logger.info('Corporate number auto-fill requested', {
        corporateNumber,
        userId
      });

      const result = await autoFillService.autoFillCompanyInfo({
        method: 'corporateNumber',
        data: { corporateNumber },
        userId
      });

      if (result.success && userId) {
        // 結果をキャッシュ
        await autoFillService.cacheExtractionResult(userId, result);
      }

      res.json({
        success: result.success,
        data: result.data,
        confidence: result.confidence,
        sources: result.sources,
        suggestions: result.suggestions,
        processingTime: result.processingTime,
        metadata: {
          extractedAt: result.extractedAt,
          requestedBy: userId
        }
      });

    } catch (error: any) {
      logger.error('Corporate number auto-fill error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '企業情報の抽出に失敗しました',
        errorCode: 'EXTRACTION_ERROR',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/company-autofill/website
 * ウェブサイトから企業情報を自動抽出
 */
router.post('/website',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = websiteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: validation.error.errors,
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { website } = validation.data;
      const userId = req.user?.id;

      logger.info('Website auto-fill requested', {
        website,
        userId
      });

      const result = await autoFillService.autoFillCompanyInfo({
        method: 'website',
        data: { website },
        userId
      });

      if (result.success && userId) {
        await autoFillService.cacheExtractionResult(userId, result);
      }

      res.json({
        success: result.success,
        data: result.data,
        confidence: result.confidence,
        sources: result.sources,
        suggestions: result.suggestions,
        processingTime: result.processingTime,
        metadata: {
          extractedAt: result.extractedAt,
          requestedBy: userId
        }
      });

    } catch (error: any) {
      logger.error('Website auto-fill error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ウェブサイトからの情報抽出に失敗しました',
        errorCode: 'WEBSITE_EXTRACTION_ERROR',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/company-autofill/company-name
 * 企業名から企業情報を自動抽出
 */
router.post('/company-name',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = companyNameSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: validation.error.errors,
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { companyName, prefecture } = validation.data;
      const userId = req.user?.id;

      logger.info('Company name auto-fill requested', {
        companyName,
        prefecture,
        userId
      });

      const result = await autoFillService.autoFillCompanyInfo({
        method: 'companyName',
        data: { companyName, prefecture },
        userId
      });

      if (result.success && userId) {
        await autoFillService.cacheExtractionResult(userId, result);
      }

      res.json({
        success: result.success,
        data: result.data,
        confidence: result.confidence,
        sources: result.sources,
        suggestions: result.suggestions,
        processingTime: result.processingTime,
        metadata: {
          extractedAt: result.extractedAt,
          requestedBy: userId
        }
      });

    } catch (error: any) {
      logger.error('Company name auto-fill error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '企業名検索に失敗しました',
        errorCode: 'COMPANY_NAME_SEARCH_ERROR',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/company-autofill/mixed
 * 複数の情報源から企業情報を自動抽出
 */
router.post('/mixed',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = mixedSearchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: validation.error.errors,
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const searchData = validation.data;
      const userId = req.user?.id;

      logger.info('Mixed auto-fill requested', {
        searchData,
        userId
      });

      const result = await autoFillService.autoFillCompanyInfo({
        method: 'mixed',
        data: searchData,
        userId
      });

      if (result.success && userId) {
        await autoFillService.cacheExtractionResult(userId, result);
      }

      res.json({
        success: result.success,
        data: result.data,
        confidence: result.confidence,
        sources: result.sources,
        suggestions: result.suggestions,
        processingTime: result.processingTime,
        metadata: {
          extractedAt: result.extractedAt,
          requestedBy: userId,
          sourcesUsed: Object.keys(searchData).filter(key => searchData[key as keyof typeof searchData])
        }
      });

    } catch (error: any) {
      logger.error('Mixed auto-fill error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '企業情報の抽出に失敗しました',
        errorCode: 'MIXED_EXTRACTION_ERROR',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/company-autofill/validate-corporate-number/:number
 * 法人番号の妥当性を検証
 */
router.get('/validate-corporate-number/:number',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const corporateNumber = req.params.number;
      
      const validation = corporateAPI.validateCorporateNumber(corporateNumber);
      
      logger.info('Corporate number validation requested', {
        corporateNumber,
        isValid: validation.isValid,
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: {
          corporateNumber,
          isValid: validation.isValid,
          error: validation.error,
          formatted: validation.isValid ? corporateNumber.replace(/[-\s]/g, '') : null
        }
      });

    } catch (error: any) {
      logger.error('Corporate number validation error', {
        corporateNumber: req.params.number,
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '法人番号の検証に失敗しました',
        errorCode: 'VALIDATION_ERROR'
      });
    }
  }
);

/**
 * GET /api/company-autofill/search-suggestions/:query
 * 企業名の候補を検索
 */
router.get('/search-suggestions/:query',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = req.params.query;
      const prefecture = req.query.prefecture as string;
      
      if (query.length < 2) {
        return res.status(400).json({
          success: false,
          error: '検索クエリは2文字以上である必要があります',
          errorCode: 'QUERY_TOO_SHORT'
        });
      }

      logger.info('Search suggestions requested', {
        query,
        prefecture,
        userId: req.user?.id
      });

      const suggestions = await corporateAPI.fuzzySearchCompany(query, 10);
      
      const formattedSuggestions = suggestions.map(suggestion => ({
        corporateNumber: suggestion.corporateNumber,
        name: suggestion.name,
        furigana: suggestion.furigana,
        address: `${suggestion.prefectureName}${suggestion.cityName}`,
        kind: suggestion.kind
      }));

      res.json({
        success: true,
        data: {
          query,
          suggestions: formattedSuggestions,
          count: formattedSuggestions.length
        }
      });

    } catch (error: any) {
      logger.error('Search suggestions error', {
        query: req.params.query,
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '企業検索候補の取得に失敗しました',
        errorCode: 'SUGGESTIONS_ERROR'
      });
    }
  }
);

/**
 * GET /api/company-autofill/prefectures
 * 都道府県リストを取得
 */
router.get('/prefectures',
  generalRateLimit,
  (req: Request, res: Response) => {
    const prefectures = [
      { code: '01', name: '北海道' }, { code: '02', name: '青森県' }, { code: '03', name: '岩手県' },
      { code: '04', name: '宮城県' }, { code: '05', name: '秋田県' }, { code: '06', name: '山形県' },
      { code: '07', name: '福島県' }, { code: '08', name: '茨城県' }, { code: '09', name: '栃木県' },
      { code: '10', name: '群馬県' }, { code: '11', name: '埼玉県' }, { code: '12', name: '千葉県' },
      { code: '13', name: '東京都' }, { code: '14', name: '神奈川県' }, { code: '15', name: '新潟県' },
      { code: '16', name: '富山県' }, { code: '17', name: '石川県' }, { code: '18', name: '福井県' },
      { code: '19', name: '山梨県' }, { code: '20', name: '長野県' }, { code: '21', name: '岐阜県' },
      { code: '22', name: '静岡県' }, { code: '23', name: '愛知県' }, { code: '24', name: '三重県' },
      { code: '25', name: '滋賀県' }, { code: '26', name: '京都府' }, { code: '27', name: '大阪府' },
      { code: '28', name: '兵庫県' }, { code: '29', name: '奈良県' }, { code: '30', name: '和歌山県' },
      { code: '31', name: '鳥取県' }, { code: '32', name: '島根県' }, { code: '33', name: '岡山県' },
      { code: '34', name: '広島県' }, { code: '35', name: '山口県' }, { code: '36', name: '徳島県' },
      { code: '37', name: '香川県' }, { code: '38', name: '愛媛県' }, { code: '39', name: '高知県' },
      { code: '40', name: '福岡県' }, { code: '41', name: '佐賀県' }, { code: '42', name: '長崎県' },
      { code: '43', name: '熊本県' }, { code: '44', name: '大分県' }, { code: '45', name: '宮崎県' },
      { code: '46', name: '鹿児島県' }, { code: '47', name: '沖縄県' }
    ];

    res.json({
      success: true,
      data: prefectures
    });
  }
);

/**
 * GET /api/company-autofill/extraction-stats
 * 抽出統計情報を取得
 */
router.get('/extraction-stats',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      
      // 管理者のみ統計情報を閲覧可能
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // 統計情報の収集（実装は省略）
      const stats = {
        totalExtractions: 0,
        successRate: 0,
        averageConfidence: 0,
        sourceBreakdown: {
          corporateNumberAPI: 0,
          websiteScraping: 0,
          mixed: 0
        },
        averageProcessingTime: 0,
        popularCompanyTypes: []
      };

      res.json({
        success: true,
        data: stats,
        metadata: {
          generatedAt: new Date().toISOString(),
          requestedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Extraction stats error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '統計情報の取得に失敗しました',
        errorCode: 'STATS_ERROR'
      });
    }
  }
);

export default router;