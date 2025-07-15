import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  APPLICATION_REQUIREMENTS, 
  EQUIPMENT_CATEGORIES, 
  EVALUATION_POINTS,
  SUCCESS_PHRASES,
  AVOID_PHRASES,
  SUCCESS_EXAMPLES,
  SUBSIDY_RATES
} from '@/data/business-improvement-guideline';

export interface CompanyProfile {
  name: string;
  industry: string;
  employeeCount: number;
  currentMinWage: number;
  targetWageIncrease: number;
  businessChallenges: string[];
  currentProcesses: string;
  targetEquipment?: string;
}

export interface AIAnalysisResult {
  overallScore: number;
  recommendedCourse: string;
  recommendedEquipment: {
    category: string;
    equipment: string;
    estimatedCost: number;
    expectedEffect: string;
  };
  generatedSections: {
    necessity: string;
    plan: string;
    effect: string;
    sustainability: string;
  };
  riskAssessment: {
    risks: string[];
    countermeasures: string[];
  };
  improvementSuggestions: string[];
  estimatedApprovalRate: number;
}

export class BusinessImprovementAI {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeAndGenerate(profile: CompanyProfile): Promise<AIAnalysisResult> {
    try {
      const analysis = await this.performComprehensiveAnalysis(profile);
      const generatedContent = await this.generateApplicationContent(profile, analysis);
      
      return {
        ...analysis,
        generatedSections: generatedContent,
        estimatedApprovalRate: this.calculateApprovalRate(profile, analysis)
      };
    } catch (error) {
      console.error('AI分析エラー:', error);
      throw error;
    }
  }

  private async performComprehensiveAnalysis(profile: CompanyProfile): Promise<Partial<AIAnalysisResult>> {
    const prompt = `
業務改善助成金の申請書作成のため、以下の企業情報を分析してください。

【企業情報】
- 企業名: ${profile.name}
- 業種: ${profile.industry}  
- 従業員数: ${profile.employeeCount}名
- 現在の最低賃金: ${profile.currentMinWage}円
- 希望賃金引上げ額: ${profile.targetWageIncrease}円
- 業務課題: ${profile.businessChallenges.join('、')}
- 現在の業務プロセス: ${profile.currentProcesses}

【分析観点】
1. 最適な申請コース（30円/45円/60円/90円）
2. 推奨設備・機器
3. 採択確率の評価
4. リスク要因と対策

【参考データ】
助成金コース情報: ${JSON.stringify(SUBSIDY_RATES.courses)}
設備カテゴリ: ${JSON.stringify(EQUIPMENT_CATEGORIES)}
評価ポイント: ${JSON.stringify(EVALUATION_POINTS)}

以下のJSON形式で分析結果を返してください：
{
  "overallScore": 0-100の数値,
  "recommendedCourse": "推奨コース名",
  "recommendedEquipment": {
    "category": "設備カテゴリ",
    "equipment": "具体的な設備名",
    "estimatedCost": 推定費用（数値）,
    "expectedEffect": "期待される効果"
  },
  "riskAssessment": {
    "risks": ["リスク1", "リスク2"],
    "countermeasures": ["対策1", "対策2"]
  },
  "improvementSuggestions": ["改善提案1", "改善提案2"]
}
`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('JSONパースエラー:', error);
    }

    // フォールバック
    return this.generateFallbackAnalysis(profile);
  }

  private async generateApplicationContent(
    profile: CompanyProfile, 
    analysis: Partial<AIAnalysisResult>
  ): Promise<AIAnalysisResult['generatedSections']> {
    const prompt = `
業務改善助成金の申請書の各セクションを生成してください。

【企業情報】
${JSON.stringify(profile)}

【分析結果】
${JSON.stringify(analysis)}

【成功フレーズ例】
${JSON.stringify(SUCCESS_PHRASES)}

【避けるべきフレーズ】
${JSON.stringify(AVOID_PHRASES)}

【成功事例】
${JSON.stringify(SUCCESS_EXAMPLES)}

以下の4つのセクションを、採択確率を最大化する内容で生成してください：

1. 必要性（現状の課題と設備導入の必要性）
2. 事業計画（具体的な導入計画と実施方法）
3. 効果（生産性向上効果と賃金引上げ計画）
4. 持続性（継続的な効果と企業成長への貢献）

各セクション400-600文字で、以下のJSON形式で返してください：
{
  "necessity": "必要性の文章",
  "plan": "事業計画の文章", 
  "effect": "効果の文章",
  "sustainability": "持続性の文章"
}

【重要な指示】
- 具体的な数値を含める
- 業界の特性を考慮する
- 審査員が評価するポイントを意識する
- 地域経済への貢献を強調する
- 継続性と実現可能性を示す
`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('コンテンツ生成エラー:', error);
    }

    // フォールバック
    return this.generateFallbackContent(profile);
  }

  private calculateApprovalRate(profile: CompanyProfile, analysis: Partial<AIAnalysisResult>): number {
    let baseRate = 75; // 基本採択率

    // 業種による調整
    const industryBonus = this.getIndustryBonus(profile.industry);
    baseRate += industryBonus;

    // 従業員数による調整
    if (profile.employeeCount <= 5) baseRate += 5; // 小規模事業者は有利
    if (profile.employeeCount >= 20) baseRate -= 5; // 大企業は不利

    // 賃金引上げ額による調整
    if (profile.targetWageIncrease >= 60) baseRate += 10;
    else if (profile.targetWageIncrease >= 45) baseRate += 5;

    // 分析スコアによる調整
    if (analysis.overallScore) {
      baseRate = (baseRate + analysis.overallScore) / 2;
    }

    return Math.min(Math.max(baseRate, 30), 95); // 30-95%の範囲に収める
  }

  private getIndustryBonus(industry: string): number {
    const bonusMap: Record<string, number> = {
      '製造業': 10,
      '建設業': 8,
      '運輸業': 8,
      '飲食サービス業': 5,
      '小売業': 5,
      '介護・福祉': 12,
      'その他': 0
    };
    
    return bonusMap[industry] || 0;
  }

  private generateFallbackAnalysis(profile: CompanyProfile): Partial<AIAnalysisResult> {
    // 推奨コースの決定
    let recommendedCourse = '45円コース';
    if (profile.targetWageIncrease >= 90) recommendedCourse = '90円コース';
    else if (profile.targetWageIncrease >= 60) recommendedCourse = '60円コース';
    else if (profile.targetWageIncrease <= 30) recommendedCourse = '30円コース';

    // 業種に基づく推奨設備
    const equipmentCategory = this.getRecommendedCategory(profile.industry);
    const equipment = equipmentCategory.examples[0];

    return {
      overallScore: 75,
      recommendedCourse,
      recommendedEquipment: {
        category: equipmentCategory.id,
        equipment,
        estimatedCost: 1000000,
        expectedEffect: equipmentCategory.effectivePhrase
      },
      riskAssessment: {
        risks: ['導入期間の遅延リスク', '従業員の習熟期間'],
        countermeasures: ['詳細なスケジュール管理', '事前研修の実施']
      },
      improvementSuggestions: [
        '具体的な数値目標の設定',
        '従業員研修計画の詳細化',
        '効果測定方法の明確化'
      ]
    };
  }

  private generateFallbackContent(profile: CompanyProfile): AIAnalysisResult['generatedSections'] {
    return {
      necessity: `弊社は${profile.industry}において、${profile.businessChallenges.join('、')}といった課題に直面しております。特に人手不足の深刻化により、従業員一人当たりの業務負担が増加し、生産性の向上が急務となっています。また、地域別最低賃金の引上げに対応し、優秀な人材の確保・定着を図るため、労働環境の改善と賃金水準の向上が不可欠です。これらの課題を解決し、持続的な成長を実現するため、生産性向上に資する設備投資を行う必要があります。`,
      
      plan: `本事業では、${profile.currentProcesses}の業務プロセスを見直し、最新の設備導入により効率化を図ります。具体的には、導入予定の設備により作業工程を自動化・効率化し、従業員をより付加価値の高い業務に配置転換します。導入スケジュールは、設備選定から導入完了まで6ヶ月を予定し、並行して従業員への研修も実施します。設備導入後は、効果測定を毎月実施し、PDCAサイクルを回しながら継続的な改善を行います。`,
      
      effect: `設備導入により、作業時間の30%短縮と品質の安定化を実現し、労働生産性を大幅に向上させます。これにより創出される利益を原資として、全従業員の時間給を${profile.targetWageIncrease}円引上げ、年収ベースで約${profile.targetWageIncrease * 2000}円の処遇改善を実現します。また、業務効率化により残業時間の削減も可能となり、ワークライフバランスの向上にも寄与します。さらに、品質向上により顧客満足度が向上し、新規受注の獲得も期待できます。`,
      
      sustainability: `生産性向上による収益改善により、賃金引上げを継続的に維持します。また、従業員のスキルアップにより、企業の技術力と競争力を強化し、中長期的な成長基盤を構築します。地域の雇用創出と人材定着にも貢献し、地域経済の活性化に寄与します。今回の設備投資を契機として、さらなる業務改善と技術革新に取り組み、業界のリーディングカンパニーを目指します。`
    };
  }

  private getRecommendedCategory(industry: string) {
    const categoryMap: Record<string, string> = {
      '製造業': 'manufacturing',
      '建設業': 'manufacturing',
      '運輸業': 'logistics',
      '飲食サービス業': 'service',
      '小売業': 'service',
      '介護・福祉': 'service',
      'IT・情報通信業': 'it-system'
    };

    const categoryId = categoryMap[industry] || 'it-system';
    return EQUIPMENT_CATEGORIES.find(cat => cat.id === categoryId) || EQUIPMENT_CATEGORIES[0];
  }

  async optimizeApplicationText(
    currentText: string, 
    section: string, 
    profile: CompanyProfile
  ): Promise<string> {
    const prompt = `
以下の申請書の「${section}」セクションを、採択確率を向上させるよう改善してください。

【現在の文章】
${currentText}

【企業情報】
${JSON.stringify(profile)}

【改善指針】
- 具体的な数値を追加
- 審査員が重視するポイントを強調
- 成功フレーズを活用
- 避けるべきフレーズを除去
- 論理的な構成に改善

【参考情報】
評価ポイント: ${JSON.stringify(EVALUATION_POINTS)}
成功フレーズ: ${JSON.stringify(SUCCESS_PHRASES)}

改善された文章のみを返してください。
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('文章最適化エラー:', error);
      return currentText;
    }
  }
}