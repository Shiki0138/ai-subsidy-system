import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { documentTemplateService } from '../services/documentTemplateService';
import { logger } from '../config/logger';

const router = express.Router();

// バリデーション
const createTemplateValidation = [
  body('documentType').isString().notEmpty().withMessage('Document type is required'),
  body('templateName').isString().isLength({ min: 1, max: 255 }).withMessage('Template name is required'),
  body('description').optional().isString(),
  body('structure').isObject().withMessage('Structure must be an object'),
  body('defaultContent').isObject().withMessage('Default content must be an object'),
  body('requiredFields').isArray().withMessage('Required fields must be an array'),
  body('category').optional().isString(),
  body('tags').optional().isArray()
];

const updateTemplateValidation = [
  body('templateName').optional().isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('structure').optional().isObject(),
  body('defaultContent').optional().isObject(),
  body('requiredFields').optional().isArray(),
  body('placeholders').optional().isObject(),
  body('formatOptions').optional().isObject(),
  body('validationRules').optional().isObject(),
  body('isActive').optional().isBoolean(),
  body('category').optional().isString(),
  body('tags').optional().isArray()
];

const generateDocumentValidation = [
  body('templateId').isString().notEmpty().withMessage('Template ID is required'),
  body('inputData').isObject().withMessage('Input data must be an object'),
  body('title').isString().notEmpty().withMessage('Document title is required'),
  body('fileFormat').optional().isIn(['PDF', 'DOCX', 'HTML']).withMessage('Invalid file format')
];

// テンプレート作成
router.post('/',
  authenticateToken,
  createTemplateValidation,
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

      // 管理者権限チェック
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const templateData = req.body;
      const template = await documentTemplateService.createTemplate(templateData);

      logger.info('✅ Document template created', {
        templateId: template.id,
        documentType: template.documentType,
        templateName: template.templateName,
        createdBy: req.user?.userId
      });

      res.status(201).json({
        success: true,
        message: 'Document template created successfully',
        data: { template }
      });

    } catch (error) {
      logger.error('❌ Failed to create document template', {
        documentType: req.body.documentType,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create document template',
        message: error.message
      });
    }
  }
);

// テンプレート一覧取得
router.get('/',
  authenticateToken,
  query('documentType').optional().isString(),
  query('category').optional().isString(),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const filters = {
        documentType: req.query.documentType as string,
        category: req.query.category as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await documentTemplateService.getTemplates(filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ Failed to get document templates', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get document templates'
      });
    }
  }
);

// テンプレート詳細取得
router.get('/:templateId',
  authenticateToken,
  param('templateId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const template = await documentTemplateService.getTemplateById(templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Document template not found'
        });
      }

      res.json({
        success: true,
        data: { template }
      });

    } catch (error) {
      logger.error('❌ Failed to get document template', {
        templateId: req.params.templateId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get document template'
      });
    }
  }
);

// テンプレート更新
router.put('/:templateId',
  authenticateToken,
  param('templateId').isString().notEmpty(),
  updateTemplateValidation,
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

      // 管理者権限チェック
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { templateId } = req.params;
      const updateData = req.body;

      const template = await documentTemplateService.updateTemplate(templateId, updateData);

      logger.info('✅ Document template updated', {
        templateId,
        changes: Object.keys(updateData),
        updatedBy: req.user?.userId
      });

      res.json({
        success: true,
        message: 'Document template updated successfully',
        data: { template }
      });

    } catch (error) {
      logger.error('❌ Failed to update document template', {
        templateId: req.params.templateId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update document template',
        message: error.message
      });
    }
  }
);

// ドキュメント生成
router.post('/generate',
  authenticateToken,
  generateDocumentValidation,
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
      const { templateId, inputData, title, fileFormat = 'PDF' } = req.body;

      const document = await documentTemplateService.generateDocument(
        templateId,
        inputData,
        title,
        fileFormat,
        userId
      );

      logger.info('📄 Document generated from template', {
        templateId,
        documentId: document.id,
        title,
        fileFormat,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Document generated successfully',
        data: { document }
      });

    } catch (error) {
      logger.error('❌ Failed to generate document', {
        templateId: req.body.templateId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate document',
        message: error.message
      });
    }
  }
);

// ユーザーの生成済みドキュメント一覧
router.get('/user/documents',
  authenticateToken,
  query('status').optional().isString(),
  query('templateId').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const filters = {
        status: req.query.status as string,
        templateId: req.query.templateId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await documentTemplateService.getUserDocuments(userId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ Failed to get user documents', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user documents'
      });
    }
  }
);

// 生成済みドキュメント詳細取得
router.get('/documents/:documentId',
  authenticateToken,
  param('documentId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user?.userId;

      const document = await documentTemplateService.getGeneratedDocument(documentId, userId);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Generated document not found'
        });
      }

      res.json({
        success: true,
        data: { document }
      });

    } catch (error) {
      logger.error('❌ Failed to get generated document', {
        documentId: req.params.documentId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get generated document'
      });
    }
  }
);

// ドキュメント確定
router.post('/documents/:documentId/finalize',
  authenticateToken,
  param('documentId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user?.userId;

      const document = await documentTemplateService.finalizeDocument(documentId, userId);

      logger.info('✅ Document finalized', {
        documentId,
        userId,
        finalizedAt: document.finalizedAt
      });

      res.json({
        success: true,
        message: 'Document finalized successfully',
        data: { document }
      });

    } catch (error) {
      logger.error('❌ Failed to finalize document', {
        documentId: req.params.documentId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to finalize document',
        message: error.message
      });
    }
  }
);

// テンプレート複製
router.post('/:templateId/duplicate',
  authenticateToken,
  param('templateId').isString().notEmpty(),
  body('templateName').isString().notEmpty().withMessage('New template name is required'),
  async (req, res) => {
    try {
      // 管理者権限チェック
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { templateId } = req.params;
      const { templateName } = req.body;

      const duplicatedTemplate = await documentTemplateService.duplicateTemplate(templateId, templateName);

      logger.info('📄 Template duplicated', {
        originalTemplateId: templateId,
        newTemplateId: duplicatedTemplate.id,
        newTemplateName: templateName,
        createdBy: req.user?.userId
      });

      res.status(201).json({
        success: true,
        message: 'Template duplicated successfully',
        data: { template: duplicatedTemplate }
      });

    } catch (error) {
      logger.error('❌ Failed to duplicate template', {
        templateId: req.params.templateId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to duplicate template',
        message: error.message
      });
    }
  }
);

// テンプレート削除
router.delete('/:templateId',
  authenticateToken,
  param('templateId').isString().notEmpty(),
  async (req, res) => {
    try {
      // 管理者権限チェック
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { templateId } = req.params;
      await documentTemplateService.deleteTemplate(templateId);

      logger.info('🗑️ Document template deleted', {
        templateId,
        deletedBy: req.user?.userId
      });

      res.json({
        success: true,
        message: 'Document template deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Failed to delete document template', {
        templateId: req.params.templateId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete document template',
        message: error.message
      });
    }
  }
);

export default router;