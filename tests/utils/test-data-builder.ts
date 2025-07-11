/**
 * Test Data Builder Utility
 * テストデータの統一的な生成ユーティリティ
 * 作成日: 2025-06-20
 */

export interface CompanyInfo {
  name: string;
  businessType: string;
  employeeCount: number;
  annualRevenue: number;
  establishedYear: number;
  address: string;
  representative: string;
  capital: number;
}

export interface ProjectInfo {
  name: string;
  description: string;
  budget: number;
  duration: number;
  objectives: string[];
  expectedEffects: string[];
  targetMarket: string;
  technology: string[];
}

export interface GuidelineInfo {
  name: string;
  filePath: string;
  expectedScore: number;
  category: string;
  maxBudget: number;
  subsidyRate: number;
}

export interface TestData {
  companyInfo: CompanyInfo;
  projectInfo: ProjectInfo;
  guideline: GuidelineInfo;
}

export class TestDataBuilder {
  /**
   * 完全なユーザージャーニー用のテストデータを生成
   */
  static createCompleteJourneyData(): TestData {
    return {
      companyInfo: this.createCompanyInfo(),
      projectInfo: this.createProjectInfo(),
      guideline: this.createGuidelineInfo()
    };
  }

  /**
   * 標準的な企業情報を生成
   */
  static createCompanyInfo(overrides: Partial<CompanyInfo> = {}): CompanyInfo {
    const defaults: CompanyInfo = {
      name: '株式会社テストカンパニー',
      businessType: '製造業',
      employeeCount: 50,
      annualRevenue: 500000000, // 5億円
      establishedYear: 2010,
      address: '東京都千代田区大手町1-1-1',
      representative: '田中太郎',
      capital: 50000000 // 5000万円
    };

    return { ...defaults, ...overrides };
  }

  /**
   * 標準的なプロジェクト情報を生成
   */
  static createProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
    const defaults: ProjectInfo = {
      name: 'DX推進プロジェクト',
      description: '製造工程のデジタル化による生産性向上',
      budget: 10000000, // 1000万円
      duration: 12, // 12ヶ月
      objectives: [
        '生産性向上20%',
        'コスト削減15%',
        '品質向上10%'
      ],
      expectedEffects: [
        '年間売上増加: 2000万円',
        'コスト削減: 500万円/年',
        '従業員満足度向上'
      ],
      targetMarket: '国内製造業',
      technology: [
        'IoTセンサー',
        'AI画像解析',
        'クラウド基盤',
        'データ分析ツール'
      ]
    };

    return { ...defaults, ...overrides };
  }

  /**
   * 標準的な募集要項情報を生成
   */
  static createGuidelineInfo(overrides: Partial<GuidelineInfo> = {}): GuidelineInfo {
    const defaults: GuidelineInfo = {
      name: 'ものづくり補助金（一般型）',
      filePath: './test-data/monodukuri-general-guideline.pdf',
      expectedScore: 85,
      category: 'manufacturing',
      maxBudget: 15000000, // 1500万円
      subsidyRate: 50 // 50%
    };

    return { ...defaults, ...overrides };
  }

  /**
   * 複数の企業パターンを生成
   */
  static createMultipleCompanies(): CompanyInfo[] {
    return [
      this.createCompanyInfo({
        name: '大手製造株式会社',
        businessType: '製造業',
        employeeCount: 500,
        annualRevenue: 5000000000, // 50億円
        capital: 500000000 // 5億円
      }),
      this.createCompanyInfo({
        name: '中小IT企業',
        businessType: '情報通信業',
        employeeCount: 30,
        annualRevenue: 200000000, // 2億円
        capital: 10000000 // 1000万円
      }),
      this.createCompanyInfo({
        name: 'スタートアップ合同会社',
        businessType: 'サービス業',
        employeeCount: 10,
        annualRevenue: 50000000, // 5000万円
        capital: 3000000 // 300万円
      })
    ];
  }

  /**
   * 複数の補助金パターンを生成
   */
  static createMultipleGuidelines(): GuidelineInfo[] {
    return [
      this.createGuidelineInfo({
        name: 'ものづくり補助金（一般型）',
        filePath: './test-data/monodukuri-general.pdf',
        expectedScore: 85,
        category: 'manufacturing',
        maxBudget: 15000000,
        subsidyRate: 50
      }),
      this.createGuidelineInfo({
        name: 'IT導入補助金（A類型）',
        filePath: './test-data/it-introduction-a.pdf',
        expectedScore: 90,
        category: 'it',
        maxBudget: 4500000,
        subsidyRate: 50
      }),
      this.createGuidelineInfo({
        name: '持続化補助金（一般型）',
        filePath: './test-data/jizokuka-general.pdf',
        expectedScore: 75,
        category: 'small_business',
        maxBudget: 500000,
        subsidyRate: 66
      }),
      this.createGuidelineInfo({
        name: '事業再構築補助金（通常枠）',
        filePath: './test-data/saikouchiku-normal.pdf',
        expectedScore: 80,
        category: 'restructuring',
        maxBudget: 80000000,
        subsidyRate: 50
      })
    ];
  }

  /**
   * パフォーマンステスト用の大量データを生成
   */
  static createBulkData(count: number) {
    return {
      companies: Array.from({ length: count }, (_, i) => 
        this.createCompanyInfo({
          name: `テスト企業${i + 1}`,
          employeeCount: Math.floor(Math.random() * 1000) + 10,
          annualRevenue: Math.floor(Math.random() * 10000000000) + 100000000
        })
      ),
      projects: Array.from({ length: count }, (_, i) =>
        this.createProjectInfo({
          name: `プロジェクト${i + 1}`,
          budget: Math.floor(Math.random() * 50000000) + 1000000,
          duration: Math.floor(Math.random() * 24) + 6
        })
      )
    };
  }

  /**
   * エラーケース用のテストデータ
   */
  static createErrorCaseData() {
    return {
      invalidCompany: {
        name: '', // 空文字
        businessType: 'invalid_type', // 不正な業種
        employeeCount: -1, // 負の値
        annualRevenue: 'invalid' as any, // 文字列
        establishedYear: 3000, // 未来の年
        address: '',
        representative: '',
        capital: -1000000
      },
      invalidProject: {
        name: '',
        description: '',
        budget: -1000000, // 負の予算
        duration: 0, // 0期間
        objectives: [],
        expectedEffects: [],
        targetMarket: '',
        technology: []
      },
      corruptedFile: {
        name: '破損ファイルテスト',
        filePath: './test-data/corrupted-file.pdf',
        expectedScore: 0,
        category: 'test',
        maxBudget: 0,
        subsidyRate: 0
      }
    };
  }

  /**
   * セキュリティテスト用のテストデータ
   */
  static createSecurityTestData() {
    return {
      sqlInjection: {
        companyName: "'; DROP TABLE users; --",
        projectName: "' OR '1'='1",
        description: "<script>alert('XSS')</script>"
      },
      xssPayloads: [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
        "');alert('XSS');//"
      ],
      oversizeData: {
        largeText: 'A'.repeat(1000000), // 1MB文字列
        largeArray: Array(10000).fill('data'),
        deepObject: this.createDeepNestedObject(1000)
      }
    };
  }

  /**
   * 深くネストしたオブジェクトを生成（セキュリティテスト用）
   */
  private static createDeepNestedObject(depth: number): any {
    if (depth === 0) return 'value';
    return { nested: this.createDeepNestedObject(depth - 1) };
  }

  /**
   * API負荷テスト用のリクエストデータ
   */
  static createLoadTestRequests(concurrent: number) {
    return Array.from({ length: concurrent }, (_, i) => ({
      id: `load-test-${i}`,
      company: this.createCompanyInfo({
        name: `負荷テスト企業${i}`
      }),
      project: this.createProjectInfo({
        name: `負荷テストプロジェクト${i}`
      }),
      timestamp: new Date().toISOString(),
      sessionId: `session-${i}`
    }));
  }

  /**
   * マイルストーン用のテストデータ
   */
  static createMilestones() {
    return [
      {
        title: '要件定義',
        description: 'システム要件の詳細化',
        dueDate: '2025-08-31',
        deliverables: ['要件定義書', 'システム仕様書']
      },
      {
        title: '設計・開発',
        description: 'システムの設計と開発',
        dueDate: '2026-03-31',
        deliverables: ['設計書', 'システム']
      },
      {
        title: 'テスト・検証',
        description: 'システムテストと性能検証',
        dueDate: '2026-05-31',
        deliverables: ['テスト結果', '性能評価レポート']
      },
      {
        title: '本格運用開始',
        description: 'システムの本格運用開始',
        dueDate: '2026-06-30',
        deliverables: ['運用マニュアル', '効果測定レポート']
      }
    ];
  }

  /**
   * KPIデータの生成
   */
  static createKPIData() {
    return {
      baseline: {
        productivity: 100,
        efficiency: 100,
        quality: 100,
        cost: 100
      },
      target: {
        productivity: 120,
        efficiency: 115,
        quality: 110,
        cost: 85
      },
      actual: {
        productivity: 118,
        efficiency: 113,
        quality: 108,
        cost: 87
      }
    };
  }

  /**
   * 財務データの生成
   */
  static createFinancialData() {
    return {
      budget: {
        equipment: 5000000,
        software: 2000000,
        personnel: 2500000,
        other: 500000,
        total: 10000000
      },
      actual: {
        equipment: 4800000,
        software: 1900000,
        personnel: 2600000,
        other: 450000,
        total: 9750000
      },
      variance: {
        equipment: -200000,
        software: -100000,
        personnel: 100000,
        other: -50000,
        total: -250000
      }
    };
  }
}