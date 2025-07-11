/**
 * 企業データ取得API
 * 法人番号から実際の企業データを取得
 */

import { NextRequest, NextResponse } from 'next/server'
import { RealDataService } from '@/services/external/realDataService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const corporateNumber = searchParams.get('corporateNumber')
    
    if (!corporateNumber) {
      return NextResponse.json(
        { error: '法人番号が指定されていません' },
        { status: 400 }
      )
    }
    
    // 実データサービスのインスタンス作成
    const realDataService = new RealDataService(
      process.env.ESTAT_APP_ID
    )
    
    // 企業データを取得
    const companyData = await realDataService.getCompanyRealData(corporateNumber)
    
    // 補助金適格性チェック
    const eligibility = await realDataService.checkSubsidyEligibility(companyData)
    
    // 申請用にフォーマット
    const applicationData = realDataService.formatForApplication(companyData)
    
    return NextResponse.json({
      success: true,
      data: {
        company: companyData,
        eligibility: eligibility,
        applicationData: applicationData
      }
    })
    
  } catch (error) {
    console.error('企業データ取得エラー:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '企業データの取得に失敗しました' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, prefecture } = body
    
    if (!companyName) {
      return NextResponse.json(
        { error: '企業名が指定されていません' },
        { status: 400 }
      )
    }
    
    const realDataService = new RealDataService(
      process.env.ESTAT_APP_ID
    )
    
    // 企業名で検索
    const results = await realDataService.searchCompany(companyName, prefecture)
    
    return NextResponse.json({
      success: true,
      data: results,
      count: results.length
    })
    
  } catch (error) {
    console.error('企業検索エラー:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '企業検索に失敗しました' 
      },
      { status: 500 }
    )
  }
}