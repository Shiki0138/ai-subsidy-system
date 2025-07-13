import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'お問い合わせ - AI補助金申請システム',
  description: 'AI補助金申請システムに関するお問い合わせはこちらからどうぞ。',
}

export default function ContactPage() {
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
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-8">
            <EnvelopeIcon className="h-8 w-8 text-brand-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">お問い合わせ</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* お問い合わせフォーム */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">メールでのお問い合わせ</h2>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                    placeholder="山田太郎"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    会社名・団体名
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                    placeholder="株式会社○○"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                    placeholder="example@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    お問い合わせ内容 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="">選択してください</option>
                    <option value="service">サービスについて</option>
                    <option value="technical">技術的な問題</option>
                    <option value="billing">料金について</option>
                    <option value="feature">機能要望</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    メッセージ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                    placeholder="お問い合わせ内容を詳しくお書きください"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>📌 現在デモ環境のため、フォーム送信は無効になっています。</strong><br />
                    実際のお問い合わせは、下記の連絡先まで直接ご連絡ください。
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
                  disabled
                >
                  送信（デモ環境のため無効）
                </button>
              </form>
            </div>

            {/* 連絡先情報 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">その他の連絡方法</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <EnvelopeIcon className="h-6 w-6 text-brand-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">メール</h3>
                    <p className="text-gray-600">support@ai-subsidy.com</p>
                    <p className="text-sm text-gray-500 mt-1">
                      24時間受付（営業時間内に返信いたします）
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <PhoneIcon className="h-6 w-6 text-brand-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">電話</h3>
                    <p className="text-gray-600">03-1234-5678</p>
                    <p className="text-sm text-gray-500 mt-1">
                      平日 9:00-18:00（土日祝除く）
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPinIcon className="h-6 w-6 text-brand-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">所在地</h3>
                    <p className="text-gray-600">
                      〒100-0001<br />
                      東京都千代田区千代田1-1-1<br />
                      AIビル 10F
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">よくある質問</h3>
                <p className="text-sm text-green-700 mb-3">
                  お問い合わせ前に、よくある質問もご確認ください。
                </p>
                <Link
                  href="/faq"
                  className="text-brand-600 hover:text-brand-500 underline text-sm"
                >
                  FAQ ページを見る →
                </Link>
              </div>

              <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2">緊急時のサポート</h3>
                <p className="text-sm text-amber-700">
                  システムの重大な障害や緊急時は、メールにて「緊急」と件名に記載してご連絡ください。
                  優先的に対応いたします。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="space-x-4">
              <Link 
                href="/faq" 
                className="text-brand-600 hover:text-brand-500 underline"
              >
                よくある質問
              </Link>
              <Link 
                href="/help" 
                className="text-brand-600 hover:text-brand-500 underline"
              >
                ヘルプセンター
              </Link>
              <Link 
                href="/terms" 
                className="text-brand-600 hover:text-brand-500 underline"
              >
                利用規約
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}