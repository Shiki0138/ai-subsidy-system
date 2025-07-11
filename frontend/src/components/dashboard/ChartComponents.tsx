/**
 * ダッシュボードのグラフコンポーネント
 * Chart.jsを使用した統計グラフ表示
 */

'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface MonthlyStats {
  month: string
  applications: number
  approved: number
}

interface ChartComponentsProps {
  monthlyStats?: MonthlyStats[]
  totalApplications: number
  approved: number
  inProgress: number
  completed: number
}

export function ChartComponents({
  monthlyStats = [],
  totalApplications,
  approved,
  inProgress,
  completed,
}: ChartComponentsProps) {
  // モックデータ（データがない場合のフォールバック）
  const defaultMonthlyStats: MonthlyStats[] = [
    { month: '1月', applications: 2, approved: 1 },
    { month: '2月', applications: 3, approved: 2 },
    { month: '3月', applications: 4, approved: 2 },
    { month: '4月', applications: 3, approved: 3 },
    { month: '5月', applications: 5, approved: 4 },
    { month: '6月', applications: 4, approved: 3 },
  ]

  const stats = monthlyStats.length > 0 ? monthlyStats : defaultMonthlyStats

  // 月別申請数グラフ
  const lineChartData = {
    labels: stats.map(s => s.month),
    datasets: [
      {
        label: '申請数',
        data: stats.map(s => s.applications),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.3,
      },
      {
        label: '採択数',
        data: stats.map(s => s.approved),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
      },
    ],
  }

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '月別申請・採択数推移',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  // ステータス別内訳
  const doughnutChartData = {
    labels: ['完成', '作成中', '採択済み'],
    datasets: [
      {
        data: [completed, inProgress, approved],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(79, 70, 229, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(79, 70, 229)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: '申請書ステータス内訳',
        font: {
          size: 16,
        },
      },
    },
  }

  // 月別採択率グラフ
  const barChartData = {
    labels: stats.map(s => s.month),
    datasets: [
      {
        label: '採択率 (%)',
        data: stats.map(s => 
          s.applications > 0 ? Math.round((s.approved / s.applications) * 100) : 0
        ),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
      },
    ],
  }

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '月別採択率',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          },
        },
      },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 月別申請数推移 */}
      <div className="card p-6">
        <div className="h-80">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* ステータス内訳 */}
      <div className="card p-6">
        <div className="h-80">
          <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
        </div>
      </div>

      {/* 採択率推移 */}
      <div className="card p-6 lg:col-span-2">
        <div className="h-64">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>
    </div>
  )
}