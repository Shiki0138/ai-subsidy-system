/**
 * ロギングユーティリティ
 * 本番環境とローカル環境で適切にログを管理
 */

import { IS_PRODUCTION, IS_DEVELOPMENT } from '@/config/environment'

// ログレベル
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// ログエントリー
interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: string
  data?: any
  error?: Error
}

// ログ設定
const LOG_LEVEL = IS_PRODUCTION ? LogLevel.WARN : LogLevel.DEBUG
const MAX_LOG_ENTRIES = 100

class Logger {
  private logs: LogEntry[] = []
  
  private shouldLog(level: LogLevel): boolean {
    return level >= LOG_LEVEL
  }
  
  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const levelStr = LogLevel[entry.level]
    const context = entry.context ? `[${entry.context}]` : ''
    return `${timestamp} ${levelStr} ${context} ${entry.message}`
  }
  
  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // ログのサイズ制限
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES)
    }
    
    // コンソール出力
    if (this.shouldLog(entry.level)) {
      const formattedMessage = this.formatMessage(entry)
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.log('🔍', formattedMessage, entry.data)
          break
        case LogLevel.INFO:
          console.info('ℹ️', formattedMessage, entry.data)
          break
        case LogLevel.WARN:
          console.warn('⚠️', formattedMessage, entry.data)
          break
        case LogLevel.ERROR:
          console.error('❌', formattedMessage, entry.error || entry.data)
          break
      }
    }
  }
  
  debug(message: string, data?: any, context?: string) {
    this.addLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context,
      data
    })
  }
  
  info(message: string, data?: any, context?: string) {
    this.addLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context,
      data
    })
  }
  
  warn(message: string, data?: any, context?: string) {
    this.addLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context,
      data
    })
  }
  
  error(message: string, error?: Error | any, context?: string) {
    this.addLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      error: error instanceof Error ? error : undefined,
      data: error instanceof Error ? undefined : error
    })
  }
  
  // パフォーマンス計測
  time(label: string) {
    if (IS_DEVELOPMENT) {
      console.time(label)
    }
  }
  
  timeEnd(label: string) {
    if (IS_DEVELOPMENT) {
      console.timeEnd(label)
    }
  }
  
  // ログのエクスポート（デバッグ用）
  exportLogs(): LogEntry[] {
    return [...this.logs]
  }
  
  // ログのクリア
  clearLogs() {
    this.logs = []
  }
  
  // エラー報告（本番環境用）
  async reportError(error: Error, context?: string, userId?: string) {
    // 本番環境でのエラー報告
    if (IS_PRODUCTION) {
      try {
        // TODO: エラー報告サービスへの送信
        // 例: Sentry, LogRocket, etc.
        const errorReport = {
          message: error.message,
          stack: error.stack,
          context,
          userId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
        
        // 現時点ではコンソールに出力
        console.error('Error Report:', errorReport)
      } catch (reportError) {
        // エラー報告自体が失敗した場合
        console.error('Failed to report error:', reportError)
      }
    }
  }
}

// シングルトンインスタンス
export const logger = new Logger()

// 開発環境用のグローバル公開
if (IS_DEVELOPMENT && typeof window !== 'undefined') {
  (window as any).__logger = logger
}