import { Metadata } from 'next'
import { GuidelineBasedForm } from '@/components/subsidy/GuidelineBasedForm'

export const metadata: Metadata = {
  title: '業務改善助成金申請書作成 - AI補助金申請システム',
  description: '募集要項に基づいて業務改善助成金の申請書を自動作成します。',
}

export default function GyomuKaizenPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              業務改善助成金 申請書作成
            </h1>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 説明セクション */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              🎯 募集要項に基づいた申請書作成
            </h2>
            <p className="text-blue-800 mb-4">
              このシステムは、募集要項を読み込んで、その要件に完全に準拠した申請書を自動生成します。
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📄 ステップ1</h3>
                <p className="text-sm text-gray-600">
                  募集要項（DOCX/TXT）をアップロード
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📝 ステップ2</h3>
                <p className="text-sm text-gray-600">
                  申請書テンプレート（DOCX）をアップロード
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✨ ステップ3</h3>
                <p className="text-sm text-gray-600">
                  AIが要項に基づいて内容を自動生成
                </p>
              </div>
            </div>
          </div>

          {/* メインフォーム */}
          <GuidelineBasedForm subsidyType="gyomu-kaizen" />
          
          {/* 注意事項 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-3">📌 ご利用にあたって</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• 生成された内容は必ず確認・修正してください</li>
              <li>• 募集要項は最新のものをご使用ください</li>
              <li>• 企業情報は正確に入力してください</li>
              <li>• 申請前に要項との整合性を再確認してください</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}