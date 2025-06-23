'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  CurrencyYenIcon,
  FlagIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProjectProgress {
  id: string;
  applicationId: string;
  projectName: string;
  subsidyType: string;
  startDate: string;
  endDate: string;
  currentPhase: 'planning' | 'execution' | 'monitoring' | 'closing';
  overallProgress: number;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  team: {
    totalMembers: number;
    activeMembers: number;
  };
  milestones: Milestone[];
  recentActivity: Activity[];
  kpis: KPI[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  deliverables: string[];
}

interface Activity {
  id: string;
  type: 'milestone_completed' | 'task_updated' | 'budget_updated' | 'risk_identified';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface KPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'business' | 'technical' | 'financial';
}

interface ProgressDashboardProps {
  applicationId: string;
}

export default function ProgressDashboard({ applicationId }: ProgressDashboardProps) {
  const [project, setProject] = useState<ProjectProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'kpis' | 'team'>('overview');

  useEffect(() => {
    fetchProjectProgress();
  }, [applicationId]);

  const fetchProjectProgress = async () => {
    setIsLoading(true);
    try {
      // TODO: 実際のAPI呼び出し
      const mockData: ProjectProgress = {
        id: 'proj_001',
        applicationId: applicationId,
        projectName: 'AI活用による業務効率化プロジェクト',
        subsidyType: 'ものづくり補助金',
        startDate: '2025-01-15',
        endDate: '2025-12-31',
        currentPhase: 'execution',
        overallProgress: 65,
        status: 'on_track',
        budget: {
          allocated: 15000000,
          spent: 8500000,
          remaining: 6500000
        },
        team: {
          totalMembers: 8,
          activeMembers: 7
        },
        milestones: [
          {
            id: 'ms_001',
            title: '要件定義完了',
            description: 'システム要件の詳細化と承認',
            dueDate: '2025-03-01',
            completedDate: '2025-02-28',
            status: 'completed',
            progress: 100,
            deliverables: ['要件定義書', '承認書']
          },
          {
            id: 'ms_002',
            title: 'システム設計完了',
            description: 'アーキテクチャ設計とUI/UX設計',
            dueDate: '2025-05-01',
            completedDate: '2025-04-25',
            status: 'completed',
            progress: 100,
            deliverables: ['設計書', 'プロトタイプ']
          },
          {
            id: 'ms_003',
            title: '開発フェーズ1完了',
            description: 'コア機能の開発と単体テスト',
            dueDate: '2025-07-15',
            status: 'in_progress',
            progress: 70,
            deliverables: ['ソースコード', 'テスト結果']
          },
          {
            id: 'ms_004',
            title: '統合テスト完了',
            description: 'システム全体の統合テストと性能検証',
            dueDate: '2025-09-30',
            status: 'pending',
            progress: 0,
            deliverables: ['テスト仕様書', '結果報告書']
          }
        ],
        recentActivity: [
          {
            id: 'act_001',
            type: 'milestone_completed',
            title: 'システム設計が完了しました',
            description: 'アーキテクチャ設計とUI/UX設計が期日前に完了',
            timestamp: '2025-04-25T10:30:00Z',
            user: '田中 太郎'
          },
          {
            id: 'act_002',
            type: 'budget_updated',
            description: '開発フェーズの予算を更新しました',
            title: '予算更新',
            timestamp: '2025-04-20T14:15:00Z',
            user: '佐藤 花子'
          }
        ],
        kpis: [
          {
            id: 'kpi_001',
            name: '業務効率向上率',
            target: 30,
            current: 25,
            unit: '%',
            trend: 'up',
            category: 'business'
          },
          {
            id: 'kpi_002',
            name: 'システム処理時間削減',
            target: 50,
            current: 45,
            unit: '%',
            trend: 'up',
            category: 'technical'
          },
          {
            id: 'kpi_003',
            name: 'コスト削減率',
            target: 20,
            current: 15,
            unit: '%',
            trend: 'stable',
            category: 'financial'
          }
        ]
      };

      setProject(mockData);
    } catch (error) {
      console.error('Failed to fetch project progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'success';
      case 'at_risk': return 'warning';
      case 'delayed': return 'error';
      case 'completed': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_track': return '順調';
      case 'at_risk': return 'リスクあり';
      case 'delayed': return '遅延';
      case 'completed': return '完了';
      default: return '不明';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'planning': return '計画';
      case 'execution': return '実行';
      case 'monitoring': return '監視';
      case 'closing': return '終了';
      default: return '不明';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'overdue': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return <FlagIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          プロジェクト情報が見つかりません
        </h3>
        <p className="text-gray-600">
          申請が承認された後に進捗管理が開始されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.projectName}</h1>
            <p className="text-gray-600 mt-1">{project.subsidyType}</p>
          </div>
          <Badge variant={getStatusColor(project.status) as any} size="lg">
            {getStatusText(project.status)}
          </Badge>
        </div>

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">全体進捗</span>
            <span className="text-sm font-medium text-gray-900">{project.overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-blue-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${project.overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* プロジェクト基本情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">開始日</p>
            <p className="font-medium">{new Date(project.startDate).toLocaleDateString('ja-JP')}</p>
          </div>
          <div>
            <p className="text-gray-500">終了予定日</p>
            <p className="font-medium">{new Date(project.endDate).toLocaleDateString('ja-JP')}</p>
          </div>
          <div>
            <p className="text-gray-500">現在フェーズ</p>
            <p className="font-medium">{getPhaseText(project.currentPhase)}</p>
          </div>
          <div>
            <p className="text-gray-500">チームメンバー</p>
            <p className="font-medium">{project.team.activeMembers}/{project.team.totalMembers}名</p>
          </div>
        </div>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">進捗率</p>
              <p className="text-2xl font-bold text-gray-900">{project.overallProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CurrencyYenIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">予算消化率</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((project.budget.spent / project.budget.allocated) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FlagIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">完了マイルストーン</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.milestones.filter(m => m.status === 'completed').length}/
                {project.milestones.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">アクティブメンバー</p>
              <p className="text-2xl font-bold text-gray-900">{project.team.activeMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: '概要', icon: ChartBarIcon },
              { id: 'milestones', name: 'マイルストーン', icon: FlagIcon },
              { id: 'kpis', name: 'KPI', icon: ChartBarIcon },
              { id: 'team', name: 'チーム', icon: UsersIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 予算情報 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">予算状況</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">配当予算</span>
                    <span className="font-medium">{formatCurrency(project.budget.allocated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">使用済み</span>
                    <span className="font-medium text-red-600">{formatCurrency(project.budget.spent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">残額</span>
                    <span className="font-medium text-green-600">{formatCurrency(project.budget.remaining)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(project.budget.spent / project.budget.allocated) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 最近のアクティビティ */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h3>
                <div className="space-y-3">
                  {project.recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString('ja-JP')} - {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">マイルストーン</h3>
              <div className="space-y-4">
                {project.milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getMilestoneIcon(milestone.status)}
                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                      </div>
                      <Badge variant={milestone.status === 'completed' ? 'success' : 'primary'}>
                        {milestone.status === 'completed' ? '完了' : 
                         milestone.status === 'in_progress' ? '進行中' : '予定'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        期限: {new Date(milestone.dueDate).toLocaleDateString('ja-JP')}
                      </span>
                      <span className="font-medium">進捗: {milestone.progress}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kpis' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI一覧</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {project.kpis.map(kpi => (
                  <div key={kpi.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{kpi.name}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {kpi.current}{kpi.unit}
                      </span>
                      <span className="text-sm text-gray-500">
                        目標: {kpi.target}{kpi.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">チーム情報</h3>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  チーム管理機能は準備中です
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}