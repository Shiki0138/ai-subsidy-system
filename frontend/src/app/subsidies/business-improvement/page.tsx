'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CurrencyYenIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function BusinessImprovementSubsidyPage() {
  const router = useRouter();

  const handleStartApplication = () => {
    router.push('/dashboard/applications/new?subsidy=GYOMU_KAIZEN_2025');
  };

  const courses = [
    {
      name: '30円コース',
      wageIncrease: 30,
      maxSubsidy: 300000,
      targetEmployees: '1人以上',
      difficulty: '入門',
      color: 'green'
    },
    {
      name: '45円コース',
      wageIncrease: 45,
      maxSubsidy: 450000,
      targetEmployees: '1人以上',
      difficulty: '初級',
      color: 'blue'
    },
    {
      name: '60円コース',
      wageIncrease: 60,
      maxSubsidy: 600000,
      targetEmployees: '1人以上',
      difficulty: '中級',
      color: 'purple'
    },
    {
      name: '90円コース',
      wageIncrease: 90,
      maxSubsidy: 1500000,
      targetEmployees: '2人以上7人以下',
      difficulty: '中級',
      color: 'yellow'
    },
    {
      name: '120円コース',
      wageIncrease: 120,
      maxSubsidy: 3000000,
      targetEmployees: '3人以上10人以下',
      difficulty: '上級',
      color: 'orange'
    },
    {
      name: '150円コース',
      wageIncrease: 150,
      maxSubsidy: 6000000,
      targetEmployees: '4人以上',
      difficulty: '上級',
      color: 'red'
    }
  ];

  const features = [
    {
      icon: CurrencyYenIcon,
      title: '最大600万円の助成',
      description: '設備投資費用の3/4を補助（コースにより上限額が異なります）'
    },
    {
      icon: UserGroupIcon,
      title: '全業種対象',
      description: '業種を問わず、中小企業・小規模事業者が申請可能'
    },
    {
      icon: ClockIcon,
      title: '年間を通じて申請可能',
      description: '2026年2月28日まで申請受付中'
    },
    {
      icon: DocumentTextIcon,
      title: 'AI申請書作成',
      description: '複雑な申請書をAIが自動生成・最適化'
    }
  ];

  const requirements = [
    '事業場内最低賃金を一定額以上引き上げること',
    '引き上げ前の事業場内最低賃金が1,000円未満であること',
    '生産性向上に資する機器・設備等を導入すること',
    '解雇、賃金引き下げ等の不交付事由がないこと'
  ];

  const applicationFlow = [
    '申請書作成（AI支援）',
    '必要書類の準備',
    '都道府県労働局へ提出',
    '交付決定通知の受領',
    '事業実施（設備導入・賃金引上げ）',
    '実績報告書の提出',
    '助成金の受給'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-3xl font-bold text-gray-900">業務改善助成金</h1>
          <Badge variant="success">2025年度募集中</Badge>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          生産性向上に資する設備投資と賃金引上げで最大600万円の助成を受けられる制度です。
          AIが申請書を自動作成し、採択率向上をサポートします。
        </p>
        
        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            onClick={handleStartApplication}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            申請書作成を開始
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {/* スクロールして詳細へ */}}
          >
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            制度詳細を確認
          </Button>
        </div>
      </div>

      {/* 主要特徴 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          制度の特徴
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* コース一覧 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          申請コース
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.name}
                </h3>
                <Badge 
                  variant={course.color === 'green' ? 'success' : 
                          course.color === 'blue' ? 'primary' : 'default'}
                  size="sm"
                >
                  {course.difficulty}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">賃金引上げ</span>
                  <span className="font-semibold">時給+{course.wageIncrease}円</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">助成金上限</span>
                  <span className="font-semibold text-blue-600">
                    {course.maxSubsidy.toLocaleString()}円
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">対象従業員</span>
                  <span className="text-sm">{course.targetEmployees}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500">
                  補助率: 3/4（75%）
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 申請要件 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          申請要件
        </h2>
        <Card className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">基本要件</h3>
              <ul className="space-y-3">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">対象事業者</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">中小企業・小規模事業者</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">全業種対象</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">事業場内最低賃金1,000円未満</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 申請フロー */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          申請から受給までの流れ
        </h2>
        <Card className="p-6">
          <div className="grid md:grid-cols-7 gap-4">
            {applicationFlow.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                  {index + 1}
                </div>
                <div className="text-sm text-gray-700">{step}</div>
                {index < applicationFlow.length - 1 && (
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 mx-auto mt-3 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* お問い合わせ */}
      <section>
        <Card className="p-6 bg-blue-50">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ご不明な点がございましたら
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <strong>業務改善助成金コールセンター</strong>
              </p>
              <p className="text-sm text-gray-700">
                電話番号: <strong>0120-366-440</strong>
              </p>
              <p className="text-sm text-gray-700">
                受付時間: 平日 9:00～17:00
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* 開始ボタン（ページ下部） */}
      <div className="text-center pt-8">
        <Button
          size="lg"
          onClick={handleStartApplication}
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg"
        >
          <DocumentTextIcon className="h-6 w-6 mr-3" />
          業務改善助成金申請書の作成を開始する
          <ArrowRightIcon className="h-6 w-6 ml-3" />
        </Button>
        <p className="text-sm text-gray-600 mt-3">
          所要時間: 約15-30分（AI自動生成により大幅短縮）
        </p>
      </div>
    </div>
  );
}