import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
import { subsidyGuidelineService } from '../services/subsidyGuidelineService';
import { logger } from '../config/logger';

const router = express.Router();

// レート制限
const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10, // 最大10回のインポート
  message: { 
    error: 'Too many import requests. Please try again later.',
    retryAfter: 60 
  },
});

// ファイルアップロード設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// バリデーション
const urlValidation = [
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Valid URL is required')
    .custom((value) => {
      // 政府・公的機関のドメインチェック（安全性確保）
      const allowedDomains = [
        'meti.go.jp',
        'jsbri.or.jp', 
        'smrj.go.jp',
        'nedo.go.jp',
        'ipa.go.jp',
        'city.osaka.lg.jp',
        'pref.tokyo.lg.jp',
        'gov.jp',
        'lg.jp'
      ];
      
      const url = new URL(value);
      const isAllowed = allowedDomains.some(domain => 
        url.hostname.endsWith(domain)
      );
      
      if (!isAllowed && process.env.NODE_ENV === 'production') {
        throw new Error('Only government and public organization URLs are allowed');
      }
      
      return true;
    })
];

// URL から補助金要項をインポート
router.post('/import-url', 
  authenticateToken,
  importLimiter,
  urlValidation,
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

      const { url } = req.body;
      const userId = req.user?.userId;

      logger.info('📥 Starting URL import', {
        url,
        userId,
        ip: req.ip
      });

      // インポート実行
      const guideline = await subsidyGuidelineService.importFromURL(url);

      logger.info('✅ URL import completed', {
        url,
        subsidyName: guideline.name,
        userId
      });

      res.json({
        success: true,
        message: 'Subsidy guideline imported successfully',
        data: {
          guideline
        }
      });

    } catch (error) {
      logger.error('❌ URL import failed', {
        url: req.body.url,
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

// PDF から補助金要項をインポート
router.post('/import-pdf',
  authenticateToken,
  importLimiter,
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      const userId = req.user?.userId;
      const originalName = req.file.originalname;

      logger.info('📥 Starting PDF import', {
        originalName,
        fileSize: req.file.size,
        userId,
        ip: req.ip
      });

      // インポート実行
      const guideline = await subsidyGuidelineService.importFromPDF(
        req.file.buffer,
        originalName
      );

      logger.info('✅ PDF import completed', {
        originalName,
        subsidyName: guideline.name,
        userId
      });

      res.json({
        success: true,
        message: 'Subsidy guideline imported successfully from PDF',
        data: {
          guideline
        }
      });

    } catch (error) {
      logger.error('❌ PDF import failed', {
        originalName: req.file?.originalname,
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'PDF import failed',
        message: error.message
      });
    }
  }
);

// インポート済み要項一覧取得
router.get('/imported',
  authenticateToken,
  async (req, res) => {
    try {
      const guidelines = await subsidyGuidelineService.getImportedGuidelines();

      res.json({
        success: true,
        data: {
          guidelines,
          count: guidelines.length
        }
      });

    } catch (error) {
      logger.error('❌ Failed to fetch imported guidelines', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch imported guidelines'
      });
    }
  }
);

// 特定の要項から申請書テンプレート生成
router.get('/:id/template',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // 要項取得
      const guidelines = await subsidyGuidelineService.getImportedGuidelines();
      const guideline = guidelines.find(g => g.id === id);
      
      if (!guideline || !guideline.parsedGuidelines) {
        return res.status(404).json({
          success: false,
          error: 'Guideline not found'
        });
      }

      // 申請書テンプレート生成
      const template = {
        subsidyName: guideline.name,
        category: guideline.category,
        maxAmount: guideline.maxAmount,
        deadline: guideline.applicationDeadline,
        sections: guideline.parsedGuidelines.applicationSections.map((section: any) => ({
          id: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
          name: section.sectionName,
          description: section.description,
          required: section.required,
          maxLength: section.maxLength,
          placeholder: `${section.description}\n\n[ここに具体的な内容を記載してください]`,
          guidelines: [
            '具体的で定量的な内容を記載してください',
            '他社との差別化ポイントを明確にしてください',
            '実現可能性と効果を具体的に示してください'
          ]
        })),
        eligibilityCriteria: guideline.parsedGuidelines.eligibilityCriteria,
        requiredDocuments: guideline.parsedGuidelines.requiredDocuments,
        evaluationCriteria: guideline.parsedGuidelines.evaluationCriteria
      };

      logger.info('📝 Template generated', {
        guidelineId: id,
        subsidyName: guideline.name,
        sectionsCount: template.sections.length,
        userId: req.user?.userId
      });

      res.json({
        success: true,
        data: {
          template
        }
      });

    } catch (error) {
      logger.error('❌ Template generation failed', {
        guidelineId: req.params.id,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Template generation failed'
      });
    }
  }
);

// 要項削除
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      // 管理者権限チェック（必要に応じて）
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      // 削除実行（論理削除）
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.subsidyProgram.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      logger.info('🗑️ Subsidy guideline deleted', {
        guidelineId: id,
        userId
      });

      res.json({
        success: true,
        message: 'Subsidy guideline deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Guideline deletion failed', {
        guidelineId: req.params.id,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Deletion failed'
      });
    }
  }
);

// エラーハンドリング
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  logger.error('❌ Subsidy guidelines route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default router;