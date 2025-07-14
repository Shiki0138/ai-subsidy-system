// 業務改善助成金の成功パターンと採択事例の型定義

// 業界別成功パターン
export interface SuccessPattern {
  id: string
  industry: string // 業種
  employeeRange: string // 従業員規模
  acceptanceRate: number // 採択率
  patterns: {
    equipmentTypes: EquipmentPattern[] // よく採択される設備
    productivityMetrics: ProductivityMetric[] // 評価される生産性指標
    wageIncreaseStrategies: WageStrategy[] // 賃金引上げの成功パターン
    commonPhrases: string[] // 採択される頻出フレーズ
    avoidPhrases: string[] // 避けるべき表現
  }
  examples: AcceptedExample[] // 実際の採択事例
}

// 設備パターン
export interface EquipmentPattern {
  category: string // カテゴリ（IT機器、製造設備等）
  name: string // 設備名
  purpose: string // 導入目的
  effect: string // 期待効果
  acceptanceScore: number // 採択スコア（0-100）
  priceRange: {
    min: number
    max: number
  }
}

// 生産性指標
export interface ProductivityMetric {
  name: string // 指標名
  calculation: string // 計算方法
  improvementTarget: string // 改善目標
  measurementMethod: string // 測定方法
  weight: number // 重要度（0-100）
}

// 賃金戦略
export interface WageStrategy {
  increaseAmount: number // 引上げ額
  targetEmployees: string // 対象従業員
  timing: string // 実施時期
  sustainability: string // 持続可能性の説明
  acceptanceScore: number
}

// 採択事例
export interface AcceptedExample {
  id: string
  year: number
  industry: string
  employeeCount: number
  equipment: string
  productivityImprovement: string
  wageIncrease: number
  totalCost: number
  subsidyAmount: number
  keySuccessFactors: string[]
  reviewerComments?: string // 審査員コメント（推定）
}

// AI審査官の評価結果
export interface AIReviewResult {
  applicationId: string
  overallScore: number // 総合スコア（0-100）
  sectionScores: {
    necessity: number // 必要性スコア
    feasibility: number // 実現可能性スコア
    effectiveness: number // 効果性スコア
    sustainability: number // 持続性スコア
  }
  weakPoints: WeakPoint[]
  suggestions: Suggestion[]
  reviewDate: string
  reviewerComments: string
  improvementPotential: number // 改善可能性
}

// 弱点
export interface WeakPoint {
  section: string // セクション名
  issue: string // 問題点
  severity: 'high' | 'medium' | 'low'
  impact: string // 採択への影響
}

// 改善提案
export interface Suggestion {
  section: string
  currentContent: string // 現在の内容
  suggestedContent: string // 改善案
  reason: string // 改善理由
}

// クイック申請フロー
export interface QuickApplicationFlow {
  currentStep: number
  totalSteps: number
  elapsedTime: number // 経過時間（秒）
  targetTime: number // 目標時間（秒）
  
  steps: {
    basicInfo: {
      status: 'pending' | 'in_progress' | 'completed'
      autoFilled: boolean
      duration: number
    }
    aiInterview: {
      status: 'pending' | 'in_progress' | 'completed'
      answers: InterviewAnswer[]
      duration: number
    }
    autoGeneration: {
      status: 'pending' | 'in_progress' | 'completed'
      generatedFields: string[]
      duration: number
    }
    aiPreReview: {
      status: 'pending' | 'in_progress' | 'completed'
      score: number
      improved: boolean
      duration: number
    }
    finalReview: {
      status: 'pending' | 'in_progress' | 'completed'
      approved: boolean
      duration: number
    }
  }
}

// AI面談の質問
export interface InterviewQuestion {
  id: string
  question: string
  type: 'select' | 'number' | 'text' | 'multiselect'
  options?: string[]
  required: boolean
  followUp?: string // 追加質問の条件
  weight: number // 重要度
}

// 面談回答
export interface InterviewAnswer {
  questionId: string
  answer: string | number | string[]
  confidence: number // 回答の確信度
}