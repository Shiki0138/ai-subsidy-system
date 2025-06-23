'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  SparklesIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface AutoFillSuggestion {
  fieldName: string;
  fieldPath: string;
  suggestedValue: string;
  currentValue: string;
  confidence: number;
  reasoning: string;
  source: 'ai' | 'database' | 'external_api';
}

interface EnhancedAutoFillFormProps {
  formData: Record<string, any>;
  onFormUpdate: (data: Record<string, any>) => void;
  applicationId?: string;
  subsidyType: string;
}

export default function EnhancedAutoFillForm({
  formData,
  onFormUpdate,
  applicationId,
  subsidyType
}: EnhancedAutoFillFormProps) {
  const [suggestions, setSuggestions] = useState<AutoFillSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'suggestions' | 'diff' | 'preview'>('suggestions');
  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
  
  const { register, watch, setValue, getValues } = useForm({
    defaultValues: formData
  });

  const watchedValues = watch();

  // 自動入力提案の取得
  const fetchSuggestions = async () => {
    if (!formData.companyInfo?.companyName) {
      toast.error('会社名を入力してから提案を取得してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auto-fill/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyInfo.companyName,
          subsidyType: subsidyType,
          currentData: formData,
          applicationId: applicationId
        })
      });

      if (!response.ok) throw new Error('提案の取得に失敗しました');

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
      // 高信頼度の提案を自動選択
      const highConfidenceSuggestions = data.suggestions
        .filter((s: AutoFillSuggestion) => s.confidence >= 0.8)
        .map((s: AutoFillSuggestion) => s.fieldPath);
      
      setSelectedSuggestions(new Set(highConfidenceSuggestions));
      
      toast.success(`${data.suggestions.length}件の入力提案を取得しました`);
    } catch (error: any) {
      toast.error(error.message || '提案の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 提案の適用
  const applySuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      toast.error('適用する提案を選択してください');
      return;
    }

    setIsApplying(true);
    const selectedItems = suggestions.filter(s => selectedSuggestions.has(s.fieldPath));
    
    // アニメーション用キューを作成
    const animationOrder = [...selectedSuggestions];
    setAnimationQueue(animationOrder);

    try {
      // 段階的に値を適用（アニメーション効果）
      for (let i = 0; i < selectedItems.length; i++) {
        const suggestion = selectedItems[i];
        
        // アニメーション遅延
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // フォームに値を設定
        setValue(suggestion.fieldPath, suggestion.suggestedValue);
        
        // アニメーション完了をマーク
        setAnimationQueue(prev => prev.filter(path => path !== suggestion.fieldPath));
      }

      // 最終的なフォームデータを更新
      const updatedData = { ...formData };
      selectedItems.forEach(suggestion => {
        const keys = suggestion.fieldPath.split('.');
        let current = updatedData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = suggestion.suggestedValue;
      });

      onFormUpdate(updatedData);
      
      toast.success(`${selectedItems.length}件の提案を適用しました`);
      
      // 適用後は提案をクリア
      setSuggestions(prev => prev.filter(s => !selectedSuggestions.has(s.fieldPath)));
      setSelectedSuggestions(new Set());
      
    } catch (error: any) {
      toast.error('提案の適用に失敗しました');
    } finally {
      setIsApplying(false);
      setAnimationQueue([]);
    }
  };

  // 提案の選択切り替え
  const toggleSuggestion = (fieldPath: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldPath)) {
        newSet.delete(fieldPath);
      } else {
        newSet.add(fieldPath);
      }
      return newSet;
    });
  };

  // 信頼度に基づくバッジ色
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return { variant: 'success', text: '高信頼度' };
    if (confidence >= 0.7) return { variant: 'primary', text: '中信頼度' };
    return { variant: 'warning', text: '低信頼度' };
  };

  // ソースアイコン
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai': return <SparklesIcon className="h-4 w-4" />;
      case 'database': return <DocumentTextIcon className="h-4 w-4" />;
      case 'external_api': return <ArrowPathIcon className="h-4 w-4" />;
      default: return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI自動入力支援
              </h2>
              <p className="text-sm text-gray-600">
                企業情報に基づいて申請書の項目を自動入力します
              </p>
            </div>
          </div>
          
          <Button
            onClick={fetchSuggestions}
            disabled={isLoading || !formData.companyInfo?.companyName}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                提案を取得
              </>
            )}
          </Button>
        </div>

        {/* 統計情報 */}
        {suggestions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{suggestions.length}</p>
              <p className="text-xs text-gray-600">総提案数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{selectedSuggestions.size}</p>
              <p className="text-xs text-gray-600">選択中</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length * 100)}%
              </p>
              <p className="text-xs text-gray-600">平均信頼度</p>
            </div>
          </div>
        )}
      </div>

      {/* ビューモード切り替え */}
      {suggestions.length > 0 && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('suggestions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'suggestions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            提案一覧
          </button>
          <button
            onClick={() => setViewMode('diff')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'diff'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            差分表示
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            プレビュー
          </button>
        </div>
      )}

      {/* メインコンテンツ */}
      <AnimatePresence mode="wait">
        {viewMode === 'suggestions' && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {suggestions.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  提案がありません
                </h3>
                <p className="text-gray-600">
                  「提案を取得」ボタンをクリックして、自動入力提案を生成してください
                </p>
              </div>
            ) : (
              <>
                {/* 一括操作 */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedSuggestions(new Set(suggestions.map(s => s.fieldPath)))}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      すべて選択
                    </button>
                    <button
                      onClick={() => setSelectedSuggestions(new Set())}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      選択を解除
                    </button>
                    <button
                      onClick={() => {
                        const highConfidence = suggestions
                          .filter(s => s.confidence >= 0.8)
                          .map(s => s.fieldPath);
                        setSelectedSuggestions(new Set(highConfidence));
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      高信頼度のみ
                    </button>
                  </div>
                  
                  <Button
                    onClick={applySuggestions}
                    disabled={selectedSuggestions.size === 0 || isApplying}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApplying ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        適用中...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        {selectedSuggestions.size}件を適用
                      </>
                    )}
                  </Button>
                </div>

                {/* 提案リスト */}
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => {
                    const isSelected = selectedSuggestions.has(suggestion.fieldPath);
                    const isAnimating = animationQueue.includes(suggestion.fieldPath);
                    const confidenceBadge = getConfidenceBadge(suggestion.confidence);

                    return (
                      <motion.div
                        key={suggestion.fieldPath}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          scale: isAnimating ? [1, 1.02, 1] : 1,
                          borderColor: isAnimating ? '#10b981' : undefined
                        }}
                        transition={{ 
                          delay: index * 0.1,
                          scale: { duration: 0.3 },
                          borderColor: { duration: 0.3 }
                        }}
                        className={`
                          border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                          ${isAnimating ? 'border-green-500 bg-green-50' : ''}
                        `}
                        onClick={() => toggleSuggestion(suggestion.fieldPath)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {suggestion.fieldName}
                              </h4>
                              <Badge 
                                variant={confidenceBadge.variant as any}
                                size="sm"
                              >
                                {confidenceBadge.text}
                              </Badge>
                              <div className="flex items-center text-gray-500">
                                {getSourceIcon(suggestion.source)}
                                <span className="ml-1 text-xs">
                                  {suggestion.source === 'ai' ? 'AI' : 
                                   suggestion.source === 'database' ? 'DB' : 'API'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">現在の値</p>
                                <p className="text-sm bg-gray-100 rounded px-2 py-1">
                                  {suggestion.currentValue || '（未入力）'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">提案値</p>
                                <p className="text-sm bg-green-100 rounded px-2 py-1">
                                  {suggestion.suggestedValue}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600">
                              {suggestion.reasoning}
                            </p>
                          </div>
                          
                          <div className="ml-4 flex-shrink-0">
                            <div className={`
                              w-5 h-5 rounded border-2 flex items-center justify-center
                              ${isSelected 
                                ? 'bg-blue-600 border-blue-600' 
                                : 'border-gray-300'
                              }
                            `}>
                              {isSelected && (
                                <CheckCircleIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}

        {viewMode === 'diff' && (
          <motion.div
            key="diff"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              変更内容の確認
            </h3>
            
            {selectedSuggestions.size === 0 ? (
              <p className="text-gray-600 text-center py-8">
                適用する提案を選択してください
              </p>
            ) : (
              <div className="space-y-4">
                {suggestions
                  .filter(s => selectedSuggestions.has(s.fieldPath))
                  .map(suggestion => (
                    <div key={suggestion.fieldPath} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {suggestion.fieldName}
                      </h4>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="flex">
                          <div className="flex-1">
                            <span className="text-red-600 line-through">
                              {suggestion.currentValue || '（未入力）'}
                            </span>
                          </div>
                          <div className="mx-4 text-gray-400">→</div>
                          <div className="flex-1">
                            <span className="text-green-600 font-medium">
                              {suggestion.suggestedValue}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              適用後のプレビュー
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    ...watchedValues,
                    ...Object.fromEntries(
                      suggestions
                        .filter(s => selectedSuggestions.has(s.fieldPath))
                        .map(s => [s.fieldPath, s.suggestedValue])
                    )
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}