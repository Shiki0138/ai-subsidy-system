/**
 * 申請書作成のための標準化された入力スキーマ
 */

// 産業分類コード（日本標準産業分類ベース）
export enum IndustryCode {
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail', 
  SERVICE = 'service',
  IT = 'information_technology',
  HEALTHCARE = 'healthcare',
  CONSTRUCTION = 'construction',
  AGRICULTURE = 'agriculture',
  HOSPITALITY = 'hospitality',
  BEAUTY = 'beauty',
  EDUCATION = 'education',
  OTHER = 'other'
}

// 企業情報の構造化スキーマ
export interface CompanyInput {
  name: string;                    // 企業名（必須）
  industry: IndustryCode;          // 業種（必須）
  employees: number;               // 従業員数（必須）
  founded?: number;                // 設立年（任意）
  location_pref: string;           // 都道府県（必須）
  website_url?: string;            // ウェブサイト（任意）
  
  // 拡張フィールド（既存システムとの互換性）
  annualRevenue?: number;          // 年間売上高
  capitalStock?: number;           // 資本金
  businessDescription?: string;    // 事業内容詳細
}

// プロジェクト情報の構造化スキーマ
export interface ProjectInput {
  objective: string;               // 事業目的（必須・自由記述）
  budget: number;                  // 予算（必須・税込円）
  start_month?: string;            // 開始月（任意・YYYY-MM）
  expected_effect?: string;        // 期待効果（任意）
  
  // 拡張フィールド
  implementation_period?: number;  // 実施期間（月数）
  target_market?: string;          // ターゲット市場
  innovation_type?: string;        // イノベーションタイプ
}

// 統合入力スキーマ
export interface ApplicationInput {
  company: CompanyInput;
  project: ProjectInput;
  
  // メタデータ
  createdAt?: Date;
  userId?: string;
  sessionId?: string;
}

// マッチング結果スキーマ
export interface SubsidyMatch {
  subsidyId: string;
  name: string;
  score: number;                   // 0-100のマッチングスコア
  remarks: string;                 // マッチング理由・注意点
  
  // 詳細スコア内訳
  scoreBreakdown?: {
    eligibility: number;         // 適格性スコア
    objectiveMatch: number;      // 目的適合度
    budgetFit: number;          // 予算適合度
    industryPriority: number;   // 業種優先度
  };
  
  // 推奨アクション
  recommendations?: string[];
  requiredDocuments?: string[];
}

// 申請書生成リクエスト
export interface GenerationRequest {
  applicationInput: ApplicationInput;
  subsidyId: string;
  template?: ApplicationTemplate;
  options?: GenerationOptions;
}

// 申請書テンプレート定義
export interface ApplicationTemplate {
  sections: SectionTemplate[];
  metadata: {
    version: string;
    lastUpdated: Date;
    subsidyProgram: string;
  };
}

// セクションテンプレート
export interface SectionTemplate {
  id: string;
  title: string;
  order: number;
  lengthLimit: number;            // 文字数上限
  required: boolean;
  placeholderText?: string;
  evaluationPoints?: string[];    // 評価ポイント
  keywords?: string[];            // 重要キーワード
}

// 生成オプション
export interface GenerationOptions {
  aiModel?: 'gpt-4' | 'claude-3.5';
  temperature?: number;
  includeExamples?: boolean;
  doubleCheck?: boolean;          // AI二重チェック
  humanReview?: boolean;          // 人間レビュー要求
}

// プロンプトテンプレート構造
export interface PromptTemplate {
  system: string;
  context: {
    subsidyOverview: string;
    evaluationCriteria: string;
    successCaseSummary: string;
  };
  user: {
    company: CompanyInput;
    project: ProjectInput;
    template: SectionTemplate[];
  };
}

// バリデーションルール
export const ValidationRules = {
  company: {
    name: { required: true, maxLength: 100 },
    employees: { required: true, min: 1, max: 10000 },
    location_pref: { required: true, enum: ['北海道', '青森県', /* ... */] }
  },
  project: {
    objective: { required: true, minLength: 20, maxLength: 500 },
    budget: { required: true, min: 100000, max: 100000000 },
    start_month: { pattern: /^\d{4}-\d{2}$/ }
  }
};