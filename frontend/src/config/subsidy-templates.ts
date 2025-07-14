// 補助金申請書テンプレート設定
// 各補助金の公式フォーマットに対応したテンプレート定義

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'table'
  required: boolean
  maxLength?: number
  rows?: number
  placeholder?: string
  options?: string[]
  aiSuggestion?: boolean // AI入力補助を使うかどうか
  validation?: {
    pattern?: string
    min?: number
    max?: number
  }
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

export interface SubsidyTemplate {
  id: string
  name: string
  version: string
  lastUpdated: string
  description: string
  sections: FormSection[]
  pdfTemplate: string // PDFテンプレートのID
}

// 小規模事業者持続化補助金のテンプレート
export const JIZOKUKA_TEMPLATE: SubsidyTemplate = {
  id: 'jizokuka-2024',
  name: '小規模事業者持続化補助金',
  version: '2024年度版',
  lastUpdated: '2024-06-01',
  description: '小規模事業者の販路開拓等の取組を支援',
  sections: [
    {
      id: 'basic-info',
      title: '1. 申請者の概要',
      fields: [
        {
          id: 'company_name',
          label: '事業者名',
          type: 'text',
          required: true,
          maxLength: 100,
          placeholder: '株式会社〇〇'
        },
        {
          id: 'representative_name',
          label: '代表者氏名',
          type: 'text',
          required: true,
          maxLength: 50
        },
        {
          id: 'address',
          label: '所在地',
          type: 'text',
          required: true,
          maxLength: 200
        },
        {
          id: 'established_date',
          label: '設立年月日',
          type: 'date',
          required: true
        },
        {
          id: 'capital',
          label: '資本金（千円）',
          type: 'number',
          required: true,
          validation: { min: 0, max: 50000 }
        },
        {
          id: 'employees',
          label: '従業員数',
          type: 'number',
          required: true,
          validation: { min: 0, max: 20 }
        },
        {
          id: 'business_type',
          label: '業種',
          type: 'select',
          required: true,
          options: ['製造業', '建設業', '運輸業', '卸売業', '小売業', 'サービス業', 'その他']
        },
        {
          id: 'business_description',
          label: '事業内容',
          type: 'textarea',
          required: true,
          maxLength: 400,
          rows: 4,
          aiSuggestion: true,
          placeholder: '具体的な事業内容を記入してください（400文字以内）'
        }
      ]
    },
    {
      id: 'project-plan',
      title: '2. 補助事業計画',
      fields: [
        {
          id: 'project_title',
          label: '補助事業名',
          type: 'text',
          required: true,
          maxLength: 30,
          aiSuggestion: true,
          placeholder: '30文字以内で簡潔に'
        },
        {
          id: 'project_purpose',
          label: '事業の目的・必要性',
          type: 'textarea',
          required: true,
          maxLength: 800,
          rows: 8,
          aiSuggestion: true,
          placeholder: '現状の課題と補助事業の必要性を具体的に記載（800文字以内）'
        },
        {
          id: 'project_content',
          label: '事業内容',
          type: 'textarea',
          required: true,
          maxLength: 1200,
          rows: 10,
          aiSuggestion: true,
          placeholder: '具体的な実施内容を記載（1200文字以内）'
        },
        {
          id: 'expected_effects',
          label: '期待される効果',
          type: 'textarea',
          required: true,
          maxLength: 600,
          rows: 6,
          aiSuggestion: true,
          placeholder: '売上・集客等の具体的な効果を数値目標と共に記載（600文字以内）'
        }
      ]
    },
    {
      id: 'budget-plan',
      title: '3. 経費明細',
      fields: [
        {
          id: 'expense_items',
          label: '経費内訳',
          type: 'table',
          required: true
        },
        {
          id: 'total_project_cost',
          label: '補助事業費合計（円）',
          type: 'number',
          required: true,
          validation: { min: 0, max: 2000000 }
        },
        {
          id: 'subsidy_amount',
          label: '補助金申請額（円）',
          type: 'number',
          required: true,
          validation: { min: 0, max: 1000000 }
        }
      ]
    },
    {
      id: 'schedule',
      title: '4. 事業スケジュール',
      fields: [
        {
          id: 'start_date',
          label: '事業開始予定日',
          type: 'date',
          required: true
        },
        {
          id: 'end_date',
          label: '事業完了予定日',
          type: 'date',
          required: true
        },
        {
          id: 'schedule_details',
          label: 'スケジュール詳細',
          type: 'textarea',
          required: true,
          maxLength: 400,
          rows: 4,
          placeholder: '主要なマイルストーンを時系列で記載'
        }
      ]
    }
  ],
  pdfTemplate: 'jizokuka-form-2024'
}

// IT導入補助金のテンプレート
export const IT_TEMPLATE: SubsidyTemplate = {
  id: 'it-subsidy-2024',
  name: 'IT導入補助金',
  version: '2024年度版',
  lastUpdated: '2024-06-01',
  description: 'ITツール導入による生産性向上を支援',
  sections: [
    {
      id: 'applicant-info',
      title: '1. 申請者情報',
      fields: [
        {
          id: 'company_name',
          label: '法人名／屋号',
          type: 'text',
          required: true,
          maxLength: 100
        },
        {
          id: 'corporate_number',
          label: '法人番号',
          type: 'text',
          required: true,
          maxLength: 13,
          validation: { pattern: '^[0-9]{13}$' }
        },
        {
          id: 'industry_code',
          label: '業種コード',
          type: 'text',
          required: true,
          maxLength: 5
        },
        {
          id: 'annual_sales',
          label: '直近の売上高（千円）',
          type: 'number',
          required: true,
          validation: { min: 0 }
        }
      ]
    },
    {
      id: 'it-tool-info',
      title: '2. 導入ITツール情報',
      fields: [
        {
          id: 'tool_name',
          label: 'ITツール名',
          type: 'text',
          required: true,
          maxLength: 100
        },
        {
          id: 'tool_category',
          label: 'ツールカテゴリ',
          type: 'select',
          required: true,
          options: ['顧客管理', '在庫管理', '会計', '人事労務', 'EC', 'その他']
        },
        {
          id: 'tool_description',
          label: 'ツールの機能・特徴',
          type: 'textarea',
          required: true,
          maxLength: 800,
          rows: 6,
          aiSuggestion: true
        },
        {
          id: 'implementation_purpose',
          label: '導入目的',
          type: 'textarea',
          required: true,
          maxLength: 600,
          rows: 5,
          aiSuggestion: true,
          placeholder: '現状の課題とITツール導入による解決策を記載'
        }
      ]
    },
    {
      id: 'productivity-plan',
      title: '3. 労働生産性向上計画',
      fields: [
        {
          id: 'current_productivity',
          label: '現在の労働生産性',
          type: 'textarea',
          required: true,
          maxLength: 400,
          rows: 4
        },
        {
          id: 'target_productivity',
          label: '目標労働生産性（3年後）',
          type: 'textarea',
          required: true,
          maxLength: 400,
          rows: 4
        },
        {
          id: 'improvement_rate',
          label: '生産性向上率（%）',
          type: 'number',
          required: true,
          validation: { min: 0, max: 100 }
        },
        {
          id: 'achievement_plan',
          label: '達成計画',
          type: 'textarea',
          required: true,
          maxLength: 800,
          rows: 6,
          aiSuggestion: true
        }
      ]
    }
  ],
  pdfTemplate: 'it-form-2024'
}

// ものづくり補助金のテンプレート
export const MONOZUKURI_TEMPLATE: SubsidyTemplate = {
  id: 'monozukuri-2024',
  name: 'ものづくり・商業・サービス生産性向上促進補助金',
  version: '2024年度版',
  lastUpdated: '2024-06-01',
  description: '革新的サービス開発・試作品開発・生産プロセスの改善を支援',
  sections: [
    {
      id: 'company-overview',
      title: '1. 企業概要',
      fields: [
        {
          id: 'company_name',
          label: '企業名',
          type: 'text',
          required: true,
          maxLength: 100
        },
        {
          id: 'establishment_year',
          label: '創業年',
          type: 'number',
          required: true,
          validation: { min: 1800, max: 2024 }
        },
        {
          id: 'main_products',
          label: '主要製品・サービス',
          type: 'textarea',
          required: true,
          maxLength: 400,
          rows: 3
        },
        {
          id: 'technical_strengths',
          label: '技術的強み・特徴',
          type: 'textarea',
          required: true,
          maxLength: 600,
          rows: 5,
          aiSuggestion: true
        }
      ]
    },
    {
      id: 'innovation-plan',
      title: '2. 革新的な開発計画',
      fields: [
        {
          id: 'development_theme',
          label: '開発テーマ',
          type: 'text',
          required: true,
          maxLength: 50,
          aiSuggestion: true
        },
        {
          id: 'innovation_content',
          label: '革新的な内容',
          type: 'textarea',
          required: true,
          maxLength: 1500,
          rows: 12,
          aiSuggestion: true,
          placeholder: '技術的な革新性、市場の新規性等を具体的に記載'
        },
        {
          id: 'technical_challenges',
          label: '技術的課題と解決方法',
          type: 'textarea',
          required: true,
          maxLength: 1000,
          rows: 8,
          aiSuggestion: true
        },
        {
          id: 'market_analysis',
          label: '市場分析・競合優位性',
          type: 'textarea',
          required: true,
          maxLength: 800,
          rows: 6,
          aiSuggestion: true
        }
      ]
    },
    {
      id: 'equipment-investment',
      title: '3. 設備投資計画',
      fields: [
        {
          id: 'equipment_list',
          label: '導入設備一覧',
          type: 'table',
          required: true
        },
        {
          id: 'total_investment',
          label: '設備投資総額（千円）',
          type: 'number',
          required: true,
          validation: { min: 1000, max: 100000 }
        },
        {
          id: 'subsidy_request',
          label: '補助金申請額（千円）',
          type: 'number',
          required: true,
          validation: { min: 1000, max: 10000 }
        }
      ]
    }
  ],
  pdfTemplate: 'monozukuri-form-2024'
}

// 業務改善助成金のテンプレート（簡易版）
export const GYOMU_KAIZEN_TEMPLATE: SubsidyTemplate = {
  id: 'gyomu-kaizen-2024',
  name: '業務改善助成金',
  version: '2024年度版',
  lastUpdated: '2024-06-01',
  description: '生産性向上のための設備投資等と賃金引上げを支援',
  sections: [
    {
      id: 'basic-info',
      title: '1. 申請事業者情報',
      fields: [
        {
          id: 'company_name',
          label: '事業場名称',
          type: 'text',
          required: true,
          maxLength: 100
        },
        {
          id: 'address',
          label: '事業場所在地',
          type: 'text',
          required: true,
          maxLength: 200
        },
        {
          id: 'industry',
          label: '業種',
          type: 'select',
          required: true,
          options: ['製造業', '建設業', '情報通信業', '運輸業', '卸売業', '小売業', '宿泊業', '飲食サービス業', 'サービス業', 'その他']
        },
        {
          id: 'employees',
          label: '労働者数',
          type: 'number',
          required: true,
          validation: { min: 1, max: 100 }
        },
        {
          id: 'current_min_wage',
          label: '現在の事業場内最低賃金（円）',
          type: 'number',
          required: true,
          validation: { min: 800, max: 2000 }
        }
      ]
    },
    {
      id: 'improvement-plan',
      title: '2. 生産性向上計画',
      fields: [
        {
          id: 'improvement_content',
          label: '生産性向上の取組内容',
          type: 'textarea',
          required: true,
          maxLength: 1000,
          rows: 8,
          aiSuggestion: true,
          placeholder: '導入する設備・システム、業務改善の具体的内容を記載'
        },
        {
          id: 'productivity_effect',
          label: '期待される生産性向上効果',
          type: 'textarea',
          required: true,
          maxLength: 600,
          rows: 5,
          aiSuggestion: true,
          placeholder: '時間短縮、品質向上、売上増加等の具体的効果を数値と共に記載'
        },
        {
          id: 'equipment_list',
          label: '導入設備・機器',
          type: 'textarea',
          required: true,
          maxLength: 500,
          rows: 4,
          placeholder: '設備名、型番、価格等を記載'
        }
      ]
    },
    {
      id: 'wage-increase',
      title: '3. 賃金引上げ計画',
      fields: [
        {
          id: 'target_min_wage',
          label: '引上げ後の事業場内最低賃金（円）',
          type: 'number',
          required: true,
          validation: { min: 900, max: 2500 }
        },
        {
          id: 'wage_increase_amount',
          label: '賃金引上げ額（円）',
          type: 'number',
          required: true,
          validation: { min: 30, max: 500 }
        },
        {
          id: 'affected_workers',
          label: '賃金引上げ対象労働者数',
          type: 'number',
          required: true,
          validation: { min: 1, max: 100 }
        },
        {
          id: 'implementation_date',
          label: '賃金引上げ実施予定日',
          type: 'date',
          required: true
        }
      ]
    },
    {
      id: 'budget',
      title: '4. 所要経費',
      fields: [
        {
          id: 'total_cost',
          label: '事業費総額（円）',
          type: 'number',
          required: true,
          validation: { min: 100000, max: 6000000 }
        },
        {
          id: 'subsidy_amount',
          label: '助成金申請額（円）',
          type: 'number',
          required: true,
          validation: { min: 50000, max: 6000000 }
        },
        {
          id: 'cost_breakdown',
          label: '経費内訳',
          type: 'textarea',
          required: true,
          maxLength: 500,
          rows: 4,
          placeholder: '設備費、委託費、その他の経費を項目別に記載'
        }
      ]
    }
  ],
  pdfTemplate: 'gyomu-kaizen-form-2024'
}

// 全テンプレートのマップ
export const SUBSIDY_TEMPLATES: Record<string, SubsidyTemplate> = {
  'jizokuka': JIZOKUKA_TEMPLATE,
  'it-subsidy': IT_TEMPLATE,
  'monozukuri': MONOZUKURI_TEMPLATE,
  'gyomu-kaizen': GYOMU_KAIZEN_TEMPLATE
}

// テンプレートから必要なフィールドを取得
export function getRequiredFields(templateId: string): FormField[] {
  const template = SUBSIDY_TEMPLATES[templateId]
  if (!template) return []
  
  const fields: FormField[] = []
  template.sections.forEach(section => {
    fields.push(...section.fields.filter(field => field.required))
  })
  
  return fields
}

// AIサポートが必要なフィールドを取得
export function getAISupportedFields(templateId: string): FormField[] {
  const template = SUBSIDY_TEMPLATES[templateId]
  if (!template) return []
  
  const fields: FormField[] = []
  template.sections.forEach(section => {
    fields.push(...section.fields.filter(field => field.aiSuggestion))
  })
  
  return fields
}