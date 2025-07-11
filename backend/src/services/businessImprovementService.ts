import { logger } from '../config/logger';

interface GuidelineAnalysis {
  keyPoints: string[];
  requirements: string[];
  evaluationCriteria: string[];
  successFactors: string[];
}

interface SuccessCase {
  companyProfile: string;
  equipmentInvestment: string;
  productivityImprovement: string;
  wageIncrease: string;
  keySuccessFactors: string[];
}

class BusinessImprovementService {
  private guidelineCache: Map<string, GuidelineAnalysis> = new Map();
  private successCases: SuccessCase[] = [];

  constructor() {
    this.initializeSuccessCases();
  }

  /**
   * 成功事例データの初期化
   */
  private initializeSuccessCases() {
    this.successCases = [
      {
        companyProfile: "製造業（従業員15名）",
        equipmentInvestment: "自動検査装置の導入（300万円）",
        productivityImprovement: "検査時間50%短縮、不良品率30%削減",
        wageIncrease: "時給30円引上げ（900円→930円）",
        keySuccessFactors: [
          "具体的な数値目標の設定",
          "従業員のスキルアップ計画",
          "設備導入後の効果測定方法の明確化",
          "段階的な賃金引上げ計画"
        ]
      },
      {
        companyProfile: "サービス業（従業員8名）",
        equipmentInvestment: "POSシステム・在庫管理システム（150万円）",
        productivityImprovement: "売上管理効率化、在庫回転率20%向上",
        wageIncrease: "時給60円引上げ（920円→980円）",
        keySuccessFactors: [
          "業務プロセスの見直し",
          "データ活用による経営効率化",
          "顧客満足度向上への寄与",
          "従業員のデジタルスキル向上"
        ]
      },
      {
        companyProfile: "小売業（従業員12名）",
        equipmentInvestment: "自動包装機・配送管理システム（250万円）",
        productivityImprovement: "包装作業時間40%短縮、配送効率30%向上",
        wageIncrease: "時給45円引上げ（880円→925円）",
        keySuccessFactors: [
          "作業工程の標準化",
          "顧客満足度の向上",
          "従業員の多能工化",
          "継続的な改善活動"
        ]
      }
    ];
  }

  /**
   * 募集要項の解析
   */
  async analyzeGuidelines(year: string = '2024'): Promise<GuidelineAnalysis> {
    const cacheKey = `guidelines_${year}`;
    
    if (this.guidelineCache.has(cacheKey)) {
      return this.guidelineCache.get(cacheKey)!;
    }

    try {
      // 実際の実装では、厚生労働省のPDFや公式サイトから最新の募集要項を取得・解析
      const analysis: GuidelineAnalysis = {
        keyPoints: [
          "事業場内最低賃金が1,000円未満であること",
          "生産性向上に資する設備・機器等の導入",
          "賃金引上げ計画の事前策定と確実な実施",
          "労働者との合意形成（就業規則等の改正）",
          "事業実施期間は交付決定後6ヶ月以内",
          "賃金引上げ効果の1年間継続"
        ],
        requirements: [
          "中小企業・小規模事業者であること",
          "解雇、賃金引下げ等の不交付事由がないこと",
          "労働保険・社会保険に適切に加入していること",
          "過去3年間に労働基準法等違反がないこと",
          "申請事業場で雇用する労働者の賃金を引き上げること"
        ],
        evaluationCriteria: [
          "設備投資による生産性向上効果の妥当性",
          "賃金引上げ計画の具体性・実現可能性",
          "事業場の財務状況・継続性",
          "従業員への波及効果",
          "地域経済への貢献度"
        ],
        successFactors: [
          "定量的な効果測定指標の設定",
          "段階的な実施計画の策定",
          "従業員のスキル向上計画",
          "継続的な改善活動の仕組み作り",
          "適切な投資回収計画"
        ]
      };

      this.guidelineCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      logger.error('Guidelines analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 設備投資計画のAI生成
   */
  async generateEquipmentPlan(params: {
    equipmentName: string;
    purpose: string;
    businessType: string;
    employeeCount: number;
  }): Promise<any> {
    try {
      const guidelines = await this.analyzeGuidelines();
      const relevantSuccessCases = this.getRelevantSuccessCases(params.businessType);

      // 成功事例を参考にした効果的な計画生成
      const plan = {
        equipmentName: params.equipmentName,
        purpose: params.purpose,
        expectedEffect: this.generateExpectedEffect(params, relevantSuccessCases, guidelines),
        cost: this.estimateEquipmentCost(params.equipmentName, params.businessType),
        supplier: this.suggestSupplier(params.equipmentName),
        specifications: this.generateSpecifications(params.equipmentName, params.purpose),
        productivityMetrics: this.generateProductivityMetrics(params),
        implementationPlan: this.generateImplementationPlan(),
        riskMitigation: this.generateRiskMitigation()
      };

      logger.info('Equipment plan generated', {
        equipmentName: params.equipmentName,
        businessType: params.businessType
      });

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      logger.error('Equipment plan generation failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 賃金引上げ根拠のAI生成
   */
  async generateWageIncreasePlan(params: {
    selectedCourse: string;
    currentWage: number;
    targetEmployees: number;
    businessType: string;
    equipmentPlans: any[];
  }): Promise<any> {
    try {
      const guidelines = await this.analyzeGuidelines();
      const successCases = this.getRelevantSuccessCases(params.businessType);

      const justification = this.generateWageJustification(params, successCases, guidelines);
      const plan = {
        justification,
        implementationSchedule: this.generateImplementationSchedule(),
        effectMeasurement: this.generateEffectMeasurement(),
        sustainabilityPlan: this.generateSustainabilityPlan(params)
      };

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      logger.error('Wage increase plan generation failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 事業概要のAI生成
   */
  async generateBusinessOverview(params: {
    simpleDescription: string;
    businessType: string;
    equipmentPlans: any[];
  }): Promise<any> {
    try {
      const guidelines = await this.analyzeGuidelines();
      
      const overview = this.generateComprehensiveOverview(params, guidelines);
      const goals = this.generateProductivityGoals(params, guidelines);

      return {
        success: true,
        data: {
          overview,
          goals
        }
      };
    } catch (error) {
      logger.error('Business overview generation failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 関連する成功事例の取得
   */
  private getRelevantSuccessCases(businessType: string): SuccessCase[] {
    // 業種に基づいて関連する成功事例をフィルタリング
    const businessTypeMap: { [key: string]: string[] } = {
      '製造業': ['製造業'],
      'サービス業': ['サービス業', '小売業'],
      '小売業': ['小売業', 'サービス業'],
      '建設業': ['製造業'],
      '運輸業': ['小売業', 'サービス業']
    };

    const relevantTypes = businessTypeMap[businessType] || ['製造業', 'サービス業'];
    return this.successCases.filter(case_ => 
      relevantTypes.some(type => case_.companyProfile.includes(type))
    );
  }

  /**
   * 期待される効果の生成
   */
  private generateExpectedEffect(
    params: any, 
    successCases: SuccessCase[], 
    guidelines: GuidelineAnalysis
  ): string {
    const baseEffect = `${params.equipmentName}の導入により、${params.purpose}を実現し、以下の効果が期待されます：

【生産性向上効果】
• 作業効率の向上：30-50%の時間短縮
• 品質の安定化：不良率20-30%削減
• 従業員の負荷軽減：反復作業の自動化

【経営効果】
• 年間売上増加：約10-15%の向上見込み
• コスト削減：人件費効率化と材料ロス削減
• 顧客満足度向上：品質安定化による信頼性向上

【従業員への効果】
• スキルアップ機会の創出
• より付加価値の高い業務への転換
• 労働環境の改善と安全性向上`;

    // 成功事例の要素を組み込み
    if (successCases.length > 0) {
      const case_ = successCases[0];
      return baseEffect + `

【成功事例参考】
類似業種での実績：${case_.productivityImprovement}
これらの効果により、持続的な賃金引上げの基盤を構築し、従業員のモチベーション向上と企業の競争力強化を同時に実現します。`;
    }

    return baseEffect;
  }

  /**
   * 設備費用の見積もり
   */
  private estimateEquipmentCost(equipmentName: string, businessType: string): number {
    const costMap: { [key: string]: number } = {
      '自動包装機': 250000,
      'POSシステム': 150000,
      '検査装置': 300000,
      '配送管理システム': 200000,
      'レジスター': 100000,
      'パソコン': 80000,
      'プリンター': 50000,
      '製造装置': 400000,
      '測定器': 180000
    };

    // 設備名に基づく基本費用
    let baseCost = 200000; // デフォルト
    for (const [key, cost] of Object.entries(costMap)) {
      if (equipmentName.includes(key)) {
        baseCost = cost;
        break;
      }
    }

    // 業種による調整
    const businessAdjustment: { [key: string]: number } = {
      '製造業': 1.2,
      'サービス業': 0.9,
      '小売業': 1.0,
      '建設業': 1.1
    };

    const adjustment = businessAdjustment[businessType] || 1.0;
    return Math.floor(baseCost * adjustment * (0.8 + Math.random() * 0.4));
  }

  /**
   * 賃金引上げ根拠の生成
   */
  private generateWageJustification(
    params: any,
    successCases: SuccessCase[],
    guidelines: GuidelineAnalysis
  ): string {
    const courseDetails = {
      '30万円': { rate: 90, amount: '30万円' },
      '60万円': { rate: 80, amount: '60万円' },
      '120万円': { rate: 75, amount: '120万円' }
    };

    const course = courseDetails[params.selectedCourse as keyof typeof courseDetails];
    
    let justification = `【賃金引上げの根拠】

1. 生産性向上による付加価値創出
設備投資により従業員一人当たりの生産性が約30%向上し、これにより創出される付加価値を従業員に適切に還元します。時給${params.currentWage}円から${params.currentWage + (course ? parseInt(params.selectedCourse) : 30)}円への引上げは、この生産性向上効果に基づく合理的な水準です。

2. 人材確保・定着の必要性
同業他社との競争力維持および優秀な人材の確保・定着を図るため、適切な賃金水準の維持が不可欠です。本引上げにより、従業員のモチベーション向上と離職率低下を実現します。

3. 持続的な事業成長への投資
賃金引上げを通じて従業員の働きがいを向上させ、さらなる生産性向上の好循環を創出します。これにより、長期的な事業成長と雇用の安定を実現します。

4. 地域経済への貢献
賃金引上げにより地域の消費活動が活性化し、地域経済の発展に寄与します。`;

    // 成功事例の追加
    if (successCases.length > 0) {
      const case_ = successCases[0];
      justification += `

【類似事例の実績】
${case_.companyProfile}において、${case_.equipmentInvestment}により${case_.productivityImprovement}を実現し、${case_.wageIncrease}を実施した事例があります。同様の効果が期待できることから、本計画の実現可能性は高いと判断されます。`;
    }

    return justification;
  }

  /**
   * その他のヘルパーメソッド
   */
  private suggestSupplier(equipmentName: string): string {
    const suppliers = [
      `${equipmentName}専門メーカー`,
      '株式会社機械システム',
      '産業機器株式会社',
      'システムソリューション株式会社'
    ];
    return suppliers[Math.floor(Math.random() * suppliers.length)];
  }

  private generateSpecifications(equipmentName: string, purpose: string): string {
    return `${equipmentName}の業務用標準仕様
• 目的：${purpose}に最適化された機能
• 耐用年数：3-5年
• 保証期間：1-3年
• メンテナンス：定期点検サービス付き
• 安全基準：JIS規格準拠`;
  }

  private generateProductivityMetrics(params: any): string[] {
    return [
      '作業時間30%短縮',
      '品質向上（不良率20%削減）',
      '従業員満足度向上',
      '年間売上10%増加目標'
    ];
  }

  private generateImplementationPlan(): string {
    return `【実施計画】
1. 設備導入（1-2ヶ月）
2. 従業員研修（1ヶ月）
3. 運用開始・効果測定（継続）
4. 改善・最適化（継続）`;
  }

  private generateRiskMitigation(): string {
    return `【リスク対策】
• 十分な従業員研修による習熟期間の確保
• 段階的な導入による影響の最小化
• 定期的な効果測定と改善活動
• 専門業者による技術サポート体制`;
  }

  private generateImplementationSchedule(): string {
    return `交付決定後1ヶ月以内に賃金引上げを実施し、1年間継続します。`;
  }

  private generateEffectMeasurement(): string {
    return `生産性向上効果を毎月測定し、賃金引上げの持続可能性を継続的に評価します。`;
  }

  private generateSustainabilityPlan(params: any): string {
    return `設備投資効果により創出される付加価値を原資として、持続的な賃金水準の維持を図ります。`;
  }

  private generateComprehensiveOverview(params: any, guidelines: GuidelineAnalysis): string {
    return `弊社は${params.simpleDescription}を主力事業として展開し、地域に根ざしたサービスを提供しています。今回の設備投資により、作業効率の向上と品質の安定化を図り、競争力強化を実現します。この生産性向上効果を従業員の賃金引上げに還元することで、持続的な事業成長サイクルを構築し、地域経済の発展に貢献します。`;
  }

  private generateProductivityGoals(params: any, guidelines: GuidelineAnalysis): string {
    return `設備投資により以下の具体的な生産性向上目標を設定：1)作業時間30%短縮、2)品質不良率20%削減、3)従業員一人当たり生産性30%向上。これらの改善により年間売上10%増加を見込み、その効果を従業員賃金引上げに還元します。`;
  }
}

export const businessImprovementService = new BusinessImprovementService();