'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline'

interface StatsCardConfig {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'info'
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    period: string
  }
  action?: {
    label: string
    href: string
  }
}

interface DashboardStats {
  totalApplications: number
  inProgress: number
  completed: number
  approved: number
  totalSavings?: number
  timeReduction?: number
  successRate?: number
}

interface StatsGridProps {
  stats: DashboardStats
  isLoading?: boolean
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const [animatedStats, setAnimatedStats] = useState<DashboardStats>({
    totalApplications: 0,
    inProgress: 0,
    completed: 0,
    approved: 0
  })

  // アニメーション効果で数値を徐々に増やす
  useEffect(() => {
    if (isLoading) return

    const duration = 1000 // 1秒
    const steps = 30
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        totalApplications: Math.floor(stats.totalApplications * progress),
        inProgress: Math.floor(stats.inProgress * progress),
        completed: Math.floor(stats.completed * progress),
        approved: Math.floor(stats.approved * progress)
      })

      if (currentStep >= steps) {
        setAnimatedStats(stats)
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [stats, isLoading])

  // 統計カードの設定（拡張版）
  const statsCards: StatsCardConfig[] = [
    {
      title: '総申請書数',
      value: animatedStats.totalApplications,
      icon: DocumentTextIcon,
      color: 'primary',
      trend: {
        value: 2,
        direction: 'up',
        period: '今月'
      },
      action: {
        label: '詳細を見る',
        href: '/dashboard/applications'
      }
    },
    {
      title: '完了済み',
      value: animatedStats.completed,
      icon: CheckCircleIcon,
      color: 'success',
      trend: {
        value: 1,
        direction: 'up',
        period: '今週'
      }
    },
    {
      title: '作成中',
      value: animatedStats.inProgress,
      icon: ClockIcon,
      color: 'warning'
    },
    {
      title: '成功率',
      value: stats.successRate ? `${stats.successRate}%` : stats.totalApplications > 0 ? `${Math.round((stats.approved / stats.totalApplications) * 100)}%` : '85%',
      icon: ArrowTrendingUpIcon,
      color: 'info',
      trend: {
        value: 5,
        direction: 'up',
        period: '前回比'
      }
    }
  ]

  // 拡張統計カード（効果・削減実績）
  const extendedCards: StatsCardConfig[] = stats.totalSavings ? [
    {
      title: '削減効果',
      value: `${(stats.totalSavings / 10000).toFixed(0)}万円`,
      icon: ArrowTrendingUpIcon,
      color: 'success',
      trend: {
        value: 15,
        direction: 'up',
        period: '累計'
      }
    },
    {
      title: '時間短縮',
      value: `${stats.timeReduction || 85}%`,
      icon: ClockIcon,
      color: 'info',
      trend: {
        value: 10,
        direction: 'up',
        period: '平均'
      }
    }
  ] : []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card p-6 animate-pulse">
            <div className="flex items-center">
              <div className="bg-gray-200 rounded-lg p-3 w-12 h-12"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const allCards = [...statsCards, ...extendedCards]

  return (
    <div className="space-y-6">
      {/* メイン統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatsCard key={index} config={card} />
        ))}
      </div>
      
      {/* 拡張統計カード（効果実績） */}
      {extendedCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {extendedCards.map((card, index) => (
            <StatsCard key={`extended-${index}`} config={card} />
          ))}
        </div>
      )}
    </div>
  )
}

interface StatsCardProps {
  config: StatsCardConfig
}

function StatsCard({ config }: StatsCardProps) {
  const { title, value, icon: Icon, color, trend, action } = config

  const getColorClasses = (color: string) => {
    const colorMap = {
      primary: {
        bg: 'bg-brand-100',
        icon: 'text-brand-600',
        trend: 'text-brand-600'
      },
      success: {
        bg: 'bg-success-100',
        icon: 'text-success-600',
        trend: 'text-success-600'
      },
      warning: {
        bg: 'bg-warning-100',
        icon: 'text-warning-600',
        trend: 'text-warning-600'
      },
      info: {
        bg: 'bg-purple-100',
        icon: 'text-purple-600',
        trend: 'text-purple-600'
      }
    }
    return colorMap[color] || colorMap.primary
  }

  const colors = getColorClasses(color)

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return ArrowUpIcon
      case 'down':
        return ArrowDownIcon
      default:
        return MinusIcon
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-success-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="card p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`${colors.bg} rounded-lg p-3 group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {value}
            </p>
          </div>
        </div>
      </div>

      {/* トレンド表示 */}
      {trend && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {(() => {
              const TrendIcon = getTrendIcon(trend.direction)
              return (
                <TrendIcon className={`h-4 w-4 mr-1 ${getTrendColor(trend.direction)}`} />
              )
            })()}
            <span className={`text-sm font-medium ${getTrendColor(trend.direction)}`}>
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.value}
            </span>
          </div>
          <span className="text-xs text-gray-500">{trend.period}</span>
        </div>
      )}

      {/* アクションボタン */}
      {action && (
        <div className="mt-4">
          <a
            href={action.href}
            className={`text-xs font-medium ${colors.trend} hover:underline transition-colors duration-200`}
          >
            {action.label} →
          </a>
        </div>
      )}
    </div>
  )
}