'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface GuidelineData {
  id?: string;
  title: string;
  subsidyType: string;
  organization: string;
  applicationDeadline: string;
  maxAmount: number;
  subsidyRate: number;
  eligibilityRequirements: string[];
  requiredDocuments: string[];
  evaluationCriteria: string[];
  applicationProcess: string[];
  contactInfo: {
    department: string;
    phone: string;
    email: string;
    website: string;
  };
  rawContent: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  confidence: number;
}

interface ParsedSection {
  title: string;
  content: string;
  confidence: number;
  isEdited: boolean;
}

interface GuidelineImporterProps {
  onComplete?: (guideline: GuidelineData) => void;
  onCancel?: () => void;
}

export default function GuidelineImporter({
  onComplete,
  onCancel
}: GuidelineImporterProps) {
  const [importMethod, setImportMethod] = useState<'url' | 'file' | null>(null);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [guidelineData, setGuidelineData] = useState<GuidelineData | null>(null);
  const [currentStep, setCurrentStep] = useState<'import' | 'processing' | 'review' | 'edit'>('import');
  const [editingSections, setEditingSections] = useState<Record<string, ParsedSection>>({});
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('URLを入力してください');
      return;
    }

    try {
      new URL(url); // URL validation
    } catch {
      toast.error('有効なURLを入力してください');
      return;
    }

    await processGuideline({ type: 'url', source: url });
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFile = files[0];
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('PDF、Word、テキストファイルのみ対応しています');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    setFile(selectedFile);
    toast.success('ファイルを選択しました');
  }, []);

  const handleFileImport = async () => {
    if (!file) {
      toast.error('ファイルを選択してください');
      return;
    }

    await processGuideline({ type: 'file', source: file });
  };

  const processGuideline = async (source: { type: 'url' | 'file', source: string | File }) => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessingProgress(0);

    try {
      // Progress simulation
      const progressSteps = [
        { step: 'コンテンツ取得中...', progress: 20 },
        { step: 'AI解析実行中...', progress: 50 },
        { step: '構造化データ生成中...', progress: 80 },
        { step: '最終検証中...', progress: 95 },
        { step: '完了', progress: 100 }
      ];

      for (const { step, progress } of progressSteps) {
        toast(step, { icon: '🔄' });
        setProcessingProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Mock parsed data
      const mockData: GuidelineData = {
        id: `guideline_${Date.now()}`,
        title: source.type === 'url' ? 
          'ものづくり・商業・サービス生産性向上促進補助金' : 
          'IT導入補助金2025',
        subsidyType: source.type === 'url' ? 'ものづくり補助金' : 'IT導入補助金',
        organization: '独立行政法人中小企業基盤整備機構',
        applicationDeadline: '2025-08-31',
        maxAmount: source.type === 'url' ? 1000 : 450,
        subsidyRate: source.type === 'url' ? 50 : 30,
        eligibilityRequirements: [
          '中小企業・小規模事業者であること',
          '補助事業の実施場所が日本国内であること',
          '補助事業実施期間中に他の補助金を受けていないこと',
          '暴力団等の反社会的勢力でないこと'
        ],
        requiredDocuments: [
          '事業計画書',
          '経費明細書',
          '見積書',
          '事業要請書',
          '決算書（直近2期分）',
          '履歴事項全部証明書'
        ],
        evaluationCriteria: [
          '技術面での新規性・優位性',
          '事業化に向けた実現可能性',
          '補助事業としての適格性',
          '事業実施体制の妥当性',
          '政策面での意義'
        ],
        applicationProcess: [
          'GビズIDプライムアカウントの取得',
          '電子申請システムでの事業者登録',
          '申請書類の作成・提出',
          '審査結果の通知受領',
          '交付決定通知の受領'
        ],
        contactInfo: {
          department: '中小企業基盤整備機構 補助金事務局',
          phone: '03-1234-5678',
          email: 'info@smrj.go.jp',
          website: 'https://www.smrj.go.jp'
        },
        rawContent: source.type === 'url' ? url : file?.name || '',
        processingStatus: 'completed',
        confidence: 0.92
      };

      setGuidelineData(mockData);
      setCurrentStep('review');
      toast.success('募集要項の解析が完了しました');

    } catch (error: any) {
      setCurrentStep('import');
      toast.error('解析に失敗しました: ' + (error.message || '不明なエラー'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (field: string, value: any) => {
    if (!guidelineData) return;

    setGuidelineData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleArrayEdit = (field: string, index: number, value: string) => {
    if (!guidelineData) return;

    const currentArray = (guidelineData as any)[field] as string[];
    const newArray = [...currentArray];
    newArray[index] = value;

    setGuidelineData(prev => ({
      ...prev!,
      [field]: newArray
    }));
  };

  const addArrayItem = (field: string) => {
    if (!guidelineData) return;

    const currentArray = (guidelineData as any)[field] as string[];
    setGuidelineData(prev => ({
      ...prev!,
      [field]: [...currentArray, '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    if (!guidelineData) return;

    const currentArray = (guidelineData as any)[field] as string[];
    setGuidelineData(prev => ({
      ...prev!,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return { variant: 'success', text: '高精度' };
    if (confidence >= 0.7) return { variant: 'primary', text: '中精度' };
    if (confidence >= 0.5) return { variant: 'warning', text: '要確認' };
    return { variant: 'error', text: '低精度' };
  };

  const saveGuideline = async () => {
    if (!guidelineData) return;

    try {
      // TODO: 実際のAPI呼び出し
      toast('補助金プログラムを登録中...', { icon: '💾' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('補助金プログラムとして登録されました');
      onComplete?.(guidelineData);
    } catch (error) {
      toast.error('登録に失敗しました');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          募集要項インポート
        </h1>
        <p className="text-gray-600">
          新しい補助金の募集要項をシステムに取り込み、申請対象として追加します
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* インポート方法選択 */}
        {currentStep === 'import' && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* インポート方法選択 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                  importMethod === 'url' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setImportMethod('url')}
              >
                <LinkIcon className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  URLから取得
                </h3>
                <p className="text-gray-600 text-sm">
                  募集要項が公開されているWebページのURLを指定して、自動で内容を解析します
                </p>
              </div>

              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                  importMethod === 'file' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setImportMethod('file')}
              >
                <DocumentTextIcon className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ファイルアップロード
                </h3>
                <p className="text-gray-600 text-sm">
                  PDF、Word、テキストファイルをアップロードして内容を解析します
                </p>
              </div>
            </div>

            {/* URL入力 */}
            {importMethod === 'url' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  URLを入力してください
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      募集要項のURL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/guideline.html"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">対応サイト例</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 中小企業庁の補助金・助成金サイト</li>
                      <li>• 各都道府県・市町村の公式サイト</li>
                      <li>• 独立行政法人の公開資料</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleUrlImport}
                    disabled={!url.trim() || isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    URLから解析開始
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ファイルアップロード */}
            {importMethod === 'file' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ファイルをアップロードしてください
                </h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    {file ? (
                      <div>
                        <p className="text-lg font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          onClick={() => setFile(null)}
                          variant="secondary"
                          size="sm"
                          className="mt-2"
                        >
                          選択を解除
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            ファイルを選択
                          </span>
                          <span className="text-gray-500"> またはドラッグ&ドロップ</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />
                        </label>
                        <p className="text-sm text-gray-500 mt-2">
                          PDF、Word、テキストファイル（最大10MB）
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">ファイル要件</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 対応形式: PDF、Word (.doc/.docx)、テキスト (.txt)</li>
                      <li>• ファイルサイズ: 10MB以下</li>
                      <li>• 文字が読み取り可能な形式（画像PDF不可）</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleFileImport}
                    disabled={!file || isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    ファイルから解析開始
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 処理中画面 */}
        {currentStep === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center"
          >
            <SparklesIcon className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              AI解析中...
            </h2>
            <p className="text-gray-600 mb-8">
              募集要項の内容を解析し、構造化データに変換しています
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">進捗</span>
                <span className="text-sm font-medium text-gray-900">{processingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-blue-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>この処理には1-2分程度かかる場合があります</p>
            </div>
          </motion.div>
        )}

        {/* 結果確認・編集画面 */}
        {currentStep === 'review' && guidelineData && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* ヘッダーとアクション */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    解析結果の確認
                  </h2>
                  <div className="flex items-center mt-2">
                    <Badge 
                      variant={getConfidenceBadge(guidelineData.confidence).variant as any}
                      className="mr-3"
                    >
                      {getConfidenceBadge(guidelineData.confidence).text}
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(guidelineData.confidence)}`}>
                      解析精度: {Math.round(guidelineData.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setCurrentStep('edit')}
                    variant="secondary"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    詳細編集
                  </Button>
                  <Button
                    onClick={saveGuideline}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    登録する
                  </Button>
                </div>
              </div>
            </div>

            {/* 解析結果 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">補助金名: </span>
                    <span>{guidelineData.title}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">種別: </span>
                    <span>{guidelineData.subsidyType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">実施機関: </span>
                    <span>{guidelineData.organization}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">申請締切: </span>
                    <span>{new Date(guidelineData.applicationDeadline).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">上限額: </span>
                    <span>{guidelineData.maxAmount}万円</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">補助率: </span>
                    <span>{guidelineData.subsidyRate}%</span>
                  </div>
                </div>
              </div>

              {/* 連絡先情報 */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">連絡先情報</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">担当部署: </span>
                    <span>{guidelineData.contactInfo.department}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">電話番号: </span>
                    <span>{guidelineData.contactInfo.phone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">メール: </span>
                    <span>{guidelineData.contactInfo.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Webサイト: </span>
                    <a href={guidelineData.contactInfo.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      {guidelineData.contactInfo.website}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 詳細情報リスト */}
            <div className="space-y-6">
              {[
                { title: '応募資格・要件', field: 'eligibilityRequirements' },
                { title: '必要書類', field: 'requiredDocuments' },
                { title: '評価基準', field: 'evaluationCriteria' },
                { title: '申請手続き', field: 'applicationProcess' }
              ].map(({ title, field }) => (
                <div key={field} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                  <ul className="space-y-2">
                    {((guidelineData as any)[field] as string[]).map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-3">•</span>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 詳細編集画面 */}
        {currentStep === 'edit' && guidelineData && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">詳細編集</h2>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setCurrentStep('review')}
                  variant="secondary"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  プレビューに戻る
                </Button>
                <Button
                  onClick={saveGuideline}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  保存して登録
                </Button>
              </div>
            </div>

            {/* 編集フォーム */}
            <div className="space-y-6">
              {/* 基本情報編集 */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      補助金名
                    </label>
                    <input
                      type="text"
                      value={guidelineData.title}
                      onChange={(e) => handleEdit('title', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      種別
                    </label>
                    <input
                      type="text"
                      value={guidelineData.subsidyType}
                      onChange={(e) => handleEdit('subsidyType', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      上限額（万円）
                    </label>
                    <input
                      type="number"
                      value={guidelineData.maxAmount}
                      onChange={(e) => handleEdit('maxAmount', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      補助率（%）
                    </label>
                    <input
                      type="number"
                      value={guidelineData.subsidyRate}
                      onChange={(e) => handleEdit('subsidyRate', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* リスト項目編集 */}
              {[
                { title: '応募資格・要件', field: 'eligibilityRequirements' },
                { title: '必要書類', field: 'requiredDocuments' },
                { title: '評価基準', field: 'evaluationCriteria' }
              ].map(({ title, field }) => (
                <div key={field} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <Button
                      onClick={() => addArrayItem(field)}
                      variant="secondary"
                      size="sm"
                    >
                      項目を追加
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {((guidelineData as any)[field] as string[]).map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayEdit(field, index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-3 py-2"
                        />
                        <Button
                          onClick={() => removeArrayItem(field, index)}
                          variant="secondary"
                          size="sm"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}