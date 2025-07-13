import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, SparklesIcon, DocumentTextIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon, CpuChipIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '機能一覧 - AI補助金申請システム',
  description: 'AI補助金申請システムの全機能をご紹介。高度なAI技術で補助金申請を効率化します。',
}

export default function FeaturesPage() {
  const features = [
    {
      icon: SparklesIcon,
      title: "AI自動生成",
      description: "Google Gemini AIによる高品質な申請書自動生成",
      benefits: [
        "過去の採択事例を学習したAIモデル",
        "審査基準に適合した内容を自動生成",
        "専門知識不要で高品質な申請書を作成"
      ],
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: DocumentTextIcon,
      title: "多様な補助金対応",
      description: "主要な補助金制度に幅広く対応",
      benefits: [
        "ものづくり補助金",
        "小規模企業持続化補助金",
        "IT導入補助金",
        "事業再構築補助金"
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: ChartBarIcon,
      title: "インテリジェント分析",
      description: "企業情報を分析して最適な申請戦略を提案",
      benefits: [
        "企業の強みを自動分析",
        "市場性・実現可能性の評価",
        "採択可能性の向上提案"
      ],
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: ClockIcon,
      title: "時間短縮",
      description: "従来の1/10の時間で申請書作成が完了",
      benefits: [
        "約10-15分で完成",
        "面倒な書類作成作業を自動化",
        "本業に集中できる時間を確保"
      ],
      color: "from-orange-500 to-red-600"
    },
    {
      icon: CpuChipIcon,
      title: "リアルタイム改善",
      description: "AIによる文章改善とフィードバック機能",
      benefits: [
        "文章の品質をリアルタイムでチェック",
        "具体性・説得力の向上提案",
        "審査員に響く表現への最適化"
      ],
      color: "from-teal-500 to-cyan-600"
    },
    {
      icon: ShieldCheckIcon,
      title: "セキュリティ",
      description: "企業情報を安全に保護する高度なセキュリティ",
      benefits: [
        "SSL暗号化通信",
        "厳格なアクセス制御",
        "プライバシー保護の徹底"
      ],
      color: "from-gray-500 to-gray-700"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="flex items-center text-gray-600 hover:text-brand-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              ホームに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-brand-600 to-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI補助金申請システムの機能
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            最新のAI技術で補助金申請を革新。
            複雑な申請プロセスを簡単・迅速・確実に。
          </p>
        </div>
      </section>

      {/* 機能一覧 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className={`bg-gradient-to-r ${feature.color} p-6`}>
                  <div className="flex items-center text-white">
                    <feature.icon className="h-8 w-8 mr-4" />
                    <h3 className="text-2xl font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-white/90 mt-2">{feature.description}</p>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* プロセス説明 */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              簡単3ステップで申請書完成
            </h2>
            <p className="text-xl text-gray-600">
              複雑な申請プロセスをシンプルに
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">基本情報入力</h3>
              <p className="text-gray-600">
                企業の基本情報と事業内容を入力するだけ。約5分で完了します。
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI自動生成</h3>
              <p className="text-gray-600">
                AIが入力情報を分析し、審査に通りやすい申請書を自動生成します。
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF出力・提出</h3>
              <p className="text-gray-600">
                完成した申請書をPDF形式で出力し、そのまま提出できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 技術的優位性 */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              技術的優位性
            </h2>
            <p className="text-xl text-gray-600">
              最新のAI技術とデータ分析で圧倒的な品質を実現
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Google Gemini AI</h3>
              <p className="text-gray-700">
                Googleの最新AI技術を活用し、自然で説得力のある文章を生成。
                従来の定型文では表現できない企業独自の強みを適切に文章化します。
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">採択事例分析</h3>
              <p className="text-gray-700">
                過去の採択事例を機械学習で分析し、成功パターンを特定。
                審査員が評価するポイントを押さえた申請書を作成します。
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">リアルタイム最適化</h3>
              <p className="text-gray-700">
                申請書作成中にリアルタイムで品質をチェック。
                文章の具体性、説得力、論理構成を即座に改善提案します。
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">継続的学習</h3>
              <p className="text-gray-700">
                システムは継続的に学習・改善されます。
                最新の審査傾向や制度変更に自動的に対応し、常に最高品質を維持します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐ始めませんか？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            無料でAI補助金申請システムをお試しいただけます
          </p>
          <div className="space-x-4">
            <Link
              href="/quick-apply"
              className="inline-flex items-center px-8 py-3 bg-white text-brand-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              無料で申請書作成
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-brand-600 transition-colors"
            >
              ダッシュボード
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}