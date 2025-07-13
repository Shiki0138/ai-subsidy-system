import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'プライバシーポリシー - AI補助金申請システム',
  description: 'AI補助金申請システムのプライバシーポリシーをご確認ください。',
}

export default function PrivacyPage() {
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
            <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              最終更新日：2024年7月13日
              <br />
              施行日：2024年7月13日
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 個人情報の取得</h2>
              <p className="text-gray-700 mb-4">
                当社は、本サービスの提供にあたり、以下の個人情報を取得いたします：
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>氏名、会社名、代表者名</li>
                <li>メールアドレス</li>
                <li>電話番号</li>
                <li>住所（会社所在地）</li>
                <li>事業内容に関する情報</li>
                <li>申請書作成に必要な企業情報</li>
                <li>サービス利用履歴</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 個人情報の利用目的</h2>
              <p className="text-gray-700 mb-4">
                取得した個人情報は、以下の目的で利用いたします：
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>本サービスの提供・運営</li>
                <li>申請書の作成・生成</li>
                <li>ユーザーサポート・問い合わせ対応</li>
                <li>サービスの改善・品質向上</li>
                <li>新機能・サービスのご案内</li>
                <li>利用統計・分析（匿名化処理後）</li>
                <li>不正利用の防止・セキュリティ確保</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 個人情報の第三者提供</h2>
              <p className="text-gray-700 mb-4">
                当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません：
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 個人情報の委託</h2>
              <p className="text-gray-700 mb-4">
                当社は、個人情報の取扱いの全部または一部を第三者に委託する場合があります。
                委託先に対しては、個人情報保護に関する契約を締結し、適切な監督を行います。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 個人情報の安全管理</h2>
              <p className="text-gray-700 mb-4">
                当社は、個人情報の漏えい、滅失、毀損等を防止するため、以下の措置を講じています：
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>SSL暗号化通信の使用</li>
                <li>アクセス制御・認証システムの導入</li>
                <li>従業員への個人情報保護教育</li>
                <li>定期的なセキュリティ監査</li>
                <li>不正アクセス監視システム</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 個人情報の開示・訂正・削除</h2>
              <p className="text-gray-700 mb-4">
                ユーザーは、当社が保有する自己の個人情報について、開示、訂正、利用停止、削除を求めることができます。
                ご希望の場合は、当社指定の方法でお申し出ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookieの使用</h2>
              <p className="text-gray-700 mb-4">
                本サービスでは、サービスの利便性向上のためCookieを使用しています。
                Cookieの使用を希望されない場合は、ブラウザの設定で無効にすることができますが、
                一部機能がご利用いただけない場合があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. アクセスログ</h2>
              <p className="text-gray-700 mb-4">
                当社は、サービスの安定運用およびセキュリティ確保のため、
                アクセスログ（IPアドレス、アクセス日時、アクセス元URL等）を記録・保存しています。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. プライバシーポリシーの変更</h2>
              <p className="text-gray-700 mb-4">
                当社は、必要に応じて本プライバシーポリシーを変更することがあります。
                変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. お問い合わせ</h2>
              <p className="text-gray-700 mb-4">
                個人情報の取扱いに関するお問い合わせは、以下までご連絡ください：
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-medium">AI補助金申請システム 個人情報保護窓口</p>
                <p className="text-gray-600 mt-2">
                  Email: privacy@ai-subsidy.com<br />
                  受付時間: 平日 9:00-18:00
                </p>
              </div>
            </section>

            <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-center">
                本プライバシーポリシーは2024年7月13日より効力を生じます。
              </p>
            </div>

            <div className="mt-8 text-center">
              <div className="space-x-4">
                <Link 
                  href="/terms" 
                  className="text-brand-600 hover:text-brand-500 underline"
                >
                  利用規約
                </Link>
                <Link 
                  href="/disclaimer" 
                  className="text-brand-600 hover:text-brand-500 underline"
                >
                  免責事項
                </Link>
                <Link 
                  href="/contact" 
                  className="text-brand-600 hover:text-brand-500 underline"
                >
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}