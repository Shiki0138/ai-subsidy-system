import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

interface CreateProgressData {
  applicationId: string;
  userId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  subsidyAmount: number;
  currentPhase?: string;
  riskLevel?: string;
  riskFactors?: any;
}

interface UpdateProgressData {
  projectName?: string;
  currentPhase?: string;
  overallProgress?: number;
  status?: string;
  nextMilestone?: Date;
  riskLevel?: string;
  riskFactors?: any;
  spentAmount?: number;
}

interface GetProjectsOptions {
  page: number;
  limit: number;
  status?: string;
}

class ProgressManagementService {
  /**
   * プロジェクト進捗を作成
   */
  async createProjectProgress(data: CreateProgressData) {
    try {
      // 申請書の存在確認
      const application = await prisma.application.findFirst({
        where: {
          id: data.applicationId,
          userId: data.userId
        }
      });

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      // 既存の進捗管理がないか確認
      const existingProgress = await prisma.projectProgress.findFirst({
        where: {
          applicationId: data.applicationId,
          userId: data.userId
        }
      });

      if (existingProgress) {
        throw new Error('Project progress already exists for this application');
      }

      const progress = await prisma.projectProgress.create({
        data: {
          applicationId: data.applicationId,
          userId: data.userId,
          projectName: data.projectName,
          startDate: data.startDate,
          endDate: data.endDate,
          currentPhase: data.currentPhase as any || 'PLANNING',
          overallProgress: 0,
          totalBudget: data.totalBudget,
          subsidyAmount: data.subsidyAmount,
          spentAmount: 0,
          riskLevel: data.riskLevel as any || 'LOW',
          riskFactors: data.riskFactors,
          status: 'ACTIVE'
        },
        include: {
          application: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          milestones: true,
          tasks: true
        }
      });

      logger.info('✅ Project progress created', {
        progressId: progress.id,
        applicationId: data.applicationId,
        projectName: data.projectName
      });

      return progress;

    } catch (error) {
      logger.error('❌ Failed to create project progress', {
        applicationId: data.applicationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 申請書IDから進捗を取得
   */
  async getProjectProgressByApplication(applicationId: string, userId: string) {
    try {
      const progress = await prisma.projectProgress.findFirst({
        where: {
          applicationId,
          userId
        },
        include: {
          application: {
            select: {
              id: true,
              title: true,
              status: true,
              subsidyProgram: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          milestones: {
            orderBy: { dueDate: 'asc' },
            include: {
              evidenceFiles: true
            }
          },
          tasks: {
            orderBy: { dueDate: 'asc' }
          },
          progressReports: {
            orderBy: { reportDate: 'desc' },
            take: 5
          }
        }
      });

      return progress;

    } catch (error) {
      logger.error('❌ Failed to get project progress', {
        applicationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * プロジェクト進捗を更新
   */
  async updateProjectProgress(progressId: string, userId: string, data: UpdateProgressData) {
    try {
      // 所有者確認
      const existingProgress = await prisma.projectProgress.findFirst({
        where: {
          id: progressId,
          userId
        }
      });

      if (!existingProgress) {
        throw new Error('Project progress not found or access denied');
      }

      const updateData: any = {
        ...data,
        lastUpdated: new Date()
      };

      // 日付文字列をDateオブジェクトに変換
      if (data.nextMilestone) {
        updateData.nextMilestone = new Date(data.nextMilestone);
      }

      const progress = await prisma.projectProgress.update({
        where: { id: progressId },
        data: updateData,
        include: {
          application: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          milestones: true,
          tasks: true
        }
      });

      logger.info('✅ Project progress updated', {
        progressId,
        changes: Object.keys(data)
      });

      return progress;

    } catch (error) {
      logger.error('❌ Failed to update project progress', {
        progressId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ユーザーのプロジェクト一覧を取得
   */
  async getUserProjects(userId: string, options: GetProjectsOptions) {
    try {
      const { page, limit, status } = options;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      const [projects, total] = await Promise.all([
        prisma.projectProgress.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            application: {
              select: {
                id: true,
                title: true,
                status: true,
                subsidyProgram: {
                  select: {
                    name: true,
                    category: true
                  }
                }
              }
            },
            _count: {
              select: {
                milestones: true,
                tasks: true
              }
            }
          }
        }),
        prisma.projectProgress.count({ where })
      ]);

      return {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ Failed to get user projects', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * プロジェクト進捗を削除
   */
  async deleteProjectProgress(progressId: string, userId: string) {
    try {
      // 所有者確認
      const existingProgress = await prisma.projectProgress.findFirst({
        where: {
          id: progressId,
          userId
        }
      });

      if (!existingProgress) {
        throw new Error('Project progress not found or access denied');
      }

      // 関連データも削除
      await prisma.$transaction([
        // マイルストーンの証憑ファイルを削除
        prisma.evidence.deleteMany({
          where: {
            milestone: {
              projectId: progressId
            }
          }
        }),
        // マイルストーンを削除
        prisma.milestone.deleteMany({
          where: { projectId: progressId }
        }),
        // タスクを削除
        prisma.projectTask.deleteMany({
          where: { projectId: progressId }
        }),
        // 進捗レポートを削除
        prisma.progressReport.deleteMany({
          where: { projectId: progressId }
        }),
        // プロジェクト進捗を削除
        prisma.projectProgress.delete({
          where: { id: progressId }
        })
      ]);

      logger.info('🗑️ Project progress deleted', {
        progressId,
        userId
      });

    } catch (error) {
      logger.error('❌ Failed to delete project progress', {
        progressId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * プロジェクト進捗の統計情報を取得
   */
  async getProjectStats(progressId: string, userId: string) {
    try {
      const progress = await prisma.projectProgress.findFirst({
        where: {
          id: progressId,
          userId
        },
        include: {
          milestones: true,
          tasks: true,
          progressReports: true
        }
      });

      if (!progress) {
        throw new Error('Project progress not found');
      }

      const totalMilestones = progress.milestones.length;
      const completedMilestones = progress.milestones.filter(m => m.status === 'COMPLETED').length;
      const totalTasks = progress.tasks.length;
      const completedTasks = progress.tasks.filter(t => t.status === 'COMPLETED').length;
      const overdueTasks = progress.tasks.filter(t => 
        t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()
      ).length;

      const budgetUtilization = progress.totalBudget > 0 
        ? (progress.spentAmount / progress.totalBudget) * 100 
        : 0;

      const timeElapsed = progress.startDate && progress.endDate
        ? ((new Date().getTime() - progress.startDate.getTime()) / 
           (progress.endDate.getTime() - progress.startDate.getTime())) * 100
        : 0;

      return {
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          completionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        },
        budget: {
          total: progress.totalBudget,
          spent: progress.spentAmount,
          remaining: progress.totalBudget - progress.spentAmount,
          utilizationRate: budgetUtilization
        },
        timeline: {
          startDate: progress.startDate,
          endDate: progress.endDate,
          timeElapsed: Math.min(Math.max(timeElapsed, 0), 100),
          daysRemaining: progress.endDate 
            ? Math.max(0, Math.ceil((progress.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : null
        },
        risk: {
          level: progress.riskLevel,
          factors: progress.riskFactors
        }
      };

    } catch (error) {
      logger.error('❌ Failed to get project stats', {
        progressId,
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

export const progressManagementService = new ProgressManagementService();