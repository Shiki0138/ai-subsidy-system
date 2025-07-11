/**
 * ステップインジケーターコンポーネント
 * 申請フローの進捗を表示
 */

import { CheckCircle } from 'lucide-react'

interface Step {
  number: number
  title: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* ステップサークル */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${isCurrent ? 'bg-blue-600 text-white' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-600' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                
                {/* ステップ情報 */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                  <p className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>

              {/* 接続線 */}
              {!isLast && (
                <div className="flex-1 mx-2">
                  <div
                    className={`h-1 ${
                      step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}