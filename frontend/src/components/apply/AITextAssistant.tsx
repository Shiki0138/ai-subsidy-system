'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { showError, showSuccess } from '@/utils/error-handler'
import { GeminiService } from '@/services/ai/geminiService'

interface AITextAssistantProps {
  fieldName: string
  fieldLabel: string
  currentValue: string
  subsidyType: string
  placeholder?: string
  exampleText?: string
  onUpdate: (value: string) => void
}

export function AITextAssistant({
  fieldName,
  fieldLabel,
  currentValue,
  subsidyType,
  placeholder,
  exampleText,
  onUpdate
}: AITextAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [showExample, setShowExample] = useState(false)

  // 参考例文の定義
  const examples: Record<string, string> = {
    projectTitle: 'DX推進による販路拡大計画',
    currentChallenges: '現在、当社では新規顧客の獲得に苦戦しており、既存の販路では売上成長に限界を感じています。また、業務の属人化により効率が悪く、スタッフの負担が増加しています。',
    improvementNeeds: 'ECサイトを構築してオンライン販売を強化し、全国の顧客にアプローチしたいと考えています。同時に、業務管理システムを導入して効率化を図ります。',
    projectDescription: '自社ECサイトを構築し、既存商品のオンライン販売を開始します。SNSマーケティングと連携し、ブランド認知度を高めながら新規顧客を獲得します。',
    projectPurpose: '地域限定だった販売エリアを全国に拡大し、売上を現在の1.5倍に成長させることを目指します。',
    subsidyUsage: 'ECサイト構築費用：150万円、在庫管理システム：50万円、SNS広告費：30万円、コンサルティング費用：20万円',
    expectedResults: '1年後に月商を現在の300万円から450万円へ成長、新規顧客数200名獲得、リピート率30%達成',
    targetMarket: '30-40代の健康志向の女性、都市部在住、世帯年収500万円以上',
    competitiveAdvantage: '地元産の有機野菜を使用した独自レシピ、管理栄養士監修の健康メニュー、48時間以内の産地直送システム',
    kpiTargets: '月間売上高：450万円、新規顧客獲得数：月20名、顧客単価：15,000円、リピート率：30%',
    sustainabilityPlan: '補助事業終了後も、構築したECサイトとマーケティング体制を維持し、売上の10%を継続的な改善投資に充てます。'
  }

  const handleAIImprove = async () => {
    if (!currentValue.trim()) {
      showError('改善する文章を入力してください')
      return
    }

    setLoading(true)
    try {
      const geminiService = new GeminiService()
      
      // フィールドごとに異なるプロンプトを生成
      let prompt = ''
      
      if (fieldName === 'projectTitle') {
        // 事業計画名の場合：短く、キャッチーなタイトルを生成
        prompt = `
あなたは${subsidyType}の申請書作成の専門家です。
以下の内容をもとに、審査員の印象に残る、短くてキャッチーな事業計画名を生成してください。

現在の事業計画名：
${currentValue}

生成のポイント：
- 15文字以内で簡潔に
- 事業の特徴や目的が一目でわかる
- インパクトがあり記憶に残る
- ${subsidyType}の趣旨に合致する
- 具体的な価値提案を含む

改善後の事業計画名のみを出力してください。
`
      } else if (fieldName === 'projectDescription') {
        // 事業計画の概要の場合：包括的な概要文を生成
        prompt = `
あなたは${subsidyType}の申請書作成の専門家です。
以下の内容を、審査員に事業の全体像が伝わる包括的な概要文に改善してください。

現在の概要：
${currentValue}

改善のポイント：
- 事業の背景・課題を明確に
- 解決策と実施内容を具体的に
- 期待される効果を数値で示す
- 200-300文字程度でまとめる
- ${subsidyType}の審査基準に適合する内容

改善後の概要文のみを出力してください。
`
      } else {
        // その他のフィールドの場合：汎用的な改善
        prompt = `
あなたは${subsidyType}の申請書作成の専門家です。
以下の「${fieldLabel}」の内容を、審査員に伝わりやすく、説得力のある文章に改善してください。

現在の文章：
${currentValue}

改善のポイント：
- 具体的な数値や期間を含める
- 課題や効果を明確に示す
- 専門用語は適度に使用し、分かりやすく説明
- ${subsidyType}の審査基準に適合する内容にする

改善後の文章のみを出力してください。
`
      }

      const improvedText = await geminiService.improveText(prompt)
      onUpdate(improvedText)
      showSuccess('文章を改善しました')
    } catch (error) {
      showError('文章の改善に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUseExample = () => {
    const example = exampleText || examples[fieldName] || ''
    if (example) {
      onUpdate(example)
      setShowExample(false)
      showSuccess('参考例を適用しました')
    }
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAIImprove}
        disabled={loading || !currentValue.trim()}
        className="text-xs"
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            改善中...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-1" />
            AIで改善
          </>
        )}
      </Button>

      {(exampleText || examples[fieldName]) && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowExample(!showExample)}
            className="text-xs"
          >
            参考例を見る
          </Button>

          {showExample && (
            <div className="absolute z-10 mt-8 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm max-w-md">
              <p className="text-gray-700 mb-2">{exampleText || examples[fieldName]}</p>
              <Button
                type="button"
                size="sm"
                onClick={handleUseExample}
                className="text-xs"
              >
                この例を使用
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}