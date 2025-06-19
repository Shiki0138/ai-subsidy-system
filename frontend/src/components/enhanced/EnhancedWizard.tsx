'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { Alert } from '../ui/Alert'

export interface WizardStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<StepProps>
  validation?: (data: any) => { isValid: boolean; errors: string[] }
  estimatedTime?: number // 分
  optional?: boolean
}

export interface StepProps {
  data: any
  onChange: (data: any) => void
  onNext: () => void
  onPrevious: () => void
  isLoading?: boolean
  errors?: string[]
}

interface WizardContextType {
  currentStep: number
  totalSteps: number
  steps: WizardStep[]
  data: any
  isLoading: boolean
  errors: string[]
  completedSteps: string[]
  goToStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  updateData: (stepData: any) => void
  saveProgress: () => Promise<void>
  autoSaveEnabled: boolean
  lastSaved: Date | null
}

const WizardContext = createContext<WizardContextType | null>(null)

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}

export interface EnhancedWizardProps {
  steps: WizardStep[]
  initialData?: any
  onComplete: (data: any) => Promise<void>
  onSave?: (data: any) => Promise<void>
  autoSaveInterval?: number // 秒
  enableAutosave?: boolean
  allowBackNavigation?: boolean
  showProgress?: boolean
  showTimeEstimate?: boolean
  children?: React.ReactNode
}

export function EnhancedWizard({
  steps,
  initialData = {},
  onComplete,
  onSave,
  autoSaveInterval = 30,
  enableAutosave = true,
  allowBackNavigation = true,
  showProgress = true,
  showTimeEstimate = true
}: EnhancedWizardProps) {
  const router = useRouter()
  
  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [stepStartTime, setStepStartTime] = useState(Date.now())

  // Auto-save functionality
  const saveProgress = useCallback(async () => {
    if (!onSave || !hasUnsavedChanges) return

    setIsSaving(true)
    try {
      await onSave(data)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [data, hasUnsavedChanges, onSave])

  // Auto-save effect
  useEffect(() => {
    if (!enableAutosave) return

    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveProgress()
      }
    }, autoSaveInterval * 1000)

    return () => clearInterval(interval)
  }, [enableAutosave, autoSaveInterval, hasUnsavedChanges, saveProgress])

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Beforeunload handler for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '未保存の変更があります。ページを離れますか？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Step validation
  const validateCurrentStep = useCallback(() => {
    const step = steps[currentStep]
    if (!step.validation) return { isValid: true, errors: [] }

    return step.validation(data)
  }, [currentStep, data, steps])

  // Navigation functions
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    
    // Validate current step before moving forward
    if (stepIndex > currentStep) {
      const validation = validateCurrentStep()
      if (!validation.isValid) {
        setErrors(validation.errors)
        return
      }
    }

    setCurrentStep(stepIndex)
    setStepStartTime(Date.now())
    setErrors([])
  }, [currentStep, validateCurrentStep, steps.length])

  const nextStep = useCallback(async () => {
    const validation = validateCurrentStep()
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Mark current step as completed
    const currentStepId = steps[currentStep].id
    setCompletedSteps(prev => 
      prev.includes(currentStepId) ? prev : [...prev, currentStepId]
    )

    // Auto-save on step completion
    if (enableAutosave && hasUnsavedChanges) {
      await saveProgress()
    }

    if (currentStep === steps.length - 1) {
      // Final step - complete wizard
      setIsLoading(true)
      try {
        await onComplete(data)
      } catch (error) {
        setErrors(['申請の提出に失敗しました。もう一度お試しください。'])
        setIsLoading(false)
        return
      }
    } else {
      goToStep(currentStep + 1)
    }
  }, [
    currentStep, 
    validateCurrentStep, 
    steps, 
    data, 
    enableAutosave, 
    hasUnsavedChanges, 
    saveProgress, 
    onComplete, 
    goToStep
  ])

  const previousStep = useCallback(() => {
    if (allowBackNavigation && currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }, [allowBackNavigation, currentStep, goToStep])

  const updateData = useCallback((stepData: any) => {
    setData(prev => ({ ...prev, ...stepData }))
    setHasUnsavedChanges(true)
    setErrors([]) // Clear errors when data changes
  }, [])

  // Calculate time estimates
  const getTotalEstimatedTime = useCallback(() => {
    return steps.reduce((total, step) => total + (step.estimatedTime || 5), 0)
  }, [steps])

  const getRemainingEstimatedTime = useCallback(() => {
    return steps
      .slice(currentStep + 1)
      .reduce((total, step) => total + (step.estimatedTime || 5), 0)
  }, [steps, currentStep])

  const getProgressPercentage = useCallback(() => {
    return Math.round(((currentStep + 1) / steps.length) * 100)
  }, [currentStep, steps.length])

  // Context value
  const contextValue: WizardContextType = {
    currentStep,
    totalSteps: steps.length,
    steps,
    data,
    isLoading,
    errors,
    completedSteps,
    goToStep,
    nextStep,
    previousStep,
    updateData,
    saveProgress,
    autoSaveEnabled: enableAutosave,
    lastSaved
  }

  const CurrentStepComponent = steps[currentStep]?.component

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              補助金申請書作成
            </h1>
            
            {/* Auto-save indicator */}
            {enableAutosave && (
              <div className="flex items-center space-x-2 text-sm">
                {isSaving ? (
                  <>
                    <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
                    <span className="text-blue-600">保存中...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">
                      {new Date(lastSaved).toLocaleTimeString()}に保存済み
                    </span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600">未保存の変更があります</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  ステップ {currentStep + 1} / {steps.length}: {steps[currentStep]?.title}
                </span>
                {showTimeEstimate && (
                  <span>
                    あと約{getRemainingEstimatedTime()}分で完了
                  </span>
                )}
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2"
                showLabel={false}
              />
            </div>
          )}

          {/* Step navigation */}
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                disabled={index > currentStep + 1 || isLoading}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === currentStep
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-100 text-green-700 hover:bg-green-150'
                    : index < currentStep
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-150'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {completedSteps.includes(step.id) ? (
                    <CheckCircleIcon className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span>{step.title}</span>
                {step.optional && (
                  <span className="text-xs text-gray-500">(任意)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error display */}
        {errors.length > 0 && (
          <Alert variant="error" className="mb-6">
            <div>
              <h4 className="font-medium mb-2">入力内容をご確認ください</h4>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep]?.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {steps[currentStep]?.description}
            </p>
            {steps[currentStep]?.estimatedTime && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <ClockIcon className="h-4 w-4" />
                <span>推定時間: {steps[currentStep].estimatedTime}分</span>
              </div>
            )}
          </div>

          {CurrentStepComponent && (
            <CurrentStepComponent
              data={data}
              onChange={updateData}
              onNext={nextStep}
              onPrevious={previousStep}
              isLoading={isLoading}
              errors={errors}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <div>
            {allowBackNavigation && currentStep > 0 && (
              <Button
                variant="secondary"
                onClick={previousStep}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>戻る</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Save button */}
            {onSave && hasUnsavedChanges && (
              <Button
                variant="secondary"
                onClick={saveProgress}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </Button>
            )}

            {/* Next/Complete button */}
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <ClockIcon className="h-4 w-4 animate-spin" />
                  <span>処理中...</span>
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>申請書を提出</span>
                </>
              ) : (
                <>
                  <span>次へ</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            作業内容は自動的に保存されます。いつでも中断・再開できます。
          </p>
          {showTimeEstimate && (
            <p className="text-xs text-gray-400 mt-1">
              作業開始から{Math.floor(timeSpent / 60)}分経過
              {getRemainingEstimatedTime() > 0 && (
                <> • あと約{getRemainingEstimatedTime()}分で完了予定</>
              )}
            </p>
          )}
        </div>
      </div>
    </WizardContext.Provider>
  )
}

// Helper component for step content
export function StepContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}

// Helper component for form sections within steps
export function StepSection({ 
  title, 
  description, 
  children, 
  required = false 
}: {
  title: string
  description?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          {title}
          {required && (
            <span className="ml-2 text-red-500 text-sm">*必須</span>
          )}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}