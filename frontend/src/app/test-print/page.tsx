'use client'

import { useState } from 'react'
import { generateStyledApplicationPDF, openHTMLPreview, downloadHTMLFile } from '@/utils/pdfGenerator'
import { ApplicationData } from '@/types/application'
import { toast } from 'react-hot-toast'

export default function TestPrintPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const demoApplicationData: ApplicationData = {
    id: 'test-print-001',
    title: 'DX推進による業務効率化プロジェクト',
    subsidyProgramName: '小規模事業者持続化補助金',
    subsidyProgramCategory: '一般型',
    projectDescription: `本事業は、デジタル技術を活用した業務プロセス改革により、当社の持続的な成長と競争力強化を目指すものです。

【事業の背景】
現在、当社では多くの業務が手作業に依存しており、効率性や正確性の面で課題を抱えています。特に顧客管理、在庫管理、売上分析等の業務において、デジタル化による抜本的な改善が急務となっています。

【実施内容】
1. 顧客管理システムの導入
2. 在庫管理の自動化
3. データ分析ツールの活用
4. スタッフのデジタルスキル向上

これらの取り組みにより、業務効率を30%向上させ、売上の20%増加を目指します。`,
    purpose: '業務プロセスのデジタル化により生産性を向上し、持続的な事業成長を実現するため',
    targetMarket: '地域の中小企業及び個人顧客を対象としたBtoB・BtoC複合型サービス市場',
    expectedEffects: '業務効率30%向上、売上20%増加、顧客満足度向上、新規顧客開拓の促進',
    budget: 3500000,
    timeline: `【第1段階】システム導入期（1-3ヶ月）
- 顧客管理システム導入
- スタッフ研修実施

【第2段階】運用改善期（4-6ヶ月）
- 在庫管理自動化
- データ分析基盤構築

【第3段階】効果測定期（7-12ヶ月）
- 効果測定と改善
- 追加機能導入`,
    challenges: '手作業による非効率性、データの分散管理、分析機能の不足',
    innovation: 'AI技術を活用した予測分析機能により、従来にない精度での需要予測を実現',
    companyName: 'デモ株式会社',
    representativeName: '田中 太郎',
    createdAt: new Date().toISOString(),
    status: 'COMPLETED'
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      await generateStyledApplicationPDF(demoApplicationData)
      toast.success('PDFを生成しました')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDF生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenHTMLPreview = () => {
    openHTMLPreview(demoApplicationData)
    toast.success('HTMLプレビューを開きました')
  }

  const handleDownloadHTML = () => {
    downloadHTMLFile(demoApplicationData)
    toast.success('HTMLファイルをダウンロードしました')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">印刷機能テストページ</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">テスト用申請書データ</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">申請書名:</span>
              <span className="ml-2">{demoApplicationData.title}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">補助金:</span>
              <span className="ml-2">{demoApplicationData.subsidyProgramName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">会社名:</span>
              <span className="ml-2">{demoApplicationData.companyName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">予算:</span>
              <span className="ml-2">¥{demoApplicationData.budget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">印刷機能テスト</h2>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-2">1. PDFダウンロード（jsPDF使用）</h3>
              <p className="text-sm text-gray-600 mb-3">
                jsPDFライブラリを使用してクライアントサイドでPDFを生成します。
                日本語フォントに対応した申請書形式のPDFが生成されます。
              </p>
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isGenerating ? '生成中...' : 'PDFをダウンロード'}
              </button>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-2">2. HTMLプレビュー（新規ウィンドウ）</h3>
              <p className="text-sm text-gray-600 mb-3">
                印刷用にスタイリングされたHTMLを新しいウィンドウで表示します。
                ブラウザの印刷機能（Ctrl+P / Cmd+P）でPDF保存も可能です。
              </p>
              <button
                onClick={handleOpenHTMLPreview}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                HTMLプレビューを開く
              </button>
            </div>

            <div className="pb-4">
              <h3 className="font-medium text-gray-900 mb-2">3. HTMLファイルダウンロード</h3>
              <p className="text-sm text-gray-600 mb-3">
                印刷用HTMLファイルをダウンロードします。
                保存したファイルをブラウザで開いて印刷できます。
              </p>
              <button
                onClick={handleDownloadHTML}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                HTMLファイルをダウンロード
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">印刷のヒント</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• PDFダウンロード: 最も簡単な方法。そのまま印刷可能なPDFが生成されます。</li>
              <li>• HTMLプレビュー: より細かい印刷設定が可能。ブラウザの印刷機能を使用します。</li>
              <li>• 印刷時は「背景グラフィック」のオプションを有効にすると、より美しい出力が得られます。</li>
              <li>• A4サイズでの印刷を推奨します。</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">実際の補助金申請書作成</h2>
          <p className="text-sm text-gray-600 mb-6">
            各補助金の公式フォーマットに対応した申請書を作成できます。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">📋 テンプレート方式</h3>
              <div className="space-y-3">
                <a
                  href="/apply/jizokuka"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-brand-500 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">小規模事業者持続化補助金</h4>
                  <p className="text-sm text-gray-600">販路開拓等の取組を支援</p>
                </a>
                <a
                  href="/apply/it-subsidy"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-brand-500 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">IT導入補助金</h4>
                  <p className="text-sm text-gray-600">ITツール導入を支援</p>
                </a>
                <a
                  href="/apply/monozukuri"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-brand-500 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">ものづくり補助金</h4>
                  <p className="text-sm text-gray-600">革新的開発を支援</p>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">📑 募集要項ベース方式</h3>
              <div className="space-y-3">
                <a
                  href="/apply/gyomu-kaizen"
                  className="block p-4 border border-green-200 bg-green-50 rounded-lg hover:border-green-500 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">業務改善助成金</h4>
                  <p className="text-sm text-gray-600">募集要項をアップロードして自動生成</p>
                  <p className="text-xs text-green-600 mt-2">✨ NEW: DOCXファイル対応</p>
                </a>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">
                    今後、他の補助金も募集要項ベースに対応予定
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-brand-600 hover:text-brand-700 underline">
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  )
}