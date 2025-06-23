import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { milestoneService } from '../services/milestoneService';
import { logger } from '../config/logger';

const router = express.Router();

// バリデーション
const createMilestoneValidation = [
  body('projectId').isString().notEmpty().withMessage('Project ID is required'),
  body('title').isString().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('deliverables').isArray().withMessage('Deliverables must be an array'),
  body('completionCriteria').isArray().withMessage('Completion criteria must be an array')
];

const updateMilestoneValidation = [
  body('title').optional().isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('dueDate').optional().isISO8601(),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']),
  body('deliverables').optional().isArray(),
  body('completionCriteria').optional().isArray(),
  body('verificationMethod').optional().isString()
];

// マイルストーン作成
router.post('/',
  authenticateToken,
  createMilestoneValidation,
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
      const milestoneData = {
        ...req.body,
        dueDate: new Date(req.body.dueDate)
      };

      const milestone = await milestoneService.createMilestone(milestoneData, userId);

      logger.info('✅ Milestone created', {
        milestoneId: milestone.id,
        projectId: req.body.projectId,
        title: req.body.title,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data: { milestone }
      });

    } catch (error) {
      logger.error('❌ Failed to create milestone', {
        projectId: req.body.projectId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create milestone',
        message: error.message
      });
    }
  }
);

// プロジェクトのマイルストーン一覧取得
router.get('/project/:projectId',
  authenticateToken,
  param('projectId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      const milestones = await milestoneService.getProjectMilestones(projectId, userId);

      res.json({
        success: true,
        data: {
          milestones,
          count: milestones.length
        }
      });

    } catch (error) {
      logger.error('❌ Failed to get project milestones', {
        projectId: req.params.projectId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get project milestones'
      });
    }
  }
);

// マイルストーン詳細取得
router.get('/:milestoneId',
  authenticateToken,
  param('milestoneId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.userId;

      const milestone = await milestoneService.getMilestoneById(milestoneId, userId);

      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: 'Milestone not found'
        });
      }

      res.json({
        success: true,
        data: { milestone }
      });

    } catch (error) {
      logger.error('❌ Failed to get milestone', {
        milestoneId: req.params.milestoneId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get milestone'
      });
    }
  }
);

// マイルストーン更新
router.put('/:milestoneId',
  authenticateToken,
  param('milestoneId').isString().notEmpty(),
  updateMilestoneValidation,
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

      const { milestoneId } = req.params;
      const userId = req.user?.userId;
      const updateData = req.body;

      // 日付変換
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }

      const milestone = await milestoneService.updateMilestone(milestoneId, updateData, userId);

      logger.info('✅ Milestone updated', {
        milestoneId,
        userId,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Milestone updated successfully',
        data: { milestone }
      });

    } catch (error) {
      logger.error('❌ Failed to update milestone', {
        milestoneId: req.params.milestoneId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update milestone',
        message: error.message
      });
    }
  }
);

// マイルストーン完了
router.post('/:milestoneId/complete',
  authenticateToken,
  param('milestoneId').isString().notEmpty(),
  body('evidenceUrls').optional().isArray(),
  body('notes').optional().isString(),
  async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.userId;
      const { evidenceUrls, notes } = req.body;

      const milestone = await milestoneService.completeMilestone(
        milestoneId,
        userId,
        { evidenceUrls, notes }
      );

      logger.info('🎯 Milestone completed', {
        milestoneId,
        userId,
        completedAt: milestone.completedDate
      });

      res.json({
        success: true,
        message: 'Milestone completed successfully',
        data: { milestone }
      });

    } catch (error) {
      logger.error('❌ Failed to complete milestone', {
        milestoneId: req.params.milestoneId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to complete milestone',
        message: error.message
      });
    }
  }
);

// マイルストーン削除
router.delete('/:milestoneId',
  authenticateToken,
  param('milestoneId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.userId;

      await milestoneService.deleteMilestone(milestoneId, userId);

      logger.info('🗑️ Milestone deleted', {
        milestoneId,
        userId
      });

      res.json({
        success: true,
        message: 'Milestone deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Failed to delete milestone', {
        milestoneId: req.params.milestoneId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete milestone',
        message: error.message
      });
    }
  }
);

// 証憑ファイルアップロード
router.post('/:milestoneId/evidence',
  authenticateToken,
  param('milestoneId').isString().notEmpty(),
  body('fileName').isString().notEmpty(),
  body('fileUrl').isString().notEmpty(),
  body('fileType').isString().notEmpty(),
  body('fileSize').isInt({ min: 1 }),
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

      const { milestoneId } = req.params;
      const userId = req.user?.userId;
      const evidenceData = {
        ...req.body,
        uploadedBy: userId
      };

      const evidence = await milestoneService.addEvidence(milestoneId, evidenceData, userId);

      logger.info('📎 Evidence added to milestone', {
        milestoneId,
        evidenceId: evidence.id,
        fileName: req.body.fileName,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Evidence added successfully',
        data: { evidence }
      });

    } catch (error) {
      logger.error('❌ Failed to add evidence', {
        milestoneId: req.params.milestoneId,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to add evidence',
        message: error.message
      });
    }
  }
);

export default router;