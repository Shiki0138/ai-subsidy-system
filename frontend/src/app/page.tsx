'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Cpu, 
  Wrench,
  TrendingUp,
  Users,
  Shield,
  CheckCircle,
  Clock,
  Zap,
  DollarSign,
  Globe
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const subsidyPrograms = [
    {
      id: 'sustainability',
      name: '小規模企業持続化補助金',
      shortName: '持続化補助金',
      description: '小規模事業者の販路開拓等の取り組みを支援',
      maxAmount: '200万円',
      subsidyRate: '2/3',
      icon: Building2,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      features: ['販路開拓', '業務効率化', '生産性向上'],
      applicationPeriod: '第17次締切：2025年2月28日',
      difficulty: 'normal',
      href: '/apply/sustainability',
      available: true
    },
    {
      id: 'business-improvement',
      name: '業務改善助成金',
      shortName: '業務改善助成金',
      description: '生産性向上と賃金引上げを同時に実現する厚生労働省の助成金',
      maxAmount: '600万円',
      subsidyRate: '最大90%',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      features: ['賃金引上げ', '設備投資', '生産性向上'],
      applicationPeriod: '締切：2025年12月26日',
      difficulty: 'easy',
      href: '/apply/business-improvement',
      available: true
    },
    {
      id: 'it',
      name: 'IT導入補助金',
      shortName: 'IT補助金',
      description: 'ITツール導入による業務効率化・売上向上を支援',
      maxAmount: '450万円',
      subsidyRate: '1/2〜3/4',
      icon: Cpu,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      features: ['ITツール導入', 'デジタル化', 'セキュリティ強化'],
      applicationPeriod: '最終締切：2025年12月15日',
      difficulty: 'easy',
      href: '/apply/it-subsidy',
      available: true
    },
    {
      id: 'manufacturing',
      name: 'ものづくり補助金',
      shortName: 'ものづくり',
      description: '革新的サービス開発・試作品開発・生産プロセス改善を支援',
      maxAmount: '1,250万円',
      subsidyRate: '1/2〜2/3',
      icon: Wrench,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: ['設備投資', '新製品開発', '生産性向上'],
      applicationPeriod: '第18次締切：2025年4月30日',
      difficulty: 'hard',
      href: '/apply/manufacturing',
      available: true
    },
    {
      id: 'restructuring',
      name: '事業再構築補助金',
      shortName: '再構築補助金',
      description: '新分野展開や事業転換等の思い切った事業再構築を支援',
      maxAmount: '1.5億円',
      subsidyRate: '1/2〜3/4',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      features: ['新分野展開', '事業転換', '業態転換'],
      applicationPeriod: '第13回公募：2025年3月予定',
      difficulty: 'hard',
      href: '/apply/reconstruction',
      available: true
    }
  ];

  const getDifficultyBadge = (difficulty: string) => {
    const config = {
      easy: { label: '申請難易度：低', color: 'bg-green-100 text-green-700' },
      normal: { label: '申請難易度：中', color: 'bg-yellow-100 text-yellow-700' },
      hard: { label: '申請難易度：高', color: 'bg-red-100 text-red-700' }
    };
    return config[difficulty as keyof typeof config] || config.normal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                AI補助金申請システム
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  ダッシュボード
                </Button>
                <Button variant="ghost" size="sm" className="sm:hidden px-2">
                  <Users className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm">
                  <span className="hidden sm:inline">ログイン</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-4 px-3 py-1" variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            AI搭載・申請支援
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            補助金申請を
            <br className="sm:hidden" />
            <span className="text-blue-600">簡単に、確実に</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
            AIが最適な補助金を提案し、申請書を自動作成。
            <br className="hidden sm:inline" />
            煩雑な申請作業を大幅に削減します。
          </p>
        </div>
      </section>

      {/* 補助金プログラム一覧 */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              対応補助金プログラム
            </h3>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              主要な補助金に対応。AIが申請書類を自動生成します
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subsidyPrograms.map((program) => {
              const Icon = program.icon;
              const difficultyBadge = getDifficultyBadge(program.difficulty);
              
              return (
                <Card 
                  key={program.id}
                  className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    program.available ? 'cursor-pointer' : 'opacity-75'
                  } ${program.borderColor}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-5`} />
                  
                  <div className="relative p-6">
                    {/* ヘッダー */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${program.bgColor}`}>
                          <Icon className={`h-6 w-6 text-${program.color.split('-')[1]}-600`} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">
                            {program.name}
                          </h4>
                          <p className="text-sm text-gray-500">{program.shortName}</p>
                        </div>
                      </div>
                      {!program.available && (
                        <Badge variant="secondary" className="text-xs">
                          準備中
                        </Badge>
                      )}
                    </div>

                    {/* 説明 */}
                    <p className="text-gray-600 mb-4">
                      {program.description}
                    </p>

                    {/* 詳細情報 */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">上限額</p>
                        <p className="text-lg font-bold text-gray-900">{program.maxAmount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">補助率</p>
                        <p className="text-lg font-bold text-gray-900">{program.subsidyRate}</p>
                      </div>
                    </div>

                    {/* 特徴タグ */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {program.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* 申請期間と難易度 */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">{program.applicationPeriod}</p>
                      <Badge className={`text-xs ${difficultyBadge.color}`}>
                        {difficultyBadge.label}
                      </Badge>
                    </div>

                    {/* アクションボタン */}
                    {program.available ? (
                      <Link href={program.href} className="block">
                        <Button 
                          className={`w-full bg-gradient-to-r ${program.color} hover:opacity-90 text-white shadow-sm`}
                          size="lg"
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          申請書類を作成する
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full text-base"
                        variant="secondary"
                        size="lg"
                        disabled
                      >
                        準備中
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* クイックスタート */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                どの補助金が最適か分からない？
              </h4>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                2つの質問に答えるだけで、AIが最適な補助金を提案します
              </p>
              <Link href="/quick-apply">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-sm w-full" size="lg">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">かんたん診断を始める</span>
                </Button>
              </Link>
            </Card>
            
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200">
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                記載のない補助金を申請したい
              </h4>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                全国1700以上の自治体独自補助金に対応
                <br />
                募集要項を読み込んで申請書を自動生成
              </p>
              <Link href="/custom-subsidy">
                <Button className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:opacity-90 shadow-sm w-full" size="lg">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">独自補助金を申請する</span>
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 法的表示セクション */}
      <section className="py-8 px-4 bg-gray-100 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              重要なお知らせ
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  本サービスは、補助金・助成金申請書類の作成を支援するツールです。
                  <strong>申請代行サービスではありません。</strong>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  作成した申請書類の提出は、お客様ご自身で行っていただく必要があります。
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  本サービスは日本国内の事業者向けサービスです。海外からのご利用はできません。
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  補助金の採択を保証するものではありません。詳細は
                  <Link href="/disclaimer" className="text-blue-600 hover:underline mx-1">
                    免責事項
                  </Link>
                  をご確認ください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* 会社情報 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <span className="font-semibold">AI補助金申請システム</span>
              </div>
              <p className="text-sm text-gray-600">
                補助金申請書類作成支援ツール
              </p>
            </div>
            
            {/* 法的情報 */}
            <div>
              <h4 className="font-semibold mb-3">法的情報</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link href="/specified-commercial-transaction" className="text-gray-600 hover:text-gray-900">
                    特定商取引法に基づく表記
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-gray-600 hover:text-gray-900">
                    免責事項
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* サポート */}
            <div>
              <h4 className="font-semibold mb-3">サポート</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="text-gray-600 hover:text-gray-900">
                    ヘルプセンター
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-600 hover:text-gray-900">
                    よくある質問
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                    お問い合わせ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* サービス */}
            <div>
              <h4 className="font-semibold mb-3">サービス</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                    料金プラン
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-gray-600 hover:text-gray-900">
                    機能紹介
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                    ダッシュボード
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-600">
                © 2024 AI補助金申請システム. All rights reserved.
              </p>
              <p className="text-sm text-gray-600 mt-2 md:mt-0">
                日本国内サービス | 申請書作成支援ツール
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}