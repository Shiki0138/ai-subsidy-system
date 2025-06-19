'use client'

import React, { useState } from 'react'
import { 
  AITextAssistant, 
  AIBusinessDescriptionField,
  AIProjectSummaryField,
  AIObjectivesField,
  AIBackgroundField 
} from '../../components/ai/AITextAssistant'

export default function TestAIPage() {
  const [businessDescription, setBusinessDescription] = useState('')
  const [projectSummary, setProjectSummary] = useState('')
  const [objectives, setObjectives] = useState('')
  const [background, setBackground] = useState('')
  const [generalText, setGeneralText] = useState('')

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI文章支援機能テストページ
        </h1>
        <p className="text-gray-600">
          各入力フィールドでAI文章生成機能をテストできます。
        </p>
      </div>

      <div className="space-y-8">
        {/* 事業内容説明 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            事業内容説明
          </h2>
          <AIBusinessDescriptionField
            value={businessDescription}
            onChange={setBusinessDescription}
            label="事業内容の詳細"
            placeholder="事業内容について詳しく説明してください..."
            maxLength={500}
            className="mb-4"
          />
          {businessDescription && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">生成された文章:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{businessDescription}</p>
            </div>
          )}
        </div>

        {/* プロジェクト概要 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            プロジェクト概要
          </h2>
          <AIProjectSummaryField
            value={projectSummary}
            onChange={setProjectSummary}
            label="プロジェクトの要約"
            placeholder="プロジェクトの概要を入力してください..."
            maxLength={400}
            className="mb-4"
          />
          {projectSummary && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">生成された文章:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{projectSummary}</p>
            </div>
          )}
        </div>

        {/* 事業目標 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            事業目標
          </h2>
          <AIObjectivesField
            value={objectives}
            onChange={setObjectives}
            label="具体的な目標"
            placeholder="達成したい目標を入力してください..."
            maxLength={300}
            className="mb-4"
          />
          {objectives && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">生成された文章:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{objectives}</p>
            </div>
          )}
        </div>

        {/* 事業背景 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            事業背景
          </h2>
          <AIBackgroundField
            value={background}
            onChange={setBackground}
            label="事業の背景・動機"
            placeholder="なぜこの事業を始めるのか、背景を入力してください..."
            maxLength={600}
            className="mb-4"
          />
          {background && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">生成された文章:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{background}</p>
            </div>
          )}
        </div>

        {/* 汎用フィールド */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            汎用テキストフィールド
          </h2>
          <AITextAssistant
            value={generalText}
            onChange={setGeneralText}
            label="自由記述欄"
            placeholder="任意の内容について文章を生成できます..."
            maxLength={800}
            fieldType="general"
            showSuggestions={true}
            customPrompt="以下の内容について、分かりやすく整理された文章を作成してください："
            className="mb-4"
          />
          {generalText && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">生成された文章:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{generalText}</p>
            </div>
          )}
        </div>

        {/* 使用方法の説明 */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-3 text-blue-900">
            使用方法
          </h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. 各フィールドの右上にある ✨ ボタンをクリックしてAI支援パネルを開きます</p>
            <p>2. 「要点・キーワード」欄に箇条書きや短文で内容を入力します</p>
            <p>3. 必要に応じて詳細設定（文体・長さ）を調整します</p>
            <p>4. 「文章を生成」ボタンをクリックします</p>
            <p>5. 生成された文章を編集し、「適用」ボタンで本文に反映します</p>
          </div>
        </div>

        {/* 入力例 */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h2 className="text-lg font-semibold mb-3 text-green-900">
            入力例
          </h2>
          <div className="text-sm text-green-800 space-y-3">
            <div>
              <h4 className="font-medium">事業内容の場合:</h4>
              <p className="ml-4">・AI技術を活用したシステム開発<br/>・業務効率化により20%のコスト削減<br/>・中小企業向けのクラウドサービス提供</p>
            </div>
            <div>
              <h4 className="font-medium">プロジェクト概要の場合:</h4>
              <p className="ml-4">・期間：2024年4月〜2025年3月<br/>・予算：500万円<br/>・チーム：エンジニア3名、デザイナー1名</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}