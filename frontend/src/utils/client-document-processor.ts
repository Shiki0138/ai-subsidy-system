// クライアントサイド用のドキュメント処理ユーティリティ

import mammoth from 'mammoth'
import { PDFDocument } from 'pdf-lib'
import * as XLSX from 'xlsx'

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
export async function readDocxContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('DOCX読み込みエラー:', error)
    throw new Error('DOCXファイルの読み込みに失敗しました')
  }
}

// PDFファイルを読み込んでテキストを抽出
export async function readPdfContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    let text = ''
    
    // 各ページからテキストを抽出（簡易版）
    // 注：pdf-libは主にPDF作成用で、テキスト抽出は限定的
    // より高度な抽出が必要な場合は、サーバーサイドでpdf-parseを使用
    for (const page of pages) {
      // PDFのメタデータやフォーム情報を取得
      const { width, height } = page.getSize()
      text += `[ページサイズ: ${width}x${height}]\n`
      
      // フォームフィールドがある場合は抽出
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      if (fields.length > 0) {
        text += '\n[フォームフィールド]\n'
        fields.forEach(field => {
          const name = field.getName()
          text += `${name}: [入力フィールド]\n`
        })
      }
    }
    
    // PDFからの完全なテキスト抽出は制限があるため、注意喚起
    if (text.length < 100) {
      text = `PDFファイルが読み込まれました。\n\n` +
             `※ 注意：PDFからの自動テキスト抽出は制限があります。\n` +
             `より正確な内容抽出のため、以下をお勧めします：\n` +
             `1. PDFをテキストファイル（.txt）に変換してアップロード\n` +
             `2. PDFの内容をDOCXファイルにコピーしてアップロード\n` +
             `3. 重要な部分を手動でテキストファイルに転記\n\n` +
             `ファイル名: ${file.name}\n` +
             `ファイルサイズ: ${(file.size / 1024).toFixed(2)} KB\n` +
             `ページ数: ${pages.length}`
    }
    
    return text
  } catch (error) {
    console.error('PDF読み込みエラー:', error)
    throw new Error('PDFファイルの読み込みに失敗しました。テキストファイルまたはDOCXファイルの使用をお勧めします。')
  }
}

// Excelファイルを読み込んでテキストを抽出
export async function readExcelContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    let text = `Excelファイル: ${file.name}\n\n`
    
    // 各シートを処理
    workbook.SheetNames.forEach((sheetName, index) => {
      text += `【シート${index + 1}: ${sheetName}】\n`
      
      const worksheet = workbook.Sheets[sheetName]
      
      // CSVフォーマットでテキスト化
      const csv = XLSX.utils.sheet_to_csv(worksheet, {
        blankrows: false,
        skipHidden: true
      })
      
      // HTMLテーブル形式でも取得（より構造化された情報）
      const html = XLSX.utils.sheet_to_html(worksheet, {
        header: '',
        footer: ''
      })
      
      // テキストとして追加
      text += csv + '\n\n'
      
      // セル範囲情報
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      text += `データ範囲: ${range.s.c + 1}列 × ${range.e.r + 1}行\n\n`
    })
    
    return text
  } catch (error) {
    console.error('Excel読み込みエラー:', error)
    throw new Error('Excelファイルの読み込みに失敗しました')
  }
}

// シンプルなテキスト読み込み
export async function readTextFile(file: File): Promise<string> {
  try {
    const text = await file.text()
    return text
  } catch (error) {
    console.error('ファイル読み込みエラー:', error)
    throw new Error('ファイルの読み込みに失敗しました')
  }
}

// ファイルタイプに応じて適切な読み込み関数を選択
export async function readFileContent(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.docx')) {
    return await readDocxContent(file)
  } else if (fileName.endsWith('.pdf')) {
    return await readPdfContent(file)
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return await readExcelContent(file)
  } else if (fileName.endsWith('.txt')) {
    return await readTextFile(file)
  } else {
    throw new Error(`サポートされていないファイル形式です: ${file.name}`)
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
    /令和\d+年度\s*(.+?助成金)/,
    /【(.+?助成金)】/,
    /^(.+?助成金)/m,
    /業務改善助成金/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  
  return '業務改善助成金'
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
  
  return '中小企業・小規模事業者の生産性向上を支援し、事業場内最低賃金の引上げを図るための制度です。'
}

// 対象事業者を抽出
function extractTargetBusiness(sections: string[]): string[] {
  const targetKeywords = ['対象者', '対象事業者', '申請資格', '応募資格']
  const targets: string[] = []
  
  for (const section of sections) {
    for (const keyword of targetKeywords) {
      if (section.includes(keyword)) {
        const lines = section.split('\n')
        lines.forEach(line => {
          if (line.match(/^[・●○□▪▫◆◇■□]/)) {
            targets.push(line.trim())
          }
        })
      }
    }
  }
  
  // デフォルト値
  if (targets.length === 0) {
    targets.push('中小企業・小規模事業者')
    targets.push('事業場内最低賃金と地域別最低賃金の差額が50円以内の事業場')
  }
  
  return targets
}

// 補助金額を抽出
function extractSubsidyAmount(sections: string[]): { min: number; max: number; rate: string } {
  const amountKeywords = ['助成金額', '助成上限', '助成率', '交付額']
  let min = 300000
  let max = 6000000
  let rate = '3/4'
  
  for (const section of sections) {
    for (const keyword of amountKeywords) {
      if (section.includes(keyword)) {
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
  const expenseKeywords = ['対象経費', '助成対象経費', '経費区分', '対象となる経費']
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
  
  // デフォルト値
  if (expenses.length === 0) {
    expenses.push('設備投資費用（機械装置等購入費）')
    expenses.push('コンサルティング費用')
    expenses.push('教育訓練費')
  }
  
  return expenses
}

// 要件セクションを抽出
function extractRequirements(sections: string[]): RequirementSection[] {
  const requirements: RequirementSection[] = []
  const reqKeywords = ['事業計画', '実施内容', '必要書類', '記載事項', '提出書類']
  
  // デフォルトの要件
  requirements.push({
    title: '事業実施計画',
    requirements: [
      '生産性向上のための設備投資等の計画',
      '賃金引上げ計画',
      '事業実施による効果'
    ],
    keywords: ['生産性', '向上', '効率化', '改善', '賃金', '引上げ'],
    maxLength: 800
  })
  
  for (const section of sections) {
    for (const keyword of reqKeywords) {
      if (section.includes(keyword)) {
        const req: RequirementSection = {
          title: keyword,
          requirements: [],
          keywords: extractKeywords(section)
        }
        
        const lengthPattern = /(\d{2,4})[字文]字?(以内|程度|まで)/
        const lengthMatch = section.match(lengthPattern)
        if (lengthMatch) {
          req.maxLength = parseInt(lengthMatch[1])
        }
        
        const lines = section.split('\n')
        lines.forEach(line => {
          if (line.length > 10 && !line.match(/^[\s　]*$/)) {
            req.requirements.push(line.trim())
          }
        })
        
        if (req.requirements.length > 0) {
          requirements.push(req)
        }
      }
    }
  }
  
  return requirements
}

// 締切を抽出
function extractDeadline(text: string): string {
  const deadlinePattern = /締[切切][:：]?\s*(.+?日)/
  const match = text.match(deadlinePattern)
  return match ? match[1] : '随時受付'
}

// 評価ポイントを抽出
function extractEvaluationPoints(sections: string[]): string[] {
  const evalKeywords = ['審査基準', '評価基準', '評価ポイント', '審査の観点']
  const points: string[] = []
  
  // デフォルトの評価ポイント
  points.push('生産性向上の具体性・実現可能性')
  points.push('賃金引上げ計画の妥当性')
  points.push('事業の継続性・発展性')
  
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
    '生産性', '向上', '効率化', '改善', '賃金', '引上げ',
    'デジタル', '自動化', '省力化', '機械', '設備',
    '売上', '利益', '削減', '短縮', '品質'
  ]
  
  importantWords.forEach(word => {
    if (text.includes(word)) {
      keywords.push(word)
    }
  })
  
  return keywords
}

// 業務改善助成金の申請書フィールドマッピング
export const GYOMU_KAIZEN_FIELDS: Record<string, string> = {
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