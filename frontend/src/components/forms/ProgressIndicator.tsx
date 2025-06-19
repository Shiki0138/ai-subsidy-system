'use client'

interface Step {
  id: number
  name: string
  description: string
  status: 'upcoming' | 'current' | 'completed'
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full py-6">
      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>進捗</span>
          <span>{currentStep}/5 ステップ</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ステップ一覧 */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isUpcoming = step.id > currentStep

          return (
            <div key={step.id} className="flex items-center relative z-10">
              {/* ステップアイコン */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-300
                ${isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 
                  isCurrent ? 'border-blue-600 bg-white text-blue-600 animate-pulse shadow-lg' : 
                  'border-gray-300 bg-white text-gray-400 hover:border-gray-400'}
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                ) : (
                  step.id
                )}
              </div>

              {/* ステップ情報 */}
              <div className="ml-3 min-w-0 flex-1">
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  isCurrent ? 'text-blue-600' : 
                  isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">
                  {step.description}
                </p>
              </div>

              {/* 接続線 */}
              {index < steps.length - 1 && (
                <div className={`
                  absolute top-5 -right-12 w-24 h-0.5 transition-colors duration-300
                  ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}