import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '料金プラン - AI補助金申請システム',
  description: 'AI補助金申請システムの料金プランをご確認ください。',
}

export default function PricingPage() {
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

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">料金プラン</h1>
          <p className="text-xl text-gray-600">
            現在ベータ版として無料でご利用いただけます
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-blue-700 p-8 text-white text-center">
            <div className="flex items-center justify-center mb-4">
              <StarIcon className="h-8 w-8 mr-2" />
              <h2 className="text-3xl font-bold">ベータ版</h2>
            </div>
            <div className="text-5xl font-bold mb-2">
              ¥0
              <span className="text-xl font-normal">/月</span>
            </div>
            <p className="text-blue-100">
              正式リリースまで完全無料
            </p>
          </div>

          <div className="p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              ベータ版に含まれる機能
            </h3>
            
            <div className="space-y-4 mb-8">
              {[
                'AI自動申請書生成（無制限）',
                '主要補助金対応（ものづくり・持続化・IT導入・事業再構築）',
                'PDF出力機能',
                'リアルタイム文章改善',
                'クラウド保存',
                'メールサポート',
                'セキュリティ保護'
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/quick-apply"
                className="inline-flex items-center px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors mb-4"
              >
                今すぐ無料で始める
              </Link>
              <p className="text-sm text-gray-500">
                アカウント登録不要 • すぐに利用開始
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            正式版について
          </h3>
          <p className="text-gray-700 mb-4">
            正式版リリース後の料金体系は現在検討中です。
            ベータ版ユーザーの皆様には、特別価格での提供を予定しています。
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">予定している機能追加</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• より多くの補助金制度への対応</li>
                <li>• 高度な企業分析機能</li>
                <li>• チーム機能・権限管理</li>
                <li>• API連携機能</li>
                <li>• 電話サポート</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">お得な情報</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ベータユーザー限定割引</li>
                <li>• 長期契約での割引</li>
                <li>• 複数申請での従量割引</li>
                <li>• 早期決済特典</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            料金に関するご質問やご要望がございましたら、お気軽にお問い合わせください。
          </p>
          <Link
            href="/contact"
            className="text-brand-600 hover:text-brand-500 underline"
          >
            お問い合わせ
          </Link>
        </div>
      </main>
    </div>
  )
}