'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Download, Loader2, Check, FileText, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DocumentCreationFormProps {
  onBack: () => void;
}

interface ExpenseItem {
  id: string;
  category: string;
  item: string;
  quantity: number;
  unitPrice: number;
  description: string;
}

export default function DocumentCreationForm({ onBack }: DocumentCreationFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<any[]>([]);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    // 企業基本情報
    companyInfo: {
      companyName: '',
      representativeName: '',
      businessType: '',
      foundedYear: new Date().getFullYear() - 1,
      employeeCount: 1,
      address: '',
      phone: '',
      email: '',
      capital: 0,
      revenue: 0
    },
    // 事業計画
    businessPlan: {
      projectName: '',
      businessOverview: '',
      marketAnalysis: '',
      competitiveAdvantage: '',
      expectedResults: ''
    },
    // 予算計画
    budgetPlan: {
      totalProjectCost: 0,
      subsidyAmount: 0,
      selfFunding: 0,
      expenseDetails: [] as ExpenseItem[]
    }
  });

  const expenseCategories = [
    { id: 'machinery_equipment', name: '機械装置等費' },
    { id: 'advertising', name: '広報費' },
    { id: 'exhibition', name: '展示会等出展費' },
    { id: 'travel', name: '旅費' },
    { id: 'development', name: '開発費' },
    { id: 'outsourcing', name: '委託費' },
    { id: 'expert', name: '専門家経費' }
  ];

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      category: '',
      item: '',
      quantity: 1,
      unitPrice: 0,
      description: ''
    };

    setFormData(prev => ({
      ...prev,
      budgetPlan: {
        ...prev.budgetPlan,
        expenseDetails: [...prev.budgetPlan.expenseDetails, newItem]
      }
    }));
  };

  const removeExpenseItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      budgetPlan: {
        ...prev.budgetPlan,
        expenseDetails: prev.budgetPlan.expenseDetails.filter(item => item.id !== id)
      }
    }));
  };

  const updateExpenseItem = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      budgetPlan: {
        ...prev.budgetPlan,
        expenseDetails: prev.budgetPlan.expenseDetails.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const calculateTotalCost = () => {
    return formData.budgetPlan.expenseDetails.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const validateForm = () => {
    // 基本的なバリデーション
    if (!formData.companyInfo.companyName || !formData.companyInfo.representativeName) {
      toast({
        title: 'エラー',
        description: '企業情報を入力してください',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.businessPlan.projectName || formData.businessPlan.projectName.length < 5) {
      toast({
        title: 'エラー',
        description: '事業名は5文字以上30文字以内で入力してください',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.budgetPlan.expenseDetails.length === 0) {
      toast({
        title: 'エラー',
        description: '経費明細を1つ以上入力してください',
        variant: 'destructive'
      });
      return false;
    }

    // 補助率チェック
    const totalCost = calculateTotalCost();
    const subsidyRate = formData.budgetPlan.subsidyAmount / totalCost;
    if (subsidyRate > 2/3) {
      toast({
        title: 'エラー',
        description: '補助率は2/3以内にしてください',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // APIトークンを取得（開発環境）
      const authResponse = await fetch('/api/dev-auth/auto-login');
      const authData = await authResponse.json();
      
      if (!authData.token) {
        throw new Error('認証に失敗しました');
      }

      // 書類生成API呼び出し
      const response = await fetch('/api/sustainability-subsidy/generate-all-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          ...formData,
          budgetPlan: {
            ...formData.budgetPlan,
            totalProjectCost: calculateTotalCost(),
            selfFunding: calculateTotalCost() - formData.budgetPlan.subsidyAmount
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '書類生成に失敗しました');
      }

      const result = await response.json();
      setGeneratedDocuments(result.data.documents);
      setStep(4); // 完了画面へ

      toast({
        title: '成功',
        description: '申請書類を生成しました',
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '書類生成中にエラーが発生しました',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">ステップ1: 企業基本情報</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">企業名 *</Label>
                <Input
                  id="companyName"
                  value={formData.companyInfo.companyName}
                  onChange={(e) => handleInputChange('companyInfo', 'companyName', e.target.value)}
                  placeholder="株式会社サンプル"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="representativeName">代表者名 *</Label>
                <Input
                  id="representativeName"
                  value={formData.companyInfo.representativeName}
                  onChange={(e) => handleInputChange('companyInfo', 'representativeName', e.target.value)}
                  placeholder="山田 太郎"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType">業種 *</Label>
                <Input
                  id="businessType"
                  value={formData.companyInfo.businessType}
                  onChange={(e) => handleInputChange('companyInfo', 'businessType', e.target.value)}
                  placeholder="小売業"
                  required
                />
              </div>

              <div>
                <Label htmlFor="foundedYear">設立年</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={formData.companyInfo.foundedYear}
                  onChange={(e) => handleInputChange('companyInfo', 'foundedYear', parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <Label htmlFor="employeeCount">従業員数 *</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={formData.companyInfo.employeeCount}
                  onChange={(e) => handleInputChange('companyInfo', 'employeeCount', parseInt(e.target.value))}
                  min="1"
                  max="20"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">小規模事業者は20名以下</p>
              </div>

              <div>
                <Label htmlFor="phone">電話番号 *</Label>
                <Input
                  id="phone"
                  value={formData.companyInfo.phone}
                  onChange={(e) => handleInputChange('companyInfo', 'phone', e.target.value)}
                  placeholder="03-1234-5678"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">所在地 *</Label>
                <Input
                  id="address"
                  value={formData.companyInfo.address}
                  onChange={(e) => handleInputChange('companyInfo', 'address', e.target.value)}
                  placeholder="東京都千代田区..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.companyInfo.email}
                  onChange={(e) => handleInputChange('companyInfo', 'email', e.target.value)}
                  placeholder="info@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="capital">資本金（万円）</Label>
                <Input
                  id="capital"
                  type="number"
                  value={formData.companyInfo.capital}
                  onChange={(e) => handleInputChange('companyInfo', 'capital', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">ステップ2: 事業計画</h2>
            
            <div>
              <Label htmlFor="projectName">事業名 * (5-30文字)</Label>
              <Input
                id="projectName"
                value={formData.businessPlan.projectName}
                onChange={(e) => handleInputChange('businessPlan', 'projectName', e.target.value)}
                placeholder="ECサイト構築による販路拡大事業"
                maxLength={30}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.businessPlan.projectName.length}/30文字
              </p>
            </div>

            <div>
              <Label htmlFor="businessOverview">事業概要</Label>
              <Textarea
                id="businessOverview"
                value={formData.businessPlan.businessOverview}
                onChange={(e) => handleInputChange('businessPlan', 'businessOverview', e.target.value)}
                placeholder="事業の概要を記入してください（AIが詳細な計画書を作成します）"
                rows={4}
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                <strong>AI支援について：</strong>
                事業概要を入力いただくと、AIが市場分析・競合分析・期待される成果を含む
                採択されやすい経営計画書（様式2）を自動生成します。
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">ステップ3: 経費明細</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="subsidyAmount">補助金申請額（円）*</Label>
                <Input
                  id="subsidyAmount"
                  type="number"
                  value={formData.budgetPlan.subsidyAmount}
                  onChange={(e) => handleInputChange('budgetPlan', 'subsidyAmount', parseInt(e.target.value))}
                  max={2000000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">上限200万円</p>
              </div>
              
              <div>
                <Label>補助対象経費合計</Label>
                <div className="text-2xl font-bold mt-2">
                  ¥{calculateTotalCost().toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  補助率: {formData.budgetPlan.subsidyAmount ? 
                    Math.round((formData.budgetPlan.subsidyAmount / calculateTotalCost()) * 100) : 0}%
                  （上限66.7%）
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">経費明細</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpenseItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  経費追加
                </Button>
              </div>

              {formData.budgetPlan.expenseDetails.map((expense, index) => (
                <Card key={expense.id} className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>経費区分</Label>
                      <Select
                        value={expense.category}
                        onValueChange={(value) => updateExpenseItem(expense.id, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>費目・品名</Label>
                      <Input
                        value={expense.item}
                        onChange={(e) => updateExpenseItem(expense.id, 'item', e.target.value)}
                        placeholder="ノートPC"
                      />
                    </div>

                    <div>
                      <Label>数量</Label>
                      <Input
                        type="number"
                        value={expense.quantity}
                        onChange={(e) => updateExpenseItem(expense.id, 'quantity', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>

                    <div>
                      <Label>単価（円）</Label>
                      <Input
                        type="number"
                        value={expense.unitPrice}
                        onChange={(e) => updateExpenseItem(expense.id, 'unitPrice', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>内容・用途</Label>
                      <Input
                        value={expense.description}
                        onChange={(e) => updateExpenseItem(expense.id, 'description', e.target.value)}
                        placeholder="ECサイト構築用の開発環境"
                      />
                    </div>

                    <div className="col-span-2 flex justify-between items-center">
                      <div className="text-sm">
                        小計: ¥{(expense.quantity * expense.unitPrice).toLocaleString()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenseItem(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {formData.budgetPlan.expenseDetails.length === 0 && (
                <Alert>
                  <AlertDescription>
                    経費を追加してください。補助対象となる経費を入力します。
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">申請書類の生成が完了しました！</h2>
              <p className="text-gray-600">
                以下の書類が自動生成されました。ダウンロードしてご確認ください。
              </p>
            </div>

            <div className="grid gap-4">
              {generatedDocuments.map((doc, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-gray-500">{doc.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: 実際のダウンロード実装
                        toast({
                          title: 'ダウンロード開始',
                          description: `${doc.title}のダウンロードを開始しました`,
                        });
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ダウンロード
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Alert className="bg-orange-50 border-orange-200">
              <AlertDescription>
                <strong>次のステップ：</strong>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>商工会・商工会議所で様式4（事業支援計画書）を取得してください</li>
                  <li>財務書類・登記書類をご準備ください</li>
                  <li>必要に応じて見積書（3社以上）を取得してください</li>
                  <li>GビズIDプライムで電子申請を行ってください</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          書類一覧に戻る
        </Button>
        
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['企業情報', '事業計画', '経費明細', '完了'].map((label, index) => (
              <div
                key={index}
                className={`text-sm font-medium ${
                  step > index + 1 ? 'text-blue-600' : 
                  step === index + 1 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <Card className="p-8">
        {renderStep()}
        
        {step < 4 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              前へ
            </Button>
            
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                次へ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    書類を生成する
                    <FileText className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}