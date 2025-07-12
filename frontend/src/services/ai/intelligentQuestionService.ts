/**
 * インテリジェント質問生成サービス
 * Phase 2: 補助金タイプに応じた適応型質問システム
 */

interface Question {
  id: string
  text: string
  type: 'text' | 'select' | 'number' | 'file' | 'textarea' | 'url'
  category: string
  priority: number
  isRequired: boolean
  aiContext: string
  validationRules: Record<string, any>
  options?: string[] // select用
}

interface Answer {
  questionId: string
  value: string
  confidence: number
  source: 'user' | 'ai' | 'web_analysis'
}

interface QuestionAnalysis {
  completeness: number // 0-100%
  relevance: number // 採択基準との適合度
  missingCritical: string[] // 不足している重要項目
  suggestions: string[] // 改善提案
  nextQuestions: Question[] // 推奨質問
}

export class IntelligentQuestionService {
  
  /**
   * 補助金タイプに応じた初期質問を生成
   */
  async generateInitialQuestions(subsidyType: string): Promise<Question[]> {
    try {
      const response = await fetch('/api/questions/generate-initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsidyType })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate initial questions')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error generating initial questions:', error)
      return this.getFallbackQuestions(subsidyType)
    }
  }

  /**
   * 回答を分析して追加質問を生成
   */
  async analyzeAnswersAndGenerateFollowups(
    answers: Answer[],
    subsidyType: string
  ): Promise<QuestionAnalysis> {
    try {
      const response = await fetch('/api/questions/analyze-and-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, subsidyType })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze answers')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error analyzing answers:', error)
      return this.getBasicAnalysis(answers)
    }
  }

  /**
   * 不足している重要情報を特定
   */
  async identifyMissingCriticalInfo(
    answers: Answer[],
    subsidyType: string
  ): Promise<string[]> {
    const response = await fetch('/api/questions/identify-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, subsidyType })
    })
    
    const result = await response.json()
    return result.missingItems || []
  }

  /**
   * 質問の完了度を計算
   */
  calculateCompleteness(answers: Answer[], requiredQuestions: Question[]): number {
    const answeredRequired = answers.filter(answer => 
      requiredQuestions.some(q => q.id === answer.questionId && q.isRequired)
    ).length
    
    const totalRequired = requiredQuestions.filter(q => q.isRequired).length
    
    return totalRequired > 0 ? (answeredRequired / totalRequired) * 100 : 0
  }

  /**
   * AI支援による質問生成
   */
  async generateAIAssistedQuestions(
    context: {
      companyProfile: any
      businessType: string
      targetSubsidy: string
      existingAnswers: Answer[]
    }
  ): Promise<Question[]> {
    const response = await fetch('/api/questions/ai-assisted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context)
    })
    
    return await response.json()
  }

  /**
   * 質問の優先度を動的に調整
   */
  async adjustQuestionPriority(
    questions: Question[],
    answers: Answer[],
    subsidyType: string
  ): Promise<Question[]> {
    // 回答状況に基づいて質問の優先度を調整
    const answeredQuestionIds = new Set(answers.map(a => a.questionId))
    
    return questions.map(question => {
      if (answeredQuestionIds.has(question.id)) {
        return { ...question, priority: question.priority + 100 } // 回答済みは低優先度
      }
      
      // 未回答の重要質問は高優先度
      if (question.isRequired && !answeredQuestionIds.has(question.id)) {
        return { ...question, priority: question.priority - 50 }
      }
      
      return question
    }).sort((a, b) => a.priority - b.priority)
  }

  /**
   * フォールバック質問（基本的な質問セット）
   */
  private getFallbackQuestions(subsidyType: string): Question[] {
    const baseQuestions: Question[] = [
      {
        id: 'company_overview',
        text: '会社の主力事業・製品・サービスを具体的に教えてください。',
        type: 'textarea',
        category: 'company_basic',
        priority: 1,
        isRequired: true,
        aiContext: '申請者の事業概要を把握し、補助事業との関連性を評価',
        validationRules: { minLength: 50, maxLength: 1000 }
      },
      {
        id: 'innovation_plan',
        text: '今回の補助事業で実現したい革新的な取り組みを教えてください。',
        type: 'textarea',
        category: 'innovation',
        priority: 2,
        isRequired: true,
        aiContext: '補助事業の革新性と独自性を評価するための核心的な質問',
        validationRules: { minLength: 100, maxLength: 1500 }
      },
      {
        id: 'technical_details',
        text: '導入予定の設備・システムの技術的詳細を教えてください。',
        type: 'textarea',
        category: 'technical',
        priority: 3,
        isRequired: true,
        aiContext: '技術的実現可能性と設備投資の妥当性を評価',
        validationRules: { minLength: 100, maxLength: 1200 }
      }
    ]

    // 補助金タイプ別の追加質問
    if (subsidyType === 'monozukuri') {
      baseQuestions.push({
        id: 'production_process',
        text: '現在の生産プロセスの課題と改善計画を教えてください。',
        type: 'textarea',
        category: 'process_improvement',
        priority: 4,
        isRequired: false,
        aiContext: 'ものづくり補助金特有の生産性向上要素を評価',
        validationRules: { minLength: 80, maxLength: 800 }
      })
    }

    return baseQuestions
  }

  /**
   * 基本的な分析結果
   */
  private getBasicAnalysis(answers: Answer[]): QuestionAnalysis {
    return {
      completeness: Math.min((answers.length / 5) * 100, 100),
      relevance: 70,
      missingCritical: ['市場分析', '競合優位性', '実行計画'],
      suggestions: [
        '具体的な数値データを追加してください',
        '競合他社との差別化ポイントを明確にしてください',
        '実行スケジュールをより詳細に記載してください'
      ],
      nextQuestions: []
    }
  }
}