/**
 * 業務改善助成金申請書テンプレート
 */

export interface BusinessImprovementApplicationData {
  // 申請者情報
  applicant: {
    companyName: string;
    corporateNumber?: string;
    representativeName: string;
    address: string;
    phone: string;
    email?: string;
    industry: string;
    employeeCount: number;
    foundedYear?: number;
  };
  
  // 事業所情報
  workplace: {
    workplaceName: string;
    workplaceAddress: string;
    workplacePhone: string;
    managerName: string;
    employeeCount: number;
    currentMinimumWage: number;
    targetMinimumWage: number;
    wageIncreaseAmount: number;
  };
  
  // 選択コース
  selectedCourse: {
    courseName: string;
    wageIncrease: number;
    maxSubsidy: number;
    requiredEmployees: string;
  };
  
  // 業務改善計画
  improvementPlan: {
    currentSituation: string;
    challenges: string;
    improvementGoals: string;
    expectedEffects: string;
    productivityImprovements: {
      item: string;
      currentValue: string;
      targetValue: string;
      improvementRate: string;
    }[];
  };
  
  // 設備投資計画
  equipmentPlan: {
    equipmentList: {
      name: string;
      type: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      supplier: string;
      installationDate: string;
      purpose: string;
    }[];
    totalInvestment: number;
    subsidyRequest: number;
    selfFunding: number;
  };
  
  // 賃金引上げ計画
  wageIncreasePlan: {
    targetEmployees: {
      name: string;
      position: string;
      currentWage: number;
      newWage: number;
      increaseAmount: number;
    }[];
    implementationDate: string;
    sustainabilityMeasures: string;
  };
  
  // 事業実施体制
  implementationStructure: {
    projectManager: string;
    responsibleDepartment: string;
    implementationSchedule: {
      phase: string;
      period: string;
      description: string;
    }[];
    riskManagement: string;
  };
}

export const businessImprovementSubsidyTemplate = {
  title: '業務改善助成金交付申請書',
  
  // フォーム定義
  formSections: [
    {
      id: 'applicant_info',
      title: '申請者情報',
      fields: [
        {
          id: 'companyName',
          label: '事業所名',
          type: 'text',
          required: true,
          placeholder: '株式会社○○',
          validation: { minLength: 1, maxLength: 100 }
        },
        {
          id: 'corporateNumber',
          label: '法人番号',
          type: 'text',
          required: false,
          placeholder: '1234567890123',
          validation: { pattern: '^[0-9]{13}$' }
        },
        {
          id: 'representativeName',
          label: '代表者氏名',
          type: 'text',
          required: true,
          placeholder: '山田太郎',
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          id: 'address',
          label: '所在地',
          type: 'text',
          required: true,
          placeholder: '東京都千代田区○○1-1-1',
          validation: { minLength: 1, maxLength: 200 }
        },
        {
          id: 'phone',
          label: '電話番号',
          type: 'tel',
          required: true,
          placeholder: '03-1234-5678',
          validation: { pattern: '^[0-9-]{10,15}$' }
        },
        {
          id: 'email',
          label: 'メールアドレス',
          type: 'email',
          required: false,
          placeholder: 'example@company.co.jp'
        },
        {
          id: 'industry',
          label: '業種',
          type: 'select',
          required: true,
          options: [
            '製造業',
            '建設業',
            '情報通信業',
            '運輸・郵便業',
            '卸売・小売業',
            '宿泊・飲食サービス業',
            'サービス業',
            'その他'
          ]
        },
        {
          id: 'employeeCount',
          label: '従業員数',
          type: 'number',
          required: true,
          placeholder: '10',
          validation: { min: 1, max: 999 }
        }
      ]
    },
    {
      id: 'workplace_info', 
      title: '事業所情報',
      fields: [
        {
          id: 'workplaceName',
          label: '事業所名',
          type: 'text',
          required: true,
          placeholder: '本社事業所'
        },
        {
          id: 'workplaceAddress',
          label: '事業所所在地',
          type: 'text', 
          required: true,
          placeholder: '東京都千代田区○○1-1-1'
        },
        {
          id: 'currentMinimumWage',
          label: '現在の事業場内最低賃金（時給）',
          type: 'number',
          required: true,
          placeholder: '900',
          validation: { min: 500, max: 999 }
        },
        {
          id: 'targetMinimumWage',
          label: '引上げ後の事業場内最低賃金（時給）',
          type: 'number',
          required: true,
          placeholder: '960',
          validation: { min: 500, max: 1500 }
        },
        {
          id: 'wageIncreaseAmount',
          label: '賃金引上げ額（時給）',
          type: 'number',
          required: true,
          placeholder: '60',
          validation: { min: 30, max: 200 }
        }
      ]
    },
    {
      id: 'course_selection',
      title: 'コース選択',
      fields: [
        {
          id: 'selectedCourse',
          label: '申請コース',
          type: 'radio',
          required: true,
          options: [
            { value: '30', label: '30円コース（上限30万円）' },
            { value: '45', label: '45円コース（上限45万円）' },
            { value: '60', label: '60円コース（上限60万円）' },
            { value: '90', label: '90円コース（上限150万円）' },
            { value: '120', label: '120円コース（上限300万円）' },
            { value: '150', label: '150円コース（上限600万円）' }
          ]
        }
      ]
    },
    {
      id: 'improvement_plan',
      title: '業務改善計画',
      fields: [
        {
          id: 'currentSituation',
          label: '現在の業務の状況',
          type: 'textarea',
          required: true,
          placeholder: '現在の業務プロセス、課題、問題点等を詳しく記述してください。',
          validation: { minLength: 100, maxLength: 1000 }
        },
        {
          id: 'challenges',
          label: '解決すべき課題',
          type: 'textarea',
          required: true,
          placeholder: '生産性向上において解決が必要な具体的な課題を記述してください。',
          validation: { minLength: 50, maxLength: 500 }
        },
        {
          id: 'improvementGoals',
          label: '業務改善の目標',
          type: 'textarea',
          required: true,
          placeholder: '設備投資によって達成したい具体的な目標を記述してください。',
          validation: { minLength: 50, maxLength: 500 }
        },
        {
          id: 'expectedEffects',
          label: '期待される効果',
          type: 'textarea',
          required: true,
          placeholder: '業務改善により期待される具体的な効果を記述してください。',
          validation: { minLength: 50, maxLength: 500 }
        }
      ]
    },
    {
      id: 'equipment_plan',
      title: '設備投資計画',
      fields: [
        {
          id: 'equipmentList',
          label: '導入予定設備',
          type: 'array',
          required: true,
          itemFields: [
            { id: 'name', label: '設備名', type: 'text', required: true },
            { id: 'type', label: '種類', type: 'text', required: true },
            { id: 'quantity', label: '数量', type: 'number', required: true },
            { id: 'unitPrice', label: '単価', type: 'number', required: true },
            { id: 'supplier', label: '供給業者', type: 'text', required: true },
            { id: 'purpose', label: '導入目的', type: 'text', required: true }
          ]
        },
        {
          id: 'totalInvestment',
          label: '総投資額',
          type: 'number',
          required: true,
          placeholder: '1000000'
        },
        {
          id: 'subsidyRequest',
          label: '助成金申請額',
          type: 'number',
          required: true,
          placeholder: '750000'
        }
      ]
    },
    {
      id: 'wage_plan',
      title: '賃金引上げ計画',
      fields: [
        {
          id: 'targetEmployees',
          label: '対象従業員',
          type: 'array',
          required: true,
          itemFields: [
            { id: 'name', label: '氏名', type: 'text', required: true },
            { id: 'position', label: '職種', type: 'text', required: true },
            { id: 'currentWage', label: '現在の時給', type: 'number', required: true },
            { id: 'newWage', label: '引上げ後の時給', type: 'number', required: true }
          ]
        },
        {
          id: 'implementationDate',
          label: '賃金引上げ実施日',
          type: 'date',
          required: true
        },
        {
          id: 'sustainabilityMeasures',
          label: '賃金引上げの持続性確保方策',
          type: 'textarea',
          required: true,
          placeholder: '引き上げた賃金を維持するための具体的な方策を記述してください。',
          validation: { minLength: 50, maxLength: 500 }
        }
      ]
    },
    {
      id: 'implementation',
      title: '実施体制',
      fields: [
        {
          id: 'projectManager',
          label: '事業責任者',
          type: 'text',
          required: true,
          placeholder: '田中次郎'
        },
        {
          id: 'responsibleDepartment',
          label: '担当部署',
          type: 'text',
          required: true,
          placeholder: '生産部'
        },
        {
          id: 'implementationSchedule',
          label: '実施スケジュール',
          type: 'array',
          required: true,
          itemFields: [
            { id: 'phase', label: 'フェーズ', type: 'text', required: true },
            { id: 'period', label: '期間', type: 'text', required: true },
            { id: 'description', label: '実施内容', type: 'text', required: true }
          ]
        },
        {
          id: 'riskManagement',
          label: 'リスク管理',
          type: 'textarea',
          required: true,
          placeholder: 'プロジェクト実施におけるリスクと対応策を記述してください。',
          validation: { minLength: 50, maxLength: 500 }
        }
      ]
    }
  ],

  // AI生成用プロンプトテンプレート
  aiPrompts: {
    currentSituation: `
企業情報: {companyInfo}
業種: {industry}
従業員数: {employeeCount}
現在の最低賃金: {currentMinimumWage}円

上記の企業の現在の業務状況について、以下の観点から具体的に記述してください：
- 主要な業務プロセス
- 生産性の課題
- 労働環境の現状
- 改善が必要な点

文字数: 200-400文字
`,
    
    challenges: `
企業情報: {companyInfo}
現在の状況: {currentSituation}

生産性向上において解決すべき具体的な課題を以下の観点から記述してください：
- 作業効率の問題
- 品質管理の課題
- コストの問題
- 人的リソースの課題

文字数: 100-200文字
`,
    
    improvementGoals: `
企業情報: {companyInfo}
解決すべき課題: {challenges}
導入予定設備: {equipmentList}

設備投資によって達成したい具体的な目標を記述してください：
- 生産性向上の数値目標
- 品質改善の目標
- コスト削減の目標
- 労働環境改善の目標

文字数: 100-200文字
`,
    
    expectedEffects: `
企業情報: {companyInfo}
改善目標: {improvementGoals}
投資計画: {equipmentPlan}

業務改善により期待される具体的な効果を以下の観点から記述してください：
- 生産性向上効果（数値で示す）
- 品質向上効果
- コスト削減効果
- 従業員の労働環境改善効果
- 地域経済への貢献

文字数: 150-300文字
`,
    
    sustainabilityMeasures: `
企業情報: {companyInfo}
賃金引上げ計画: {wageIncreasePlan}
期待される効果: {expectedEffects}

引き上げた賃金を維持するための具体的な方策を記述してください：
- 生産性向上による収益増加
- 新規事業の展開
- 業務効率化によるコスト削減
- 従業員のスキルアップ

文字数: 100-200文字
`
  },

  // 必要書類リスト
  requiredDocuments: [
    {
      name: '業務改善助成金交付申請書',
      description: 'システムで生成されるメイン申請書',
      required: true,
      category: 'main'
    },
    {
      name: '事業場内最低賃金引上げ計画書',
      description: '賃金引上げの詳細計画',
      required: true,
      category: 'wage'
    },
    {
      name: '業務改善計画書',
      description: '生産性向上のための具体的計画',
      required: true,
      category: 'improvement'
    },
    {
      name: '設備等導入に関する計画書',
      description: '導入予定設備の詳細',
      required: true,
      category: 'equipment'
    },
    {
      name: '購入予定設備等の見積書',
      description: '設備購入の見積もり',
      required: true,
      category: 'estimate'
    },
    {
      name: '労働者名簿',
      description: '対象従業員の一覧',
      required: true,
      category: 'employee'
    },
    {
      name: '賃金台帳',
      description: '現在の賃金状況',
      required: true,
      category: 'wage'
    },
    {
      name: '就業規則',
      description: '労働条件の規定',
      required: true,
      category: 'regulation'
    }
  ],

  // バリデーションルール
  validationRules: {
    wageIncrease: {
      min: 30,
      max: 200,
      courses: {
        30: { max: 300000, employees: '1人以上' },
        45: { max: 450000, employees: '1人以上' },
        60: { max: 600000, employees: '1人以上' },
        90: { max: 1500000, employees: '2人以上7人以下' },
        120: { max: 3000000, employees: '3人以上10人以下' },
        150: { max: 6000000, employees: '4人以上' }
      }
    },
    subsidyRate: 0.75, // 3/4
    maxMinimumWage: 999 // 事業場内最低賃金の上限
  }
};

export default businessImprovementSubsidyTemplate;