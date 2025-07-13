import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, QuestionMarkCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'よくある質問（FAQ） - AI補助金申請システム',
  description: 'AI補助金申請システムに関するよくある質問とその回答をまとめました。',
}

export default function FAQPage() {
  const faqs = [
    {
      category: "サービス全般",
      questions: [
        {
          q: "AI補助金申請システムとはどのようなサービスですか？",
          a: "AIを活用して補助金申請書を自動生成するシステムです。企業の基本情報や事業内容を入力するだけで、審査に通りやすい高品質な申請書を作成できます。"
        },
        {
          q: "どのような補助金に対応していますか？",
          a: "ものづくり補助金、小規模企業持続化補助金、IT導入補助金、事業再構築補助金など、主要な補助金に対応しています。随時対応補助金を拡大中です。"
        },
        {
          q: "利用料金はいくらですか？",
          a: "現在はベータ版として無料でご利用いただけます。正式版リリース後の料金については、別途ご案内いたします。"
        }
      ]
    },
    {
      category: "使い方",
      questions: [
        {
          q: "申請書作成にはどのくらい時間がかかりますか？",
          a: "基本情報の入力から申請書完成まで、約10-15分程度です。従来の手作業と比べて大幅な時間短縮が可能です。"
        },
        {
          q: "作成した申請書はどのような形式で出力できますか？",
          a: "PDF形式での出力に対応しています。印刷してそのまま提出いただけるレイアウトで生成されます。"
        },
        {
          q: "申請書の内容を後から修正できますか？",
          a: "はい、保存した申請書はいつでも編集・修正が可能です。AIによる改善提案機能も利用できます。"
        }
      ]
    },
    {
      category: "技術・セキュリティ",
      questions: [
        {
          q: "入力した企業情報は安全に管理されますか？",
          a: "SSL暗号化通信により、すべての情報は安全に保護されます。また、厳格なプライバシーポリシーに基づいて情報を管理しています。"
        },
        {
          q: "AIはどのように申請書を生成しているのですか？",
          a: "Google Gemini AIを活用し、過去の採択事例や審査基準を学習したモデルが、最適な申請書内容を生成します。"
        },
        {
          q: "オフラインでも利用できますか？",
          a: "申し訳ございませんが、現在はオンライン環境でのみご利用いただけます。インターネット接続が必要です。"
        }
      ]
    },
    {
      category: "補助金申請",
      questions: [
        {
          q: "このシステムを使えば補助金に必ず採択されますか？",
          a: "採択を保証するものではありませんが、審査基準に適合した高品質な申請書作成により、採択確率の向上が期待できます。"
        },
        {
          q: "申請書提出後のサポートはありますか？",
          a: "申請書作成後の提出手続きについては、各補助金の公式サイトをご確認ください。手続きに関するご質問はお問い合わせフォームからどうぞ。"
        },
        {
          q: "複数の補助金に同時申請できますか？",
          a: "技術的には可能ですが、各補助金の申請要件や重複申請の制限については、事前に各制度の詳細をご確認ください。"
        }
      ]
    },
    {
      category: "アカウント・サポート",
      questions: [
        {
          q: "アカウント登録は必要ですか？",
          a: "現在はデモ環境のため、アカウント登録なしでもご利用いただけます。正式版では、データ保存のためアカウント登録が必要になります。"
        },
        {
          q: "パスワードを忘れてしまいました。",
          a: "正式版リリース後は、パスワードリセット機能を提供予定です。現在のデモ環境では、アカウント機能は無効になっています。"
        },
        {
          q: "システムの使い方がわからない場合はどうすればよいですか？",
          a: "各ページにヘルプガイドを用意しています。また、お問い合わせフォームからご質問いただければ、サポートチームが回答いたします。"
        }
      ]
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

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-8">
            <QuestionMarkCircleIcon className="h-8 w-8 text-brand-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">よくある質問（FAQ）</h1>
          </div>

          <div className="mb-8">
            <p className="text-gray-600">
              AI補助金申請システムに関するよくある質問をまとめました。
              こちらにない質問については、<Link href="/contact" className="text-brand-600 hover:text-brand-500 underline">お問い合わせフォーム</Link>からご連絡ください。
            </p>
          </div>

          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {section.category}
              </h2>
              
              <div className="space-y-4">
                {section.questions.map((faq, index) => (
                  <details
                    key={index}
                    className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h3 className="font-medium text-gray-900 pr-4">
                        Q. {faq.q}
                      </h3>
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        A. {faq.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">💡 問題が解決しませんでしたか？</h3>
            <p className="text-blue-700 mb-4">
              上記のFAQで解決しない問題がございましたら、お気軽にお問い合わせください。
              サポートチームが迅速に対応いたします。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
              >
                お問い合わせする
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center px-4 py-2 border border-brand-600 text-brand-600 rounded-md hover:bg-brand-50 transition-colors"
              >
                ヘルプセンター
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              最終更新日：2024年7月13日
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}