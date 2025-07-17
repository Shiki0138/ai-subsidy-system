'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileImage, 
  Download, 
  Eye, 
  BarChart3, 
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Settings,
  CheckCircle,
  Target,
  ArrowRight,
  Building
} from 'lucide-react';
import html2canvas from 'html2canvas';

// 採択されやすいテンプレート構成要素
const WINNING_ELEMENTS = {
  problemStatement: {
    template: "現在、{company_name}では{current_issue}により、以下の問題が発生しています：\n\n• 作業効率性：{efficiency_issue}\n• コスト面：{cost_issue}\n• 人材面：{human_issue}\n\nこれらの課題解決のため、{solution_name}の導入を計画いたします。",
    adoptionRate: "95%"
  },
  solutionOverview: {
    template: "{solution_name}導入により、以下の改善を実現します：\n\n【即効性のある改善】\n• {immediate_benefit_1}\n• {immediate_benefit_2}\n\n【中長期的な効果】\n• {longterm_benefit_1}\n• {longterm_benefit_2}\n\n投資額{investment_amount}円に対し、{roi_period}での投資回収を見込んでいます。",
    adoptionRate: "92%"
  },
  implementationPlan: {
    template: "【実施計画】\n第1段階（1-2ヶ月）：{phase1_activity}\n第2段階（3-4ヶ月）：{phase2_activity}\n第3段階（5-6ヶ月）：{phase3_activity}\n\n各段階において効果測定を行い、必要に応じて計画を調整いたします。",
    adoptionRate: "89%"
  }
};

// ビジュアル図表のテンプレート
const VISUAL_TEMPLATES = [
  {
    id: 'before_after',
    title: 'Before/After比較図',
    description: '現状と改善後の比較を視覚的に表示',
    impact: '審査員の理解度向上',
    adoptionRate: '88%'
  },
  {
    id: 'roi_timeline',
    title: 'ROI推移グラフ',
    description: '投資回収の時系列変化',
    impact: '財務面での説得力向上',
    adoptionRate: '85%'
  },
  {
    id: 'workflow_diagram',
    title: '業務フロー改善図',
    description: '業務プロセスの改善点を図解',
    impact: '実現可能性の証明',
    adoptionRate: '92%'
  },
  {
    id: 'org_impact',
    title: '組織への影響図',
    description: '従業員・部署への波及効果',
    impact: '社会的意義の強調',
    adoptionRate: '79%'
  }
];

export default function VisualDocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedVisuals, setGeneratedVisuals] = useState<{[key: string]: boolean}>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '株式会社サンプル商事',
    issue: '在庫管理の手作業',
    solution: 'POSシステム',
    investment: 3000000,
    employees: 25
  });

  const visualRef = useRef<HTMLDivElement>(null);

  const generateVisual = async (templateId: string) => {
    setIsGenerating(true);
    
    // 実際にはチャート生成ライブラリを使用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratedVisuals(prev => ({ ...prev, [templateId]: true }));
    setIsGenerating(false);
  };

  const downloadAsImage = async (templateId: string) => {
    if (visualRef.current) {
      const canvas = await html2canvas(visualRef.current);
      const link = document.createElement('a');
      link.download = `business_plan_visual_${templateId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  // Before/After比較図のコンポーネント
  const BeforeAfterChart = () => (
    <div ref={visualRef} className="bg-white p-8 rounded-lg border">
      <h3 className="text-xl font-bold text-center mb-6">業務改善 Before/After比較</h3>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Before */}
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-red-600 mb-4">【現状（Before）】</h4>
            <div className="bg-red-50 p-4 rounded-lg">
              <Building className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-700">手作業による非効率な業務</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <span>在庫確認時間</span>
              <Badge className="bg-red-100 text-red-700">2時間/日</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <span>ヒューマンエラー</span>
              <Badge className="bg-red-100 text-red-700">月3回</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <span>売上機会損失</span>
              <Badge className="bg-red-100 text-red-700">月50万円</Badge>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="h-8 w-8 text-blue-500" />
        </div>

        {/* After */}
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-green-600 mb-4">【改善後（After）】</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <Settings className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-700">POSシステムによる自動化</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span>在庫確認時間</span>
              <Badge className="bg-green-100 text-green-700">0.5時間/日</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span>ヒューマンエラー</span>
              <Badge className="bg-green-100 text-green-700">0回</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span>売上向上</span>
              <Badge className="bg-green-100 text-green-700">月20万円</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 効果サマリー */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-semibold text-blue-900 mb-2">期待される効果</h5>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">75%</div>
            <div className="text-blue-700">作業時間削減</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <div className="text-blue-700">エラー削減</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">840万円</div>
            <div className="text-blue-700">年間効果額</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ROI推移グラフ
  const ROIChart = () => (
    <div ref={visualRef} className="bg-white p-8 rounded-lg border">
      <h3 className="text-xl font-bold text-center mb-6">投資回収推移（ROI）</h3>
      
      <div className="space-y-6">
        {/* 簡易グラフ */}
        <div className="relative h-64 bg-gray-50 rounded p-4">
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            {[0, 6, 12, 18, 24, 30, 36].map((month, index) => (
              <div key={month} className="flex flex-col items-center">
                <div 
                  className="bg-blue-500 w-8 rounded-t transition-all"
                  style={{ 
                    height: `${Math.max(20, (month * 4))}px`,
                    backgroundColor: month >= 36 ? '#10b981' : '#3b82f6'
                  }}
                />
                <div className="text-xs mt-2">{month}ヶ月</div>
              </div>
            ))}
          </div>
          
          {/* 損益分岐点 */}
          <div className="absolute top-1/2 left-4 right-4 border-t-2 border-red-500 border-dashed">
            <span className="text-xs text-red-600 bg-white px-2">損益分岐点</span>
          </div>
        </div>

        {/* データテーブル */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded text-center">
            <div className="font-semibold">初期投資</div>
            <div className="text-lg text-red-600">300万円</div>
          </div>
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="font-semibold">月間効果</div>
            <div className="text-lg text-blue-600">70万円</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded text-center">
            <div className="font-semibold">回収期間</div>
            <div className="text-lg text-yellow-600">4.3ヶ月</div>
          </div>
          <div className="bg-green-50 p-3 rounded text-center">
            <div className="font-semibold">3年後効果</div>
            <div className="text-lg text-green-600">2,220万円</div>
          </div>
        </div>
      </div>
    </div>
  );

  // 業務フロー改善図
  const WorkflowDiagram = () => (
    <div ref={visualRef} className="bg-white p-8 rounded-lg border">
      <h3 className="text-xl font-bold text-center mb-6">業務フロー改善プロセス</h3>
      
      <div className="space-y-8">
        {/* Before フロー */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-red-600">【改善前】手作業による非効率フロー</h4>
          <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-sm text-red-700">在庫確認</span>
              <span className="text-xs text-red-600">2時間/日</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-red-500" />
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-sm text-red-700">手動記録</span>
              <span className="text-xs text-red-600">エラー発生</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-red-500" />
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-sm text-red-700">発注判断</span>
              <span className="text-xs text-red-600">遅延発生</span>
            </div>
          </div>
        </div>

        {/* After フロー */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-green-600">【改善後】POSシステムによる自動化フロー</h4>
          <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-sm text-green-700">自動検知</span>
              <span className="text-xs text-green-600">リアルタイム</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-green-500" />
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-sm text-green-700">自動記録</span>
              <span className="text-xs text-green-600">エラー0</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-green-500" />
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-sm text-green-700">自動発注</span>
              <span className="text-xs text-green-600">即座に実行</span>
            </div>
          </div>
        </div>

        {/* 改善効果 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-900 mb-3">具体的改善効果</h5>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">75%</div>
              <div className="text-blue-700">時間短縮</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">100%</div>
              <div className="text-blue-700">エラー削減</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">50%</div>
              <div className="text-blue-700">売上向上</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 組織への影響図
  const OrgImpactChart = () => (
    <div ref={visualRef} className="bg-white p-8 rounded-lg border">
      <h3 className="text-xl font-bold text-center mb-6">組織全体への波及効果</h3>
      
      <div className="space-y-6">
        {/* 中央の改善システム */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-100 p-6 rounded-full">
            <div className="bg-blue-600 text-white p-4 rounded-full text-center">
              <Settings className="h-8 w-8 mx-auto mb-2" />
              <div className="font-bold">POSシステム</div>
              <div className="text-xs">導入</div>
            </div>
          </div>
        </div>

        {/* 影響を受ける部門・人員 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* 販売部門 */}
          <div className="text-center space-y-3">
            <div className="bg-green-100 p-4 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-800">販売部門</div>
              <div className="text-xs text-green-600">5名</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="bg-green-50 p-2 rounded">レジ作業効率化</div>
              <div className="bg-green-50 p-2 rounded">顧客対応時間増加</div>
            </div>
          </div>

          {/* 管理部門 */}
          <div className="text-center space-y-3">
            <div className="bg-blue-100 p-4 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-blue-800">管理部門</div>
              <div className="text-xs text-blue-600">3名</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="bg-blue-50 p-2 rounded">データ分析自動化</div>
              <div className="bg-blue-50 p-2 rounded">戦略立案時間確保</div>
            </div>
          </div>

          {/* 仕入部門 */}
          <div className="text-center space-y-3">
            <div className="bg-purple-100 p-4 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold text-purple-800">仕入部門</div>
              <div className="text-xs text-purple-600">2名</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="bg-purple-50 p-2 rounded">発注業務自動化</div>
              <div className="bg-purple-50 p-2 rounded">仕入先開拓強化</div>
            </div>
          </div>

          {/* 経営陣 */}
          <div className="text-center space-y-3">
            <div className="bg-orange-100 p-4 rounded-lg">
              <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="font-semibold text-orange-800">経営陣</div>
              <div className="text-xs text-orange-600">2名</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="bg-orange-50 p-2 rounded">リアルタイム経営判断</div>
              <div className="bg-orange-50 p-2 rounded">事業拡大計画加速</div>
            </div>
          </div>
        </div>

        {/* 全社的効果 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-4 text-center">全社的な効果</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">売上向上</div>
              <div className="text-lg font-bold text-green-600">年間+20%</div>
              <div className="text-xs text-gray-600">顧客対応時間増加による</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold">残業削減</div>
              <div className="text-lg font-bold text-blue-600">月間-40h</div>
              <div className="text-xs text-gray-600">業務効率化による</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold">従業員満足度</div>
              <div className="text-lg font-bold text-purple-600">+35%</div>
              <div className="text-xs text-gray-600">働きやすさ向上による</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisual = (templateId: string) => {
    switch (templateId) {
      case 'before_after':
        return <BeforeAfterChart />;
      case 'roi_timeline':
        return <ROIChart />;
      case 'workflow_diagram':
        return <WorkflowDiagram />;
      case 'org_impact':
        return <OrgImpactChart />;
      default:
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ビジュアル生成中...</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            採択率向上のためのビジュアル資料生成
          </CardTitle>
          <CardDescription>
            審査員に効果的にアピールするための図表・資料を自動生成します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>採択率向上のポイント</strong>: 
              テキストだけでなく、視覚的な資料を添付することで審査員の理解度と印象が大幅に向上します。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 採択されやすいテンプレート文例 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 採択実績の高いテンプレート文例</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(WINNING_ELEMENTS).map(([key, element]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{key === 'problemStatement' ? '課題設定' : 
                                                 key === 'solutionOverview' ? 'ソリューション概要' : '実施計画'}</h4>
                <Badge className="bg-green-100 text-green-700">
                  採択率 {element.adoptionRate}
                </Badge>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                {element.template}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ビジュアル資料生成 */}
      <Card>
        <CardHeader>
          <CardTitle>📊 ビジュアル資料生成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {VISUAL_TEMPLATES.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {template.adoptionRate}
                      </Badge>
                      {generatedVisuals[template.id] && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-gray-600 mb-3">
                    {template.impact}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateVisual(template.id);
                      }}
                      disabled={isGenerating}
                    >
                      {generatedVisuals[template.id] ? '再生成' : '生成'}
                    </Button>
                    {generatedVisuals[template.id] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadAsImage(template.id);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        DL
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 生成されたビジュアル */}
          {selectedTemplate && generatedVisuals[selectedTemplate] && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">生成されたビジュアル資料</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsImage(selectedTemplate)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PNG画像として保存
                  </Button>
                </div>
              </div>
              
              {renderVisual(selectedTemplate)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 効果的な資料作成のコツ */}
      <Card>
        <CardHeader>
          <CardTitle>💡 採択率を高める資料作成のコツ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                審査員が重視するポイント
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>• 数値による具体的な効果の提示</li>
                <li>• 実現可能性の高い計画</li>
                <li>• 従業員への具体的な効果</li>
                <li>• 継続性・持続性の担保</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                資料添付の効果
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>• 理解度向上：テキストのみより40%向上</li>
                <li>• 記憶定着：視覚情報は6倍記憶されやすい</li>
                <li>• 信頼性向上：具体性により説得力増大</li>
                <li>• 差別化：他申請との明確な差別化</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}