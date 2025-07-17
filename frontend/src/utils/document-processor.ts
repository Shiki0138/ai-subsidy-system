// 申請書・募集要項ドキュメント処理ユーティリティ

import mammoth from 'mammoth'

// PDF.jsは動的インポートで使用（SSRエラー回避）
let pdfjsLib: any = null;

// PDF.jsの動的初期化
async function initializePDFJS() {
  if (typeof window === 'undefined') {
    throw new Error('PDF処理はクライアントサイドでのみ実行可能です');
  }
  
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  
  return pdfjsLib;
}

// 募集要項の要件を構造化
export interface RequirementSection {
  title: string
  requirements: string[]
  keywords: string[]
  maxLength?: number
  evaluationCriteria?: string[]
}

export interface GuidelineData {
  subsidyName: string
  purpose: string
  targetBusiness: string[]
  subsidyAmount: {
    min: number
    max: number
    rate: string
  }
  eligibleExpenses: string[]
  requirements: RequirementSection[]
  deadline: string
  evaluationPoints: string[]
}

// DOCXファイルを読み込んで内容を抽出
export async function readDocxContent(file: File | Buffer): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer
    
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer()
    } else {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
    }
    
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('DOCX読み込みエラー:', error)
    throw new Error('DOCXファイルの読み込みに失敗しました')
  }
}

// PDFファイルから募集要項を読み込み（クライアントサイド対応）
export async function readPdfGuidelines(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    let fullText = ''
    const numPages = pdf.numPages
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText
  } catch (error) {
    console.error('PDF読み込みエラー:', error)
    throw new Error('PDFファイルの読み込みに失敗しました')
  }
}

// 募集要項テキストを構造化データに変換
export function parseGuidelines(text: string): GuidelineData {
  // キーワードベースで要項を解析
  const sections = text.split(/\n{2,}/)
  
  const guideline: GuidelineData = {
    subsidyName: extractSubsidyName(text),
    purpose: extractPurpose(sections),
    targetBusiness: extractTargetBusiness(sections),
    subsidyAmount: extractSubsidyAmount(sections),
    eligibleExpenses: extractEligibleExpenses(sections),
    requirements: extractRequirements(sections),
    deadline: extractDeadline(text),
    evaluationPoints: extractEvaluationPoints(sections)
  }
  
  return guideline
}

// 補助金名を抽出
function extractSubsidyName(text: string): string {
  const patterns = [
    /令和\d+年度\s*(.+?補助金)/,
    /【(.+?補助金)】/,
    /^(.+?補助金)/m
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  
  return '補助金'
}

// 目的を抽出
function extractPurpose(sections: string[]): string {
  const purposeKeywords = ['目的', '趣旨', '概要', '背景']
  
  for (const section of sections) {
    for (const keyword of purposeKeywords) {
      if (section.includes(keyword)) {
        return section.substring(0, 500)
      }
    }
  }
  
  return ''
}

// 対象事業者を抽出
function extractTargetBusiness(sections: string[]): string[] {
  const targetKeywords = ['対象者', '対象事業者', '申請資格', '応募資格']
  const targets: string[] = []
  
  for (const section of sections) {
    for (const keyword of targetKeywords) {
      if (section.includes(keyword)) {
        // 箇条書きを抽出
        const lines = section.split('\n')
        lines.forEach(line => {
          if (line.match(/^[・●○□▪▫◆◇■□]/)) {
            targets.push(line.trim())
          }
        })
      }
    }
  }
  
  return targets
}

// 補助金額を抽出
function extractSubsidyAmount(sections: string[]): { min: number; max: number; rate: string } {
  const amountKeywords = ['補助金額', '補助上限', '補助率', '交付額']
  let min = 0
  let max = 0
  let rate = ''
  
  for (const section of sections) {
    for (const keyword of amountKeywords) {
      if (section.includes(keyword)) {
        // 金額パターンを抽出
        const amountPattern = /(\d{1,4})[万千]\s*円/g
        const matches = section.matchAll(amountPattern)
        const amounts: number[] = []
        
        for (const match of matches) {
          const num = parseInt(match[1])
          const unit = match[0].includes('万') ? 10000 : 1000
          amounts.push(num * unit)
        }
        
        if (amounts.length > 0) {
          min = Math.min(...amounts)
          max = Math.max(...amounts)
        }
        
        // 補助率を抽出
        const ratePattern = /(\d+)[／/](\d+)|(\d+)%|(\d+)割/
        const rateMatch = section.match(ratePattern)
        if (rateMatch) {
          rate = rateMatch[0]
        }
      }
    }
  }
  
  return { min, max, rate }
}

// 対象経費を抽出
function extractEligibleExpenses(sections: string[]): string[] {
  const expenseKeywords = ['対象経費', '補助対象経費', '経費区分', '対象となる経費']
  const expenses: string[] = []
  
  for (const section of sections) {
    for (const keyword of expenseKeywords) {
      if (section.includes(keyword)) {
        const lines = section.split('\n')
        lines.forEach(line => {
          if (line.match(/^[・●○□▪▫◆◇■□①②③④⑤]/) || line.match(/^\d+[\.、]/)) {
            expenses.push(line.trim())
          }
        })
      }
    }
  }
  
  return expenses
}

// 要件セクションを抽出
function extractRequirements(sections: string[]): RequirementSection[] {
  const requirements: RequirementSection[] = []
  const reqKeywords = ['事業計画', '実施内容', '必要書類', '記載事項', '提出書類']
  
  for (const section of sections) {
    for (const keyword of reqKeywords) {
      if (section.includes(keyword)) {
        const req: RequirementSection = {
          title: keyword,
          requirements: [],
          keywords: extractKeywords(section)
        }
        
        // 文字数制限を抽出
        const lengthPattern = /(\d{2,4})[字文]字?(以内|程度|まで)/
        const lengthMatch = section.match(lengthPattern)
        if (lengthMatch) {
          req.maxLength = parseInt(lengthMatch[1])
        }
        
        // 要件を抽出
        const lines = section.split('\n')
        lines.forEach(line => {
          if (line.length > 10 && !line.match(/^[\s　]*$/)) {
            req.requirements.push(line.trim())
          }
        })
        
        requirements.push(req)
      }
    }
  }
  
  return requirements
}

// 締切を抽出
function extractDeadline(text: string): string {
  const deadlinePattern = /締[切切][:：]?\s*(.+?日)/
  const match = text.match(deadlinePattern)
  return match ? match[1] : ''
}

// 評価ポイントを抽出
function extractEvaluationPoints(sections: string[]): string[] {
  const evalKeywords = ['審査基準', '評価基準', '評価ポイント', '審査の観点']
  const points: string[] = []
  
  for (const section of sections) {
    for (const keyword of evalKeywords) {
      if (section.includes(keyword)) {
        const lines = section.split('\n')
        lines.forEach(line => {
          if (line.match(/^[・●○□▪▫◆◇■□①②③④⑤]/) || line.match(/^\d+[\.、]/)) {
            points.push(line.trim())
          }
        })
      }
    }
  }
  
  return points
}

// キーワードを抽出
function extractKeywords(text: string): string[] {
  const keywords: string[] = []
  const importantWords = [
    '革新', '生産性', '効率化', 'DX', 'デジタル', '改善', '向上',
    '新規', '創出', '開発', '導入', '展開', '拡大', '強化',
    '課題', '解決', '効果', '成果', '実績', '計画', '戦略'
  ]
  
  importantWords.forEach(word => {
    if (text.includes(word)) {
      keywords.push(word)
    }
  })
  
  return keywords
}

// DOCXテンプレートに値を入力
export async function fillDocxTemplate(
  templateBuffer: Buffer,
  data: Record<string, any>
): Promise<Buffer> {
  try {
    const result = await createReport({
      template: templateBuffer,
      data: data,
      cmdDelimiter: ['{{', '}}'], // プレースホルダーの形式
    })
    
    return Buffer.from(result)
  } catch (error) {
    console.error('DOCXテンプレート処理エラー:', error)
    throw new Error('申請書の生成に失敗しました')
  }
}

// 業務改善助成金の申請書フィールドマッピング
export const GYOMU_KAIZEN_FIELDS = {
  '事業場名': 'companyName',
  '所在地': 'address',
  '代表者氏名': 'representativeName',
  '業種': 'industry',
  '常時使用する労働者数': 'employeeCount',
  '事業実施計画の名称': 'projectTitle',
  '事業実施計画の目的・必要性': 'projectPurpose',
  '事業実施計画の内容': 'projectContent',
  '期待される効果': 'expectedEffects',
  '導入する設備・機器等': 'equipment',
  '事業費総額': 'totalCost',
  '助成金申請額': 'subsidyAmount',
  '賃金引上げ計画': 'wageIncreasePlan',
  '実施予定期間': 'implementationPeriod'
}

// 要項に基づいてフィールドに最適な内容を生成するためのプロンプト
export function generateFieldPrompt(
  fieldName: string,
  guideline: GuidelineData,
  companyInfo: any
): string {
  const field = GYOMU_KAIZEN_FIELDS[fieldName]
  const requirements = guideline.requirements.find(r => 
    r.keywords.some(k => fieldName.includes(k))
  )
  
  let prompt = `以下の情報を基に、「${fieldName}」欄に記載する内容を生成してください。\n\n`
  
  prompt += `【補助金情報】\n`
  prompt += `補助金名: ${guideline.subsidyName}\n`
  prompt += `目的: ${guideline.purpose}\n\n`
  
  if (requirements) {
    prompt += `【記載要件】\n`
    requirements.requirements.forEach(req => {
      prompt += `- ${req}\n`
    })
    if (requirements.maxLength) {
      prompt += `\n文字数制限: ${requirements.maxLength}文字以内\n`
    }
    prompt += `\n【重要キーワード】\n`
    prompt += requirements.keywords.join('、') + '\n'
  }
  
  if (guideline.evaluationPoints.length > 0) {
    prompt += `\n【評価ポイント】\n`
    guideline.evaluationPoints.forEach(point => {
      prompt += `- ${point}\n`
    })
  }
  
  prompt += `\n【企業情報】\n`
  Object.entries(companyInfo).forEach(([key, value]) => {
    prompt += `${key}: ${value}\n`
  })
  
  prompt += `\n【生成ルール】\n`
  prompt += `1. 募集要項の要件を満たす内容にする\n`
  prompt += `2. 評価ポイントを意識した記載にする\n`
  prompt += `3. 具体的な数値や根拠を含める\n`
  prompt += `4. 読みやすく説得力のある文章にする\n`
  
  return prompt
}