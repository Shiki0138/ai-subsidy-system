import { Metadata } from 'next'
import Link from 'next/link'
import { SparklesIcon, ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline'
import { RegisterForm } from '../../../components/auth/RegisterForm'

export const metadata: Metadata = {
  title: '無料登録 - AI補助金申請システム',
  description: 'AI補助金申請システムの無料アカウントを作成して、革新的な申請書自動生成機能をお試しください。',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* ヘッダーナビゲーション */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
          aria-label="ホームページに戻る"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          ホームに戻る
        </Link>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <SparklesIcon className="h-8 w-8 text-brand-600 group-hover:animate-pulse" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
              AI補助金申請システム
            </h1>
          </Link>
        </div>
        
        <div className="text-center mt-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            <span className="inline-flex items-center">
              🚀 無料で始める
              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
                3分で完了
              </span>
            </span>
          </h2>
          <p className="mt-2 text-gray-600">
            AI技術で申請書作成を革新しましょう
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
              aria-label="ログインページへ移動"
            >
              こちらからログイン
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-gray-100 sm:rounded-xl sm:px-10">
          <RegisterForm />
        </div>
      </div>

      {/* 特徴・メリット */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <span className="inline-flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-2" aria-hidden="true" />
                無料アカウントの特典
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              クレジットカード不要でご利用開始できます
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="bg-brand-100 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-brand-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI申請書生成</p>
                <p className="text-xs text-gray-600">月3回まで無料</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-success-100 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-success-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">PDF出力</p>
                <p className="text-xs text-gray-600">高品質な申請書PDF</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-purple-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">採択率分析</p>
                <p className="text-xs text-gray-600">成功可能性を予測</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-warning-100 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-warning-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">安全保護</p>
                <p className="text-xs text-gray-600">企業情報を暗号化</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center max-w-lg mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <span className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              無料
            </span>
            <span className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              即時利用
            </span>
            <span className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              安全
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 leading-relaxed">
          アカウント作成することで、
          <Link 
            href="/privacy" 
            className="text-brand-600 hover:text-brand-500 underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            aria-label="プライバシーポリシーを確認"
          >
            プライバシーポリシー
          </Link>
          と
          <Link 
            href="/terms" 
            className="text-brand-600 hover:text-brand-500 underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            aria-label="利用規約を確認"
          >
            利用規約
          </Link>
          に同意したものとみなされます。
        </p>
      </div>
    </div>
  )
}