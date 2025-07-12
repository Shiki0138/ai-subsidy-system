/**
 * Google Gemini API サービス
 * 無料枠で使えるGemini APIを活用した申請書生成
 */

export interface GenerationConfig {
  temperature?: number
  topK?: number
  topP?: number
  maxOutputTokens?: number
  stopSequences?: string[]
}

export interface SubsidyApplicationPrompt {
  subsidyType: string
  companyData: any
  requirements: any
  additionalInfo?: string
}

export class GeminiService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Gemini API key not configured')
    }
  }

  /**
   * Phase 2: 適応型質問生成
   */
  async generateAdaptiveQuestions(subsidyType: string, baseQuestions: any[]): Promise<any[]> {
    const prompt = `
補助金タイプ「${subsidyType}」に対して、より詳細で適応型の質問を3つ生成してください。

基本質問:
${baseQuestions.map(q => `- ${q.text}`).join('\n')}

以下の形式で回答してください:
[
  {
    "id": "unique_id",
    "text": "質問文",
    "type": "textarea",
    "category": "カテゴリ",
    "priority": 優先度(数値),
    "isRequired": false,
    "aiContext": "この質問の目的",
    "validationRules": {"minLength": 50, "maxLength": 800}
  }
]
`

    try {
      const response = await this.generateContent({
        prompt,
        config: { temperature: 0.8, maxOutputTokens: 2048 }
      })

      // JSON形式のレスポンスをパース
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch (error) {
      console.error('Error generating adaptive questions:', error)
      return []
    }
  }

  /**
   * Phase 3: 企業プロファイル分析
   */
  async analyzeCompanyProfile(websiteContent: string, url: string): Promise<any> {
    const prompt = `
以下のホームページ内容を分析して、企業プロファイルを作成してください。

URL: ${url}
内容: ${websiteContent}

以下のJSON形式で回答してください:
{
  "businessType": "業種",
  "mainServices": ["主要サービス1", "主要サービス2"],
  "targetMarket": ["ターゲット市場"],
  "strengths": ["強み1", "強み2", "強み3"],
  "technologyStack": ["使用技術"],
  "companySize": "small|medium|large",
  "innovationAspects": ["革新的な要素"],
  "marketPosition": "市場での位置づけ",
  "competitiveAdvantages": ["競争優位性"],
  "subsidyRecommendations": ["推奨補助金"],
  "confidence": 0.8
}
`

    try {
      const response = await this.generateContent({
        prompt,
        config: { temperature: 0.5, maxOutputTokens: 2048 }
      })

      // JSON形式のレスポンスをパース
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // フォールバック
      return this.getDefaultProfile()
    } catch (error) {
      console.error('Error analyzing company profile:', error)
      return this.getDefaultProfile()
    }
  }

  /**
   * 採択最適化コンテンツ生成
   */
  async generateOptimizedContent(
    sectionType: string,
    answers: any[],
    companyProfile: any,
    subsidyType: string
  ): Promise<{
    content: string
    adoptionScore: number
    suggestions: string[]
  }> {
    const prompt = `
補助金申請書の「${sectionType}」セクションを作成してください。

補助金タイプ: ${subsidyType}
企業プロファイル: ${JSON.stringify(companyProfile)}
回答内容: ${JSON.stringify(answers)}

要件:
1. 採択されやすい内容にする
2. 具体的で説得力のある文章
3. 800-1200文字程度
4. 評価基準を意識した構成

以下の形式で回答:
{
  "content": "生成された申請書内容",
  "adoptionScore": 85,
  "suggestions": ["改善提案1", "改善提案2"]
}
`

    try {
      const response = await this.generateContent({
        prompt,
        config: { temperature: 0.6, maxOutputTokens: 3048 }
      })

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return {
        content: response,
        adoptionScore: 70,
        suggestions: ['より具体的な数値を追加してください']
      }
    } catch (error) {
      console.error('Error generating optimized content:', error)
      return {
        content: '申請書の生成中にエラーが発生しました。',
        adoptionScore: 0,
        suggestions: ['再度生成を試してください']
      }
    }
  }

  /**
   * デフォルトプロファイル
   */
  private getDefaultProfile(): any {
    return {
      businessType: '製造業',
      mainServices: ['製品開発', '製造'],
      targetMarket: ['国内B2B'],
      strengths: ['技術力', '品質'],
      technologyStack: [],
      companySize: 'small',
      innovationAspects: ['技術革新'],
      marketPosition: '専門特化',
      competitiveAdvantages: ['技術力'],
      subsidyRecommendations: ['ものづくり補助金'],
      confidence: 0.3
    }
  }
  
  /**
   * 補助金申請書の生成
   */
  async generateApplication(
    prompt: SubsidyApplicationPrompt
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(prompt.subsidyType)
    const userPrompt = this.buildUserPrompt(prompt)
    
    const response = await this.generateContent({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.9
      }
    })
    
    return response
  }
  
  /**
   * 申請書の各セクションを個別生成
   */
  async generateSection(
    sectionType: string,
    context: any
  ): Promise<string> {
    const sectionPrompts: { [key: string]: string } = {
      businessOverview: '事業概要を400文字以内で簡潔に説明してください。',
      implementationPlan: '実施計画を具体的なスケジュールと共に記載してください。',
      expectedEffects: '期待される効果を定量的・定性的に説明してください。',
      financialPlan: '収支計画を表形式で分かりやすく提示してください。',
      marketAnalysis: '市場分析と競合優位性について説明してください。'
    }
    
    const prompt = `
${sectionPrompts[sectionType] || 'セクションを生成してください。'}

コンテキスト情報:
${JSON.stringify(context, null, 2)}

以下の点に注意して作成してください:
- 具体的で説得力のある内容
- 数値やデータを含める
- 専門用語は適切に使用
- 読みやすい構成
`
    
    return await this.generateContent({
      prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 2048
      }
    })
  }
  
  /**
   * 申請書のレビューと改善提案
   */
  async reviewApplication(
    applicationContent: string,
    subsidyType: string
  ): Promise<{
    score: number
    strengths: string[]
    improvements: string[]
    suggestions: string
  }> {
    const prompt = `
以下の${subsidyType}補助金申請書をレビューし、改善点を提案してください。

申請書内容:
${applicationContent}

以下の形式でレビュー結果を返してください:
1. 総合評価スコア（100点満点）
2. 強み（箇条書き3-5点）
3. 改善点（箇条書き3-5点）
4. 具体的な改善提案
`
    
    const response = await this.generateContent({
      prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 2048
      }
    })
    
    // レスポンスを解析
    return this.parseReviewResponse(response)
  }
  
  /**
   * 企業データから自動的にキーワードを抽出
   */
  async extractKeywords(companyData: any): Promise<string[]> {
    const prompt = `
以下の企業データから、補助金申請に有利となるキーワードを10個抽出してください。

企業データ:
${JSON.stringify(companyData, null, 2)}

キーワードはカンマ区切りで出力してください。
`
    
    const response = await this.generateContent({
      prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 256
      }
    })
    
    return response.split(',').map(k => k.trim())
  }
  
  /**
   * テキストの改善
   */
  async improveText(prompt: string): Promise<string> {
    const response = await this.generateContent({
      prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        topP: 0.9
      }
    })
    
    return response.trim()
  }
  
  /**
   * 基本的なコンテンツ生成
   */
  private async generateContent({
    prompt,
    config = {}
  }: {
    prompt: string
    config?: GenerationConfig
  }): Promise<string> {
    if (!this.apiKey) {
      // APIキーがない場合はモックレスポンスを返す
      return this.getMockResponse(prompt)
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: config.temperature || 0.7,
              topK: config.topK || 40,
              topP: config.topP || 0.95,
              maxOutputTokens: config.maxOutputTokens || 2048,
              stopSequences: config.stopSequences || []
            }
          })
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Gemini API error:', error)
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
      }
      
      const data = await response.json()
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text
      }
      
      throw new Error('Invalid response format from Gemini API')
      
    } catch (error) {
      console.error('Gemini generation error:', error)
      // エラー時はフォールバック
      return this.getMockResponse(prompt)
    }
  }
  
  /**
   * システムプロンプトの構築
   */
  private buildSystemPrompt(subsidyType: string): string {
    const subsidyPrompts: { [key: string]: string } = {
      sustainability: `
あなたは小規模事業者持続化補助金の申請書作成専門家です。
以下の点に特に注意して申請書を作成してください：
- 地域経済への貢献
- 持続可能な事業モデル
- 具体的な販路開拓計画
- 明確な数値目標
`,
      monozukuri: `
あなたはものづくり補助金の申請書作成専門家です。
以下の点に特に注意して申請書を作成してください：
- 革新的なサービス開発・試作品開発・生産プロセスの改善
- 設備投資の必要性と効果
- 生産性向上の具体的な数値
- 技術的な優位性
`,
      'business-improvement': `
あなたは業務改善助成金の申請書作成専門家です。
以下の点に特に注意して申請書を作成してください：
- 最低賃金引上げ計画
- 生産性向上設備の導入効果
- 従業員の処遇改善
- 具体的な業務改善内容
`,
      reconstruction: `
あなたは事業再構築補助金の申請書作成専門家です。
以下の点に特に注意して申請書を作成してください：
- 思い切った事業再構築
- 新分野展開、事業転換、業種転換、業態転換
- V字回復の実現可能性
- 詳細な事業計画
`,
      'it-subsidy': `
あなたはIT導入補助金の申請書作成専門家です。
以下の点に特に注意して申請書を作成してください：
- ITツール導入による業務効率化
- デジタル化による生産性向上
- セキュリティ対策
- 導入後のサポート体制
`
    }
    
    return subsidyPrompts[subsidyType] || subsidyPrompts.sustainability
  }
  
  /**
   * ユーザープロンプトの構築
   */
  private buildUserPrompt(prompt: SubsidyApplicationPrompt): string {
    return `
以下の企業情報と要件に基づいて、${prompt.subsidyType}の申請書を作成してください。

【企業情報】
${JSON.stringify(prompt.companyData, null, 2)}

【補助金要件】
${JSON.stringify(prompt.requirements, null, 2)}

${prompt.additionalInfo ? `【追加情報】\n${prompt.additionalInfo}` : ''}

申請書は以下の構成で作成してください：
1. 事業概要（現状と課題）
2. 補助事業の内容（具体的な取り組み）
3. 実施スケジュール
4. 期待される効果（定量的・定性的）
5. 必要経費の内訳
6. 今後の事業展開

各セクションは具体的で説得力のある内容にしてください。
`
  }
  
  /**
   * レビューレスポンスの解析
   */
  private parseReviewResponse(response: string): {
    score: number
    strengths: string[]
    improvements: string[]
    suggestions: string
  } {
    // 簡易的なパーサー（実際はより精密な解析が必要）
    const lines = response.split('\n')
    let score = 80
    const strengths: string[] = []
    const improvements: string[] = []
    let suggestions = ''
    
    let currentSection = ''
    
    for (const line of lines) {
      if (line.includes('評価スコア') || line.includes('点')) {
        const match = line.match(/(\d+)/)
        if (match) {
          score = parseInt(match[1])
        }
      } else if (line.includes('強み')) {
        currentSection = 'strengths'
      } else if (line.includes('改善点')) {
        currentSection = 'improvements'
      } else if (line.includes('提案')) {
        currentSection = 'suggestions'
      } else if (line.trim().startsWith('-') || line.trim().startsWith('・')) {
        const content = line.trim().substring(1).trim()
        if (currentSection === 'strengths') {
          strengths.push(content)
        } else if (currentSection === 'improvements') {
          improvements.push(content)
        }
      } else if (currentSection === 'suggestions' && line.trim()) {
        suggestions += line + '\n'
      }
    }
    
    return {
      score,
      strengths: strengths.length > 0 ? strengths : ['構成が明確', '具体的な数値を含む', '実現可能性が高い'],
      improvements: improvements.length > 0 ? improvements : ['より詳細な市場分析が必要', '競合優位性の記述を強化'],
      suggestions: suggestions || '全体的によく書けていますが、数値目標をより明確にすることで説得力が増します。'
    }
  }
  
  /**
   * モックレスポンス（APIキーがない場合のフォールバック）
   */
  private getMockResponse(prompt: string): string {
    if (prompt.includes('事業概要')) {
      return `
弊社は創業以来、地域に根ざした事業活動を展開してまいりました。
主要事業として、高品質な製品・サービスの提供を通じて、顧客満足度の向上に努めています。
現在、市場環境の変化に対応するため、新たな取り組みを開始する準備を進めており、
本補助金を活用することで、事業の更なる発展と地域経済への貢献を実現したいと考えています。
`
    }
    
    return '申請書の内容を生成しました。実際の使用にはGemini APIキーの設定が必要です。'
  }
}