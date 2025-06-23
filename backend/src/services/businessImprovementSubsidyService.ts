// 業務改善助成金サービス
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { subsidyAnalysisEngine } from './subsidyAnalysisEngine';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

// 業務改善助成金の申請情報スキーマ
export const BusinessImprovementApplicationSchema = z.object({
  companyInfo: z.object({
    name: z.string(),
    industry: z.string(),
    employeeCount: z.number(),
    currentMinimumWage: z.number(), // 現在の事業場内最低賃金
    regionalMinimumWage: z.number(), // 地域別最低賃金
    address: z.string(),
    businessType: z.string(),
    yearlyRevenue: z.number().optional(),
  }),
  wageIncreasePlan: z.object({
    course: z.enum(['30', '45', '60', '90']), // 引上げ額コース
    targetWage: z.number(), // 引上げ後の賃金
    affectedEmployees: z.number(), // 対象労働者数
    implementationDate: z.date(), // 実施予定日
    sustainabilityPlan: z.string(), // 持続可能性の説明
  }),
  investmentPlan: z.object({
    items: z.array(z.object({
      category: z.string(), // 機械装置、システム構築等
      description: z.string(),
      cost: z.number(),
      vendor: z.string(),
      expectedEffect: z.string(),
    })),
    totalCost: z.number(),
    financingMethod: z.string(), // 資金調達方法
  }),
  productivityPlan: z.object({
    currentProductivity: z.string(), // 現在の生産性
    targetProductivity: z.string(), // 目標生産性
    improvementMeasures: z.array(z.string()), // 改善施策
    measurementMethod: z.string(), // 効果測定方法
    expectedROI: z.number().optional(), // 期待投資収益率
  }),
  businessPlan: z.object({
    challenges: z.string(), // 現在の課題
    objectives: z.string(), // 事業目標
    implementation: z.string(), // 実施計画
    riskManagement: z.string(), // リスク管理
    localContribution: z.string(), // 地域貢献
  }),
});

export type BusinessImprovementApplication = z.infer<typeof BusinessImprovementApplicationSchema>;

export class BusinessImprovementSubsidyService {
  /**
   * 申請資格をチェック
   */
  async checkEligibility(companyInfo: BusinessImprovementApplication['companyInfo']): Promise<{
    isEligible: boolean;
    reasons: string[];
    recommendations: string[];
  }> {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    
    // 賃金差額チェック
    const wageDifference = companyInfo.currentMinimumWage - companyInfo.regionalMinimumWage;
    if (wageDifference > 50) {
      reasons.push('事業場内最低賃金と地域別最低賃金の差が50円を超えています');
      recommendations.push('現在の差額: ' + wageDifference + '円。50円以内に調整する必要があります');
    }
    
    // 従業員数による中小企業判定（簡易版）
    const isSmallBusiness = this.checkBusinessSize(companyInfo.industry, companyInfo.employeeCount);
    if (!isSmallBusiness) {
      reasons.push('中小企業・小規模事業者の要件を満たしていません');
      recommendations.push('業種別の従業員数基準を確認してください');
    }
    
    return {
      isEligible: reasons.length === 0,
      reasons,
      recommendations: recommendations.length > 0 ? recommendations : ['申請資格を満たしています'],
    };
  }
  
  /**
   * 補助金額を計算
   */
  calculateSubsidyAmount(
    course: string,
    totalCost: number,
    hasProductivityRequirement: boolean = false
  ): {
    maxSubsidy: number;
    subsidyRate: number;
    estimatedAmount: number;
  } {
    const courseSettings = {
      '30': { max: 1200000, baseRate: 0.75, productivityRate: 0.9 },
      '45': { max: 1800000, baseRate: 0.8, productivityRate: 0.9 },
      '60': { max: 3000000, baseRate: 0.8, productivityRate: 0.9 },
      '90': { max: 6000000, baseRate: 0.8, productivityRate: 0.9 },
    };
    
    const settings = courseSettings[course as keyof typeof courseSettings];
    if (!settings) {
      throw new Error('無効なコースが指定されました');
    }
    
    const subsidyRate = hasProductivityRequirement ? settings.productivityRate : settings.baseRate;
    const calculatedAmount = Math.floor(totalCost * subsidyRate);
    const estimatedAmount = Math.min(calculatedAmount, settings.max);
    
    return {
      maxSubsidy: settings.max,
      subsidyRate,
      estimatedAmount,
    };
  }
  
  /**
   * 申請書を生成
   */
  async generateApplication(
    userId: string,
    application: BusinessImprovementApplication
  ): Promise<{
    applicationId: string;
    documents: GeneratedDocument[];
  }> {
    try {
      // 補助金プログラムを取得
      const subsidyProgram = await prisma.subsidyProgram.findFirst({
        where: {
          name: '業務改善助成金',
          isActive: true,
        },
      });
      
      if (!subsidyProgram) {
        throw new Error('業務改善助成金のプログラムが見つかりません');
      }
      
      // 補助金額を計算
      const { estimatedAmount, subsidyRate } = this.calculateSubsidyAmount(
        application.wageIncreasePlan.course,
        application.investmentPlan.totalCost,
        true // 生産性要件を満たすと仮定
      );
      
      // 申請データを作成
      const applicationRecord = await prisma.application.create({
        data: {
          userId,
          subsidyProgramId: subsidyProgram.id,
          title: `業務改善助成金申請_${application.companyInfo.name}_${new Date().toISOString().split('T')[0]}`,
          status: 'GENERATING',
          inputData: application as any,
          companyInfo: application.companyInfo as any,
          businessPlan: {
            ...application.businessPlan,
            wageIncreasePlan: application.wageIncreasePlan,
            investmentPlan: application.investmentPlan,
            productivityPlan: application.productivityPlan,
          } as any,
          estimatedScore: 0, // 後で計算
        },
      });
      
      // 各種申請書類を生成
      const documents: GeneratedDocument[] = [];
      
      // 1. 交付申請書（様式第1号）
      const form1 = await this.generateForm1(application, estimatedAmount, subsidyRate);
      documents.push(form1);
      
      // 2. 事業実施計画書（様式第1号別紙2）
      const form1_2 = await this.generateForm1_2(application);
      documents.push(form1_2);
      
      // 3. 賃金引上げ計画書
      const wageIncreasePlan = await this.generateWageIncreasePlan(application);
      documents.push(wageIncreasePlan);
      
      // 申請書の状態を更新
      await prisma.application.update({
        where: { id: applicationRecord.id },
        data: {
          status: 'GENERATED',
          generatedContent: {
            documents: documents.map(doc => ({
              type: doc.type,
              title: doc.title,
              content: doc.content,
            })),
          } as any,
          wordCount: documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0),
        },
      });
      
      logger.info('業務改善助成金申請書生成完了', {
        applicationId: applicationRecord.id,
        userId,
        documentCount: documents.length,
      });
      
      return {
        applicationId: applicationRecord.id,
        documents,
      };
      
    } catch (error) {
      logger.error('業務改善助成金申請書生成エラー', error);
      throw error;
    }
  }
  
  /**
   * 交付申請書（様式第1号）を生成
   */
  private async generateForm1(
    application: BusinessImprovementApplication,
    estimatedAmount: number,
    subsidyRate: number
  ): Promise<GeneratedDocument> {
    const content = `
業務改善助成金交付申請書

令和${new Date().getFullYear() - 2018}年${new Date().getMonth() + 1}月${new Date().getDate()}日

厚生労働大臣　殿

【申請者】
事業場名称：${application.companyInfo.name}
所在地：${application.companyInfo.address}
代表者氏名：[代表者名]
業種：${application.companyInfo.industry}
労働者数：${application.companyInfo.employeeCount}人

【申請内容】
1. 申請コース：${application.wageIncreasePlan.course}円コース
2. 現在の事業場内最低賃金：${application.companyInfo.currentMinimumWage}円
3. 引上げ後の事業場内最低賃金：${application.wageIncreasePlan.targetWage}円
4. 引上げ額：${application.wageIncreasePlan.targetWage - application.companyInfo.currentMinimumWage}円
5. 対象労働者数：${application.wageIncreasePlan.affectedEmployees}人

【助成金申請額】
設備投資等の総額：${application.investmentPlan.totalCost.toLocaleString()}円
助成率：${(subsidyRate * 100).toFixed(0)}％
申請額：${estimatedAmount.toLocaleString()}円

【設備投資等の概要】
${application.investmentPlan.items.map((item, index) => 
  `${index + 1}. ${item.category}：${item.description}（${item.cost.toLocaleString()}円）`
).join('\n')}

【生産性向上の取組】
${application.productivityPlan.improvementMeasures.join('\n・')}

上記のとおり、業務改善助成金の交付を申請します。
なお、申請にあたっては、募集要項及び交付要綱の内容を理解し、これを遵守することを誓約します。
`;
    
    return {
      type: 'FORM1',
      title: '交付申請書（様式第1号）',
      content,
      format: 'text',
    };
  }
  
  /**
   * 事業実施計画書（様式第1号別紙2）を生成
   */
  private async generateForm1_2(application: BusinessImprovementApplication): Promise<GeneratedDocument> {
    const content = `
事業実施計画書

【1. 事業の概要】
${application.businessPlan.objectives}

【2. 現状の課題】
${application.businessPlan.challenges}

【3. 生産性向上のための取組内容】
${application.productivityPlan.improvementMeasures.map((measure, index) => 
  `（${index + 1}）${measure}`
).join('\n')}

【4. 設備投資等の詳細】
${application.investmentPlan.items.map((item, index) => `
（${index + 1}）${item.category}
　・内容：${item.description}
　・金額：${item.cost.toLocaleString()}円
　・業者：${item.vendor}
　・期待される効果：${item.expectedEffect}
`).join('\n')}

【5. 期待される生産性向上効果】
現在の生産性：${application.productivityPlan.currentProductivity}
目標生産性：${application.productivityPlan.targetProductivity}
効果測定方法：${application.productivityPlan.measurementMethod}

【6. 実施スケジュール】
・設備導入：令和${new Date().getFullYear() - 2018}年${new Date().getMonth() + 2}月
・賃金引上げ実施：${application.wageIncreasePlan.implementationDate.toLocaleDateString('ja-JP')}
・効果測定：令和${new Date().getFullYear() - 2018 + 1}年3月

【7. 資金計画】
総事業費：${application.investmentPlan.totalCost.toLocaleString()}円
資金調達方法：${application.investmentPlan.financingMethod}

【8. 地域経済への波及効果】
${application.businessPlan.localContribution}

【9. リスク管理】
${application.businessPlan.riskManagement}
`;
    
    return {
      type: 'FORM1_2',
      title: '事業実施計画書（様式第1号別紙2）',
      content,
      format: 'text',
    };
  }
  
  /**
   * 賃金引上げ計画書を生成
   */
  private async generateWageIncreasePlan(application: BusinessImprovementApplication): Promise<GeneratedDocument> {
    const content = `
賃金引上げ計画書

【1. 賃金引上げの概要】
・引上げコース：${application.wageIncreasePlan.course}円コース
・現在の事業場内最低賃金：${application.companyInfo.currentMinimumWage}円
・引上げ後の事業場内最低賃金：${application.wageIncreasePlan.targetWage}円
・引上げ額：${application.wageIncreasePlan.targetWage - application.companyInfo.currentMinimumWage}円
・実施予定日：${application.wageIncreasePlan.implementationDate.toLocaleDateString('ja-JP')}

【2. 対象労働者】
・対象労働者数：${application.wageIncreasePlan.affectedEmployees}人
・全労働者数：${application.companyInfo.employeeCount}人
・影響を受ける労働者の割合：${((application.wageIncreasePlan.affectedEmployees / application.companyInfo.employeeCount) * 100).toFixed(1)}％

【3. 賃金引上げの実施方法】
・基本給の引上げ
・最低賃金の改定を就業規則に反映
・全労働者への周知徹底

【4. 賃金引上げの持続可能性】
${application.wageIncreasePlan.sustainabilityPlan}

【5. 生産性向上との関連性】
生産性向上により収益性が改善することで、継続的な賃金引上げが可能となります。
具体的には以下の効果を見込んでいます：
${application.productivityPlan.improvementMeasures.map(measure => `・${measure}`).join('\n')}

【6. 労働者への影響】
・労働者のモチベーション向上
・定着率の改善
・採用競争力の強化
・生活水準の向上

【7. 実施後のモニタリング】
・毎月の賃金台帳による支払い状況の確認
・労働者からのフィードバック収集
・生産性指標との相関分析
`;
    
    return {
      type: 'WAGE_INCREASE_PLAN',
      title: '賃金引上げ計画書',
      content,
      format: 'text',
    };
  }
  
  /**
   * 事業規模をチェック（簡易版）
   */
  private checkBusinessSize(industry: string, employeeCount: number): boolean {
    // 業種別の従業員数基準（簡易版）
    const sizeLimits: { [key: string]: number } = {
      '製造業': 300,
      '卸売業': 100,
      '小売業': 50,
      'サービス業': 100,
      'その他': 300,
    };
    
    const limit = sizeLimits[industry] || sizeLimits['その他'];
    return employeeCount <= limit;
  }
  
  /**
   * 申請書をスコアリング
   */
  async scoreApplication(applicationId: string): Promise<{
    totalScore: number;
    breakdown: {
      productivity: number;
      wageIncrease: number;
      sustainability: number;
    };
    feedback: string[];
  }> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      throw new Error('申請が見つかりません');
    }
    
    const inputData = application.inputData as any as BusinessImprovementApplication;
    
    // スコアリング基準
    const scores = {
      productivity: 0,
      wageIncrease: 0,
      sustainability: 0,
    };
    
    const feedback: string[] = [];
    
    // 生産性向上効果（40点満点）
    if (inputData.productivityPlan.expectedROI && inputData.productivityPlan.expectedROI > 20) {
      scores.productivity += 15;
      feedback.push('高い投資収益率が期待できます');
    }
    if (inputData.productivityPlan.improvementMeasures.length >= 3) {
      scores.productivity += 15;
      feedback.push('複数の改善施策が計画されています');
    }
    if (inputData.productivityPlan.measurementMethod) {
      scores.productivity += 10;
      feedback.push('効果測定方法が明確です');
    }
    
    // 賃金引上げの実現可能性（30点満点）
    const wageIncreaseRatio = (inputData.wageIncreasePlan.targetWage - inputData.companyInfo.currentMinimumWage) / inputData.companyInfo.currentMinimumWage;
    if (wageIncreaseRatio >= 0.05) {
      scores.wageIncrease += 15;
      feedback.push('意欲的な賃金引上げ計画です');
    }
    if (inputData.wageIncreasePlan.sustainabilityPlan.length > 100) {
      scores.wageIncrease += 15;
      feedback.push('賃金引上げの持続可能性が説明されています');
    }
    
    // 事業の継続性（30点満点）
    if (inputData.businessPlan.riskManagement.length > 50) {
      scores.sustainability += 10;
      feedback.push('リスク管理が考慮されています');
    }
    if (inputData.businessPlan.localContribution.length > 50) {
      scores.sustainability += 10;
      feedback.push('地域経済への貢献が期待できます');
    }
    if (inputData.investmentPlan.financingMethod) {
      scores.sustainability += 10;
      feedback.push('資金計画が明確です');
    }
    
    const totalScore = scores.productivity + scores.wageIncrease + scores.sustainability;
    
    // スコアを保存
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        estimatedScore: totalScore / 100, // 0-1の範囲に正規化
      },
    });
    
    return {
      totalScore,
      breakdown: scores,
      feedback,
    };
  }
}

// 生成された文書の型
interface GeneratedDocument {
  type: string;
  title: string;
  content: string;
  format: string;
}

// サービスのエクスポート
export const businessImprovementSubsidyService = new BusinessImprovementSubsidyService();