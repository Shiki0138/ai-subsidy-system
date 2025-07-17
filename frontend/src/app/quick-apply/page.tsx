'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Target,
  TrendingUp,
  Package,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { showSuccess } from '@/utils/error-handler'

interface DiagnosticResult {
  subsidyType: string
  subsidyName: string
  reason: string
  matchScore: number
}

export default function QuickApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    businessType: '',
    objective: ''
  })
  const [result, setResult] = useState<DiagnosticResult | null>(null)

  const businessTypes = [
    { id: 'manufacturing', label: '製造業', icon: Package },
    { id: 'retail', label: '小売・サービス業', icon: TrendingUp },
    { id: 'tech', label: 'IT・テクノロジー', icon: Zap },
    { id: 'other', label: 'その他', icon: Target }
  ]

  const objectives = [
    { id: 'digitalization', label: 'デジタル化・IT導入', subsidies: ['it-subsidy'] },
    { id: 'sales', label: '販路開拓・売上拡大', subsidies: ['sustainability'] },
    { id: 'productivity', label: '生産性向上・設備投資', subsidies: ['manufacturing', 'business-improvement'] },
    { id: 'restructuring', label: '事業転換・新分野進出', subsidies: ['reconstruction'] }
  ]

  const subsidyDetails: Record<string, any> = {
    'it-subsidy': {
      name: 'IT導入補助金',
      reason: 'ITツール導入による業務効率化を支援する補助金です'
    },
    'sustainability': {
      name: '小規模事業者持続化補助金',
      reason: '販路開拓や売上拡大の取り組みを支援する補助金です'
    },
    'manufacturing': {
      name: 'ものづくり補助金',
      reason: '革新的な設備投資や生産プロセス改善を支援する補助金です'
    },
    'business-improvement': {
      name: '業務改善助成金',
      reason: '生産性向上と賃金引上げを同時に実現する補助金です'
    },
    'reconstruction': {
      name: '事業再構築補助金',
      reason: '新分野展開や事業転換を支援する大型補助金です'
    }
  }

  const handleDiagnose = () => {
    const selectedObjective = objectives.find(obj => obj.id === answers.objective)
    if (selectedObjective && selectedObjective.subsidies.length > 0) {
      const recommendedSubsidy = selectedObjective.subsidies[0]
      const details = subsidyDetails[recommendedSubsidy]
      
      setResult({
        subsidyType: recommendedSubsidy,
        subsidyName: details.name,
        reason: details.reason,
        matchScore: 95
      })
      setStep(3)
    }
  }

  const handleApply = () => {
    if (result) {
      showSuccess('最適な補助金が見つかりました')
      router.push(`/apply/${result.subsidyType}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">トップに戻る</span>
            </Link>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              ステップ {step} / 3
            </Badge>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            <Zap className="inline-block w-6 h-6 sm:w-8 sm:h-8 mr-2 text-blue-600" />
            かんたん補助金診断
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            2つの質問に答えるだけで、最適な補助金を提案します
          </p>
        </div>

        {/* ステップ1: 業種選択 */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">質問1：あなたの業種は？</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              {businessTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setAnswers({ ...answers, businessType: type.id })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      answers.businessType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                    <p className="font-medium">{type.label}</p>
                  </button>
                )
              })}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!answers.businessType}
              className="w-full"
              size="lg"
            >
              次へ
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Card>
        )}

        {/* ステップ2: 目的選択 */}
        {step === 2 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">質問2：補助金の活用目的は？</h2>
            <div className="space-y-3 mb-6">
              {objectives.map((objective) => (
                <button
                  key={objective.id}
                  onClick={() => setAnswers({ ...answers, objective: objective.id })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    answers.objective === objective.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-lg">{objective.label}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                戻る
              </Button>
              <Button
                onClick={handleDiagnose}
                disabled={!answers.objective}
                className="flex-1"
                size="lg"
              >
                診断結果を見る
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* ステップ3: 診断結果 */}
        {step === 3 && result && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">診断完了！</h2>
                <p className="text-sm sm:text-base text-gray-600">あなたに最適な補助金が見つかりました</p>
              </div>

              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full p-2 mt-1">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">
                      {result.subsidyName}
                    </h3>
                    <p className="text-blue-800">{result.reason}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white">
                        マッチ度 {result.matchScore}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </Alert>

              <div className="space-y-3">
                <Button onClick={handleApply} className="w-full" size="lg">
                  この補助金を申請する
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setStep(1)
                    setAnswers({ businessType: '', objective: '' })
                    setResult(null)
                  }}
                  className="w-full"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  もう一度診断する
                </Button>
              </div>
            </Card>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                より詳細な相談が必要な場合は
              </p>
              <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
                ダッシュボードから詳細申請へ
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}