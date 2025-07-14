import { Metadata } from 'next'
import Link from 'next/link'
import { 
  DocumentTextIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '補助金申請 - AI補助金申請システム',
  description: '様々な補助金・助成金の申請書作成を開始します。',
}

const SUBSIDY_OPTIONS = [
  {
    id: 'jizokuka',
    name: '小規模事業者持続化補助金',
    description: '販路開拓等の取組を支援',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    icon: DocumentTextIcon,
    templateAvailable: true
  },
  {
    id: 'it-subsidy',
    name: 'IT導入補助金',
    description: 'ITツール導入による生産性向上を支援',
    color: 'bg-green-50 border-green-200 hover:border-green-400',
    icon: DocumentTextIcon,
    templateAvailable: true
  },
  {
    id: 'monozukuri',
    name: 'ものづくり補助金',
    description: '革新的サービス開発・試作品開発を支援',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    icon: DocumentTextIcon,
    templateAvailable: true
  },
  {
    id: 'gyomu-kaizen',
    name: '業務改善助成金',
    description: '生産性向上と賃金引上げを支援',
    color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    icon: DocumentTextIcon,
    templateAvailable: false // 募集要項ベースのみ
  }
]

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                補助金申請書作成
              </h1>
              <p className="text-sm text-gray-600">申請したい補助金を選択してください</p>
            </div>
            <Link
              href="/dashboard"
              className="text-brand-600 hover:text-brand-700 underline"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 申請方法の選択肢 */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              💡 申請方法について
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold">テンプレート方式</h3>
                </div>
                <p className="text-gray-600">
                  事前定義されたフォームに記入。最も簡単で素早く作成可能。
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <DocumentDuplicateIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-semibold">募集要項ベース</h3>
                </div>
                <p className="text-gray-600">
                  募集要項をアップロードしてAIが内容を解析・生成。
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AcademicCapIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold">知識ベース活用</h3>
                </div>
                <p className="text-gray-600">
                  複数の資料を総合分析して最適な申請書を生成。
                </p>
              </div>
            </div>
          </div>

          {/* 補助金リスト */}
          <div className="grid md:grid-cols-2 gap-6">
            {SUBSIDY_OPTIONS.map((subsidy) => {
              const Icon = subsidy.icon
              return (
                <div
                  key={subsidy.id}
                  className={`border-2 rounded-lg p-6 transition-all ${subsidy.color}`}
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <Icon className="h-8 w-8 text-gray-700" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subsidy.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {subsidy.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {subsidy.templateAvailable ? (
                      <>
                        <Link
                          href={`/apply/${subsidy.id}`}
                          className="w-full px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-center block"
                        >
                          <SparklesIcon className="h-4 w-4 inline mr-2" />
                          テンプレートで作成
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/apply/gyomu-kaizen`}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-white text-center text-sm"
                          >
                            募集要項ベース
                          </Link>
                          <Link
                            href={`/apply/knowledge-based/${subsidy.id}`}
                            className="px-3 py-2 border border-brand-300 text-brand-700 rounded-md hover:bg-white text-center text-sm"
                          >
                            知識ベース活用
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                          <p className="text-sm text-yellow-800">
                            ⚠️ この補助金はテンプレートが準備中です
                          </p>
                        </div>
                        <Link
                          href={`/apply/gyomu-kaizen`}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center block"
                        >
                          募集要項ベースで作成
                        </Link>
                        <Link
                          href={`/apply/knowledge-based/${subsidy.id}`}
                          className="w-full px-4 py-2 border border-brand-600 text-brand-600 rounded-md hover:bg-brand-50 text-center block"
                        >
                          知識ベース活用で作成
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* その他のオプション */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-4">
              お探しの補助金が見つからない場合
            </p>
            <Link
              href="/custom-subsidy"
              className="inline-block px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            >
              カスタム補助金申請
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}