// 補助金知識ベース管理サービス

import { 
  SubsidyKnowledgeBase, 
  KnowledgeDocument, 
  DocumentUploadRequest,
  AnalysisResult 
} from '@/types/knowledge-base'
import { readFileContent } from '@/utils/client-document-processor'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ローカルストレージのキー
const KNOWLEDGE_BASE_KEY = 'subsidy_knowledge_bases'

export class KnowledgeBaseService {
  private genAI: GoogleGenerativeAI | null = null

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
  }

  // 知識ベースを取得
  async getKnowledgeBase(subsidyId: string): Promise<SubsidyKnowledgeBase | null> {
    const bases = this.getAllKnowledgeBases()
    return bases.find(base => base.subsidyId === subsidyId) || null
  }

  // 全ての知識ベースを取得
  getAllKnowledgeBases(): SubsidyKnowledgeBase[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(KNOWLEDGE_BASE_KEY)
    if (!stored) return []
    
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('知識ベース読み込みエラー:', error)
      return []
    }
  }

  // 知識ベースを保存
  private saveKnowledgeBase(knowledgeBase: SubsidyKnowledgeBase): void {
    const bases = this.getAllKnowledgeBases()
    const index = bases.findIndex(base => base.subsidyId === knowledgeBase.subsidyId)
    
    if (index >= 0) {
      bases[index] = knowledgeBase
    } else {
      bases.push(knowledgeBase)
    }
    
    localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(bases))
  }

  // ドキュメントを追加
  async addDocument(
    subsidyId: string, 
    subsidyName: string,
    request: DocumentUploadRequest
  ): Promise<SubsidyKnowledgeBase> {
    let content = ''
    
    // ファイルの場合
    if (request.file) {
      content = await readFileContent(request.file)
    }
    
    // URLの場合
    if (request.url) {
      content = await this.fetchWebContent(request.url)
    }
    
    const document: KnowledgeDocument = {
      id: this.generateId(),
      type: request.type,
      name: request.name,
      content: content,
      url: request.url,
      uploadedAt: new Date()
    }
    
    // 知識ベースを取得または作成
    let knowledgeBase = await this.getKnowledgeBase(subsidyId)
    if (!knowledgeBase) {
      knowledgeBase = {
        subsidyId,
        subsidyName,
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    // ドキュメントを追加
    knowledgeBase.documents.push(document)
    knowledgeBase.updatedAt = new Date()
    
    // 保存
    this.saveKnowledgeBase(knowledgeBase)
    
    return knowledgeBase
  }

  // ドキュメントを削除
  async removeDocument(subsidyId: string, documentId: string): Promise<void> {
    const knowledgeBase = await this.getKnowledgeBase(subsidyId)
    if (!knowledgeBase) return
    
    knowledgeBase.documents = knowledgeBase.documents.filter(
      doc => doc.id !== documentId
    )
    knowledgeBase.updatedAt = new Date()
    
    this.saveKnowledgeBase(knowledgeBase)
  }

  // 知識ベース全体を分析
  async analyzeKnowledgeBase(subsidyId: string): Promise<AnalysisResult | null> {
    console.log('analyzeKnowledgeBase開始:', subsidyId)
    console.log('Gemini API設定状態:', !!this.genAI)
    
    if (!this.genAI) {
      console.error('Gemini APIが初期化されていません')
      throw new Error('Gemini APIキーが設定されていません')
    }
    
    const knowledgeBase = await this.getKnowledgeBase(subsidyId)
    console.log('知識ベース取得結果:', knowledgeBase)
    
    if (!knowledgeBase || knowledgeBase.documents.length === 0) {
      console.log('ドキュメントが存在しません')
      return null
    }
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // 全ドキュメントを結合
    const combinedContent = this.combineDocuments(knowledgeBase.documents)
    console.log('結合後の文字数:', combinedContent.length)
    
    const prompt = `
以下の補助金関連資料を総合的に分析し、申請書作成に必要な情報を抽出してください。

【分析対象資料】
${combinedContent}

【分析項目】
1. 必須要件の要約（箇条書き5項目以内）
2. 評価ポイント（重要度順に5項目）
3. 採択される申請書の成功パターン（3パターン）
4. 推奨される申請アプローチ
5. 注意すべきリスク要因（3項目）

【出力形式】
JSON形式で以下の構造で出力してください：
{
  "summary": "分析結果の要約（200文字以内）",
  "keyRequirements": ["要件1", "要件2", ...],
  "evaluationPoints": ["評価ポイント1", "評価ポイント2", ...],
  "successPatterns": ["パターン1", "パターン2", ...],
  "recommendedApproach": "推奨アプローチの説明",
  "riskFactors": ["リスク1", "リスク2", ...]
}
`
    
    try {
      console.log('Gemini API呼び出し開始')
      console.log('プロンプト長:', prompt.length)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      console.log('Gemini応答:', text)
      
      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        
        // 分析結果を知識ベースに保存
        knowledgeBase.analysis = {
          requirements: analysis.keyRequirements || [],
          evaluationCriteria: analysis.evaluationPoints || [],
          successFactors: analysis.successPatterns || [],
          commonMistakes: analysis.riskFactors || [],
          keywords: this.extractKeywords(combinedContent),
          budget: this.extractBudgetInfo(combinedContent)
        }
        knowledgeBase.updatedAt = new Date()
        this.saveKnowledgeBase(knowledgeBase)
        
        return analysis
      }
      
      throw new Error('分析結果の解析に失敗しました')
    } catch (error) {
      console.error('知識ベース分析エラー:', error)
      throw error
    }
  }

  // 知識ベースを使用して申請内容を生成
  async generateApplicationContent(
    subsidyId: string,
    fieldName: string,
    companyInfo: any
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini APIキーが設定されていません')
    }
    
    const knowledgeBase = await this.getKnowledgeBase(subsidyId)
    if (!knowledgeBase) {
      throw new Error('知識ベースが見つかりません')
    }
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // 関連するドキュメントを選択
    const relevantDocs = this.selectRelevantDocuments(
      knowledgeBase.documents,
      fieldName
    )
    
    const context = this.combineDocuments(relevantDocs)
    const analysis = knowledgeBase.analysis
    
    const prompt = `
以下の知識ベースとコンテキストに基づいて、「${fieldName}」の内容を生成してください。

【知識ベース分析結果】
${analysis ? `
- 必須要件: ${analysis.requirements.join(', ')}
- 評価ポイント: ${analysis.evaluationCriteria.join(', ')}
- 成功要因: ${analysis.successFactors.join(', ')}
- キーワード: ${analysis.keywords.join(', ')}
` : '分析結果なし'}

【参考資料】
${context}

【企業情報】
${JSON.stringify(companyInfo, null, 2)}

【生成ルール】
1. 知識ベースの要件を完全に満たす内容にする
2. 評価ポイントを最大限に活かす
3. 成功パターンを参考にする
4. 具体的な数値・データを含める
5. 説得力のある論理展開にする

【出力】
${fieldName}に記載する内容を生成してください（文字数制限がある場合は守ること）。
`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }

  // ドキュメントを結合（トークン制限対応）
  private combineDocuments(documents: KnowledgeDocument[]): string {
    const maxCharsPerDoc = 50000 // 各ドキュメントの最大文字数
    const maxTotalChars = 200000 // 全体の最大文字数
    
    let totalChars = 0
    const processedDocs: string[] = []
    
    for (const doc of documents) {
      // 各ドキュメントの内容を制限
      let content = doc.content
      if (content.length > maxCharsPerDoc) {
        content = content.substring(0, maxCharsPerDoc) + '\n...[内容省略]'
      }
      
      const docText = `
【${doc.type}: ${doc.name}】
${content}
---
`
      
      // 全体の文字数をチェック
      if (totalChars + docText.length > maxTotalChars) {
        processedDocs.push('\n...[以降のドキュメントは省略されました]')
        break
      }
      
      processedDocs.push(docText)
      totalChars += docText.length
    }
    
    return processedDocs.join('\n')
  }

  // 関連ドキュメントを選択
  private selectRelevantDocuments(
    documents: KnowledgeDocument[],
    fieldName: string
  ): KnowledgeDocument[] {
    // フィールド名に基づいて関連性の高いドキュメントを選択
    const relevanceScore = (doc: KnowledgeDocument): number => {
      let score = 0
      const content = doc.content.toLowerCase()
      const field = fieldName.toLowerCase()
      
      // フィールド名が含まれている
      if (content.includes(field)) score += 3
      
      // タイプによるスコア
      if (doc.type === 'guideline') score += 2
      if (doc.type === 'example') score += 1
      
      return score
    }
    
    return documents
      .sort((a, b) => relevanceScore(b) - relevanceScore(a))
      .slice(0, 3) // 上位3つのドキュメントを選択
  }

  // キーワード抽出
  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>()
    const importantTerms = [
      'DX', 'デジタル', 'AI', '生産性', '向上', '効率化',
      '革新', '改善', '開発', '導入', '展開', '成長',
      '競争力', '付加価値', '差別化', 'イノベーション'
    ]
    
    importantTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.add(term)
      }
    })
    
    return Array.from(keywords)
  }

  // 予算情報を抽出
  private extractBudgetInfo(text: string): { min: number; max: number; average: number } {
    const amounts: number[] = []
    const amountPattern = /(\d{1,5})[万千]円/g
    const matches = text.matchAll(amountPattern)
    
    for (const match of matches) {
      const num = parseInt(match[1])
      const unit = match[0].includes('万') ? 10000 : 1000
      amounts.push(num * unit)
    }
    
    if (amounts.length === 0) {
      return { min: 0, max: 0, average: 0 }
    }
    
    return {
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      average: amounts.reduce((a, b) => a + b, 0) / amounts.length
    }
  }

  // Webコンテンツを取得（簡易版）
  private async fetchWebContent(url: string): Promise<string> {
    // セキュリティのため、信頼できるドメインのみ許可
    const allowedDomains = [
      'www.mhlw.go.jp',
      'www.meti.go.jp',
      'www.chusho.meti.go.jp',
      'www.smrj.go.jp'
    ]
    
    const urlObj = new URL(url)
    if (!allowedDomains.includes(urlObj.hostname)) {
      throw new Error('許可されていないドメインです')
    }
    
    // 実際にはプロキシサーバーやAPIを経由する必要があります
    return `URL: ${url}\n（Webコンテンツの取得にはサーバーサイドの実装が必要です）`
  }

  // ID生成
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}