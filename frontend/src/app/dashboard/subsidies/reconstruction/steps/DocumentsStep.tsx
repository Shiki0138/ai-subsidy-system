'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface DocumentsStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
}

export function DocumentsStep({ data, onComplete, onSave }: DocumentsStepProps) {
  const [formData, setFormData] = useState({
    support_organization: data.support_organization || {
      name: '',
      representative: '',
      certification_number: '',
      contact_info: ''
    },
    required_documents: data.required_documents || {},
    additional_notes: data.additional_notes || ''
  });

  const requiredDocuments = [
    { key: 'business_plan', name: '事業計画書', required: true },
    { key: 'financial_statements', name: '財務諸表（3期分）', required: true },
    { key: 'corporate_register', name: '履歴事項全部証明書', required: true },
    { key: 'sales_proof', name: '売上減少を示す書類', required: true },
    { key: 'quotations', name: '見積書・仕様書', required: true },
    { key: 'support_org_confirmation', name: '認定支援機関確認書', required: true },
    { key: 'board_resolution', name: '取締役会議事録', required: false },
    { key: 'market_research', name: '市場調査資料', required: false }
  ];

  const handleSupportOrgChange = (field: string, value: string) => {
    const newSupportOrg = { ...formData.support_organization, [field]: value };
    const newData = { ...formData, support_organization: newSupportOrg };
    setFormData(newData);
    onSave(newData);
  };

  const handleDocumentCheck = (docKey: string, checked: boolean) => {
    const newDocs = { ...formData.required_documents, [docKey]: checked };
    const newData = { ...formData, required_documents: newDocs };
    setFormData(newData);
    onSave(newData);
  };

  const handleComplete = () => {
    // 認定支援機関の必須項目チェック
    const supportOrg = formData.support_organization;
    if (!supportOrg.name || !supportOrg.representative || !supportOrg.certification_number) {
      alert('認定支援機関の情報をすべて入力してください');
      return;
    }

    // 必須書類のチェック
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !formData.required_documents[doc.key]);
    
    if (missingDocs.length > 0) {
      alert('必須書類の準備状況をすべて確認してください');
      return;
    }

    onComplete(formData);
  };

  const isFormValid = () => {
    const supportOrg = formData.support_organization;
    const supportOrgValid = supportOrg.name && supportOrg.representative && supportOrg.certification_number;
    
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const requiredDocsValid = requiredDocs.every(doc => formData.required_documents[doc.key]);
    
    return supportOrgValid && requiredDocsValid;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          事業再構築補助金では、認定経営革新等支援機関からの確認と多くの書類が必要です。
          事前に準備状況を確認してください。
        </AlertDescription>
      </Alert>

      {/* 認定支援機関 */}
      <Card>
        <CardHeader>
          <CardTitle>認定経営革新等支援機関</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="org_name">機関名*</Label>
            <Textarea
              id="org_name"
              placeholder="例: ○○経営コンサルティング株式会社"
              value={formData.support_organization.name}
              onChange={(e) => handleSupportOrgChange('name', e.target.value)}
              rows={1}
            />
          </div>

          <div>
            <Label htmlFor="representative">代表者名*</Label>
            <Textarea
              id="representative"
              placeholder="例: 山田太郎"
              value={formData.support_organization.representative}
              onChange={(e) => handleSupportOrgChange('representative', e.target.value)}
              rows={1}
            />
          </div>

          <div>
            <Label htmlFor="cert_number">認定番号*</Label>
            <Textarea
              id="cert_number"
              placeholder="例: 123456789012"
              value={formData.support_organization.certification_number}
              onChange={(e) => handleSupportOrgChange('certification_number', e.target.value)}
              rows={1}
            />
          </div>

          <div>
            <Label htmlFor="contact_info">連絡先</Label>
            <Textarea
              id="contact_info"
              placeholder="電話番号、メールアドレス等"
              value={formData.support_organization.contact_info}
              onChange={(e) => handleSupportOrgChange('contact_info', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 必要書類チェックリスト */}
      <Card>
        <CardHeader>
          <CardTitle>必要書類チェックリスト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requiredDocuments.map(doc => (
              <div
                key={doc.key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={doc.key}
                    checked={formData.required_documents[doc.key] || false}
                    onChange={(e) => handleDocumentCheck(doc.key, e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor={doc.key} className="flex-1">
                    {doc.name}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
                
                <div className="flex items-center">
                  {formData.required_documents[doc.key] ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : doc.required ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">書類準備のポイント</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 財務諸表は税理士または公認会計士の確認があると良い</li>
              <li>• 売上減少の証明は月次試算表等で具体的に示す</li>
              <li>• 見積書は複数社から取得し比較検討した旨を明記</li>
              <li>• 認定支援機関確認書は事前に相談して作成依頼</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 追加情報 */}
      <Card>
        <CardHeader>
          <CardTitle>追加情報・特記事項</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="additional_notes">その他の準備状況や特記事項</Label>
            <Textarea
              id="additional_notes"
              placeholder="書類準備で工夫した点や、申請に関する特記事項があれば記載してください。"
              value={formData.additional_notes}
              onChange={(e) => {
                const newData = { ...formData, additional_notes: e.target.value };
                setFormData(newData);
                onSave(newData);
              }}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!isFormValid()}
          className="px-8"
        >
          書類準備を完了
        </Button>
      </div>
    </div>
  );
}