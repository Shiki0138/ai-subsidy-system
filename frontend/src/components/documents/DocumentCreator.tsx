'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  SparklesIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business_plan' | 'budget' | 'estimate' | 'report' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  requiredFields: TemplateField[];
  previewUrl?: string;
  isPopular?: boolean;
}

interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  description?: string;
  options?: string[]; // for select type
  aiSuggestionEnabled?: boolean;
}

interface DocumentData {
  templateId: string;
  fields: Record<string, any>;
  generatedContent?: string;
  status: 'draft' | 'generating' | 'completed' | 'error';
}

interface DocumentCreatorProps {
  applicationId?: string;
  companyInfo?: any;
  onComplete?: (document: DocumentData) => void;
}

export default function DocumentCreator({
  applicationId,
  companyInfo,
  onComplete
}: DocumentCreatorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'templates' | 'form' | 'preview'>('templates');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // TODO: 実際のAPI呼び出し
      const mockTemplates: DocumentTemplate[] = [
        {
          id: 'business_plan_basic',
          name: '事業計画書（基本版）',
          description: '補助金申請に必要な基本的な事業計画書を作成します',
          category: 'business_plan',
          difficulty: 'easy',
          estimatedTime: 15,
          isPopular: true,
          requiredFields: [
            {
              id: 'company_overview',
              name: 'company_overview',
              type: 'textarea',
              label: '会社概要',
              placeholder: '当社の事業内容、設立年、従業員数等を記載',
              required: true,
              aiSuggestionEnabled: true
            },
            {
              id: 'business_purpose',
              name: 'business_purpose',
              type: 'textarea',
              label: '事業の目的',
              placeholder: '今回の事業で達成したい目的を記載',
              required: true,
              aiSuggestionEnabled: true
            },
            {
              id: 'target_market',
              name: 'target_market',
              type: 'textarea',
              label: 'ターゲット市場',
              placeholder: '想定する顧客層や市場について記載',
              required: true,
              aiSuggestionEnabled: true
            },
            {
              id: 'budget',
              name: 'budget',
              type: 'number',
              label: '総予算（円）',
              placeholder: '0',
              required: true
            },
            {
              id: 'implementation_period',
              name: 'implementation_period',
              type: 'text',
              label: '実施期間',
              placeholder: '例: 2025年4月〜2026年3月',
              required: true
            }
          ]
        },
        {
          id: 'budget_detailed',
          name: '詳細予算書',
          description: '項目別の詳細な予算計画書を作成します',
          category: 'budget',
          difficulty: 'medium',
          estimatedTime: 25,
          requiredFields: [
            {
              id: 'personnel_cost',
              name: 'personnel_cost',
              type: 'number',
              label: '人件費（円）',
              required: true
            },
            {
              id: 'equipment_cost',
              name: 'equipment_cost',
              type: 'number',
              label: '設備費（円）',
              required: true
            },
            {
              id: 'material_cost',
              name: 'material_cost',
              type: 'number',
              label: '材料費（円）',
              required: true
            },
            {
              id: 'other_cost',
              name: 'other_cost',
              type: 'number',
              label: 'その他経費（円）',
              required: true
            },
            {
              id: 'cost_breakdown',
              name: 'cost_breakdown',
              type: 'textarea',
              label: '費用の内訳説明',
              placeholder: '各費用項目の詳細な内訳を記載',
              required: true,
              aiSuggestionEnabled: true
            }
          ]
        },
        {
          id: 'estimate_standard',
          name: '見積書（標準版）',
          description: '機器購入や工事費用の見積書を作成します',
          category: 'estimate',
          difficulty: 'easy',
          estimatedTime: 10,
          isPopular: true,
          requiredFields: [
            {
              id: 'client_name',
              name: 'client_name',
              type: 'text',
              label: '宛先',
              placeholder: '○○株式会社 御中',
              required: true
            },
            {
              id: 'project_name',
              name: 'project_name',
              type: 'text',
              label: '件名',
              placeholder: '例: システム導入費用一式',
              required: true
            },
            {
              id: 'items',
              name: 'items',
              type: 'textarea',
              label: '見積項目',
              placeholder: '項目名, 数量, 単価の形式で記載',
              required: true
            },
            {
              id: 'delivery_date',
              name: 'delivery_date',
              type: 'date',
              label: '納期',
              required: true
            },
            {
              id: 'payment_terms',
              name: 'payment_terms',
              type: 'select',
              label: '支払条件',
              options: ['月末締め翌月末払い', '納品時一括払い', '分割払い（2回）', 'その他'],
              required: true
            }
          ]
        },
        {
          id: 'progress_report',
          name: '進捗報告書',
          description: 'プロジェクトの進捗状況を報告する書類を作成します',
          category: 'report',
          difficulty: 'medium',
          estimatedTime: 20,
          requiredFields: [
            {
              id: 'report_period',
              name: 'report_period',
              type: 'text',
              label: '報告対象期間',
              placeholder: '例: 2025年1月〜3月',
              required: true
            },
            {
              id: 'achievements',
              name: 'achievements',
              type: 'textarea',
              label: '主な成果・達成事項',
              placeholder: '期間中に達成した主要な成果を記載',
              required: true,
              aiSuggestionEnabled: true
            },
            {
              id: 'challenges',
              name: 'challenges',
              type: 'textarea',
              label: '課題・問題点',
              placeholder: '発生した課題や問題点を記載',
              required: false,
              aiSuggestionEnabled: true
            },
            {
              id: 'next_actions',
              name: 'next_actions',
              type: 'textarea',
              label: '今後の予定',
              placeholder: '次期の主要な予定や計画を記載',
              required: true,
              aiSuggestionEnabled: true
            },
            {
              id: 'progress_percentage',
              name: 'progress_percentage',
              type: 'number',
              label: '全体進捗率（%）',
              placeholder: '0-100',
              required: true
            }
          ]
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('テンプレートの取得に失敗しました');
    }
  };

  const selectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setDocumentData({
      templateId: template.id,
      fields: {},
      status: 'draft'
    });
    setCurrentView('form');
  };

  const updateField = (fieldId: string, value: any) => {
    if (!documentData) return;

    setDocumentData(prev => ({
      ...prev!,
      fields: {
        ...prev!.fields,
        [fieldId]: value
      }
    }));
  };

  const getAISuggestion = async (field: TemplateField) => {
    try {
      toast('AI提案を生成中...', { icon: '🤖' });
      
      // TODO: 実際のAPI呼び出し
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockSuggestions: Record<string, string> = {
        company_overview: `${companyInfo?.companyName || '当社'}は、${new Date().getFullYear() - 5}年に設立された、革新的な技術ソリューションを提供する企業です。従業員数${Math.floor(Math.random() * 50) + 10}名で、主に中小企業向けのDXソリューションを展開しています。`,
        business_purpose: '業務効率化とコスト削減を目的とし、最新のAI技術を活用したシステム導入により、生産性を30%向上させることを目指します。',
        target_market: '従業員規模50-200名の製造業・サービス業を主なターゲットとし、特にDX推進を課題とする企業に対してソリューションを提供します。',
        cost_breakdown: '人件費には専門エンジニア3名の6ヶ月分の工数を含み、設備費はサーバー機器とソフトウェアライセンス費用、材料費には開発用機材を計上しています。',
        achievements: '要件定義フェーズを完了し、システム設計書を作成しました。また、プロトタイプ開発により基本機能の動作確認を行い、想定通りの性能を確認しています。',
        challenges: '一部の既存システムとの連携において技術的な課題が発生しましたが、代替手法を検討し解決に向けて進めています。',
        next_actions: '開発フェーズ2に移行し、メイン機能の実装を開始します。また、ユーザビリティテストの準備を並行して進める予定です。'
      };

      const suggestion = mockSuggestions[field.id] || 'AI提案を生成できませんでした。';
      updateField(field.id, suggestion);
      
      toast.success('AI提案を反映しました');
    } catch (error) {
      toast.error('AI提案の生成に失敗しました');
    }
  };

  const generateDocument = async () => {
    if (!selectedTemplate || !documentData) return;

    setIsGenerating(true);
    setDocumentData(prev => ({ ...prev!, status: 'generating' }));

    try {
      // TODO: 実際のAPI呼び出し
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockContent = `
# ${selectedTemplate.name}

## 作成日
${new Date().toLocaleDateString('ja-JP')}

## 会社情報
${documentData.fields.company_overview || '会社概要が入力されていません'}

## 事業内容
${documentData.fields.business_purpose || documentData.fields.project_name || '事業内容が入力されていません'}

## 詳細情報
${selectedTemplate.requiredFields.map(field => {
  const value = documentData.fields[field.id];
  if (!value) return '';
  return `### ${field.label}\n${value}\n`;
}).join('\n')}

---
本書類は AI補助金申請システムにより自動生成されました。
      `.trim();

      setPreviewContent(mockContent);
      setDocumentData(prev => ({
        ...prev!,
        generatedContent: mockContent,
        status: 'completed'
      }));
      setCurrentView('preview');
      
      toast.success('書類の生成が完了しました');
    } catch (error) {
      setDocumentData(prev => ({ ...prev!, status: 'error' }));
      toast.error('書類の生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = (format: 'pdf' | 'word' | 'text') => {
    // TODO: 実際のダウンロード処理
    toast.success(`${format.toUpperCase()}ファイルの準備中...`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business_plan': return '📋';
      case 'budget': return '💰';
      case 'estimate': return '📊';
      case 'report': return '📝';
      default: return '📄';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'secondary';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '簡単';
      case 'medium': return '普通';
      case 'hard': return '詳細';
      default: return '不明';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          書類作成アシスタント
        </h1>
        <p className="text-gray-600">
          テンプレートを選択して、必要な書類を簡単に作成できます
        </p>
      </div>

      {/* ナビゲーション */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setCurrentView('templates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'templates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Squares2X2Icon className="h-4 w-4 inline mr-2" />
            テンプレート選択
          </button>
          <button
            onClick={() => selectedTemplate && setCurrentView('form')}
            disabled={!selectedTemplate}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'form' && selectedTemplate
                ? 'bg-blue-600 text-white'
                : selectedTemplate
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PencilIcon className="h-4 w-4 inline mr-2" />
            内容入力
          </button>
          <button
            onClick={() => documentData?.status === 'completed' && setCurrentView('preview')}
            disabled={documentData?.status !== 'completed'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'preview' && documentData?.status === 'completed'
                ? 'bg-blue-600 text-white'
                : documentData?.status === 'completed'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <EyeIcon className="h-4 w-4 inline mr-2" />
            プレビュー
          </button>
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {/* テンプレート選択画面 */}
        {currentView === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {templates.map(template => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => selectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-2xl">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {template.isPopular && (
                      <Badge variant="success" size="sm">人気</Badge>
                    )}
                    <Badge variant={getDifficultyColor(template.difficulty) as any} size="sm">
                      {getDifficultyText(template.difficulty)}
                    </Badge>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    約{template.estimatedTime}分
                  </div>
                  <div className="flex items-center text-blue-600">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {template.requiredFields.length}項目
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* フォーム入力画面 */}
        {currentView === 'form' && selectedTemplate && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow border border-gray-200 p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedTemplate.name}
              </h2>
              <p className="text-gray-600">
                必要な情報を入力してください。AI支援機能を使って自動入力も可能です。
              </p>
            </div>

            <div className="space-y-6">
              {selectedTemplate.requiredFields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.aiSuggestionEnabled && (
                      <Button
                        onClick={() => getAISuggestion(field)}
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                      >
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        AI提案
                      </Button>
                    )}
                  </div>

                  {field.description && (
                    <p className="text-xs text-gray-500">{field.description}</p>
                  )}

                  {field.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      placeholder={field.placeholder}
                      value={documentData?.fields[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={documentData?.fields[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      {field.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={documentData?.fields[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={generateDocument}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    書類を生成
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* プレビュー画面 */}
        {currentView === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 操作パネル */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedTemplate?.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    書類が正常に生成されました
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => downloadDocument('pdf')}
                    variant="secondary"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => downloadDocument('word')}
                    variant="secondary"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Word
                  </Button>
                  <Button
                    onClick={() => onComplete?.(documentData!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    完了
                  </Button>
                </div>
              </div>
            </div>

            {/* プレビューコンテンツ */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {previewContent}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}