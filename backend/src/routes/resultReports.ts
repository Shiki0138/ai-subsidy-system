import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { resultReportService } from '../services/resultReportService';
import { logger } from '../config/logger';

const router = express.Router();

// バリデーション
const createReportValidation = [
  body('applicationId').isString().notEmpty().withMessage('Application ID is required'),
  body('reportType').isIn(['INTERIM', 'FINAL', 'FOLLOW_UP', 'ANNUAL']).withMessage('Invalid report type'),
  body('reportPeriod').isString().notEmpty().withMessage('Report period is required'),
  body('title').isString().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('achievements').isObject().withMessage('Achievements must be an object'),
  body('kpiResults').isObject().withMessage('KPI results must be an object'),
  body('narrative').isString().notEmpty().withMessage('Narrative is required'),
  body('actualExpenses').isObject().withMessage('Actual expenses must be an object'),
  body('budgetVariance').isObject().withMessage('Budget variance must be an object')
];

const updateReportValidation = [
  body('reportType').optional().isIn(['INTERIM', 'FINAL', 'FOLLOW_UP', 'ANNUAL']),
  body('reportPeriod').optional().isString(),
  body('title').optional().isString().isLength({ min: 1, max: 255 }),
  body('achievements').optional().isObject(),
  body('kpiResults').optional().isObject(),
  body('narrative').optional().isString(),
  body('actualExpenses').optional().isObject(),
  body('budgetVariance').optional().isObject(),
  body('costEffectiveness').optional().isFloat(),
  body('status').optional().isIn(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_NEEDED'])
];

// 結果報告書作成
router.post('/',
  authenticateToken,
  createReportValidation,
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
      const reportData = req.body;

      const report = await resultReportService.createResultReport(reportData, userId);

      logger.info('✅ Result report created', {
        reportId: report.id,
        applicationId: req.body.applicationId,
        reportType: req.body.reportType,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Result report created successfully',
        data: { report }
      });

    } catch (error) {
      logger.error('❌ Failed to create result report', {
        applicationId: req.body.applicationId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create result report',
        message: error.message
      });
    }
  }
);

// 申請書の結果報告書一覧取得
router.get('/application/:applicationId',
  authenticateToken,
  param('applicationId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const userId = req.user?.userId;

      const reports = await resultReportService.getApplicationReports(applicationId, userId);

      res.json({
        success: true,
        data: {
          reports,
          count: reports.length
        }
      });

    } catch (error) {
      logger.error('❌ Failed to get application reports', {
        applicationId: req.params.applicationId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get application reports'
      });
    }
  }
);

// 結果報告書詳細取得
router.get('/:reportId',
  authenticateToken,
  param('reportId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?.userId;

      const report = await resultReportService.getReportById(reportId, userId);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Result report not found'
        });
      }

      res.json({
        success: true,
        data: { report }
      });

    } catch (error) {
      logger.error('❌ Failed to get result report', {
        reportId: req.params.reportId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get result report'
      });
    }
  }
);

// 結果報告書更新
router.put('/:reportId',
  authenticateToken,
  param('reportId').isString().notEmpty(),
  updateReportValidation,
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

      const { reportId } = req.params;
      const userId = req.user?.userId;
      const updateData = req.body;

      const report = await resultReportService.updateResultReport(reportId, updateData, userId);

      logger.info('✅ Result report updated', {
        reportId,
        userId,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Result report updated successfully',
        data: { report }
      });

    } catch (error) {
      logger.error('❌ Failed to update result report', {
        reportId: req.params.reportId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update result report',
        message: error.message
      });
    }
  }
);

// 結果報告書提出
router.post('/:reportId/submit',
  authenticateToken,
  param('reportId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?.userId;

      const report = await resultReportService.submitReport(reportId, userId);

      logger.info('📤 Result report submitted', {
        reportId,
        userId,
        submittedAt: report.submittedAt
      });

      res.json({
        success: true,
        message: 'Result report submitted successfully',
        data: { report }
      });

    } catch (error) {
      logger.error('❌ Failed to submit result report', {
        reportId: req.params.reportId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to submit result report',
        message: error.message
      });
    }
  }
);

// 添付ファイルアップロード
router.post('/:reportId/attachments',
  authenticateToken,
  param('reportId').isString().notEmpty(),
  body('fileName').isString().notEmpty(),
  body('fileUrl').isString().notEmpty(),
  body('fileType').isString().notEmpty(),
  body('fileSize').isInt({ min: 1 }),
  body('attachmentType').isString().notEmpty(),
  body('description').optional().isString(),
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

      const { reportId } = req.params;
      const userId = req.user?.userId;
      const attachmentData = req.body;

      const attachment = await resultReportService.addAttachment(reportId, attachmentData, userId);

      logger.info('📎 Attachment added to result report', {
        reportId,
        attachmentId: attachment.id,
        fileName: req.body.fileName,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Attachment added successfully',
        data: { attachment }
      });

    } catch (error) {
      logger.error('❌ Failed to add attachment', {
        reportId: req.params.reportId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to add attachment',
        message: error.message
      });
    }
  }
);

// ユーザーの報告書一覧取得
router.get('/user/list',
  authenticateToken,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('reportType').optional().isString(),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const reportType = req.query.reportType as string;

      const result = await resultReportService.getUserReports(
        userId,
        { page, limit, status, reportType }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ Failed to get user reports', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user reports'
      });
    }
  }
);

// AI自動生成による報告書下書き作成
router.post('/:reportId/generate-draft',
  authenticateToken,
  param('reportId').isString().notEmpty(),
  body('progressData').optional().isObject(),
  body('milestoneData').optional().isObject(),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?.userId;
      const { progressData, milestoneData } = req.body;

      const report = await resultReportService.generateReportDraft(
        reportId,
        userId,
        { progressData, milestoneData }
      );

      logger.info('🤖 Report draft generated with AI', {
        reportId,
        userId
      });

      res.json({
        success: true,
        message: 'Report draft generated successfully',
        data: { report }
      });

    } catch (error) {
      logger.error('❌ Failed to generate report draft', {
        reportId: req.params.reportId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate report draft',
        message: error.message
      });
    }
  }
);

// 結果報告書削除
router.delete('/:reportId',
  authenticateToken,
  param('reportId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?.userId;

      await resultReportService.deleteResultReport(reportId, userId);

      logger.info('🗑️ Result report deleted', {
        reportId,
        userId
      });

      res.json({
        success: true,
        message: 'Result report deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Failed to delete result report', {
        reportId: req.params.reportId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete result report',
        message: error.message
      });
    }
  }
);

export default router;