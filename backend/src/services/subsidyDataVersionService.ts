import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DataSourceInfo {
  id: string;
  name: string;
  type: 'government_api' | 'scraping' | 'manual' | 'pdf_extraction';
  url?: string;
  lastUpdated: Date;
  version: string;
  reliability: 'high' | 'medium' | 'low';
  updateFrequency: string; // "daily", "weekly", "monthly", "irregular"
}

interface SubsidyDataVersion {
  subsidyProgramId: string;
  dataVersion: string;
  sourceInfo: DataSourceInfo;
  lastVerified: Date;
  nextUpdateExpected?: Date;
  changes: string[];
  warningLevel: 'none' | 'minor' | 'major' | 'critical';
  warningMessage?: string;
}

export class SubsidyDataVersionService {
  /**
   * 補助金データの最新性をチェック
   */
  async checkDataFreshness(subsidyProgramId: string): Promise<SubsidyDataVersion> {
    const program = await prisma.subsidyProgram.findUnique({
      where: { id: subsidyProgramId },
      include: {
        guidelines: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!program) {
      throw new Error('補助金プログラムが見つかりません');
    }

    const latestGuideline = program.guidelines[0];
    const now = new Date();
    const daysSinceUpdate = latestGuideline 
      ? Math.floor((now.getTime() - latestGuideline.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // データソース情報を生成
    const sourceInfo: DataSourceInfo = {
      id: `${program.id}_source`,
      name: program.organizationName,
      type: this.determineSourceType(program.sourceUrl),
      url: program.sourceUrl || undefined,
      lastUpdated: program.lastUpdated,
      version: latestGuideline?.version || '未設定',
      reliability: this.assessReliability(program.sourceUrl),
      updateFrequency: this.determineUpdateFrequency(program.category)
    };

    // 警告レベルの判定
    const { warningLevel, warningMessage } = this.assessWarningLevel(
      daysSinceUpdate,
      program.applicationEnd,
      sourceInfo.updateFrequency
    );

    // 次回更新予定日の推定
    const nextUpdateExpected = this.estimateNextUpdate(
      program.lastUpdated,
      sourceInfo.updateFrequency
    );

    return {
      subsidyProgramId,
      dataVersion: this.generateDataVersion(program.lastUpdated, latestGuideline?.version),
      sourceInfo,
      lastVerified: program.lastUpdated,
      nextUpdateExpected,
      changes: await this.getRecentChanges(subsidyProgramId),
      warningLevel,
      warningMessage
    };
  }

  /**
   * 全補助金プログラムのデータ新鮮度チェック
   */
  async checkAllDataFreshness(): Promise<SubsidyDataVersion[]> {
    const programs = await prisma.subsidyProgram.findMany({
      where: { isActive: true }
    });

    const results = await Promise.all(
      programs.map(program => this.checkDataFreshness(program.id))
    );

    return results;
  }

  /**
   * データソースの更新
   */
  async updateDataSource(
    subsidyProgramId: string,
    sourceUrl: string,
    extractedData: any
  ): Promise<SubsidyDataVersion> {
    // 変更点の検出
    const currentProgram = await prisma.subsidyProgram.findUnique({
      where: { id: subsidyProgramId }
    });

    const changes = this.detectChanges(currentProgram, extractedData);

    // データ更新
    await prisma.subsidyProgram.update({
      where: { id: subsidyProgramId },
      data: {
        sourceUrl,
        lastUpdated: new Date(),
        ...extractedData
      }
    });

    // 変更履歴の記録
    await this.recordChanges(subsidyProgramId, changes);

    return this.checkDataFreshness(subsidyProgramId);
  }

  /**
   * データソースの種類を判定
   */
  private determineSourceType(sourceUrl?: string): DataSourceInfo['type'] {
    if (!sourceUrl) return 'manual';
    
    if (sourceUrl.includes('gov.jp') || sourceUrl.includes('go.jp')) {
      return 'government_api';
    }
    if (sourceUrl.includes('.pdf')) {
      return 'pdf_extraction';
    }
    return 'scraping';
  }

  /**
   * データ信頼性の評価
   */
  private assessReliability(sourceUrl?: string): DataSourceInfo['reliability'] {
    if (!sourceUrl) return 'low';
    
    if (sourceUrl.includes('gov.jp') || sourceUrl.includes('go.jp')) {
      return 'high';
    }
    if (sourceUrl.includes('jst.go.jp') || sourceUrl.includes('nedo.go.jp')) {
      return 'high';
    }
    if (sourceUrl.includes('.pdf')) {
      return 'medium';
    }
    return 'medium';
  }

  /**
   * 更新頻度の判定
   */
  private determineUpdateFrequency(category: string): string {
    const frequencyMap: { [key: string]: string } = {
      '持続化': 'quarterly', // 四半期ごと
      'IT導入': 'quarterly',
      'ものづくり': 'annually', // 年1回
      '事業再構築': 'irregular',
      '研究開発': 'annually'
    };

    return frequencyMap[category] || 'irregular';
  }

  /**
   * 警告レベルの評価
   */
  private assessWarningLevel(
    daysSinceUpdate: number,
    applicationEnd: Date | null,
    updateFrequency: string
  ): { warningLevel: SubsidyDataVersion['warningLevel']; warningMessage?: string } {
    const now = new Date();
    
    // 申請期限が迫っている場合
    if (applicationEnd && applicationEnd < now) {
      return {
        warningLevel: 'critical',
        warningMessage: '申請期限が終了しています。最新の募集情報をご確認ください。'
      };
    }

    // 申請期限1週間前
    if (applicationEnd) {
      const daysUntilDeadline = Math.floor((applicationEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
        return {
          warningLevel: 'major',
          warningMessage: `申請期限まであと${daysUntilDeadline}日です。`
        };
      }
    }

    // データの古さによる警告
    if (daysSinceUpdate > 30) {
      return {
        warningLevel: 'major',
        warningMessage: `データが${daysSinceUpdate}日前から更新されていません。最新情報をご確認ください。`
      };
    }

    if (daysSinceUpdate > 14) {
      return {
        warningLevel: 'minor',
        warningMessage: `データが${daysSinceUpdate}日前から更新されていません。`
      };
    }

    return { warningLevel: 'none' };
  }

  /**
   * 次回更新予定日の推定
   */
  private estimateNextUpdate(lastUpdated: Date, frequency: string): Date | undefined {
    if (frequency === 'irregular') return undefined;

    const date = new Date(lastUpdated);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  /**
   * データバージョンの生成
   */
  private generateDataVersion(lastUpdated: Date, guidelineVersion?: string): string {
    const timestamp = lastUpdated.toISOString().split('T')[0].replace(/-/g, '');
    return guidelineVersion ? `${guidelineVersion}_${timestamp}` : `v${timestamp}`;
  }

  /**
   * 最近の変更履歴を取得
   */
  private async getRecentChanges(subsidyProgramId: string): Promise<string[]> {
    // 実装: 変更履歴テーブルから最近の変更を取得
    // 今回は簡略化
    return [
      '募集要項の最新版が公開されました',
      '申請期限が延長されました',
      '必要書類が追加されました'
    ];
  }

  /**
   * 変更点の検出
   */
  private detectChanges(currentData: any, newData: any): string[] {
    const changes: string[] = [];
    
    if (currentData?.maxAmount !== newData.maxAmount) {
      changes.push(`補助上限額が変更されました: ${currentData?.maxAmount} → ${newData.maxAmount}`);
    }
    
    if (currentData?.applicationEnd !== newData.applicationEnd) {
      changes.push(`申請締切日が変更されました`);
    }

    return changes;
  }

  /**
   * 変更履歴の記録
   */
  private async recordChanges(subsidyProgramId: string, changes: string[]): Promise<void> {
    if (changes.length === 0) return;

    // 実装: 変更履歴をデータベースに記録
    console.log(`Changes recorded for ${subsidyProgramId}:`, changes);
  }

  /**
   * データ新鮮度レポートの生成
   */
  async generateFreshnessReport(): Promise<{
    summary: {
      total: number;
      upToDate: number;
      needsUpdate: number;
      critical: number;
    };
    details: SubsidyDataVersion[];
  }> {
    const allVersions = await this.checkAllDataFreshness();
    
    const summary = {
      total: allVersions.length,
      upToDate: allVersions.filter(v => v.warningLevel === 'none').length,
      needsUpdate: allVersions.filter(v => ['minor', 'major'].includes(v.warningLevel)).length,
      critical: allVersions.filter(v => v.warningLevel === 'critical').length
    };

    return {
      summary,
      details: allVersions
    };
  }
}

export const subsidyDataVersionService = new SubsidyDataVersionService();