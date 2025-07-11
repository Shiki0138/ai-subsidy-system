import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { progressManagementService } from '../services/progressManagementService';
import { logger } from '../config/logger';

const router = express.Router();

// バリデーション
const createProgressValidation = [
  body('applicationId').isString().notEmpty().withMessage('Application ID is required'),
  body('projectName').isString().isLength({ min: 1, max: 255 }).withMessage('Project name is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('totalBudget').isInt({ min: 0 }).withMessage('Total budget must be a positive integer'),
  body('subsidyAmount').isInt({ min: 0 }).withMessage('Subsidy amount must be a positive integer')
];

const updateProgressValidation = [
  body('projectName').optional().isString().isLength({ min: 1, max: 255 }),
  body('currentPhase').optional().isIn(['PLANNING', 'IMPLEMENTING', 'MONITORING', 'CLOSING', 'COMPLETED']),
  body('overallProgress').optional().isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(['ACTIVE', 'ON_HOLD', 'DELAYED', 'COMPLETED', 'CANCELLED']),
  body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('spentAmount').optional().isInt({ min: 0 })
];

// プロジェクト進捗作成
router.post('/', 
  authenticateToken,
  createProgressValidation,
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
      const progressData = {
        ...req.body,
        userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };

      const progress = await progressManagementService.createProjectProgress(progressData);

      logger.info('✅ Project progress created', {
        projectId: progress.id,
        applicationId: req.body.applicationId,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Project progress created successfully',
        data: { progress }
      });

    } catch (error) {
      logger.error('❌ Failed to create project progress', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create project progress',
        message: error.message
      });
    }
  }
);

// プロジェクト進捗取得
router.get('/application/:applicationId',
  authenticateToken,
  param('applicationId').isString().notEmpty(),
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

      const { applicationId } = req.params;
      const userId = req.user?.userId;

      const progress = await progressManagementService.getProjectProgressByApplication(
        applicationId,
        userId
      );

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Project progress not found'
        });
      }

      res.json({
        success: true,
        data: { progress }
      });

    } catch (error) {
      logger.error('❌ Failed to get project progress', {
        applicationId: req.params.applicationId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get project progress'
      });
    }
  }
);

// プロジェクト進捗更新
router.put('/:progressId',
  authenticateToken,
  param('progressId').isString().notEmpty(),
  updateProgressValidation,
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

      const { progressId } = req.params;
      const userId = req.user?.userId;
      const updateData = req.body;

      const progress = await progressManagementService.updateProjectProgress(
        progressId,
        userId,
        updateData
      );

      logger.info('✅ Project progress updated', {
        progressId,
        userId,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Project progress updated successfully',
        data: { progress }
      });

    } catch (error) {
      logger.error('❌ Failed to update project progress', {
        progressId: req.params.progressId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update project progress',
        message: error.message
      });
    }
  }
);

// ユーザーのプロジェクト一覧取得
router.get('/user',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await progressManagementService.getUserProjects(
        userId,
        { page, limit, status }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ Failed to get user projects', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user projects'
      });
    }
  }
);

// プロジェクト削除
router.delete('/:progressId',
  authenticateToken,
  param('progressId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { progressId } = req.params;
      const userId = req.user?.userId;

      await progressManagementService.deleteProjectProgress(progressId, userId);

      logger.info('🗑️ Project progress deleted', {
        progressId,
        userId
      });

      res.json({
        success: true,
        message: 'Project progress deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Failed to delete project progress', {
        progressId: req.params.progressId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete project progress',
        message: error.message
      });
    }
  }
);

export default router;