'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Calculator,
  Info,
  DollarSign,
  Users,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EligibilityStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
}

const industries = [
  '製造業',
  '情報通信業',
  '運輸業・郵便業',
  '卸売業・小売業',
  '金融業・保険業',
  '不動産業・物品賃貸業',
  '学術研究・専門技術サービス業',
  '宿泊業・飲食サービス業',
  '生活関連サービス業・娯楽業',
  '教育・学習支援業',
  '医療・福祉',
  'その他サービス業',
  'その他'
];

const reconstructionTypes = [
  { value: '新分野展開', label: '新分野展開', description: '主たる業種を変更することなく、新たな製品・サービスで新たな市場に進出' },
  { value: '事業転換', label: '事業転換', description: '新たな製品・サービスを製造等することにより、主たる業種を変更' },
  { value: '業種転換', label: '業種転換', description: '新たな製品の製造等により、主たる業種を変更' },
  { value: '業態転換', label: '業態転換', description: '製品の製造方法等を相当程度変更' },
  { value: '事業再編', label: '事業再編', description: '事業再編を通じて新分野展開、事業転換、業種転換、業態転換のいずれかを行う' }
];

export function EligibilityStep({ data, onComplete, onSave }: EligibilityStepProps) {
  const [formData, setFormData] = useState({
    sales_2019: data.sales_2019 || '',
    sales_2020: data.sales_2020 || '',
    sales_2021: data.sales_2021 || '',
    sales_2022: data.sales_2022 || '',
    employee_count: data.employee_count || '',
    industry: data.industry || '',
    has_support_org: data.has_support_org || false,
    reconstruction_type: data.reconstruction_type || ''
  });
  
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [salesDeclineRate, setSalesDeclineRate] = useState<number | null>(null);

  // 売上減少率の自動計算
  useEffect(() => {
    if (formData.sales_2019 && (formData.sales_2020 || formData.sales_2021 || formData.sales_2022)) {
      const baseSales = parseFloat(formData.sales_2019);
      const comparisonSales = [
        formData.sales_2020 ? parseFloat(formData.sales_2020) : Infinity,
        formData.sales_2021 ? parseFloat(formData.sales_2021) : Infinity,
        formData.sales_2022 ? parseFloat(formData.sales_2022) : Infinity
      ].filter(s => s !== Infinity);
      
      if (comparisonSales.length > 0 && baseSales > 0) {
        const minSales = Math.min(...comparisonSales);
        const decline = ((baseSales - minSales) / baseSales) * 100;
        setSalesDeclineRate(Math.max(0, decline));
      }
    }
  }, [formData.sales_2019, formData.sales_2020, formData.sales_2021, formData.sales_2022]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const checkEligibility = async () => {
    setIsChecking(true);
    
    try {
      // 入力データの検証
      const requiredFields = ['sales_2019', 'employee_count', 'industry', 'reconstruction_type'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error('必須項目をすべて入力してください');
        return;
      }

      // 売上データの検証
      const hasSalesData = formData.sales_2020 || formData.sales_2021 || formData.sales_2022;
      if (!hasSalesData) {
        toast.error('2020年以降の売上データを少なくとも1年分入力してください');
        return;
      }

      const requestData = {
        ...formData,
        sales_2019: parseFloat(formData.sales_2019),
        sales_2020: formData.sales_2020 ? parseFloat(formData.sales_2020) : 0,
        sales_2021: formData.sales_2021 ? parseFloat(formData.sales_2021) : 0,
        sales_2022: formData.sales_2022 ? parseFloat(formData.sales_2022) : 0,
        employee_count: parseInt(formData.employee_count)
      };

      const response = await fetch('/api/reconstruction-subsidy/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.success) {
        setEligibilityResult(result.eligibility);
        
        const finalData = {
          ...requestData,
          eligibility_result: result.eligibility
        };
        
        onSave(finalData);
        
        if (result.eligibility.eligible) {
          toast.success('申請要件を満たしています！');
          setTimeout(() => onComplete(finalData), 1000);
        } else {
          toast.error('申請要件を満たしていません');
        }
      } else {
        throw new Error(result.message || '申請資格の確認に失敗しました');
      }
    } catch (error) {
      console.error('Eligibility check error:', error);
      
      // フォールバック: ローカル計算による簡易チェック
      const basicCheck = performBasicEligibilityCheck();
      setEligibilityResult(basicCheck);
      
      toast.warning('サーバーエラーのため、基本チェックのみ実施しました');
    } finally {
      setIsChecking(false);
    }
  };

  const performBasicEligibilityCheck = () => {
    const decline = salesDeclineRate || 0;
    const employeeCount = parseInt(formData.employee_count);
    
    const eligibilityChecks = {
      sales_decline: decline >= 10,
      support_organization: formData.has_support_org,
      employee_count_valid: employeeCount > 0 && employeeCount <= 300,
      reconstruction_plan: !!formData.reconstruction_type
    };
    
    const maxSubsidy = employeeCount <= 20 ? 100000000 : 
                      employeeCount <= 50 ? 120000000 : 150000000;
    
    return {
      eligible: Object.values(eligibilityChecks).every(check => check),
      sales_decline_rate: decline,
      max_subsidy_amount: maxSubsidy,
      eligibility_details: eligibilityChecks,
      recommendations: generateRecommendations(eligibilityChecks, decline)
    };
  };

  const generateRecommendations = (checks: any, decline: number) => {
    const recommendations = [];
    
    if (!checks.sales_decline) {
      if (decline < 10) {
        recommendations.push('売上減少率が10%未満です。他の比較年度のデータも確認してください。');
      }
    }
    
    if (!checks.support_organization) {
      recommendations.push('認定経営革新等支援機関との連携が必要です。');
    }
    
    if (!checks.employee_count_valid) {
      recommendations.push('従業員数の制限を確認してください。');
    }
    
    return recommendations;
  };

  const getMaxSubsidyAmount = () => {
    const employeeCount = parseInt(formData.employee_count) || 0;
    if (employeeCount <= 20) return 100000000;
    if (employeeCount <= 50) return 120000000;
    return 150000000;
  };

  const isFormValid = () => {
    return formData.sales_2019 && 
           formData.employee_count && 
           formData.industry && 
           formData.reconstruction_type &&
           (formData.sales_2020 || formData.sales_2021 || formData.sales_2022);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          事業再構築補助金の申請には、売上高の10%以上の減少と認定経営革新等支援機関の確認が必要です。
        </AlertDescription>
      </Alert>

      {/* 売上高情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2" />
            売上高の変化
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sales_2019">2019年売上高（円）*</Label>
              <Input
                id="sales_2019"
                type="number"
                placeholder="例: 50000000"
                value={formData.sales_2019}
                onChange={(e) => handleChange('sales_2019', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">基準年の売上高</p>
            </div>
            <div>
              <Label htmlFor="sales_2020">2020年売上高（円）</Label>
              <Input
                id="sales_2020"
                type="number"
                placeholder="例: 40000000"
                value={formData.sales_2020}
                onChange={(e) => handleChange('sales_2020', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sales_2021">2021年売上高（円）</Label>
              <Input
                id="sales_2021"
                type="number"
                placeholder="例: 35000000"
                value={formData.sales_2021}
                onChange={(e) => handleChange('sales_2021', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sales_2022">2022年売上高（円）</Label>
              <Input
                id="sales_2022"
                type="number"
                placeholder="例: 30000000"
                value={formData.sales_2022}
                onChange={(e) => handleChange('sales_2022', e.target.value)}
              />
            </div>
          </div>

          {salesDeclineRate !== null && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">計算された売上減少率:</span>
                <Badge variant={salesDeclineRate >= 10 ? "success" : "warning"}>
                  {salesDeclineRate.toFixed(1)}%
                </Badge>
              </div>
              {salesDeclineRate >= 10 && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ 申請要件（10%以上の減少）を満たしています
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 企業基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            企業基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_count">従業員数（人）*</Label>
              <Input
                id="employee_count"
                type="number"
                placeholder="例: 50"
                value={formData.employee_count}
                onChange={(e) => handleChange('employee_count', e.target.value)}
              />
              {formData.employee_count && (
                <p className="text-xs text-blue-600 mt-1">
                  最大補助金額: ¥{getMaxSubsidyAmount().toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="industry">業種*</Label>
              <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="業種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 再構築計画 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            再構築の種類
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reconstructionTypes.map(type => (
              <div
                key={type.value}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all
                  ${formData.reconstruction_type === type.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleChange('reconstruction_type', type.value)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="reconstruction_type"
                    value={type.value}
                    checked={formData.reconstruction_type === type.value}
                    onChange={() => handleChange('reconstruction_type', type.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 認定支援機関 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            認定経営革新等支援機関
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has_support_org"
                checked={formData.has_support_org}
                onChange={(e) => handleChange('has_support_org', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="has_support_org">
                認定経営革新等支援機関からの確認を受けています
              </Label>
            </div>
            
            {!formData.has_support_org && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  事業再構築補助金では認定経営革新等支援機関からの確認が必須です。
                  まだ連携していない場合は、申請前に適切な支援機関を見つけてください。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 申請資格チェック結果 */}
      {eligibilityResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {eligibilityResult.eligible ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              )}
              申請資格チェック結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                eligibilityResult.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="font-medium mb-2">
                  {eligibilityResult.eligible ? '✓ 申請要件を満たしています' : '✗ 申請要件を満たしていません'}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>売上減少率:</span>
                    <span className={eligibilityResult.sales_decline_rate >= 10 ? 'text-green-600' : 'text-red-600'}>
                      {eligibilityResult.sales_decline_rate?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>最大補助金額:</span>
                    <span className="text-blue-600 font-medium">
                      ¥{eligibilityResult.max_subsidy_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {eligibilityResult.recommendations && eligibilityResult.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">推奨事項:</h4>
                  <ul className="space-y-1">
                    {eligibilityResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end space-x-2">
        <Button
          onClick={checkEligibility}
          disabled={!isFormValid() || isChecking}
          className="px-6"
        >
          {isChecking ? (
            <>
              <Calculator className="w-4 h-4 mr-2 animate-spin" />
              チェック中...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              申請資格をチェック
            </>
          )}
        </Button>
      </div>
    </div>
  );
}