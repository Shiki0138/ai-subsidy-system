/**
 * 初期質問生成API
 * 補助金タイプに応じた適応型質問を生成
 */

import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/services/ai/geminiService'

export async function POST(request: NextRequest) {
  try {
    const { subsidyType } = await request.json()
    
    if (!subsidyType) {
      return NextResponse.json(
        { error: '補助金タイプが指定されていません' },
        { status: 400 }
      )
    }

    // 補助金タイプ別の基本質問セット
    const questionSets = {
      monozukuri: [
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
          id: 'current_challenges',
          text: '現在直面している事業課題や技術的課題を教えてください。',
          type: 'textarea',
          category: 'business_challenges',
          priority: 2,
          isRequired: true,
          aiContext: '補助事業の必要性と緊急性を評価',
          validationRules: { minLength: 80, maxLength: 800 }
        },
        {
          id: 'innovation_plan',
          text: '今回の補助事業で実現したい革新的な取り組みを具体的に教えてください。',
          type: 'textarea',
          category: 'innovation',
          priority: 3,
          isRequired: true,
          aiContext: '革新性と独自性を評価するための核心的な質問',
          validationRules: { minLength: 100, maxLength: 1500 }
        },
        {
          id: 'equipment_details',
          text: '導入予定の設備・システムの技術仕様と導入効果を教えてください。',
          type: 'textarea',
          category: 'technical',
          priority: 4,
          isRequired: true,
          aiContext: '技術的実現可能性と投資効果を評価',
          validationRules: { minLength: 100, maxLength: 1200 }
        },
        {
          id: 'market_analysis',
          text: 'ターゲット市場と顧客ニーズ、競合他社の状況を教えてください。',
          type: 'textarea',
          category: 'market',
          priority: 5,
          isRequired: true,
          aiContext: '市場性と事業性を評価',
          validationRules: { minLength: 80, maxLength: 1000 }
        },
        {
          id: 'implementation_schedule',
          text: '補助事業の実施スケジュールと主要マイルストーンを教えてください。',
          type: 'textarea',
          category: 'execution',
          priority: 6,
          isRequired: true,
          aiContext: '実行計画の具体性と実現可能性を評価',
          validationRules: { minLength: 80, maxLength: 800 }
        },
        {
          id: 'expected_outcomes',
          text: '補助事業実施後の期待される成果・効果を具体的な数値で教えてください。',
          type: 'textarea',
          category: 'outcomes',
          priority: 7,
          isRequired: true,
          aiContext: '事業効果の定量的評価',
          validationRules: { minLength: 80, maxLength: 800 }
        },
        {
          id: 'company_website',
          text: '会社のホームページURLを教えてください（詳細分析に使用）',
          type: 'url',
          category: 'company_basic',
          priority: 8,
          isRequired: false,
          aiContext: 'Web分析による追加情報収集',
          validationRules: { pattern: 'https?://.+' }
        }
      ],
      it_dounyuu: [
        {
          id: 'current_it_systems',
          text: '現在利用しているITシステム・ツールと課題を教えてください。',
          type: 'textarea',
          category: 'current_state',
          priority: 1,
          isRequired: true,
          aiContext: 'IT導入の必要性と現状分析',
          validationRules: { minLength: 50, maxLength: 800 }
        },
        {
          id: 'productivity_goals',
          text: 'IT導入により実現したい生産性向上の目標を教えてください。',
          type: 'textarea',
          category: 'goals',
          priority: 2,
          isRequired: true,
          aiContext: '生産性向上効果の評価',
          validationRules: { minLength: 80, maxLength: 1000 }
        }
      ]
    }

    // 基本質問セットを取得
    const baseQuestions = questionSets[subsidyType as keyof typeof questionSets] || questionSets.monozukuri

    // AIを使用して追加の適応型質問を生成
    try {
      const geminiService = new GeminiService()
      const aiGeneratedQuestions = await geminiService.generateAdaptiveQuestions(subsidyType, baseQuestions)
      
      return NextResponse.json([...baseQuestions, ...aiGeneratedQuestions])
    } catch (aiError) {
      console.warn('AI question generation failed, using base questions:', aiError)
      return NextResponse.json(baseQuestions)
    }

  } catch (error) {
    console.error('Error generating initial questions:', error)
    return NextResponse.json(
      { error: '質問生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}