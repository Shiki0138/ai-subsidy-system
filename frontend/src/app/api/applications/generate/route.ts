/**
 * AI申請書生成API
 * 実データとGemini APIを使用して申請書を生成
 */

import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/services/ai/geminiService'
import { RealDataService } from '@/services/external/realDataService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      subsidyType,
      corporateNumber,
      additionalInfo,
      sectionType,
      regenerate = false
    } = body
    
    // 必須パラメータチェック
    if (!subsidyType) {
      return NextResponse.json(
        { error: '補助金タイプが指定されていません' },
        { status: 400 }
      )
    }
    
    if (!corporateNumber) {
      return NextResponse.json(
        { error: '法人番号が指定されていません' },
        { status: 400 }
      )
    }
    
    // サービスのインスタンス化
    const realDataService = new RealDataService(process.env.ESTAT_APP_ID)
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY)
    
    // 企業の実データを取得
    let companyData
    try {
      companyData = await realDataService.getCompanyRealData(corporateNumber)
    } catch (error) {
      return NextResponse.json(
        { error: '企業データの取得に失敗しました' },
        { status: 500 }
      )
    }
    
    // 補助金の要件を設定（実際はDBから取得）
    const requirements = getSubsidyRequirements(subsidyType)
    
    // 申請用データをフォーマット
    const applicationData = realDataService.formatForApplication(companyData)
    
    let generatedContent: any
    
    if (sectionType) {
      // 特定セクションのみ生成
      generatedContent = await geminiService.generateSection(
        sectionType,
        {
          ...applicationData,
          requirements,
          additionalInfo
        }
      )
    } else {
      // 全体を生成
      generatedContent = await geminiService.generateApplication({
        subsidyType,
        companyData: applicationData,
        requirements,
        additionalInfo
      })
      
      // 生成された内容をセクションごとに分割
      generatedContent = parseGeneratedContent(generatedContent)
    }
    
    // レビューを実行（オプション）
    let review
    if (body.includeReview) {
      review = await geminiService.reviewApplication(
        typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent),
        subsidyType
      )
    }
    
    // レスポンスを構築
    const response = {
      success: true,
      data: {
        subsidyType,
        corporateNumber,
        companyInfo: {
          name: companyData.basic?.name,
          address: companyData.basic?.address,
          industry: companyData.industryStats?.industryName
        },
        eligibility: await realDataService.checkSubsidyEligibility(companyData),
        generatedContent,
        review,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: {
            corporate: '法人番号API',
            statistics: 'e-Stat API',
            ai: 'Google Gemini Pro'
          }
        }
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('申請書生成エラー:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '申請書の生成に失敗しました'
      },
      { status: 500 }
    )
  }
}

/**
 * 補助金要件を取得（実際はDBから）
 */
function getSubsidyRequirements(subsidyType: string): any {
  const requirements: { [key: string]: any } = {
    sustainability: {
      maxAmount: 500000,
      subsidyRate: 0.67,
      targetBusiness: '小規模事業者',
      eligibleExpenses: ['広報費', '開発費', '機械装置等費', '外注費'],
      specialConditions: ['賃金引上げ枠', '卒業枠', '後継者支援枠', '創業枠']
    },
    monozukuri: {
      maxAmount: 10000000,
      subsidyRate: 0.5,
      targetBusiness: '中小企業・小規模事業者',
      eligibleExpenses: ['機械装置費', 'システム構築費', '技術導入費', '専門家経費'],
      requirements: ['付加価値額3%以上向上', '給与支給総額1.5%以上向上']
    },
    'business-improvement': {
      maxAmount: 6000000,
      subsidyRate: 0.9,
      targetBusiness: '中小企業・小規模事業者',
      wageIncrease: [30, 45, 60, 90],
      eligibleExpenses: ['設備投資費', 'コンサルティング費', '研修費']
    },
    reconstruction: {
      maxAmount: 60000000,
      subsidyRate: 0.67,
      targetBusiness: '中小企業等',
      types: ['新分野展開', '事業転換', '業種転換', '業態転換', '事業再編'],
      requirements: ['売上高10%以上減少', '付加価値額15%以上向上']
    },
    'it-subsidy': {
      maxAmount: 4500000,
      subsidyRate: 0.75,
      targetBusiness: '中小企業・小規模事業者',
      types: ['通常枠', 'セキュリティ対策推進枠', 'デジタル化基盤導入枠'],
      eligibleTools: ['会計ソフト', '受発注ソフト', '決済ソフト', 'ECソフト']
    }
  }
  
  return requirements[subsidyType] || requirements.sustainability
}

/**
 * 生成されたコンテンツをパース
 */
function parseGeneratedContent(content: string): any {
  const sections: any = {
    businessOverview: '',
    implementationPlan: '',
    schedule: '',
    expectedEffects: '',
    budget: '',
    futureVision: ''
  }
  
  const sectionMarkers = {
    '1. 事業概要': 'businessOverview',
    '2. 補助事業の内容': 'implementationPlan',
    '3. 実施スケジュール': 'schedule',
    '4. 期待される効果': 'expectedEffects',
    '5. 必要経費の内訳': 'budget',
    '6. 今後の事業展開': 'futureVision'
  }
  
  let currentSection = ''
  const lines = content.split('\n')
  
  for (const line of lines) {
    // セクションマーカーをチェック
    for (const [marker, sectionKey] of Object.entries(sectionMarkers)) {
      if (line.includes(marker)) {
        currentSection = sectionKey
        break
      }
    }
    
    // コンテンツを適切なセクションに追加
    if (currentSection && !Object.keys(sectionMarkers).some(marker => line.includes(marker))) {
      sections[currentSection] += line + '\n'
    }
  }
  
  // 各セクションをトリム
  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].trim()
  }
  
  return sections
}