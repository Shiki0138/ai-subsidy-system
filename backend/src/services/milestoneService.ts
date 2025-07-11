import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

interface CreateMilestoneData {
  projectId: string;
  title: string;
  description: string;
  dueDate: Date;
  deliverables: any[];
  completionCriteria: string[];
  verificationMethod?: string;
}

interface UpdateMilestoneData {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: string;
  deliverables?: any[];
  completionCriteria?: string[];
  verificationMethod?: string;
}

interface CompleteMilestoneData {
  evidenceUrls?: string[];
  notes?: string;
}

interface AddEvidenceData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadedBy: string;
}

class MilestoneService {
  /**
   * マイルストーンを作成
   */
  async createMilestone(data: CreateMilestoneData, userId: string) {
    try {
      // プロジェクトの所有者確認
      const project = await prisma.projectProgress.findFirst({
        where: {
          id: data.projectId,
          userId
        }
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const milestone = await prisma.milestone.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          deliverables: data.deliverables,
          completionCriteria: data.completionCriteria,
          verificationMethod: data.verificationMethod,
          status: 'PENDING'
        },
        include: {
          evidenceFiles: true,
          project: {
            select: {
              id: true,
              projectName: true
            }
          }
        }
      });

      logger.info('✅ Milestone created', {
        milestoneId: milestone.id,
        projectId: data.projectId,
        title: data.title
      });

      return milestone;

    } catch (error) {
      logger.error('❌ Failed to create milestone', {
        projectId: data.projectId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * プロジェクトのマイルストーン一覧を取得
   */
  async getProjectMilestones(projectId: string, userId: string) {
    try {
      // プロジェクトの所有者確認
      const project = await prisma.projectProgress.findFirst({
        where: {
          id: projectId,
          userId
        }
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const milestones = await prisma.milestone.findMany({
        where: { projectId },
        orderBy: { dueDate: 'asc' },
        include: {
          evidenceFiles: true,
          _count: {
            select: {
              evidenceFiles: true
            }
          }
        }
      });

      return milestones;

    } catch (error) {
      logger.error('❌ Failed to get project milestones', {
        projectId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * マイルストーン詳細を取得
   */
  async getMilestoneById(milestoneId: string, userId: string) {
    try {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            userId
          }
        },
        include: {
          evidenceFiles: {
            orderBy: { createdAt: 'desc' }
          },
          project: {
            select: {
              id: true,
              projectName: true,
              status: true
            }
          }
        }
      });

      return milestone;

    } catch (error) {
      logger.error('❌ Failed to get milestone', {
        milestoneId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * マイルストーンを更新
   */
  async updateMilestone(milestoneId: string, data: UpdateMilestoneData, userId: string) {
    try {
      // 所有者確認
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            userId
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found or access denied');
      }

      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data,
        include: {
          evidenceFiles: true,
          project: {
            select: {
              id: true,
              projectName: true
            }
          }
        }
      });

      logger.info('✅ Milestone updated', {
        milestoneId,
        changes: Object.keys(data)
      });

      return updatedMilestone;

    } catch (error) {
      logger.error('❌ Failed to update milestone', {
        milestoneId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * マイルストーンを完了
   */
  async completeMilestone(milestoneId: string, userId: string, data: CompleteMilestoneData) {
    try {
      // 所有者確認
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            userId
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found or access denied');
      }

      const completedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'COMPLETED',
          completedDate: new Date()
        },
        include: {
          evidenceFiles: true,
          project: {
            select: {
              id: true,
              projectName: true
            }
          }
        }
      });

      // プロジェクト全体の進捗を更新
      await this.updateProjectProgress(milestone.projectId);

      logger.info('🎯 Milestone completed', {
        milestoneId,
        userId,
        completedAt: completedMilestone.completedDate
      });

      return completedMilestone;

    } catch (error) {
      logger.error('❌ Failed to complete milestone', {
        milestoneId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * マイルストーンを削除
   */
  async deleteMilestone(milestoneId: string, userId: string) {
    try {
      // 所有者確認
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            userId
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found or access denied');
      }

      // 関連する証憑ファイルも削除
      await prisma.$transaction([
        prisma.evidence.deleteMany({
          where: { milestoneId }
        }),
        prisma.milestone.delete({
          where: { id: milestoneId }
        })
      ]);

      // プロジェクト全体の進捗を更新
      await this.updateProjectProgress(milestone.projectId);

      logger.info('🗑️ Milestone deleted', {
        milestoneId,
        userId
      });

    } catch (error) {
      logger.error('❌ Failed to delete milestone', {
        milestoneId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 証憑ファイルを追加
   */
  async addEvidence(milestoneId: string, data: AddEvidenceData, userId: string) {
    try {
      // マイルストーンの所有者確認
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            userId
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found or access denied');
      }

      const evidence = await prisma.evidence.create({
        data: {
          milestoneId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: data.fileSize,
          description: data.description,
          uploadedBy: data.uploadedBy
        },
        include: {
          milestone: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      logger.info('📎 Evidence added to milestone', {
        milestoneId,
        evidenceId: evidence.id,
        fileName: data.fileName
      });

      return evidence;

    } catch (error) {
      logger.error('❌ Failed to add evidence', {
        milestoneId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 証憑ファイルを削除
   */
  async deleteEvidence(evidenceId: string, userId: string) {
    try {
      // 証憑の所有者確認
      const evidence = await prisma.evidence.findFirst({
        where: {
          id: evidenceId,
          milestone: {
            project: {
              userId
            }
          }
        }
      });

      if (!evidence) {
        throw new Error('Evidence not found or access denied');
      }

      await prisma.evidence.delete({
        where: { id: evidenceId }
      });

      logger.info('🗑️ Evidence deleted', {
        evidenceId,
        userId
      });

    } catch (error) {
      logger.error('❌ Failed to delete evidence', {
        evidenceId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * プロジェクト全体の進捗を更新
   */
  private async updateProjectProgress(projectId: string) {
    try {
      const milestones = await prisma.milestone.findMany({
        where: { projectId },
        select: {
          status: true
        }
      });

      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
      const overallProgress = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

      await prisma.projectProgress.update({
        where: { id: projectId },
        data: {
          overallProgress,
          lastUpdated: new Date()
        }
      });

      logger.info('📊 Project progress updated', {
        projectId,
        overallProgress,
        completedMilestones,
        totalMilestones
      });

    } catch (error) {
      logger.error('❌ Failed to update project progress', {
        projectId,
        error: error.message
      });
    }
  }

  /**
   * 期限切れマイルストーンを取得
   */
  async getOverdueMilestones(userId: string) {
    try {
      const overdueMilestones = await prisma.milestone.findMany({
        where: {
          project: {
            userId
          },
          dueDate: {
            lt: new Date()
          },
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        },
        include: {
          project: {
            select: {
              id: true,
              projectName: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      return overdueMilestones;

    } catch (error) {
      logger.error('❌ Failed to get overdue milestones', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

export const milestoneService = new MilestoneService();