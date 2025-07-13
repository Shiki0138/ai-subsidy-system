import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '免責事項 - AI補助金申請システム',
  description: 'AI補助金申請システムの利用に関する免責事項と注意事項をご確認ください。',
}

export default function DisclaimerPage() {
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
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">免責事項</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              最終更新日：2024年7月13日
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. サービスの性質について</h2>
              <p className="text-gray-700 mb-4">
                本サービス「AI補助金申請システム」（以下、「本サービス」）は、AIを活用して補助金申請書の作成を支援するツールです。
                本サービスで生成される申請書は、あくまで参考資料として提供されるものであり、実際の申請にあたっては、
                利用者様ご自身の責任において内容を確認・修正していただく必要があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 補助金採択の保証について</h2>
              <p className="text-gray-700 mb-4">
                本サービスの利用により作成された申請書を使用しても、補助金の採択を保証するものではありません。
                補助金の採択は、各補助金の審査機関による審査結果に基づくものであり、当社は採択の可否について
                一切の責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 情報の正確性について</h2>
              <p className="text-gray-700 mb-4">
                本サービスで提供する補助金情報は、公開されている情報を基に作成していますが、
                最新性・正確性・完全性を保証するものではありません。実際の申請にあたっては、
                必ず各補助金の公式ウェブサイトや募集要項をご確認ください。
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>補助金の募集期間、条件、金額等は変更される場合があります</li>
                <li>AIが生成する内容には誤りが含まれる可能性があります</li>
                <li>法令や制度の変更により、情報が古くなる場合があります</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 利用者の責任</h2>
              <p className="text-gray-700 mb-4">
                利用者は以下の事項について、自己の責任において対応するものとします：
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>生成された申請書の内容の確認と必要に応じた修正</li>
                <li>申請要件への適合性の確認</li>
                <li>提出期限の遵守</li>
                <li>必要書類の準備と提出</li>
                <li>虚偽記載の防止</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 損害賠償の制限</h2>
              <p className="text-gray-700 mb-4">
                本サービスの利用により生じた直接的または間接的な損害（補助金不採択、機会損失、
                データ損失等を含むがこれらに限定されない）について、当社は一切の責任を負いません。
                ただし、当社の故意または重過失による場合を除きます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. サービスの中断・変更</h2>
              <p className="text-gray-700 mb-4">
                当社は、以下の場合において、利用者への事前通知なく本サービスを中断・変更・終了する場合があります：
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>システムの保守・更新作業を行う場合</li>
                <li>天災・事故等の不可抗力により提供が困難な場合</li>
                <li>その他、運営上必要と判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 知的財産権</h2>
              <p className="text-gray-700 mb-4">
                本サービスで生成された申請書の著作権は利用者に帰属しますが、
                本サービス自体のシステム、デザイン、ロゴ等の知的財産権は当社または正当な権利者に帰属します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 個人情報の取り扱い</h2>
              <p className="text-gray-700 mb-4">
                個人情報の取り扱いについては、別途定める
                <Link href="/privacy" className="text-brand-600 hover:text-brand-500 underline ml-1">
                  プライバシーポリシー
                </Link>
                に従います。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. 準拠法・管轄裁判所</h2>
              <p className="text-gray-700 mb-4">
                本免責事項は日本法に準拠し、本サービスに関する紛争については、
                東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. 免責事項の変更</h2>
              <p className="text-gray-700 mb-4">
                当社は、必要に応じて本免責事項を変更することがあります。
                変更後の免責事項は、本ページに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">重要なお知らせ</h3>
                  <p className="text-amber-700">
                    本サービスはAIを活用した支援ツールです。実際の補助金申請にあたっては、
                    必ず最新の公式情報をご確認の上、専門家（税理士、中小企業診断士等）への
                    相談もご検討ください。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}