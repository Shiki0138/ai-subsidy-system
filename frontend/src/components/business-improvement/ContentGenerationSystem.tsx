'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Copy, 
  CheckCircle, 
  Lightbulb, 
  Target, 
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

// 実際の申請書フィールドに対応した項目
const APPLICATION_SECTIONS = [
  {
    id: 'business_overview',
    title: '事業の概要',
    description: '現在の事業内容と業務プロセス',
    icon: Target,
    wordCount: '200-400文字',
    difficulty: 'medium',
    fieldName: '事業の概要',
    tips: [
      '主力商品・サービスを具体的に記載',
      '現在の業務フローを簡潔に説明',
      '従業員の役割分担を明確化'
    ]
  },
  {
    id: 'current_issues',
    title: '現在の課題',
    description: '解決すべき業務上の問題点',
    icon: Lightbulb,
    wordCount: '300-500文字',
    difficulty: 'high',
    fieldName: '現在の課題',
    tips: [
      '人手不足、非効率な作業を具体的に記述',
      '数値データ（時間、コスト等）で現状を表現',
      '競合との差や市場変化への対応不足を説明'
    ]
  },
  {
    id: 'equipment_plan',
    title: '設備・機器等の導入計画',
    description: '導入予定の設備とその仕様',
    icon: Settings,
    wordCount: '400-600文字',
    difficulty: 'high',
    fieldName: '設備・機器等の導入計画',
    tips: [
      '具体的な機種名・メーカー名を記載',
      '導入数量と設置場所を明確化',
      '既存設備との連携方法を説明'
    ]
  },
  {
    id: 'productivity_improvement',
    title: '生産性向上の具体的な内容',
    description: '設備導入による改善効果',
    icon: TrendingUp,
    wordCount: '400-700文字',
    difficulty: 'high',
    fieldName: '生産性向上の具体的な内容',
    tips: [
      '作業時間短縮の具体的数値（○時間→○時間）',
      '品質向上や不良率削減の効果',
      '売上・利益向上の見込みを数値で表現'
    ]
  },
  {
    id: 'wage_increase_plan',
    title: '賃金引上げ計画',
    description: '時給引上げの具体的内容',
    icon: DollarSign,
    wordCount: '300-400文字',
    difficulty: 'high',
    fieldName: '賃金引上げ計画',
    tips: [
      '引上げ対象者の詳細（雇用形態、人数等）',
      '引上げ額と実施時期を明確化',
      '引上げ原資となる生産性向上効果を説明'
    ]
  },
  {
    id: 'implementation_schedule',
    title: '事業実施スケジュール',
    description: '設備導入から効果発現までの計画',
    icon: Clock,
    wordCount: '200-350文字',
    difficulty: 'medium',
    fieldName: '事業実施スケジュール',
    tips: [
      '設備発注から導入完了までの期間',
      '従業員研修・操作習得期間',
      '効果測定・評価のタイミング'
    ]
  },
  {
    id: 'sustainability_plan',
    title: '事業の持続性',
    description: '継続的な効果維持の方法',
    icon: RefreshCw,
    wordCount: '250-400文字',
    difficulty: 'medium',
    fieldName: '事業の持続性',
    tips: [
      '設備の維持管理体制',
      '従業員のスキルアップ継続計画',
      '将来的な事業拡大・発展計画'
    ]
  },
  {
    id: 'effect_measurement',
    title: '効果の測定方法',
    description: '成果の評価・測定指標',
    icon: BarChart3,
    wordCount: '200-300文字',
    difficulty: 'medium',
    fieldName: '効果の測定方法',
    tips: [
      '具体的な測定指標（時間、個数、金額等）',
      '測定頻度と責任者の明確化',
      '目標達成度の評価方法'
    ]
  }
];

export default function ContentGenerationSystem() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{[key: string]: string}>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // サンプル会社情報（実際にはフォームから取得）
  const companyInfo = {
    name: '株式会社サンプル商事',
    industry: '小売業',
    employees: 25,
    currentIssue: '在庫管理の手作業による非効率',
    plannedEquipment: 'POSシステム一式',
    budget: 3000000
  };

  const generateContent = async (sectionId: string) => {
    setIsGenerating(true);
    
    // 実際にはAI APIを呼び出し
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const section = APPLICATION_SECTIONS.find(s => s.id === sectionId);
    let content = '';
    
    switch (sectionId) {
      case 'business_overview':
        content = `弊社は${companyInfo.industry}として、${companyInfo.employees}名の従業員により事業を展開しております。

【主力事業】
現在、${companyInfo.currentIssue}に関連する業務を中心に行っており、顧客への商品・サービス提供から、在庫管理、発注業務、顧客対応まで一連の業務を手作業中心で実施しています。

【現在の業務フロー】
従業員は販売、管理、発注の各業務を兼務しており、特に在庫確認や発注判断において多くの時間を要しています。日々の業務は紙ベースでの管理が中心となっており、データの集計・分析に時間がかかる状況です。`;
        break;
        
      case 'current_issues':
        content = `現在、当社では以下の業務課題に直面しており、生産性向上が急務となっています。

【主要課題】
1. 手作業による非効率性：在庫確認に1日2時間、発注業務に週3時間を要し、本来の顧客対応業務が圧迫されています。

2. ヒューマンエラーの発生：手作業による管理のため、月2-3回の在庫ミスや発注漏れが発生し、売上機会の損失や顧客信頼の低下を招いています。

3. データ活用の困難：紙ベースの管理により、売上分析や在庫最適化が困難で、戦略的な経営判断ができない状況です。

4. 人手不足への対応：限られた人員で多岐にわたる業務をこなすため、従業員の負担が増加し、残業時間も増える傾向にあります。

これらの課題は競争力低下の要因となっており、早急な解決が必要です。`;
        break;
        
      case 'equipment_plan':
        content = `生産性向上を実現するため、以下の設備・機器の導入を計画しています。

【導入予定設備】
・POSシステム一式（レジ端末2台、サーバー1台）
・在庫管理システム（バーコードスキャナー含む）
・顧客管理システム（CRM機能付き）

【設備仕様・機能】
1. リアルタイム在庫管理：商品の入出庫を自動記録し、適正在庫の維持を実現
2. 自動発注機能：設定した最低在庫数を下回った際の自動発注により欠品を防止
3. 売上分析機能：日次・月次の売上データを自動集計し、経営判断を支援
4. 顧客情報管理：購買履歴の管理により、個別対応やリピート促進を実現

【導入場所・設置計画】
店舗フロアにPOS端末2台、バックオフィスにサーバー1台を設置し、既存のネットワーク環境を活用して各システムを連携させます。`;
        break;
        
      case 'productivity_improvement':
        content = `設備導入により、以下の具体的な生産性向上効果を実現します。

【作業時間の大幅短縮】
- 在庫確認作業：2時間/日 → 0.5時間/日（75%削減、年間547.5時間短縮）
- 発注業務：3時間/週 → 1時間/週（67%削減、年間104時間短縮）
- 売上集計：5時間/月 → 1時間/月（80%削減、年間48時間短縮）

【品質・精度の向上】
- 在庫管理ミス：月3回 → 0回（100%削減）
- 発注漏れ・過剰発注：月2回 → 0回（100%削減）
- 会計処理の精度向上により、月次決算時間を50%短縮

【経営効率の改善】
削減された年間699.5時間（約87日分）を顧客対応強化と新商品企画に充当することで、顧客満足度向上と売上拡大を実現します。また、正確なデータに基づく経営判断により、収益性を年間15%向上させることが可能です。

【コスト削減効果】
人件費削減効果：年間約175万円（時給2,500円×699.5時間）
在庫ロス削減：年間約50万円
合計年間効果：約225万円`;
        break;
        
      case 'wage_increase_plan':
        content = `生産性向上により創出される効果を従業員に還元するため、以下の賃金引上げを実施します。

【引上げ対象者】
全従業員${companyInfo.employees}名（正社員、パートタイム労働者を含む）

【引上げ内容】
- 時給：30円引上げ（現在の最低賃金+30円）
- 実施時期：設備導入完了後3ヶ月目（効果確認後）
- 年間総額：約${companyInfo.employees * 30 * 2000}円の賃金引上げ

【引上げの根拠・財源】
設備導入による生産性向上効果（年間約225万円）のうち、約3分の1にあたる年間${Math.floor(companyInfo.employees * 30 * 2000 / 10000)}万円を従業員への還元に充当します。残りの効果は企業の成長投資と更なる設備改善に活用し、持続的な賃金引上げの基盤を構築します。

【継続性の確保】
生産性向上効果の継続的な監視と改善により、将来的にはさらなる賃金引上げも検討しています。`;
        break;
        
      case 'implementation_schedule':
        content = `設備導入から効果発現まで、以下のスケジュールで事業を実施します。

【第1段階：準備・導入期（1-2ヶ月目）】
- 設備選定・業者決定・契約締結
- 設備納入・設置工事・ネットワーク構築
- 基本的な動作確認・初期設定

【第2段階：研修・習熟期（3ヶ月目）】
- 全従業員向け操作研修（各2日間）
- 試験運用による習熟度確認
- 業務フローの最適化・調整

【第3段階：本格運用・効果測定期（4-6ヶ月目）】
- 本格運用開始・日常業務への完全移行
- 月次効果測定・分析
- 改善点の洗い出しと対策実施
- 6ヶ月目：賃金引上げ実施

各段階で進捗確認を行い、必要に応じてスケジュール調整を実施します。`;
        break;
        
      case 'sustainability_plan':
        content = `設備導入効果を継続的に維持・発展させるため、以下の取り組みを実施します。

【設備保守・管理体制】
- 定期的なシステムメンテナンス（月1回）
- 担当者による日常点検・簡易修理対応
- メーカー保守契約による技術サポート確保

【人材育成・スキルアップ】
- 従業員のシステム操作スキル向上研修（年2回）
- データ分析スキルの習得支援
- 新入社員向けシステム研修の制度化

【継続的改善・発展計画】
- 月次効果測定による改善点の早期発見
- 顧客ニーズ変化に対応したシステム機能追加
- 将来的な事業拡大に備えた設備増強計画の策定

これらの取り組みにより、設備投資効果を長期にわたって維持し、更なる事業発展の基盤とします。`;
        break;
        
      case 'effect_measurement':
        content = `設備導入効果を客観的に測定・評価するため、以下の指標と方法を設定します。

【測定指標】
1. 作業時間削減効果
   - 在庫確認時間（分/日）
   - 発注業務時間（分/週）
   - 売上集計時間（分/月）

2. 品質向上効果
   - 在庫管理ミス件数（件/月）
   - 発注ミス件数（件/月）
   - 会計処理精度（%）

3. 経営効果
   - 売上高（円/月）
   - 在庫回転率（回/年）
   - 顧客満足度（アンケート評価）

【測定方法・頻度】
- 日次：作業時間の記録（担当者による入力）
- 週次：ミス・エラー件数の集計（責任者による確認）
- 月次：総合的な効果分析・報告（管理者による評価）

【評価・改善体制】
測定結果は月次会議で共有し、目標未達成項目については速やかに改善策を検討・実施します。`;
        break;
    }
    
    setGeneratedContent(prev => ({ ...prev, [sectionId]: content }));
    setIsGenerating(false);
  };

  const copyToClipboard = async (sectionId: string) => {
    const content = generatedContent[sectionId];
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            業務改善助成金 申請文書作成支援
          </CardTitle>
          <CardDescription>
            申請書の各項目に記入する文章をAIが生成します。生成された文章をコピーして申請書に貼り付けてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>新しいアプローチ</strong>: 申請書フォーマットへの直接入力ではなく、
              申請書に記入する文章の作成に特化しています。生成された文章は自由に編集・活用してください。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 申請項目一覧 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPLICATION_SECTIONS.map((section) => {
          const Icon = section.icon;
          const hasContent = generatedContent[section.id];
          
          return (
            <Card 
              key={section.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSection === section.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedSection(section.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(section.difficulty)}>
                      {section.difficulty === 'high' ? '重要' : '標準'}
                    </Badge>
                    {hasContent && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{section.wordCount}</span>
                  {hasContent ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(section.id);
                      }}
                      className="flex items-center gap-1"
                    >
                      {copiedSection === section.id ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedSection === section.id ? 'コピー済み' : 'コピー'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateContent(section.id);
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        '生成'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 選択された項目の詳細 */}
      {selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle>
              {APPLICATION_SECTIONS.find(s => s.id === selectedSection)?.title}
            </CardTitle>
            <CardDescription>
              以下のポイントを含めて文章を作成することをお勧めします：
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 記入のコツ */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">記入のコツ</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {APPLICATION_SECTIONS.find(s => s.id === selectedSection)?.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* 生成された文章 */}
            {generatedContent[selectedSection] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">生成された文章</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateContent(selectedSection)}
                      disabled={isGenerating}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                      再生成
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(selectedSection)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      コピー
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  value={generatedContent[selectedSection]}
                  onChange={(e) => setGeneratedContent(prev => ({
                    ...prev,
                    [selectedSection]: e.target.value
                  }))}
                  rows={12}
                  className="text-sm"
                  placeholder="生成された文章がここに表示されます"
                />
                
                <div className="text-xs text-gray-500">
                  文字数: {generatedContent[selectedSection].length}文字
                </div>
              </div>
            )}

            {/* 生成ボタン（文章がない場合） */}
            {!generatedContent[selectedSection] && (
              <Button
                onClick={() => generateContent(selectedSection)}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    AI文章生成中...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    この項目の文章をAI生成
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使い方ガイド */}
      <Card>
        <CardHeader>
          <CardTitle>💡 使い方ガイド</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. 文章生成</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 各項目カードの「生成」ボタンをクリック</li>
                <li>• AIが会社情報に基づいて文章を作成</li>
                <li>• 内容を確認し、必要に応じて編集</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. 申請書への記入</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 「コピー」ボタンで文章をクリップボードに保存</li>
                <li>• 厚労省の申請書ファイルを開く</li>
                <li>• 該当箇所にペースト（Ctrl+V）</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}