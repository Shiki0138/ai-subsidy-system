'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DocumentTextIcon,
  ChartBarIcon,
  PhotoIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyYenIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ReportData {
  basicInfo: {
    reportType: 'interim' | 'final' | 'annual';
    reportPeriod: string;
    submissionDate: string;
    reportTitle: string;
  };
  achievements: {
    kpis: KPIAchievement[];
    majorOutcomes: string[];
    challenges: string[];
    solutions: string[];
  };
  financial: {
    totalBudget: number;
    actualExpenses: ExpenseItem[];
    budgetVariance: number;
    explanation: string;
  };
  attachments: {
    evidenceFiles: FileAttachment[];
    photos: FileAttachment[];
    documents: FileAttachment[];
  };
}

interface KPIAchievement {
  id: string;
  name: string;
  target: number;
  achieved: number;
  unit: string;
  explanation: string;
}

interface ExpenseItem {
  category: string;
  planned: number;
  actual: number;
  description: string;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
  description: string;
  category: 'evidence' | 'photo' | 'document';
}

interface ReportWizardProps {
  applicationId: string;
  projectId: string;
  onComplete: (reportData: ReportData) => void;
  onCancel: () => void;
}

export default function ReportWizard({
  applicationId,
  projectId,
  onComplete,
  onCancel
}: ReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [reportData, setReportData] = useState<Partial<ReportData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  const steps = [
    { id: 1, name: '基本情報', icon: DocumentTextIcon },
    { id: 2, name: '成果・実績', icon: ChartBarIcon },
    { id: 3, name: '予算・財務', icon: CurrencyYenIcon },
    { id: 4, name: '証憑・添付', icon: PhotoIcon },
    { id: 5, name: '確認・提出', icon: CheckCircleIcon }
  ];

  useEffect(() => {
    fetchProjectInfo();
  }, [projectId]);

  const fetchProjectInfo = async () => {
    try {
      // TODO: 実際のAPI呼び出し
      const mockProjectInfo = {
        projectName: 'AI活用による業務効率化プロジェクト',
        subsidyType: 'ものづくり補助金',
        totalBudget: 15000000,
        startDate: '2025-01-15',
        endDate: '2025-12-31',
        plannedKPIs: [
          { name: '業務効率向上率', target: 30, unit: '%' },
          { name: 'システム処理時間削減', target: 50, unit: '%' },
          { name: 'コスト削減率', target: 20, unit: '%' }
        ]
      };
      setProjectInfo(mockProjectInfo);
    } catch (error) {
      console.error('Failed to fetch project info:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateReportData = (stepData: any) => {
    setReportData(prev => ({ ...prev, ...stepData }));
  };

  const handleFileUpload = (files: FileList | null, category: 'evidence' | 'photo' | 'document') => {
    if (!files) return;

    const newFiles: FileAttachment[] = Array.from(files).map((file, index) => ({
      id: `${category}_${Date.now()}_${index}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file,
      description: '',
      category
    }));

    const currentAttachments = reportData.attachments || { evidenceFiles: [], photos: [], documents: [] };
    const categoryKey = category === 'evidence' ? 'evidenceFiles' : 
                       category === 'photo' ? 'photos' : 'documents';

    updateReportData({
      attachments: {
        ...currentAttachments,
        [categoryKey]: [...(currentAttachments[categoryKey] || []), ...newFiles]
      }
    });

    toast.success(`${files.length}件のファイルを追加しました`);
  };

  const removeFile = (fileId: string, category: 'evidence' | 'photo' | 'document') => {
    const currentAttachments = reportData.attachments || { evidenceFiles: [], photos: [], documents: [] };
    const categoryKey = category === 'evidence' ? 'evidenceFiles' : 
                       category === 'photo' ? 'photos' : 'documents';

    updateReportData({
      attachments: {
        ...currentAttachments,
        [categoryKey]: currentAttachments[categoryKey]?.filter(f => f.id !== fileId) || []
      }
    });
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    try {
      // TODO: 実際のAPI呼び出し
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('報告書の提出が完了しました');
      onComplete(reportData as ReportData);
    } catch (error) {
      toast.error('報告書の提出に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">基本情報の入力</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  報告書種別
                </label>
                <select
                  {...register('reportType', { required: '報告書種別を選択してください' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => updateReportData({ basicInfo: { ...reportData.basicInfo, reportType: e.target.value } })}
                >
                  <option value="">選択してください</option>
                  <option value="interim">中間報告</option>
                  <option value="final">最終報告</option>
                  <option value="annual">年次報告</option>
                </select>
                {errors.reportType && (
                  <p className="text-red-500 text-sm mt-1">{errors.reportType.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  報告対象期間
                </label>
                <input
                  type="text"
                  {...register('reportPeriod', { required: '報告対象期間を入力してください' })}
                  placeholder="例: 2025年1月〜6月"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => updateReportData({ basicInfo: { ...reportData.basicInfo, reportPeriod: e.target.value } })}
                />
                {errors.reportPeriod && (
                  <p className="text-red-500 text-sm mt-1">{errors.reportPeriod.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提出予定日
                </label>
                <input
                  type="date"
                  {...register('submissionDate', { required: '提出予定日を選択してください' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => updateReportData({ basicInfo: { ...reportData.basicInfo, submissionDate: e.target.value } })}
                />
                {errors.submissionDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.submissionDate.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  報告書タイトル
                </label>
                <input
                  type="text"
                  {...register('reportTitle', { required: '報告書タイトルを入力してください' })}
                  placeholder="例: 第1回中間報告書"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => updateReportData({ basicInfo: { ...reportData.basicInfo, reportTitle: e.target.value } })}
                />
                {errors.reportTitle && (
                  <p className="text-red-500 text-sm mt-1">{errors.reportTitle.message as string}</p>
                )}
              </div>
            </div>

            {projectInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">プロジェクト情報</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">プロジェクト名: </span>
                    <span className="font-medium">{projectInfo.projectName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">補助金種別: </span>
                    <span className="font-medium">{projectInfo.subsidyType}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">事業期間: </span>
                    <span className="font-medium">
                      {new Date(projectInfo.startDate).toLocaleDateString('ja-JP')} 〜 
                      {new Date(projectInfo.endDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">総予算: </span>
                    <span className="font-medium">
                      {projectInfo.totalBudget.toLocaleString()}円
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">成果・実績の報告</h3>
            
            {/* KPI達成状況 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">KPI達成状況</h4>
              {projectInfo?.plannedKPIs?.map((kpi: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {kpi.name}
                      </label>
                      <p className="text-sm text-gray-500">目標: {kpi.target}{kpi.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        実績値
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        onChange={(e) => {
                          const currentKPIs = reportData.achievements?.kpis || [];
                          const updatedKPIs = [...currentKPIs];
                          updatedKPIs[index] = {
                            id: `kpi_${index}`,
                            name: kpi.name,
                            target: kpi.target,
                            achieved: parseFloat(e.target.value) || 0,
                            unit: kpi.unit,
                            explanation: updatedKPIs[index]?.explanation || ''
                          };
                          updateReportData({
                            achievements: {
                              ...reportData.achievements,
                              kpis: updatedKPIs
                            }
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        達成率
                      </label>
                      <div className="text-lg font-bold text-blue-600">
                        {reportData.achievements?.kpis?.[index]?.achieved 
                          ? Math.round((reportData.achievements.kpis[index].achieved / kpi.target) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        説明
                      </label>
                      <textarea
                        placeholder="達成状況の説明"
                        rows={2}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        onChange={(e) => {
                          const currentKPIs = reportData.achievements?.kpis || [];
                          const updatedKPIs = [...currentKPIs];
                          if (updatedKPIs[index]) {
                            updatedKPIs[index].explanation = e.target.value;
                          }
                          updateReportData({
                            achievements: {
                              ...reportData.achievements,
                              kpis: updatedKPIs
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 主要成果 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                主要な成果・アウトプット
              </label>
              <textarea
                rows={4}
                placeholder="プロジェクトで達成した主要な成果を記載してください"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => updateReportData({
                  achievements: {
                    ...reportData.achievements,
                    majorOutcomes: e.target.value.split('\n').filter(line => line.trim())
                  }
                })}
              />
            </div>

            {/* 課題と対応 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  発生した課題・問題
                </label>
                <textarea
                  rows={4}
                  placeholder="プロジェクト実施中に発生した課題を記載"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => updateReportData({
                    achievements: {
                      ...reportData.achievements,
                      challenges: e.target.value.split('\n').filter(line => line.trim())
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解決策・対応状況
                </label>
                <textarea
                  rows={4}
                  placeholder="課題に対する解決策や対応状況を記載"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => updateReportData({
                    achievements: {
                      ...reportData.achievements,
                      solutions: e.target.value.split('\n').filter(line => line.trim())
                    }
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">予算・財務状況</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-900">予算管理について</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    補助金の適切な使用を証明するため、詳細な予算執行状況を記載してください。
                  </p>
                </div>
              </div>
            </div>

            {/* 予算概要 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">総予算額</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {projectInfo?.totalBudget?.toLocaleString() || 0}円
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">執行済み</h4>
                <div>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    onChange={(e) => {
                      const actualExpenses = parseFloat(e.target.value) || 0;
                      const variance = projectInfo?.totalBudget - actualExpenses;
                      updateReportData({
                        financial: {
                          ...reportData.financial,
                          totalBudget: projectInfo?.totalBudget || 0,
                          budgetVariance: variance
                        }
                      });
                    }}
                  />
                  <p className="text-sm text-green-700">円</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">残予算</h4>
                <p className="text-2xl font-bold text-gray-600">
                  {(reportData.financial?.budgetVariance || projectInfo?.totalBudget || 0).toLocaleString()}円
                </p>
              </div>
            </div>

            {/* 支出明細 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">支出明細</h4>
              <div className="space-y-4">
                {['人件費', '設備費', '材料費', 'その他'].map((category, index) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          項目
                        </label>
                        <p className="font-medium">{category}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          計画額（円）
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          実績額（円）
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <input
                          type="text"
                          placeholder="支出の詳細"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 予算差異の説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予算差異の説明
              </label>
              <textarea
                rows={4}
                placeholder="計画と実績に差異がある場合は、その理由と影響を記載してください"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => updateReportData({
                  financial: {
                    ...reportData.financial,
                    explanation: e.target.value
                  }
                })}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">証憑・添付資料</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-green-900">提出書類について</h4>
                  <p className="text-sm text-green-700 mt-1">
                    成果を証明する写真、領収書、その他の証憑資料をアップロードしてください。
                  </p>
                </div>
              </div>
            </div>

            {/* ファイルアップロードセクション */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 証憑資料 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">証憑資料</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      ファイルを選択
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'evidence')}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    領収書、契約書等
                  </p>
                </div>
                {reportData.attachments?.evidenceFiles?.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mt-2">
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id, 'evidence')}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* 写真・画像 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">写真・画像</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      画像を選択
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'photo')}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    成果物、実施状況の写真
                  </p>
                </div>
                {reportData.attachments?.photos?.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mt-2">
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id, 'photo')}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* その他書類 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">その他書類</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      ファイルを選択
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'document')}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    報告書、資料等
                  </p>
                </div>
                {reportData.attachments?.documents?.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mt-2">
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id, 'document')}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">確認・提出</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-medium text-blue-900 mb-4">報告書内容の確認</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900">基本情報</h5>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>種別: {reportData.basicInfo?.reportType}</p>
                    <p>対象期間: {reportData.basicInfo?.reportPeriod}</p>
                    <p>提出予定: {reportData.basicInfo?.submissionDate}</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900">KPI達成状況</h5>
                  <div className="text-sm text-gray-600 mt-1">
                    {reportData.achievements?.kpis?.map((kpi, index) => (
                      <p key={index}>
                        {kpi.name}: {kpi.achieved}{kpi.unit} / {kpi.target}{kpi.unit} 
                        ({Math.round((kpi.achieved / kpi.target) * 100)}%)
                      </p>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900">添付資料</h5>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>証憑資料: {reportData.attachments?.evidenceFiles?.length || 0}件</p>
                    <p>写真: {reportData.attachments?.photos?.length || 0}件</p>
                    <p>その他書類: {reportData.attachments?.documents?.length || 0}件</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-900">提出前の確認事項</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• 全ての必須項目が入力されていることを確認してください</li>
                    <li>• 添付資料が正しくアップロードされていることを確認してください</li>
                    <li>• 提出後は内容の変更ができませんのでご注意ください</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ステップインジケーター */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2
                ${currentStep >= step.id 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
                }
              `}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`ml-3 text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`ml-8 w-24 h-0.5 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex items-center justify-between mt-8">
        <Button
          onClick={currentStep === 1 ? onCancel : prevStep}
          variant="secondary"
          className="flex items-center"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'キャンセル' : '戻る'}
        </Button>

        <div className="flex space-x-4">
          {currentStep < steps.length ? (
            <Button onClick={nextStep} className="flex items-center">
              次へ
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submitReport}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center"
            >
              {isSubmitting ? '提出中...' : '報告書を提出'}
              <CheckCircleIcon className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}