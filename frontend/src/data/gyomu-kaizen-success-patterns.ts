// 業務改善助成金の採択成功パターンデータベース

import { SuccessPattern, AcceptedExample } from '@/types/success-patterns'

// 業界別成功パターン
export const GYOMU_KAIZEN_SUCCESS_PATTERNS: SuccessPattern[] = [
  {
    id: 'manufacturing-small',
    industry: '製造業',
    employeeRange: '1-20名',
    acceptanceRate: 87,
    patterns: {
      equipmentTypes: [
        {
          category: '生産設備',
          name: '自動加工機・NC工作機械',
          purpose: '加工時間の短縮と品質向上',
          effect: '生産性30%向上、不良率50%削減',
          acceptanceScore: 95,
          priceRange: { min: 2000000, max: 5000000 }
        },
        {
          category: 'IT機器',
          name: '生産管理システム',
          purpose: '工程管理の効率化',
          effect: '管理時間40%削減、納期遵守率向上',
          acceptanceScore: 88,
          priceRange: { min: 500000, max: 1500000 }
        }
      ],
      productivityMetrics: [
        {
          name: '時間当たり生産数',
          calculation: '生産数÷作業時間',
          improvementTarget: '30%以上向上',
          measurementMethod: '導入前後3ヶ月の実績比較',
          weight: 90
        },
        {
          name: '不良率',
          calculation: '不良品数÷総生産数×100',
          improvementTarget: '50%以上削減',
          measurementMethod: '品質記録の統計分析',
          weight: 80
        }
      ],
      wageIncreaseStrategies: [
        {
          increaseAmount: 50,
          targetEmployees: '製造部門の最低賃金労働者全員',
          timing: '設備導入後3ヶ月以内',
          sustainability: '生産性向上による収益増で賃金原資を確保',
          acceptanceScore: 92
        }
      ],
      commonPhrases: [
        '具体的な数値目標を設定し、PDCAサイクルで継続的に改善',
        '従業員の技能向上と処遇改善を同時に実現',
        '地域の雇用維持・創出に貢献',
        '導入設備により作業の標準化と品質の安定化を図る'
      ],
      avoidPhrases: [
        '検討中', '予定', '努力する', '可能な限り',
        '効果があると思われる', '期待している'
      ]
    },
    examples: []
  },
  {
    id: 'food-service-small',
    industry: '飲食サービス業',
    employeeRange: '1-10名',
    acceptanceRate: 83,
    patterns: {
      equipmentTypes: [
        {
          category: '厨房機器',
          name: 'スチームコンベクションオーブン',
          purpose: '調理時間短縮と品質均一化',
          effect: '調理時間40%短縮、廃棄ロス30%削減',
          acceptanceScore: 91,
          priceRange: { min: 800000, max: 1500000 }
        },
        {
          category: 'POSシステム',
          name: 'タブレットPOSレジ',
          purpose: '注文・会計業務の効率化',
          effect: '接客時間20%短縮、売上分析による戦略立案',
          acceptanceScore: 85,
          priceRange: { min: 300000, max: 800000 }
        },
        {
          category: '予約管理',
          name: 'Web予約システム',
          purpose: '予約受付業務の自動化',
          effect: '電話対応時間70%削減、予約率20%向上',
          acceptanceScore: 82,
          priceRange: { min: 200000, max: 500000 }
        }
      ],
      productivityMetrics: [
        {
          name: '客単価×回転率',
          calculation: '(売上高÷客数)×(客数÷席数÷営業時間)',
          improvementTarget: '25%以上向上',
          measurementMethod: 'POSデータによる自動集計',
          weight: 85
        },
        {
          name: '従業員1人当たり売上',
          calculation: '月間売上高÷従業員数',
          improvementTarget: '20%以上向上',
          measurementMethod: '売上データと勤務記録の照合',
          weight: 88
        }
      ],
      wageIncreaseStrategies: [
        {
          increaseAmount: 40,
          targetEmployees: 'キッチン・ホールスタッフ全員',
          timing: 'システム導入と同時',
          sustainability: '業務効率化による人件費率の適正化で対応',
          acceptanceScore: 85
        }
      ],
      commonPhrases: [
        'お客様満足度の向上と従業員の働きやすさを両立',
        '食材ロスの削減により原価率を改善',
        'データに基づいた経営判断で収益性を向上',
        '従業員のモチベーション向上により定着率を改善'
      ],
      avoidPhrases: [
        '忙しい', '人手不足', '売上が厳しい',
        '競争が激しい', '難しい状況'
      ]
    },
    examples: []
  },
  {
    id: 'retail-small',
    industry: '小売業',
    employeeRange: '1-15名',
    acceptanceRate: 85,
    patterns: {
      equipmentTypes: [
        {
          category: '在庫管理',
          name: 'バーコード在庫管理システム',
          purpose: '在庫管理の効率化と適正化',
          effect: '棚卸時間60%削減、欠品率70%改善',
          acceptanceScore: 90,
          priceRange: { min: 400000, max: 1000000 }
        },
        {
          category: 'レジシステム',
          name: 'セミセルフレジ',
          purpose: '会計処理の効率化',
          effect: 'レジ待ち時間50%短縮、会計ミス90%削減',
          acceptanceScore: 87,
          priceRange: { min: 1000000, max: 2000000 }
        }
      ],
      productivityMetrics: [
        {
          name: '売場面積当たり売上',
          calculation: '月間売上高÷売場面積',
          improvementTarget: '15%以上向上',
          measurementMethod: '売上データと売場レイアウト図による算出',
          weight: 82
        },
        {
          name: '在庫回転率',
          calculation: '売上原価÷平均在庫高',
          improvementTarget: '20%以上改善',
          measurementMethod: '在庫管理システムの自動計算',
          weight: 85
        }
      ],
      wageIncreaseStrategies: [
        {
          increaseAmount: 45,
          targetEmployees: '販売スタッフ及び在庫管理担当者',
          timing: 'システム稼働開始から1ヶ月後',
          sustainability: '在庫ロス削減と売上向上により確保',
          acceptanceScore: 88
        }
      ],
      commonPhrases: [
        '顧客満足度を高めながら業務効率を改善',
        'データ分析により売れ筋商品の把握と適正在庫を実現',
        '従業員の負担軽減により接客品質を向上',
        '地域のニーズに応える品揃えの最適化'
      ],
      avoidPhrases: [
        'なんとなく', '感覚的に', 'これまでの経験から',
        '大手に対抗', '価格競争'
      ]
    },
    examples: []
  },
  {
    id: 'care-service',
    industry: '介護・福祉',
    employeeRange: '10-30名',
    acceptanceRate: 89,
    patterns: {
      equipmentTypes: [
        {
          category: '介護支援機器',
          name: '移乗支援リフト',
          purpose: '身体的負担の軽減と安全性向上',
          effect: '腰痛発生率60%減、移乗時間30%短縮',
          acceptanceScore: 94,
          priceRange: { min: 1500000, max: 3000000 }
        },
        {
          category: '記録システム',
          name: '介護記録タブレットシステム',
          purpose: '記録業務の効率化',
          effect: '記録時間50%削減、情報共有の迅速化',
          acceptanceScore: 89,
          priceRange: { min: 500000, max: 1200000 }
        }
      ],
      productivityMetrics: [
        {
          name: '直接介護時間比率',
          calculation: '直接介護時間÷総労働時間×100',
          improvementTarget: '15%以上向上',
          measurementMethod: '業務時間記録による測定',
          weight: 92
        },
        {
          name: '職員定着率',
          calculation: '(期末職員数－新規採用数)÷期初職員数×100',
          improvementTarget: '10%以上改善',
          measurementMethod: '人事記録による算出',
          weight: 87
        }
      ],
      wageIncreaseStrategies: [
        {
          increaseAmount: 60,
          targetEmployees: '介護職員全員',
          timing: '機器導入研修完了後',
          sustainability: '離職率低下による採用コスト削減分を原資',
          acceptanceScore: 91
        }
      ],
      commonPhrases: [
        '利用者様のQOL向上と職員の働きやすさを実現',
        '身体的負担軽減により長く働ける職場環境を構築',
        '記録の効率化により利用者様と向き合う時間を確保',
        'チーム連携の強化により介護の質を向上'
      ],
      avoidPhrases: [
        '大変な仕事', '人材不足が深刻', '厳しい労働環境',
        '報酬が低い', '社会的評価'
      ]
    },
    examples: []
  },
  {
    id: 'construction-small',
    industry: '建設業',
    employeeRange: '5-20名',
    acceptanceRate: 86,
    patterns: {
      equipmentTypes: [
        {
          category: '測量機器',
          name: '3Dレーザースキャナー',
          purpose: '測量作業の効率化と精度向上',
          effect: '測量時間70%短縮、手戻り80%削減',
          acceptanceScore: 92,
          priceRange: { min: 2000000, max: 4000000 }
        },
        {
          category: '施工管理',
          name: 'クラウド型工程管理システム',
          purpose: '工程管理と情報共有の効率化',
          effect: '管理業務30%削減、工期遅延50%改善',
          acceptanceScore: 86,
          priceRange: { min: 300000, max: 800000 }
        }
      ],
      productivityMetrics: [
        {
          name: '工事完成高/従業員',
          calculation: '年間完成工事高÷従業員数',
          improvementTarget: '20%以上向上',
          measurementMethod: '決算書と従業員名簿による算出',
          weight: 88
        },
        {
          name: '手戻り率',
          calculation: '手戻り工事件数÷総工事件数×100',
          improvementTarget: '70%以上削減',
          measurementMethod: '工事記録による集計',
          weight: 85
        }
      ],
      wageIncreaseStrategies: [
        {
          increaseAmount: 55,
          targetEmployees: '現場作業員及び施工管理技士',
          timing: '年度初めより実施',
          sustainability: '工期短縮と手戻り削減による収益改善で確保',
          acceptanceScore: 87
        }
      ],
      commonPhrases: [
        '安全性と生産性の両立を実現',
        'ICT技術の活用により若手人材の育成を促進',
        '品質向上により顧客満足度と受注率を改善',
        '働き方改革により建設業の魅力を向上'
      ],
      avoidPhrases: [
        '3K職場', '若者が集まらない', '伝統的な',
        '昔ながらの', '変化を嫌う'
      ]
    },
    examples: []
  }
]

// 採択された実例（サンプル）
export const ACCEPTED_EXAMPLES: AcceptedExample[] = [
  {
    id: 'ex-001',
    year: 2023,
    industry: '製造業',
    employeeCount: 15,
    equipment: 'CNC旋盤',
    productivityImprovement: '加工時間35%短縮、不良率60%削減',
    wageIncrease: 50,
    totalCost: 4500000,
    subsidyAmount: 3375000,
    keySuccessFactors: [
      '具体的な数値目標と測定方法の明確化',
      '従業員研修計画の詳細な記載',
      '地域経済への貢献を強調',
      '持続可能な賃金原資の確保方法'
    ],
    reviewerComments: '生産性向上と賃金引上げの関連性が明確で、実現可能性が高い'
  },
  {
    id: 'ex-002',
    year: 2023,
    industry: '飲食サービス業',
    employeeCount: 8,
    equipment: 'セントラルキッチン設備一式',
    productivityImprovement: '仕込み時間40%削減、原価率5%改善',
    wageIncrease: 45,
    totalCost: 2000000,
    subsidyAmount: 1500000,
    keySuccessFactors: [
      'HACCP対応による品質管理体制の構築',
      '従業員の多能工化計画',
      'データに基づく効果測定方法',
      '顧客満足度向上への取り組み'
    ]
  },
  {
    id: 'ex-003',
    year: 2024,
    industry: '小売業',
    employeeCount: 12,
    equipment: 'AI在庫管理システム',
    productivityImprovement: '在庫回転率25%向上、欠品率80%改善',
    wageIncrease: 40,
    totalCost: 1200000,
    subsidyAmount: 900000,
    keySuccessFactors: [
      'DXによる業務プロセスの革新',
      '従業員のITスキル向上計画',
      '売上データの詳細な分析',
      '地域密着型経営の強化'
    ]
  }
]

// 審査員が重視するポイント
export const REVIEWER_FOCUS_POINTS = {
  necessity: {
    weight: 25,
    checkPoints: [
      '現状の課題が具体的に記載されているか',
      '設備導入の必要性が論理的に説明されているか',
      '地域や業界の状況を踏まえているか'
    ]
  },
  feasibility: {
    weight: 25,
    checkPoints: [
      '実施計画が具体的で実現可能か',
      '必要な許認可や技術的要件を満たしているか',
      '実施体制が明確か'
    ]
  },
  effectiveness: {
    weight: 25,
    checkPoints: [
      '生産性向上の効果が定量的に示されているか',
      '測定方法が適切か',
      '賃金引上げとの関連性が明確か'
    ]
  },
  sustainability: {
    weight: 25,
    checkPoints: [
      '効果の持続性が期待できるか',
      '賃金引上げの原資が確保できるか',
      '事業の発展性があるか'
    ]
  }
}

// フレーズテンプレート
export const PHRASE_TEMPLATES = {
  opening: [
    '弊社は{industry}として{years}年間、地域に根ざした事業を展開してまいりました。',
    '昨今の{challenge}という課題に直面し、抜本的な生産性向上が急務となっております。',
    'この度、{equipment}の導入により、生産性向上と従業員の処遇改善を同時に実現する計画です。'
  ],
  necessity: [
    '現在、{specific_issue}により、月間約{loss_amount}円の機会損失が発生しています。',
    '{equipment}の導入により、この課題を解決し、{improvement_target}の実現を目指します。',
    '地域の{local_context}という状況下で、弊社の役割はますます重要になっています。'
  ],
  effectiveness: [
    '導入により、{metric}を{before}から{after}へ{improvement_rate}%改善します。',
    'これは{measurement_method}により客観的に測定・検証いたします。',
    '生産性向上により生み出される{benefit}を従業員に還元します。'
  ],
  sustainability: [
    '{revenue_increase}の収益増加により、賃金引上げ原資として年間{wage_fund}円を確保します。',
    '継続的な改善活動により、3年後には{future_target}の達成を見込んでいます。',
    '従業員の定着率向上により、採用・教育コストを年間{cost_reduction}円削減できます。'
  ],
  closing: [
    '本事業により、従業員の生活向上と地域経済の活性化に貢献してまいります。',
    '生産性向上の成果を確実に従業員に還元し、好循環を生み出します。',
    'ご支援を賜りますよう、何卒よろしくお願い申し上げます。'
  ]
}