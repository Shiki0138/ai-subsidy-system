// 業務改善助成金の最新募集要項・ガイドライン（2025年度版）

export interface BusinessImprovementRequirement {
  id: string;
  title: string;
  description: string;
  conditions: string[];
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  acceptanceRate: number;
  effectivePhrase: string;
}

export interface ApplicationPoint {
  category: string;
  weight: number;
  requirements: string[];
  tips: string[];
}

// 申請要件
export const APPLICATION_REQUIREMENTS: BusinessImprovementRequirement[] = [
  {
    id: 'basic',
    title: '基本要件',
    description: '業務改善助成金の基本的な申請要件',
    conditions: [
      '中小企業・小規模事業者であること',
      '事業場内最低賃金と地域別最低賃金の差額が50円以内',
      '労働者（雇用保険被保険者）を雇用していること',
      '賃金台帳等の法定帳簿を整備していること'
    ]
  },
  {
    id: 'wage',
    title: '賃金要件',
    description: '賃金引上げに関する要件',
    conditions: [
      '全ての労働者の賃金を事業場内最低賃金以上に引上げること',
      '引上げ額：30円～120円（コースにより異なる）',
      '引上げ実施時期：令和7年1月31日まで',
      '引上げ後の賃金を継続して支払うこと'
    ]
  },
  {
    id: 'productivity',
    title: '生産性向上要件',
    description: '生産性向上に関する要件',
    conditions: [
      '生産性向上に資する設備投資を行うこと',
      '設備導入により業務効率化・品質向上が見込まれること',
      '投資額：設備投資単価30万円以上（一部例外あり）',
      '単年度内に設備投資を完了すること'
    ]
  }
];

// 対象設備カテゴリ
export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'manufacturing',
    name: '生産設備',
    description: '製造業における生産性向上設備',
    examples: [
      'CNC工作機械', '自動化ライン', '検査装置', 'ロボット',
      '3Dプリンター', '溶接機', 'プレス機', '包装機'
    ],
    acceptanceRate: 92,
    effectivePhrase: '工程の自動化により、作業時間を大幅に短縮し、製品品質の安定化を実現'
  },
  {
    id: 'it-system',
    name: 'ITシステム',
    description: '業務効率化のためのITシステム',
    examples: [
      '業務管理システム', 'POS システム', '在庫管理システム',
      'ERP システム', 'クラウドサービス', 'AI・IoT システム'
    ],
    acceptanceRate: 88,
    effectivePhrase: 'デジタル化により業務プロセスを効率化し、労働生産性の向上を実現'
  },
  {
    id: 'service',
    name: 'サービス業設備',
    description: 'サービス業での効率化設備',
    examples: [
      'セルフレジ', 'モバイルオーダーシステム', '予約管理システム',
      '自動調理機器', '清掃ロボット', 'キャッシュレス決済端末'
    ],
    acceptanceRate: 85,
    effectivePhrase: '顧客サービスの質を向上させながら、従業員の負担軽減を実現'
  },
  {
    id: 'logistics',
    name: '物流・運搬設備',
    description: '物流業務の効率化設備',
    examples: [
      '自動倉庫システム', 'フォークリフト', 'AGV（無人搬送車）',
      '仕分けシステム', 'ピッキングシステム', 'RFID システム'
    ],
    acceptanceRate: 90,
    effectivePhrase: '物流工程の自動化により、作業効率と安全性を同時に向上'
  },
  {
    id: 'office',
    name: 'オフィス環境',
    description: '事務作業効率化のための設備',
    examples: [
      'テレワークシステム', 'Web会議システム', '文書管理システム',
      '複合機', 'シュレッダー', 'プロジェクター'
    ],
    acceptanceRate: 75,
    effectivePhrase: 'デジタル化により事務作業を効率化し、働き方改革を推進'
  }
];

// 審査ポイント
export const EVALUATION_POINTS: ApplicationPoint[] = [
  {
    category: '事業計画の妥当性',
    weight: 30,
    requirements: [
      '現状の課題分析が具体的であること',
      '設備導入の必要性が明確であること',
      '導入効果の測定方法が明示されていること',
      '実施スケジュールが現実的であること'
    ],
    tips: [
      '具体的な数値データを用いて現状を分析する',
      '設備導入による改善効果を定量的に示す',
      'before/afterの比較を明確にする',
      '業界動向や市場環境を踏まえた計画とする'
    ]
  },
  {
    category: '生産性向上効果',
    weight: 35,
    requirements: [
      '生産性向上が定量的に示されていること',
      '設備投資と効果の関連性が明確であること',
      '継続的な効果が期待できること',
      '他の従業員への波及効果があること'
    ],
    tips: [
      '作業時間短縮の具体的な数値を示す',
      '品質向上による効果を説明する',
      '従業員のスキルアップ効果を記載する',
      '将来の事業展開への影響を述べる'
    ]
  },
  {
    category: '賃金引上げ計画',
    weight: 25,
    requirements: [
      '全労働者の賃金引上げが計画されていること',
      '引上げ原資の確保方法が明確であること',
      '継続性が担保されていること',
      '地域経済への貢献が期待できること'
    ],
    tips: [
      '生産性向上による収益改善効果を示す',
      '売上増加計画を具体的に記載する',
      '人材確保・定着効果を説明する',
      '地域の人材確保競争への対応を述べる'
    ]
  },
  {
    category: '実現可能性',
    weight: 10,
    requirements: [
      '技術的な実現可能性が高いこと',
      '資金計画が適切であること',
      '実施体制が整っていること',
      'リスク対策が検討されていること'
    ],
    tips: [
      '過去の設備投資実績を示す',
      '専門業者との連携体制を説明する',
      '従業員の研修計画を記載する',
      '予期せぬトラブルへの対応策を準備する'
    ]
  }
];

// 助成額・助成率
export const SUBSIDY_RATES = {
  courses: [
    {
      name: '30円コース',
      wageIncrease: 30,
      subsidyRate: 0.75,
      maxAmount: {
        '1名': 300000,
        '2～3名': 500000,
        '4～6名': 700000,
        '7名以上': 1000000
      }
    },
    {
      name: '45円コース',
      wageIncrease: 45,
      subsidyRate: 0.75,
      maxAmount: {
        '1名': 450000,
        '2～3名': 700000,
        '4～6名': 1000000,
        '7名以上': 1500000
      }
    },
    {
      name: '60円コース',
      wageIncrease: 60,
      subsidyRate: 0.75,
      maxAmount: {
        '1名': 600000,
        '2～3名': 900000,
        '4～6名': 1500000,
        '7名以上': 2000000
      }
    },
    {
      name: '90円コース',
      wageIncrease: 90,
      subsidyRate: 0.8,
      maxAmount: {
        '1名': 900000,
        '2～3名': 1500000,
        '4～6名': 2000000,
        '7名以上': 3000000
      }
    }
  ]
};

// 採択されやすいフレーズ集
export const SUCCESS_PHRASES = {
  necessity: [
    '人手不足の深刻化により、業務効率化が急務となっている',
    '品質向上と生産性向上の両立が競争力強化に不可欠',
    '労働力不足を補うため、設備投資による生産性向上が必要',
    '顧客ニーズの多様化に対応するため、柔軟な生産体制の構築が必要'
  ],
  effectiveness: [
    '作業時間を[X]%短縮し、生産性を大幅に向上させる',
    '品質の安定化により、不良率を[X]%削減する',
    '自動化により、従業員をより付加価値の高い業務に配置転換',
    'デジタル化により、リアルタイムでの進捗管理と品質管理を実現'
  ],
  sustainability: [
    '生産性向上による収益改善で、継続的な賃金引上げを実現',
    '従業員のスキルアップにより、企業の成長基盤を強化',
    '地域の雇用創出と人材定着に貢献',
    '持続可能な経営基盤の確立により、長期的な発展を目指す'
  ],
  innovation: [
    'DXの推進により、新たなビジネスモデルの創出を目指す',
    '最新技術の活用により、業界のリーディングカンパニーを目指す',
    'データ活用により、エビデンスに基づく経営判断を実現',
    '働き方改革の推進により、魅力的な職場環境を創出'
  ]
};

// 避けるべきフレーズ
export const AVOID_PHRASES = [
  '古い設備', '効率が悪い', '人件費削減', '単純作業',
  '安い', '簡単', '誰でもできる', '一時的な',
  '試験的に', 'とりあえず', '何となく', '他社でも'
];

// 成功事例テンプレート
export const SUCCESS_EXAMPLES = [
  {
    industry: '製造業',
    companySize: '従業員15名',
    equipment: 'CNC旋盤導入',
    wageIncrease: 60,
    effect: '加工時間35%短縮、不良率60%削減',
    subsidyAmount: 1200000,
    keyPoint: '具体的な数値目標と測定方法の明確化が評価された'
  },
  {
    industry: '飲食業',
    companySize: '従業員8名',
    equipment: 'セルフオーダーシステム導入',
    wageIncrease: 45,
    effect: '注文処理時間50%短縮、接客品質向上',
    subsidyAmount: 700000,
    keyPoint: '顧客満足度向上と従業員負担軽減の両立が評価された'
  },
  {
    industry: '小売業',
    companySize: '従業員12名',
    equipment: '在庫管理システム導入',
    wageIncrease: 45,
    effect: '在庫管理業務70%削減、欠品率30%減少',
    subsidyAmount: 900000,
    keyPoint: 'デジタル化による業務効率化と売上向上効果が評価された'
  }
];