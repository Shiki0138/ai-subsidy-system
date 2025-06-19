'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  SparklesIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  LightBulbIcon,
  ClipboardDocumentIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

export interface AITextAssistantProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  minLength?: number
  fieldType?: 'business_description' | 'project_summary' | 'objectives' | 'background' | 'general'
  label?: string
  className?: string
  disabled?: boolean
  showSuggestions?: boolean
  customPrompt?: string
}

interface AIResponse {
  success: boolean
  generatedText?: string
  suggestions?: string[]
  error?: string
}

export function AITextAssistant({
  value,
  onChange,
  placeholder = "AIアシスタントを使用して文章を生成することができます",
  maxLength = 1000,
  minLength = 10,
  fieldType = 'general',
  label,
  className,
  disabled = false,
  showSuggestions = true,
  customPrompt
}: AITextAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [generatedText, setGeneratedText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tone, setTone] = useState<'formal' | 'casual' | 'professional'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // フィールドタイプ別のプロンプトテンプレート
  const fieldPrompts = {
    business_description: "事業内容について、以下の要点から詳細で分かりやすい事業説明文を作成してください：",
    project_summary: "プロジェクトの概要について、以下の要点から具体的で魅力的なプロジェクト要約を作成してください：",
    objectives: "事業目標について、以下の要点から明確で達成可能な目標文を作成してください：",
    background: "事業背景について、以下の要点から説得力のある背景説明を作成してください：",
    general: "以下の要点から、適切で分かりやすい文章を作成してください："
  }

  // AI文章生成API呼び出し
  const generateText = async (input: string): Promise<AIResponse> => {
    try {
      setIsGenerating(true)
      
      const prompt = customPrompt || fieldPrompts[fieldType]
      const requestBody = {
        prompt: `${prompt}\n\n要点：${input}\n\n条件：\n- 文体：${tone === 'formal' ? '丁寧語・敬語' : tone === 'casual' ? 'です・ます調' : 'ビジネス文書調'}\n- 長さ：${length === 'short' ? '100文字程度' : length === 'medium' ? '200-300文字程度' : '400-500文字程度'}\n- 補助金申請書に適した内容にしてください`,
        fieldType,
        tone,
        length,
        maxLength
      }

      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('AI文章生成に失敗しました')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'エラーが発生しました'
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 文章生成の実行
  const handleGenerate = async () => {
    if (!userInput.trim()) return

    const result = await generateText(userInput.trim())
    
    if (result.success && result.generatedText) {
      setGeneratedText(result.generatedText)
      setIsEditing(true)
      if (result.suggestions) {
        setAiSuggestions(result.suggestions)
      }
    } else {
      // エラー表示（トースト通知など）
      console.error('AI生成エラー:', result.error)
    }
  }

  // 生成されたテキストを適用
  const handleApplyText = () => {
    onChange(generatedText)
    setIsExpanded(false)
    setGeneratedText('')
    setUserInput('')
    setIsEditing(false)
  }

  // リセット
  const handleReset = () => {
    setGeneratedText('')
    setUserInput('')
    setIsEditing(false)
    setAiSuggestions([])
  }

  // 提案文の適用
  const handleApplySuggestion = (suggestion: string) => {
    setUserInput(suggestion)
  }

  // 文字数カウンター
  const getCharacterCount = (text: string) => {
    return text.length
  }

  // 文字数に基づく色
  const getCountColor = (count: number) => {
    if (count > maxLength) return 'text-red-500'
    if (count > maxLength * 0.8) return 'text-yellow-500'
    return 'text-gray-500'
  }

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* メインテキストエリア */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            "w-full min-h-[120px] p-3 pr-20 border border-gray-300 rounded-lg",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            "resize-none transition-all duration-200"
          )}
        />
        
        {/* AIアシスタントボタン */}
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="AIアシスタント"
          >
            <SparklesIcon className="h-4 w-4 text-blue-500" />
          </Button>
        </div>

        {/* 文字数カウンター */}
        <div className="absolute bottom-3 right-3 text-xs">
          <span className={getCountColor(getCharacterCount(value))}>
            {getCharacterCount(value)}/{maxLength}
          </span>
        </div>
      </div>

      {/* AI支援パネル */}
      {isExpanded && (
        <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">AIテキストアシスタント</h3>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="h-6 w-6 p-0"
                title="詳細設定"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 詳細設定 */}
          {showAdvanced && (
            <div className="mb-4 p-3 bg-white rounded border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    文体
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="professional">ビジネス文書調</option>
                    <option value="formal">丁寧語・敬語</option>
                    <option value="casual">です・ます調</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    長さ
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="short">短文 (100文字程度)</option>
                    <option value="medium">中文 (200-300文字)</option>
                    <option value="long">長文 (400-500文字)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 提案文表示 */}
          {showSuggestions && aiSuggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <LightBulbIcon className="h-4 w-4 mr-1" />
                入力の提案
              </h4>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 要点入力エリア */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              要点・キーワードを入力 (箇条書きや短文で)
            </label>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="例：&#10;・AI技術を活用したシステム開発&#10;・業務効率化により20%のコスト削減&#10;・2024年4月開始予定"
              className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
          </div>

          {/* 生成ボタン */}
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={handleGenerate}
              disabled={!userInput.trim() || isGenerating}
              className="flex items-center space-x-2"
            >
              {isGenerating ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              <span>{isGenerating ? '生成中...' : '文章を生成'}</span>
            </Button>
            
            {(userInput || generatedText) && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-gray-500"
              >
                リセット
              </Button>
            )}
          </div>

          {/* 生成された文章の表示・編集 */}
          {generatedText && (
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">生成された文章</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-6 text-xs"
                  >
                    {isEditing ? (
                      <>
                        <CheckIcon className="h-3 w-3 mr-1" />
                        完了
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-3 w-3 mr-1" />
                        編集
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isEditing ? (
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="w-full h-24 p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                  {generatedText}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-3">
                <span className={cn(
                  "text-xs",
                  getCountColor(getCharacterCount(generatedText))
                )}>
                  {getCharacterCount(generatedText)}文字
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedText)}
                    className="h-6 text-xs"
                  >
                    <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                    コピー
                  </Button>
                  <Button
                    onClick={handleApplyText}
                    size="sm"
                    className="h-6 text-xs"
                  >
                    <CheckIcon className="h-3 w-3 mr-1" />
                    適用
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 使いやすいプリセット版
export function AIBusinessDescriptionField(props: Omit<AITextAssistantProps, 'fieldType'>) {
  return <AITextAssistant {...props} fieldType="business_description" />
}

export function AIProjectSummaryField(props: Omit<AITextAssistantProps, 'fieldType'>) {
  return <AITextAssistant {...props} fieldType="project_summary" />
}

export function AIObjectivesField(props: Omit<AITextAssistantProps, 'fieldType'>) {
  return <AITextAssistant {...props} fieldType="objectives" />
}

export function AIBackgroundField(props: Omit<AITextAssistantProps, 'fieldType'>) {
  return <AITextAssistant {...props} fieldType="background" />
}