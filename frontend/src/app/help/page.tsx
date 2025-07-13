import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, LifebuoyIcon, BookOpenIcon, ChatBubbleLeftRightIcon, VideoCameraIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'ヘルプセンター - AI補助金申請システム',
  description: 'AI補助金申請システムの使い方やサポート情報をご案内します。',
}

export default function HelpPage() {
  const helpSections = [
    {
      title: "はじめに",
      icon: BookOpenIcon,
      color: "bg-blue-500",
      items: [
        { title: "システム概要", description: "AI補助金申請システムの基本的な機能と特徴" },
        { title: "初回セットアップ", description: "アカウント登録から初回利用までの手順" },
        { title: "画面の見方", description: "各画面の構成と基本的な操作方法" }
      ]
    },
    {
      title: "申請書作成",
      icon: BookOpenIcon,
      color: "bg-green-500",
      items: [
        { title: "基本情報の入力", description: "会社情報や事業内容の入力方法" },
        { title: "AIによる自動生成", description: "AIが申請書を生成する流れと仕組み" },
        { title: "内容の編集・修正", description: "生成された申請書の編集方法" },
        { title: "PDF出力", description: "完成した申請書をPDFで保存する方法" }
      ]
    },
    {
      title: "補助金別ガイド",
      icon: BookOpenIcon,
      color: "bg-purple-500",
      items: [
        { title: "ものづくり補助金", description: "ものづくり補助金申請のポイントと注意事項" },
        { title: "小規模企業持続化補助金", description: "持続化補助金の申請要領と記載例" },
        { title: "IT導入補助金", description: "IT導入補助金の申請手順と必要書類" },
        { title: "事業再構築補助金", description: "事業再構築補助金の要件と申請方法" }
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
      <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <LifebuoyIcon className="h-12 w-12 text-brand-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">ヘルプセンター</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI補助金申請システムの使い方やよくある質問への回答をご案内します。
            問題解決のお手伝いをいたします。
          </p>
        </div>

        {/* クイックアクセス */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Link
            href="/faq"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
          >
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">よくある質問</h3>
            <p className="text-sm text-gray-600">
              頻繁に寄せられる質問とその回答
            </p>
          </Link>

          <Link
            href="/contact"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
          >
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">お問い合わせ</h3>
            <p className="text-sm text-gray-600">
              サポートチームに直接質問
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 opacity-60">
            <VideoCameraIcon className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">動画ガイド</h3>
            <p className="text-sm text-gray-600">
              操作方法を動画で解説（準備中）
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 opacity-60">
            <BookOpenIcon className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">API文書</h3>
            <p className="text-sm text-gray-600">
              開発者向けAPI仕様書（準備中）
            </p>
          </div>
        </div>

        {/* ヘルプコンテンツ */}
        <div className="space-y-8">
          {helpSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className={`${section.color} p-3 rounded-lg mr-4`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-4 border border-gray-200 rounded-lg hover:border-brand-300 transition-colors cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="mt-3">
                        <span className="text-xs text-gray-400">準備中</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 追加サポート */}
        <div className="mt-12 bg-gradient-to-r from-brand-50 to-blue-50 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              さらにサポートが必要ですか？
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              上記のリソースで解決しない問題がございましたら、
              専門のサポートチームがお手伝いいたします。
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">メールサポート</h3>
                <p className="text-sm text-gray-600 mb-4">
                  24時間受付<br />
                  営業時間内に返信
                </p>
                <Link
                  href="/contact"
                  className="text-brand-600 hover:text-brand-500 font-medium text-sm"
                >
                  メール送信 →
                </Link>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">電話サポート</h3>
                <p className="text-sm text-gray-600 mb-4">
                  平日 9:00-18:00<br />
                  03-1234-5678
                </p>
                <span className="text-gray-400 text-sm">営業時間内のみ</span>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm opacity-60">
                <h3 className="font-semibold text-gray-900 mb-2">チャットサポート</h3>
                <p className="text-sm text-gray-600 mb-4">
                  リアルタイム対応<br />
                  平日 10:00-17:00
                </p>
                <span className="text-gray-400 text-sm">準備中</span>
              </div>
            </div>
          </div>
        </div>

        {/* システム状況 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">システム稼働状況</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">すべてのシステムが正常に稼働中</span>
            </div>
            <span className="text-xs text-gray-500">最終確認: 2024/07/13 12:00</span>
          </div>
        </div>
      </main>
    </div>
  )
}