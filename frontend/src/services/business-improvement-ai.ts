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

  private async retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 2000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage = error?.message || '';
        const isRetryableError = 
          errorMessage.includes('503') || 
          errorMessage.includes('overloaded') ||
          errorMessage.includes('429') ||
          errorMessage.includes('UNAVAILABLE') ||
          errorMessage.includes('RATE_LIMIT_EXCEEDED') ||
          error?.status === 503 ||
          error?.status === 429;

        console.log(`API呼び出し試行 ${attempt}/${maxRetries}:`, {
          error: errorMessage,
          isRetryable: isRetryableError,
          status: error?.status
        });

        if (isLastAttempt || !isRetryableError) {
          console.error('API呼び出し最終失敗:', error);
          throw new Error(`Gemini API呼び出しに失敗しました。しばらく時間をおいて再度お試しください。詳細: ${errorMessage}`);
        }

        // より長い指数バックオフ + ジッター
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 2000; // 0-2秒のランダム待機
        const totalDelay = exponentialDelay + jitter;
        
        console.log(`${Math.round(totalDelay)}ms後にリトライします...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  async analyzeAndGenerate(profile: CompanyProfile): Promise<AIAnalysisResult> {
    try {
      console.log('緊急モード: テンプレートベースで作成:', profile.name);
      
      // 緊急対応：AI呼び出しを完全回避してテンプレートのみ使用
      const fallbackAnalysis = this.generateFallbackAnalysis(profile);
      const fallbackContent = this.generateFallbackContent(profile);
      
      console.log('テンプレート作成完了');
      
      return {
        ...fallbackAnalysis,
        generatedSections: fallbackContent,
        estimatedApprovalRate: this.calculateApprovalRate(profile, fallbackAnalysis)
      };
    } catch (error: any) {
      console.error('申請書生成エラー:', error);
      
      // 最後の手段：基本的なフォールバック
      const basicAnalysis = this.generateFallbackAnalysis(profile);
      const basicContent = this.generateFallbackContent(profile);
      
      return {
        ...basicAnalysis,
        generatedSections: basicContent,
        estimatedApprovalRate: 75
      };
    }
  }

  // 安全なAI分析（軽量版）- オプション機能として
  async safeAnalyzeAndGenerate(profile: CompanyProfile): Promise<AIAnalysisResult> {
    try {
      console.log('安全AI分析開始:', profile.name);
      
      // ステップ1: 軽量分析（コース・設備推奨のみ）
      const basicAnalysis = await this.performBasicAnalysis(profile);
      console.log('基本分析完了');
      
      // ステップ2: 申請書骨子生成（軽量プロンプト）
      const generatedContent = await this.generateSimpleApplicationContent(profile, basicAnalysis);
      console.log('申請書生成完了');
      
      return {
        ...basicAnalysis,
        generatedSections: generatedContent,
        estimatedApprovalRate: this.calculateApprovalRate(profile, basicAnalysis)
      };
    } catch (error: any) {
      console.error('AI分析エラー、フォールバックに切り替え:', error);
      
      // エラー時は即座にテンプレートモードに切り替え
      const fallbackAnalysis = this.generateFallbackAnalysis(profile);
      const fallbackContent = this.generateFallbackContent(profile);
      
      return {
        ...fallbackAnalysis,
        generatedSections: fallbackContent,
        estimatedApprovalRate: this.calculateApprovalRate(profile, fallbackAnalysis)
      };
    }
  }

  // 軽量版: 基本分析のみ（コース・設備推奨）
  private async performBasicAnalysis(profile: CompanyProfile): Promise<Partial<AIAnalysisResult>> {
    const prompt = `
業務改善助成金の申請について、企業情報から最適な申請コースと推奨設備を提案してください。

【企業情報】
- 企業名: ${profile.name}
- 業種: ${profile.industry}  
- 従業員数: ${profile.employeeCount}名
- 希望賃金引上げ額: ${profile.targetWageIncrease}円
- 業務課題: ${profile.businessChallenges.join('、')}

【判断基準】
- 賃金引上げ額に応じたコース選択（30円/45円/60円/90円）
- 業種に適した設備カテゴリ
- 従業員数に応じた推定費用

以下のJSON形式で返してください：
{
  "overallScore": 80,
  "recommendedCourse": "${profile.targetWageIncrease}円コース",
  "recommendedEquipment": {
    "category": "設備カテゴリ",
    "equipment": "具体的な設備名",
    "estimatedCost": 1000000,
    "expectedEffect": "期待効果"
  },
  "riskAssessment": {
    "risks": ["主要リスク"],
    "countermeasures": ["対策"]
  },
  "improvementSuggestions": ["改善提案"]
}
`;

    const result = await this.retryApiCall(async () => {
      const response = await this.model.generateContent(prompt);
      return await response.response;
    });
    const text = result.text();

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

  // 軽量版: シンプルな申請書生成
  private async generateSimpleApplicationContent(
    profile: CompanyProfile, 
    analysis: Partial<AIAnalysisResult>
  ): Promise<AIAnalysisResult['generatedSections']> {
    const prompt = `
業務改善助成金の申請書を作成してください。

【企業情報】
- 企業名: ${profile.name}（${profile.industry}・${profile.employeeCount}名）
- 賃金引上げ: ${profile.targetWageIncrease}円
- 業務課題: ${profile.businessChallenges.join('、')}
- 現在の業務: ${profile.currentProcesses}

【推奨設備】${analysis.recommendedEquipment?.equipment}

【重要ポイント】
- 生産性向上による賃金引上げの根拠を明確に
- 具体的な数値効果を示す
- 継続性を強調

以下の4セクションを各400-500文字で生成：
{
  "necessity": "設備導入の必要性",
  "plan": "具体的な実施計画", 
  "effect": "生産性向上効果と賃金引上げ",
  "sustainability": "継続性と発展性"
}
`;

    const result = await this.retryApiCall(async () => {
      const response = await this.model.generateContent(prompt);
      return await response.response;
    });
    const text = result.text();

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

    const result = await this.retryApiCall(async () => {
      const response = await this.model.generateContent(prompt);
      return await response.response;
    });
    const text = result.text();

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

    const result = await this.retryApiCall(async () => {
      const response = await this.model.generateContent(prompt);
      return await response.response;
    });
    const text = result.text();

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

  // 軽量版: セクション別文章最適化
  async optimizeApplicationText(
    currentText: string, 
    section: string, 
    profile: CompanyProfile
  ): Promise<string> {
    const prompt = `
業務改善助成金申請書の「${section}」セクションを改善してください。

【現在の文章】
${currentText}

【企業情報】
- ${profile.name}（${profile.industry}・${profile.employeeCount}名）
- 賃金引上げ目標: ${profile.targetWageIncrease}円

【改善ポイント】
- 具体的な数値効果を追加
- 継続性・実現可能性を強調
- 地域経済への貢献を明記

改善された文章のみを返してください（400-600文字）。
`;

    try {
      console.log(`文章最適化開始: ${section}セクション`);
      const result = await this.retryApiCall(async () => {
        const response = await this.model.generateContent(prompt);
        return await response.response;
      });
      console.log(`文章最適化完了: ${section}セクション`);
      return result.text();
    } catch (error: any) {
      console.error('文章最適化エラー:', error);
      
      // エラーが発生しても元の文章を返すが、警告を出力
      console.warn(`${section}セクションの最適化に失敗しました。元の文章を使用します。`);
      return currentText;
    }
  }

  // 個別セクション強化生成（後で追加機能として）
  async enhanceSingleSection(
    sectionType: 'necessity' | 'plan' | 'effect' | 'sustainability',
    profile: CompanyProfile,
    equipmentInfo?: string
  ): Promise<string> {
    const sectionPrompts = {
      necessity: `
【設備導入の必要性】を説明する文章を作成してください。

企業情報: ${profile.name}（${profile.industry}・${profile.employeeCount}名）
課題: ${profile.businessChallenges.join('、')}

重点ポイント:
- 人手不足・生産性の課題
- 賃金引上げの必要性
- 設備投資の緊急性

400-600文字で作成してください。`,
      
      plan: `
【事業実施計画】を作成してください。

企業情報: ${profile.name}（${profile.industry}・${profile.employeeCount}名）
推奨設備: ${equipmentInfo || '生産性向上設備'}

重点ポイント:
- 具体的な導入スケジュール
- 従業員研修計画
- 効果測定方法

400-600文字で作成してください。`,
      
      effect: `
【生産性向上効果】を説明してください。

企業情報: ${profile.name}（${profile.industry}・${profile.employeeCount}名）
賃金引上げ: ${profile.targetWageIncrease}円

重点ポイント:
- 定量的な効果予測
- 賃金引上げの根拠
- 売上・利益への影響

400-600文字で作成してください。`,
      
      sustainability: `
【持続性・発展性】を説明してください。

企業情報: ${profile.name}（${profile.industry}・${profile.employeeCount}名）

重点ポイント:
- 継続的な効果維持
- 企業の成長戦略
- 地域経済への貢献

400-600文字で作成してください。`
    };

    const prompt = sectionPrompts[sectionType];

    try {
      const result = await this.retryApiCall(async () => {
        const response = await this.model.generateContent(prompt);
        return await response.response;
      });
      return result.text();
    } catch (error: any) {
      console.error(`${sectionType}セクション生成エラー:`, error);
      throw error;
    }
  }
}