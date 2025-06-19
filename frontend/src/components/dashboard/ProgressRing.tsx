'use client'

import { useState, useEffect } from 'react'

interface ProgressRingProps {
  progress: number // 0-100の進捗率
  size?: 'sm' | 'md' | 'lg'
  color?: string
  animated?: boolean
  label?: string
  showPercentage?: boolean
}

export function ProgressRing({ 
  progress, 
  size = 'md', 
  color = 'text-brand-600', 
  animated = true,
  label,
  showPercentage = true
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // サイズ設定
  const sizeConfig = {
    sm: { radius: 35, strokeWidth: 6, size: 80 },
    md: { radius: 45, strokeWidth: 8, size: 100 },
    lg: { radius: 60, strokeWidth: 10, size: 130 }
  }

  const config = sizeConfig[size]
  const circumference = 2 * Math.PI * config.radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  // アニメーション効果
  useEffect(() => {
    if (!animated) {
      setAnimatedProgress(progress)
      return
    }

    const duration = 1500 // 1.5秒
    const steps = 60
    const stepDuration = duration / steps
    const stepProgress = progress / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      setAnimatedProgress(Math.min(stepProgress * currentStep, progress))

      if (currentStep >= steps) {
        setAnimatedProgress(progress)
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [progress, animated])

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          className="transform -rotate-90"
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
        >
          {/* 背景円 */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          
          {/* 進捗円 */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className={color}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: animated ? 'stroke-dashoffset 0.1s ease-out' : 'none'
            }}
          />
        </svg>
        
        {/* 中央のテキスト */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {showPercentage && (
              <div className={`font-bold tabular-nums ${
                size === 'sm' ? 'text-lg' : 
                size === 'md' ? 'text-2xl' : 
                'text-3xl'
              }`}>
                {Math.round(animatedProgress)}%
              </div>
            )}
            {label && (
              <div className={`text-gray-600 ${
                size === 'sm' ? 'text-xs' : 
                size === 'md' ? 'text-sm' : 
                'text-base'
              }`}>
                {label}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 複数の進捗リングを表示するコンポーネント
interface MultiProgressRingProps {
  data: Array<{
    label: string
    value: number
    total: number
    color: string
  }>
  size?: 'sm' | 'md' | 'lg'
}

export function MultiProgressRing({ data, size = 'md' }: MultiProgressRingProps) {
  return (
    <div className="flex flex-col space-y-6">
      {data.map((item, index) => {
        const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0
        
        return (
          <div key={index} className="flex items-center space-x-4">
            <ProgressRing
              progress={percentage}
              size={size}
              color={item.color}
              label={item.label}
              showPercentage={false}
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <span className="text-sm text-gray-600">{item.value}/{item.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ease-out`}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color.includes('text-') ? 
                      `var(--color-${item.color.split('-')[1]}-${item.color.split('-')[2]})` : 
                      item.color
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{Math.round(percentage)}%</span>
                <span>{item.total - item.value} 残り</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}