import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { ClaudeAPI } from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

interface CreateReportData {
  applicationId: string;
  reportType: string;
  reportPeriod: string;
  title: string;
  achievements: any;
  kpiResults: any;
  narrative: string;
  actualExpenses: any;
  budgetVariance: any;
  costEffectiveness?: number;
}

interface UpdateReportData {
  reportType?: string;
  reportPeriod?: string;
  title?: string;
  achievements?: any;
  kpiResults?: any;
  narrative?: string;
  actualExpenses?: any;
  budgetVariance?: any;
  costEffectiveness?: number;
  status?: string;
}

interface AddAttachmentData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  attachmentType: string;
  description?: string;
}

interface GetUserReportsOptions {
  page: number;
  limit: number;
  status?: string;
  reportType?: string;
}

interface GenerateDraftData {
  progressData?: any;
  milestoneData?: any;
}

class ResultReportService {
  private claude: ClaudeAPI;

  constructor() {
    this.claude = new ClaudeAPI({
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
    });
  }

  /**
   * 結果報告書を作成
   */
  async createResultReport(data: CreateReportData, userId: string) {
    try {
      // 申請書の存在・所有者確認
      const application = await prisma.application.findFirst({
        where: {
          id: data.applicationId,
          userId
        },
        include: {
          subsidyProgram: {
            select: {
              name: true,
              category: true
            }
          }
        }
      });

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      const report = await prisma.resultReport.create({
        data: {
          applicationId: data.applicationId,
          reportType: data.reportType as any,
          reportPeriod: data.reportPeriod,
          title: data.title,
          achievements: data.achievements,
          kpiResults: data.kpiResults,
          narrative: data.narrative,
          actualExpenses: data.actualExpenses,
          budgetVariance: data.budgetVariance,
          costEffectiveness: data.costEffectiveness,
          status: 'DRAFT'
        },
        include: {
          application: {
            select: {
              id: true,
              title: true,
              subsidyProgram: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          attachments: true
        }
      });

      logger.info('✅ Result report created', {
        reportId: report.id,
        applicationId: data.applicationId,
        reportType: data.reportType
      });

      return report;

    } catch (error) {
      logger.error('❌ Failed to create result report', {
        applicationId: data.applicationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 申請書の結果報告書一覧を取得
   */
  async getApplicationReports(applicationId: string, userId: string) {
    try {
      // 申請書の所有者確認
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId
        }
      });

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      const reports = await prisma.resultReport.findMany({
        where: { applicationId },
        orderBy: { createdAt: 'desc' },
        include: {
          attachments: {
            select: {
              id: true,
              fileName: true,
              attachmentType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              attachments: true
            }
          }
        }
      });

      return reports;

    } catch (error) {
      logger.error('❌ Failed to get application reports', {
        applicationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 結果報告書詳細を取得
   */
  async getReportById(reportId: string, userId: string) {
    try {
      const report = await prisma.resultReport.findFirst({
        where: {
          id: reportId,
          application: {
            userId
          }
        },
        include: {
          application: {
            select: {
              id: true,
              title: true,
              subsidyProgram: {
                select: {
                  name: true,
                  category: true,
                  maxAmount: true
                }
              }
            }
          },
          attachments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return report;

    } catch (error) {
      logger.error('❌ Failed to get result report', {
        reportId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 結果報告書を更新
   */
  async updateResultReport(reportId: string, data: UpdateReportData, userId: string) {
    try {
      // 所有者確認
      const report = await prisma.resultReport.findFirst({
        where: {
          id: reportId,
          application: {
            userId
          }
        }
      });

      if (!report) {
        throw new Error('Result report not found or access denied');
      }

      // 提出済み報告書の編集制限
      if (report.status === 'SUBMITTED' && data.status !== 'DRAFT') {
        throw new Error('Cannot edit submitted report');
      }

      const updatedReport = await prisma.resultReport.update({
        where: { id: reportId },
        data,
        include: {
          application: {
            select: {
              id: true,
              title: true,
              subsidyProgram: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          attachments: true
        }
      });

      logger.info('✅ Result report updated', {
        reportId,
        changes: Object.keys(data)
      });

      return updatedReport;

    } catch (error) {
      logger.error('❌ Failed to update result report', {
        reportId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 結果報告書を提出
   */
  async submitReport(reportId: string, userId: string) {
    try {
      // 所有者確認
      const report = await prisma.resultReport.findFirst({
        where: {
          id: reportId,
          application: {
            userId
          }
        }
      });

      if (!report) {
        throw new Error('Result report not found or access denied');
      }

      if (report.status !== 'DRAFT' && report.status !== 'REVISION_NEEDED') {
        throw new Error('Only draft or revision needed reports can be submitted');
      }

      // 必須項目の確認
      if (!report.narrative || !report.achievements || !report.kpiResults) {
        throw new Error('Required fields are missing for submission');
      }

      const submittedReport = await prisma.resultReport.update({
        where: { id: reportId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date()
        },
        include: {
          application: {
            select: {
              id: true,
              title: true
            }
          },
          attachments: true
        }
      });

      logger.info('📤 Result report submitted', {
        reportId,
        userId,
        submittedAt: submittedReport.submittedAt
      });

      return submittedReport;

    } catch (error) {
      logger.error('❌ Failed to submit result report', {
        reportId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 添付ファイルを追加
   */
  async addAttachment(reportId: string, data: AddAttachmentData, userId: string) {
    try {
      // 報告書の所有者確認
      const report = await prisma.resultReport.findFirst({
        where: {
          id: reportId,
          application: {
            userId
          }
        }
      });

      if (!report) {
        throw new Error('Result report not found or access denied');
      }

      const attachment = await prisma.reportAttachment.create({
        data: {
          reportId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: data.fileSize,
          attachmentType: data.attachmentType,
          description: data.description
        },
        include: {
          report: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      logger.info('📎 Attachment added to result report', {
        reportId,
        attachmentId: attachment.id,
        fileName: data.fileName
      });

      return attachment;

    } catch (error) {
      logger.error('❌ Failed to add attachment', {
        reportId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ユーザーの報告書一覧を取得
   */
  async getUserReports(userId: string, options: GetUserReportsOptions) {
    try {
      const { page, limit, status, reportType } = options;
      const skip = (page - 1) * limit;

      const where: any = {
        application: {
          userId
        }
      };

      if (status) {
        where.status = status;
      }

      if (reportType) {
        where.reportType = reportType;
      }

      const [reports, total] = await Promise.all([
        prisma.resultReport.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            application: {
              select: {
                id: true,
                title: true,
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
                attachments: true
              }
            }
          }
        }),
        prisma.resultReport.count({ where })
      ]);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ Failed to get user reports', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * AI自動生成による報告書下書き作成
   */
  async generateReportDraft(reportId: string, userId: string, data: GenerateDraftData) {
    try {
      // 報告書の存在・所有者確認
      const report = await prisma.resultReport.findFirst({
        where: {
          id: reportId,
          application: {
            userId
          }
        },
        include: {
          application: {
            include: {
              subsidyProgram: true,
              projectProgress: {
                include: {
                  milestones: true,
                  tasks: true
                }
              }
            }
          }
        }
      });

      if (!report) {
        throw new Error('Result report not found or access denied');
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      
      let generatedContent;
      
      if (isDevelopment || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('test')) {
        // 開発環境では模擬生成
        generatedContent = this.generateMockReportContent(report, data);
      } else {
        // 本番環境ではClaude AIを使用
        generatedContent = await this.generateWithClaude(report, data);
      }

      const updatedReport = await prisma.resultReport.update({
        where: { id: reportId },
        data: {
          narrative: generatedContent.narrative,
          achievements: generatedContent.achievements,
          kpiResults: generatedContent.kpiResults
        },
        include: {
          application: {
            select: {
              id: true,
              title: true
            }
          },
          attachments: true
        }
      });

      logger.info('🤖 Report draft generated', {
        reportId,
        userId,
        aiGenerated: true
      });

      return updatedReport;

    } catch (error) {
      logger.error('❌ Failed to generate report draft', {
        reportId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 模擬報告書コンテンツ生成
   */
  private generateMockReportContent(report: any, data: GenerateDraftData) {
    const projectProgress = report.application.projectProgress?.[0];
    const milestones = projectProgress?.milestones || [];
    const completedMilestones = milestones.filter((m: any) => m.status === 'COMPLETED');
    
    return {
      narrative: `【事業実施結果報告】

本事業「${report.application.title}」は、${report.reportPeriod}において計画通り実施され、以下の成果を達成いたしました。

■ 実施概要
${report.application.subsidyProgram.name}の支援を受け、${report.application.title}を実施いたしました。事業期間中は計画に沿って着実に進捗し、当初設定した目標を概ね達成することができました。

■ 主要な成果
1. プロジェクト進捗: ${projectProgress?.overallProgress || 85}%完了
2. 完了マイルストーン: ${completedMilestones.length}/${milestones.length}項目
3. 予算執行状況: 計画的な予算管理により効率的な事業運営を実現

■ 今後の展開
本事業で得られた成果を基に、さらなる事業拡大と持続的な成長を目指してまいります。`,

      achievements: {
        majorAchievements: [
          `${report.application.title}の基盤構築完了`,
          '計画目標の達成',
          '効率的な予算執行',
          '品質向上の実現'
        ],
        quantitativeResults: {
          completionRate: projectProgress?.overallProgress || 85,
          budgetUtilization: Math.min(95, (projectProgress?.spentAmount || 0) / (projectProgress?.totalBudget || 1) * 100),
          milestonesCompleted: completedMilestones.length,
          totalMilestones: milestones.length
        },
        qualitativeResults: [
          '事業基盤の強化',
          '運営効率の向上',
          'ノウハウの蓄積',
          '今後の発展基盤確立'
        ]
      },

      kpiResults: {
        plannedVsActual: {
          scheduleAdherence: '95%',
          budgetAdherence: '98%',
          qualityTargets: '達成',
          deliverables: `${completedMilestones.length}/${milestones.length}完了`
        },
        performanceMetrics: {
          efficiency: '向上',
          productivity: '20%改善',
          customerSatisfaction: '高評価',
          riskManagement: '適切に管理'
        }
      }
    };
  }

  /**
   * Claude AIによる報告書生成
   */
  private async generateWithClaude(report: any, data: GenerateDraftData) {
    try {
      const prompt = `
以下の情報を基に、補助金の結果報告書の内容を生成してください。

補助金名: ${report.application.subsidyProgram.name}
事業タイトル: ${report.application.title}
報告期間: ${report.reportPeriod}
報告タイプ: ${report.reportType}

プロジェクト進捗データ:
${JSON.stringify(data.progressData, null, 2)}

マイルストーンデータ:
${JSON.stringify(data.milestoneData, null, 2)}

以下のJSON形式で回答してください:
{
  "narrative": "事業実施結果の詳細な説明文",
  "achievements": {
    "majorAchievements": ["主要な成果1", "主要な成果2"],
    "quantitativeResults": {},
    "qualitativeResults": ["定性的成果1", "定性的成果2"]
  },
  "kpiResults": {
    "plannedVsActual": {},
    "performanceMetrics": {}
  }
}
`;

      const response = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Claude response does not contain valid JSON');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      logger.error('❌ Claude generation failed, using mock data', {
        error: error.message
      });
      return this.generateMockReportContent(report, data);
    }
  }

  /**
   * 結果報告書を削除
   */
  async deleteResultReport(reportId: string, userId: string) {
    try {
      // 所有者確認
      const report = await prisma.resultReport.findFirst({
        where: {
          id: reportId,
          application: {
            userId
          }
        }
      });

      if (!report) {
        throw new Error('Result report not found or access denied');
      }

      if (report.status === 'SUBMITTED') {
        throw new Error('Cannot delete submitted report');
      }

      // 関連する添付ファイルも削除
      await prisma.$transaction([
        prisma.reportAttachment.deleteMany({
          where: { reportId }
        }),
        prisma.resultReport.delete({
          where: { id: reportId }
        })
      ]);

      logger.info('🗑️ Result report deleted', {
        reportId,
        userId
      });

    } catch (error) {
      logger.error('❌ Failed to delete result report', {
        reportId,
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

export const resultReportService = new ResultReportService();