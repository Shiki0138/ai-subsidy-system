import { Metadata } from 'next'
import { QuickApplyWizard } from './QuickApplyWizard'

export const metadata: Metadata = {
  title: 'クイック申請 - AI補助金申請システム',
  description: '2つの項目を入力するだけで最適な補助金を選定し、申請書を自動生成します'
}

export default function QuickApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            かんたん補助金申請
          </h1>
          <p className="text-xl text-gray-600">
            企業情報とプロジェクト内容を入力するだけで
            <br />
            最適な補助金の選定から申請書作成まで自動化
          </p>
        </div>

        <QuickApplyWizard />
      </div>
    </div>
  )
}