import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, BuildingOfficeIcon, CpuChipIcon, ArrowTrendingUpIcon, WrenchIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '補助金一覧 - AI補助金申請システム',
  description: '対応している補助金制度の一覧と詳細情報をご確認ください。',
}

export default function SubsidiesPage() {
  const subsidies = [
    {
      id: 'monozukuri',
      name: 'ものづくり・商業・サービス生産性向上促進補助金',
      shortName: 'ものづくり補助金',
      organization: '中小企業庁',
      maxAmount: '1,000万円〜1億円',
      subsidyRate: '1/2〜2/3',
      icon: WrenchIcon,
      color: 'from-blue-500 to-indigo-600',
      description: '中小企業・小規模事業者等が今後複数年にわたり相次いで直面する制度変更等に対応するため、革新的サービス開発・試作品開発・生産プロセスの改善を行うための設備投資等を支援',
      features: [
        '革新的な製品・サービス開発',
        '生産プロセスの改善',
        '設備投資による生産性向上',
        'デジタル化の推進'
      ],
      timeline: '年3回程度の公募',
      available: true
    },
    {
      id: 'sustainability',
      name: '小規模企業持続化補助金',
      shortName: '持続化補助金',
      organization: '中小企業庁',
      maxAmount: '50万円〜200万円',
      subsidyRate: '2/3',
      icon: BuildingOfficeIcon,
      color: 'from-green-500 to-emerald-600',
      description: '小規模事業者の販路開拓等の取組や、業務効率化の取組を支援することにより、地域の雇用や産業を支える小規模事業者の生産性向上と持続的発展を図る',
      features: [
        '販路開拓・販売促進',
        '業務効率化の取組',
        'WEBサイト制作',
        '展示会出展'
      ],
      timeline: '年4回程度の公募',
      available: true
    },
    {
      id: 'it-subsidy',
      name: 'IT導入補助金',
      shortName: 'IT導入補助金',
      organization: '経済産業省',
      maxAmount: '30万円〜450万円',
      subsidyRate: '1/2〜3/4',
      icon: CpuChipIcon,
      color: 'from-purple-500 to-violet-600',
      description: '中小企業・小規模事業者等のみなさまが自社の課題やニーズに合ったITツールを導入する経費の一部を補助することで、みなさまの業務効率化・売上アップをサポート',
      features: [
        'ITツールの導入',
        'ソフトウェア購入',
        'クラウドサービス利用',
        'セキュリティ対策'
      ],
      timeline: '年2〜3回程度の公募',
      available: true
    },
    {
      id: 'business-restructuring',
      name: '事業再構築補助金',
      shortName: '事業再構築補助金',
      organization: '経済産業省',
      maxAmount: '100万円〜1億円',
      subsidyRate: '1/2〜2/3',
      icon: ArrowTrendingUpIcon,
      color: 'from-orange-500 to-red-600',
      description: 'ポストコロナ・ウィズコロナ時代の経済社会の変化に対応するため、中小企業等の思い切った事業再構築を支援することで、日本経済の構造転換を促進',
      features: [
        '新分野展開',
        '事業転換・業種転換',
        '業態転換',
        '事業再編'
      ],
      timeline: '年3〜4回程度の公募',
      available: true
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

      {/* ヒーロー */}
      <section className="bg-gradient-to-r from-brand-600 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-4">対応補助金一覧</h1>
          <p className="text-xl text-blue-100">
            AI補助金申請システムが対応している主要な補助金制度
          </p>
        </div>
      </section>

      {/* 補助金一覧 */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {subsidies.map((subsidy, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                  {/* アイコン・基本情報 */}
                  <div className={`bg-gradient-to-br ${subsidy.color} p-8 md:w-80 flex-shrink-0`}>
                    <div className="text-white">
                      <subsidy.icon className="h-12 w-12 mb-4" />
                      <h3 className="text-2xl font-bold mb-2">{subsidy.shortName}</h3>
                      <p className="text-white/90 text-sm mb-4">{subsidy.organization}</p>
                      
                      <div className="space-y-2">
                        <div className="bg-white/20 rounded-lg p-3">
                          <div className="text-sm text-white/80">補助上限額</div>
                          <div className="font-bold">{subsidy.maxAmount}</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                          <div className="text-sm text-white/80">補助率</div>
                          <div className="font-bold">{subsidy.subsidyRate}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 詳細情報 */}
                  <div className="p-8 flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">
                      {subsidy.name}
                    </h4>
                    
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {subsidy.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">対象となる取組</h5>
                        <ul className="space-y-2">
                          {subsidy.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">申請スケジュール</h5>
                        <p className="text-sm text-gray-700 mb-4">{subsidy.timeline}</p>
                        
                        {subsidy.available ? (
                          <Link
                            href={`/apply/${subsidy.id}`}
                            className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${subsidy.color} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity`}
                          >
                            申請書を作成する
                          </Link>
                        ) : (
                          <div className="inline-flex items-center px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed">
                            準備中
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 追加情報 */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            その他の補助金について
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">対応予定の補助金</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 業務改善助成金</li>
                <li>• 働き方改革推進支援助成金</li>
                <li>• 地域別補助金制度</li>
                <li>• 環境・エネルギー関連補助金</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">カスタム対応</h3>
              <p className="text-sm text-gray-700 mb-4">
                上記以外の補助金についても、ご要望に応じてカスタム対応いたします。
              </p>
              <Link
                href="/contact"
                className="text-brand-600 hover:text-brand-500 underline text-sm"
              >
                お問い合わせ
              </Link>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              どの補助金が最適かわからない場合
            </h3>
            <p className="text-gray-700 mb-6">
              かんたん診断で、あなたの事業に最適な補助金を見つけましょう
            </p>
            <Link
              href="/quick-apply"
              className="inline-flex items-center px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
            >
              かんたん診断を始める
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}