'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  HomeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface UserFriendlyError {
  title: string
  message: string
  actionButtons: Array<{
    label: string
    action: () => void
    variant: 'primary' | 'secondary' | 'danger'
  }>
  severity: 'error' | 'warning' | 'info'
  autoRetry?: boolean
  supportContact?: boolean
  details?: string
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.prototype.generateErrorId()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // エラーログ送信
    this.logError(error, errorInfo)

    // コールバック実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId() // 実装に応じて調整
    }

    // サーバーにエラーログを送信
    this.sendErrorToServer(errorData)

    // コンソールにログ出力
    console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Error Data:', errorData)
    console.groupEnd()
  }

  async sendErrorToServer(errorData: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })
    } catch (e) {
      console.error('Failed to send error to server:', e)
    }
  }

  getUserId(): string | null {
    // 実際の実装では、認証状態から取得
    return localStorage.getItem('userId') || null
  }

  classifyError(error: Error): UserFriendlyError {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    // ネットワークエラー
    if (message.includes('network') || message.includes('fetch') || message.includes('load')) {
      return {
        title: 'ネットワーク接続エラー',
        message: 'インターネット接続を確認してください。接続が安定している場合は、しばらく時間をおいてから再試行してください。',
        severity: 'error',
        autoRetry: true,
        supportContact: true,
        actionButtons: [
          {
            label: '再試行',
            action: this.handleRetry.bind(this),
            variant: 'primary'
          },
          {
            label: 'ホームに戻る',
            action: this.goHome.bind(this),
            variant: 'secondary'
          }
        ]
      }
    }

    // チャンクローディングエラー（よくある Next.js エラー）
    if (message.includes('loading chunk') || message.includes('loading css chunk')) {
      return {
        title: 'アプリケーション更新エラー',
        message: 'アプリケーションが更新されました。ページを再読み込みして最新版をご利用ください。',
        severity: 'warning',
        autoRetry: false,
        actionButtons: [
          {
            label: 'ページを再読み込み',
            action: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      }
    }

    // メモリ不足エラー
    if (message.includes('memory') || message.includes('heap')) {
      return {
        title: 'メモリ不足エラー',
        message: 'ブラウザのメモリが不足しています。他のタブを閉じるか、ブラウザを再起動してください。',
        severity: 'error',
        actionButtons: [
          {
            label: 'ページを再読み込み',
            action: () => window.location.reload(),
            variant: 'primary'
          },
          {
            label: 'ホームに戻る',
            action: this.goHome.bind(this),
            variant: 'secondary'
          }
        ]
      }
    }

    // 認証エラー
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        title: '認証エラー',
        message: 'セッションが切れています。再度ログインしてください。',
        severity: 'warning',
        actionButtons: [
          {
            label: 'ログインページへ',
            action: () => window.location.href = '/auth/login',
            variant: 'primary'
          }
        ]
      }
    }

    // フォームバリデーションエラー
    if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
      return {
        title: '入力エラー',
        message: '入力内容に問題があります。各項目をご確認ください。',
        severity: 'warning',
        actionButtons: [
          {
            label: '戻る',
            action: this.handleRetry.bind(this),
            variant: 'primary'
          }
        ]
      }
    }

    // ファイルアップロードエラー
    if (message.includes('upload') || message.includes('file')) {
      return {
        title: 'ファイルアップロードエラー',
        message: 'ファイルのアップロードに失敗しました。ファイル形式やサイズをご確認ください。',
        severity: 'error',
        supportContact: true,
        actionButtons: [
          {
            label: '再試行',
            action: this.handleRetry.bind(this),
            variant: 'primary'
          },
          {
            label: '戻る',
            action: () => window.history.back(),
            variant: 'secondary'
          }
        ]
      }
    }

    // React コンポーネントエラー
    if (stack.includes('react') || stack.includes('component')) {
      return {
        title: '画面表示エラー',
        message: '画面の表示中にエラーが発生しました。ページを再読み込みしてください。',
        severity: 'error',
        supportContact: true,
        actionButtons: [
          {
            label: 'ページを再読み込み',
            action: () => window.location.reload(),
            variant: 'primary'
          },
          {
            label: 'ホームに戻る',
            action: this.goHome.bind(this),
            variant: 'secondary'
          }
        ]
      }
    }

    // 汎用エラー
    return {
      title: '予期しないエラー',
      message: 'システムエラーが発生しました。問題が継続する場合は、サポートまでお問い合わせください。',
      severity: 'error',
      supportContact: true,
      details: error.message,
      actionButtons: [
        {
          label: '再試行',
          action: this.handleRetry.bind(this),
          variant: 'primary'
        },
        {
          label: 'ホームに戻る',
          action: this.goHome.bind(this),
          variant: 'secondary'
        }
      ]
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId()
      })
    } else {
      // 最大リトライ回数に達した場合
      alert('再試行の上限に達しました。ページを再読み込みするか、サポートまでお問い合わせください。')
    }
  }

  goHome = () => {
    window.location.href = '/dashboard'
  }

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('エラー詳細をクリップボードにコピーしました'))
      .catch(() => alert('コピーに失敗しました'))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const userError = this.classifyError(this.state.error)

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                {/* アイコン */}
                <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                  userError.severity === 'error' ? 'bg-red-100' :
                  userError.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${
                    userError.severity === 'error' ? 'text-red-600' :
                    userError.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>

                {/* タイトル */}
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {userError.title}
                </h3>

                {/* メッセージ */}
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {userError.message}
                </p>

                {/* エラーID */}
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                  エラーID: {this.state.errorId}
                </div>

                {/* 詳細エラー情報（開発環境のみ） */}
                {process.env.NODE_ENV === 'development' && userError.details && (
                  <details className="mt-4 text-left">
                    <summary className="text-sm text-gray-500 cursor-pointer">
                      技術的詳細を表示
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                      {userError.details}
                    </div>
                  </details>
                )}

                {/* アクションボタン */}
                <div className="mt-6 space-y-3">
                  {userError.actionButtons.map((button, index) => (
                    <Button
                      key={index}
                      onClick={button.action}
                      variant={button.variant}
                      className="w-full"
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>

                {/* 追加アクション */}
                <div className="mt-6 flex justify-center space-x-4 text-sm">
                  <button
                    onClick={this.copyErrorDetails}
                    className="flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    エラー詳細をコピー
                  </button>

                  {userError.supportContact && (
                    <a
                      href="mailto:support@ai-subsidy.com?subject=システムエラー&body=エラーID: ${this.state.errorId}"
                      className="flex items-center text-gray-500 hover:text-gray-700"
                    >
                      <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
                      サポートに連絡
                    </a>
                  )}
                </div>

                {/* 自動リトライ表示 */}
                {userError.autoRetry && this.retryCount < this.maxRetries && (
                  <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                    <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                    自動で再試行しています... ({this.retryCount + 1}/{this.maxRetries})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              お困りの場合は、サポートまでお気軽にお問い合わせください
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// React Hooks版のエラーハンドリング
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: any) => {
    // エラーログの送信
    console.error('Unhandled error:', error, errorInfo)
    
    // ユーザーへの通知
    if (error.message.includes('network')) {
      alert('ネットワークエラーが発生しました。接続を確認してください。')
    } else {
      alert('エラーが発生しました。ページを再読み込みしてください。')
    }
  }

  return { handleError }
}

// エラー境界のラッパーコンポーネント
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}