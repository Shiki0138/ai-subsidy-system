import { Metadata } from 'next'
import { KnowledgeBasedApplicationForm } from '@/components/subsidy/KnowledgeBasedApplicationForm'

interface PageProps {
  params: {
    subsidyId: string
  }
}

const SUBSIDY_INFO: Record<string, { name: string; description: string }> = {
  'jizokuka': {
    name: '小規模事業者持続化補助金',
    description: '販路開拓等の取組を支援'
  },
  'it-subsidy': {
    name: 'IT導入補助金',
    description: 'ITツール導入による生産性向上を支援'
  },
  'monozukuri': {
    name: 'ものづくり補助金',
    description: '革新的サービス開発・試作品開発・生産プロセスの改善を支援'
  },
  'gyomu-kaizen': {
    name: '業務改善助成金',
    description: '生産性向上と賃金引上げを支援'
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const info = SUBSIDY_INFO[params.subsidyId]
  const title = info ? `${info.name} - 知識ベース申請書作成` : '知識ベース申請書作成'
  
  return {
    title: `${title} - AI補助金申請システム`,
    description: '募集要項・採択事例を基にAIが最適な申請書を作成します。',
  }
}

export default function KnowledgeBasedApplicationPage({ params }: PageProps) {
  const info = SUBSIDY_INFO[params.subsidyId] || {
    name: '補助金',
    description: ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {info.name}
              </h1>
              <p className="text-sm text-gray-600">{info.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 説明セクション */}
          <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-brand-900 mb-3">
              🎯 知識ベース活用型 申請書作成
            </h2>
            <p className="text-brand-800 mb-4">
              募集要項、採択事例、関連資料を総合的に分析し、最適な申請書を作成します。
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📚 知識ベース構築</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 募集要項のアップロード</li>
                  <li>• 採択事例の登録</li>
                  <li>• 関連Webサイトの追加</li>
                  <li>• AI による総合分析</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✨ 申請書生成</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 知識ベースに基づく内容生成</li>
                  <li>• 評価ポイントを考慮</li>
                  <li>• 成功パターンの適用</li>
                  <li>• リスク要因の回避</li>
                </ul>
              </div>
            </div>
          </div>

          {/* メインコンポーネント */}
          <KnowledgeBasedApplicationForm
            subsidyId={params.subsidyId}
            subsidyName={info.name}
          />

          {/* 注意事項 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-3">📌 ご利用にあたって</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• 最新の募集要項を必ずアップロードしてください</li>
              <li>• 採択事例が多いほど精度が向上します</li>
              <li>• 生成された内容は必ず確認・修正してください</li>
              <li>• 機密情報の取り扱いにご注意ください</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}