import { PrismaClient } from '@prisma/client';
import { subsidyDataVersionService } from './subsidyDataVersionService';
import { documentChecklistService } from './documentChecklistService';

const prisma = new PrismaClient();

interface ComprehensiveApplicationData {
  // 企業基本情報
  companyProfile: {
    name: string;
    representativeName: string;
    businessType: string;
    foundedYear: number;
    employeeCount: number;
    annualRevenue: number;
    address: string;
    phone: string;
    website?: string;
    industry: string;
  };
  
  // 事業計画
  businessPlan: {
    projectTitle: string;
    projectOverview: string;
    objectives: string[];
    targetMarket: string;
    marketAnalysis: string;
    competitiveAdvantage: string;
    implementationPlan: {
      phase: string;
      description: string;
      startDate: string;
      endDate: string;
      milestones: string[];
    }[];
    expectedOutcome: {
      quantitativeGoals: string[];
      qualitativeGoals: string[];
      roi: number;
      impactMeasurement: string;
    };
  };
  
  // 予算計画
  budgetPlan: {
    totalAmount: number;
    subsidyAmount: number;
    selfFunding: number;
    breakdown: {
      category: string;
      description: string;
      amount: number;
      necessity: string;
    }[];
  };
  
  // その他
  additionalInfo?: {
    pastExperience?: string;
    partnerships?: string;
    risks?: string;
    sustainabilityPlan?: string;
  };
}

interface GeneratedApplication {
  sections: {
    [key: string]: {
      title: string;
      content: string;
      wordCount: number;
      keyPoints: string[];
    };
  };
  summary: {
    totalWordCount: number;
    estimatedScore: number;
    strengthPoints: string[];
    improvementAreas: string[];
  };
  metadata: {
    generatedAt: string;
    version: string;
    aiModel: string;
    processingTime: number;
  };
}

export class EnhancedApplicationGeneratorService {
  /**
   * 完全自動申請書生成
   */
  async generateCompleteApplication(
    subsidyProgramId: string,
    applicationData: ComprehensiveApplicationData,
    options: {
      includeDataFreshness?: boolean;
      includeDocumentChecklist?: boolean;
      optimizeForScore?: boolean;
      customTone?: 'professional' | 'innovative' | 'conservative';
    } = {}
  ): Promise<{
    application: GeneratedApplication;
    dataFreshness?: any;
    documentChecklist?: any;
    recommendations: string[];
  }> {
    const startTime = Date.now();

    // 1. 補助金プログラム情報と新鮮度チェック
    const [program, dataFreshness] = await Promise.all([
      this.getSubsidyProgram(subsidyProgramId),
      options.includeDataFreshness 
        ? subsidyDataVersionService.checkDataFreshness(subsidyProgramId)
        : null
    ]);

    // 2. 書類チェックリスト生成
    const documentChecklist = options.includeDocumentChecklist
      ? await documentChecklistService.generateDocumentChecklist(
          subsidyProgramId,
          applicationData.companyProfile
        )
      : null;

    // 3. 申請書セクション生成
    const sections = await this.generateAllSections(program, applicationData, options);

    // 4. 総合評価とスコア計算
    const summary = await this.calculateApplicationSummary(sections, program);

    // 5. 改善提案生成
    const recommendations = await this.generateRecommendations(
      sections,
      summary,
      program,
      dataFreshness
    );

    const processingTime = Date.now() - startTime;

    const application: GeneratedApplication = {
      sections,
      summary,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        aiModel: 'Claude-3.5-Sonnet',
        processingTime
      }
    };

    return {
      application,
      dataFreshness,
      documentChecklist,
      recommendations
    };
  }

  /**
   * 全セクションの生成
   */
  private async generateAllSections(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ): Promise<GeneratedApplication['sections']> {
    const sectionGenerators = [
      { key: 'executive_summary', generator: this.generateExecutiveSummary },
      { key: 'company_overview', generator: this.generateCompanyOverview },
      { key: 'project_description', generator: this.generateProjectDescription },
      { key: 'market_analysis', generator: this.generateMarketAnalysis },
      { key: 'implementation_plan', generator: this.generateImplementationPlan },
      { key: 'budget_breakdown', generator: this.generateBudgetBreakdown },
      { key: 'expected_outcomes', generator: this.generateExpectedOutcomes },
      { key: 'risk_management', generator: this.generateRiskManagement },
      { key: 'sustainability', generator: this.generateSustainabilityPlan }
    ];

    const sections: GeneratedApplication['sections'] = {};

    // 並列処理でセクション生成
    const sectionPromises = sectionGenerators.map(async ({ key, generator }) => {
      const content = await generator.call(this, program, data, options);
      return { key, content };
    });

    const results = await Promise.all(sectionPromises);

    results.forEach(({ key, content }) => {
      sections[key] = content;
    });

    return sections;
  }

  /**
   * エグゼクティブサマリー生成
   */
  private async generateExecutiveSummary(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const prompt = `
補助金プログラム「${program.name}」に対する申請書のエグゼクティブサマリーを作成してください。

企業情報:
- 企業名: ${data.companyProfile.name}
- 業種: ${data.companyProfile.businessType}
- 従業員数: ${data.companyProfile.employeeCount}名
- 年商: ${data.companyProfile.annualRevenue}円

プロジェクト概要:
- タイトル: ${data.businessPlan.projectTitle}
- 概要: ${data.businessPlan.projectOverview}
- 申請額: ${data.budgetPlan.subsidyAmount}円
- 総事業費: ${data.budgetPlan.totalAmount}円

要求条件:
- 簡潔で魅力的な内容（200-300文字）
- プロジェクトの重要性と独自性を強調
- 期待される成果を定量的に表現
- 補助金の効果的活用をアピール

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: 'エグゼクティブサマリー',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 企業概要生成
   */
  private async generateCompanyOverview(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const prompt = `
以下の企業情報を基に、補助金申請用の企業概要を作成してください。

企業基本情報:
- 企業名: ${data.companyProfile.name}
- 代表者: ${data.companyProfile.representativeName}
- 設立年: ${data.companyProfile.foundedYear}
- 業種: ${data.companyProfile.businessType}
- 従業員数: ${data.companyProfile.employeeCount}名
- 年商: ${data.companyProfile.annualRevenue}円
- 所在地: ${data.companyProfile.address}
- ウェブサイト: ${data.companyProfile.website || '記載なし'}

要求条件:
- 企業の強みと実績を具体的に記載
- 業界での位置づけを明確化
- 技術力や専門性をアピール
- 信頼性と実行力を示す
- 400-600文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: '企業概要',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * プロジェクト詳細説明生成
   */
  private async generateProjectDescription(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const prompt = `
補助金プログラム「${program.name}」の目的「${program.purpose}」に適合する、以下のプロジェクト詳細説明を作成してください。

プロジェクト情報:
- タイトル: ${data.businessPlan.projectTitle}
- 概要: ${data.businessPlan.projectOverview}
- 目標: ${data.businessPlan.objectives.join(', ')}
- ターゲット市場: ${data.businessPlan.targetMarket}
- 競合優位性: ${data.businessPlan.competitiveAdvantage}

補助金の評価基準に基づいて以下を強調してください:
- 新規性・独創性
- 技術的優位性
- 市場性・事業性
- 実現可能性
- 波及効果

要求条件:
- 800-1200文字程度
- 具体的な数値データを活用
- 技術的な詳細を適切に説明
- ビジネスモデルを明確化

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: 'プロジェクト詳細説明',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 市場分析生成
   */
  private async generateMarketAnalysis(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const prompt = `
以下の情報を基に、市場分析セクションを作成してください。

市場情報:
- ターゲット市場: ${data.businessPlan.targetMarket}
- 市場分析: ${data.businessPlan.marketAnalysis}
- 競合優位性: ${data.businessPlan.competitiveAdvantage}
- 業界: ${data.companyProfile.industry}

要求条件:
- 市場規模と成長性を定量的に説明
- 競合他社との差別化ポイントを明確化
- 市場ニーズの根拠を具体的に提示
- 参入戦略と獲得見込みを記載
- 600-800文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: '市場分析',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 実施計画生成
   */
  private async generateImplementationPlan(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const planDetails = data.businessPlan.implementationPlan
      .map(phase => `
フェーズ${phase.phase}: ${phase.description}
期間: ${phase.startDate} ～ ${phase.endDate}
マイルストーン: ${phase.milestones.join(', ')}
`).join('\n');

    const prompt = `
以下の実施計画を基に、詳細な実施計画書を作成してください。

実施計画:
${planDetails}

要求条件:
- 各フェーズの目的と成果物を明確化
- 実現可能性の高いスケジュール
- リスク対策を含む
- 進捗管理方法を記載
- 600-800文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: '実施計画',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 予算内訳生成
   */
  private async generateBudgetBreakdown(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const budgetItems = data.budgetPlan.breakdown
      .map(item => `${item.category}: ${item.amount.toLocaleString()}円 - ${item.description}`)
      .join('\n');

    const prompt = `
以下の予算計画を基に、詳細な予算説明を作成してください。

予算情報:
- 総事業費: ${data.budgetPlan.totalAmount.toLocaleString()}円
- 補助金申請額: ${data.budgetPlan.subsidyAmount.toLocaleString()}円
- 自己負担額: ${data.budgetPlan.selfFunding.toLocaleString()}円

内訳:
${budgetItems}

要求条件:
- 各費目の必要性を具体的に説明
- 金額の妥当性を根拠とともに記載
- 費用対効果を強調
- 補助金の有効活用を示す
- 400-600文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: '予算内訳',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 期待される成果生成
   */
  private async generateExpectedOutcomes(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const quantitativeGoals = data.businessPlan.expectedOutcome.quantitativeGoals.join(', ');
    const qualitativeGoals = data.businessPlan.expectedOutcome.qualitativeGoals.join(', ');

    const prompt = `
以下の期待成果を基に、詳細な成果説明を作成してください。

定量的目標:
${quantitativeGoals}

定性的目標:
${qualitativeGoals}

ROI: ${data.businessPlan.expectedOutcome.roi}%
効果測定方法: ${data.businessPlan.expectedOutcome.impactMeasurement}

要求条件:
- 具体的で測定可能な成果指標
- 短期・中期・長期の成果を区分
- 社会的・経済的波及効果を記載
- 成果の持続性を説明
- 500-700文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: '期待される成果',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * リスク管理生成
   */
  private async generateRiskManagement(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const prompt = `
プロジェクト「${data.businessPlan.projectTitle}」のリスク管理計画を作成してください。

業界: ${data.companyProfile.industry}
事業規模: 総額${data.budgetPlan.totalAmount.toLocaleString()}円

考慮すべきリスク:
- 技術的リスク
- 市場リスク
- 財務リスク
- 人的リスク
- 外部環境リスク

要求条件:
- 主要リスクを特定・評価
- 各リスクの対策を具体的に記載
- 緊急時の対応計画を含む
- リスク監視体制を説明
- 400-600文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: 'リスク管理',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 持続可能性計画生成
   */
  private async generateSustainabilityPlan(
    program: any,
    data: ComprehensiveApplicationData,
    options: any
  ) {
    const prompt = `
プロジェクト「${data.businessPlan.projectTitle}」の持続可能性計画を作成してください。

企業情報:
- 業種: ${data.companyProfile.businessType}
- 従業員数: ${data.companyProfile.employeeCount}名
- 年商: ${data.companyProfile.annualRevenue}円

要求条件:
- 事業の継続性・発展性を説明
- 環境・社会への配慮を記載
- 長期的なビジョンを提示
- 地域経済への貢献を含む
- 資金調達の持続性を説明
- 400-600文字程度

トーン: ${options.customTone || 'professional'}
`;

    const content = await this.callAI(prompt);
    
    return {
      title: '持続可能性計画',
      content,
      wordCount: content.length,
      keyPoints: this.extractKeyPoints(content)
    };
  }

  /**
   * 総合評価とスコア計算
   */
  private async calculateApplicationSummary(
    sections: GeneratedApplication['sections'],
    program: any
  ): Promise<GeneratedApplication['summary']> {
    const totalWordCount = Object.values(sections)
      .reduce((sum, section) => sum + section.wordCount, 0);

    // スコア計算ロジック（簡略化）
    const estimatedScore = this.calculateEstimatedScore(sections, program);

    const strengthPoints = [
      '具体的な数値目標が設定されている',
      '市場分析が詳細で説得力がある',
      '実施計画が現実的で段階的',
      '予算配分が合理的',
      'リスク対策が包括的'
    ];

    const improvementAreas = [
      '技術的な詳細をさらに具体化',
      '競合分析をより詳細に',
      '成果指標の測定方法を明確化'
    ];

    return {
      totalWordCount,
      estimatedScore,
      strengthPoints,
      improvementAreas
    };
  }

  /**
   * スコア計算
   */
  private calculateEstimatedScore(sections: any, program: any): number {
    // 基本スコア
    let score = 70;

    // 文字数による調整
    const totalWords = Object.values(sections).reduce((sum: number, section: any) => sum + section.wordCount, 0);
    if (totalWords > 3000) score += 5;
    if (totalWords > 5000) score += 5;

    // キーポイントによる調整
    const allKeyPoints = Object.values(sections).flatMap((section: any) => section.keyPoints);
    const uniqueKeywords = new Set(allKeyPoints.map(point => point.toLowerCase()));
    
    if (uniqueKeywords.size > 20) score += 10;
    if (uniqueKeywords.size > 30) score += 5;

    return Math.min(95, score); // 最大95点
  }

  /**
   * 改善提案生成
   */
  private async generateRecommendations(
    sections: any,
    summary: any,
    program: any,
    dataFreshness: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // データ新鮮度に基づく提案
    if (dataFreshness?.warningLevel !== 'none') {
      recommendations.push('最新の募集要項を確認し、申請書の内容を最新情報に更新してください。');
    }

    // スコアに基づく提案
    if (summary.estimatedScore < 80) {
      recommendations.push('申請書の内容をより具体的に記載し、評価スコアの向上を図ってください。');
    }

    // 文字数に基づく提案
    if (summary.totalWordCount < 3000) {
      recommendations.push('各セクションの内容をより詳細に記載することをお勧めします。');
    }

    // 一般的な改善提案
    recommendations.push(
      '提出前に全ての数値データを再確認してください。',
      '第三者による内容チェックを実施することをお勧めします。',
      '必要な添付書類が全て準備されているか確認してください。'
    );

    return recommendations;
  }

  /**
   * 補助金プログラム取得
   */
  private async getSubsidyProgram(subsidyProgramId: string) {
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

    return program;
  }

  /**
   * AI呼び出し（簡略化）
   */
  private async callAI(prompt: string): Promise<string> {
    // 実際の実装では Claude API を呼び出し
    // ここではサンプルレスポンスを返す
    return `【AI生成コンテンツ】\n${prompt.slice(0, 100)}... に基づいた詳細な内容がここに生成されます。`;
  }

  /**
   * キーポイント抽出
   */
  private extractKeyPoints(content: string): string[] {
    // 簡略化した実装
    const sentences = content.split('。').filter(s => s.length > 10);
    return sentences.slice(0, 3);
  }
}

export const enhancedApplicationGeneratorService = new EnhancedApplicationGeneratorService();