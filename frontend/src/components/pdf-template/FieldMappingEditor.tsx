'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Save, Eye, Settings } from 'lucide-react';
import { FieldMapping, FieldConfig } from '@/types/pdf-template';

interface FieldMappingEditorProps {
  initialMapping?: FieldMapping;
  detectedFields?: string[];
  onMappingChange: (mapping: FieldMapping) => void;
  onSave: (mapping: FieldMapping) => void;
}

export default function FieldMappingEditor({
  initialMapping = {},
  detectedFields = [],
  onMappingChange,
  onSave
}: FieldMappingEditorProps) {
  const [mapping, setMapping] = useState<FieldMapping>(initialMapping);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(false);

  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  // 標準フィールドの定義
  const standardFields = [
    { key: 'companyName', label: '事業者名', type: 'text' },
    { key: 'representative', label: '代表者名', type: 'text' },
    { key: 'postalCode', label: '郵便番号', type: 'text' },
    { key: 'address', label: '所在地', type: 'text' },
    { key: 'phoneNumber', label: '電話番号', type: 'text' },
    { key: 'faxNumber', label: 'FAX番号', type: 'text' },
    { key: 'emailAddress', label: 'メールアドレス', type: 'text' },
    { key: 'website', label: 'ウェブサイト', type: 'text' },
    { key: 'industryType', label: '業種', type: 'text' },
    { key: 'employeeCount', label: '従業員数', type: 'number' },
    { key: 'annualRevenue', label: '年間売上', type: 'number' },
    { key: 'establishedYear', label: '設立年', type: 'number' },
    { key: 'applicationDate', label: '申請日', type: 'date' },
    { key: 'projectTitle', label: '事業名', type: 'text' },
    { key: 'businessPlan', label: '事業計画', type: 'multiline' },
    { key: 'necessity', label: '必要性', type: 'multiline' },
    { key: 'expectedEffect', label: '期待される効果', type: 'multiline' },
    { key: 'implementationMethod', label: '実施方法', type: 'multiline' },
    { key: 'totalProjectCost', label: '総事業費', type: 'number' },
    { key: 'subsidyRequestAmount', label: '助成金申請額', type: 'number' },
    { key: 'remarks', label: '備考', type: 'multiline' }
  ];

  const addField = () => {
    const newKey = `custom_${Date.now()}`;
    setMapping(prev => ({
      ...prev,
      [newKey]: {
        type: 'text',
        label: '新規フィールド',
        format: {
          fontSize: 10,
          fontColor: '#000000'
        }
      }
    }));
    setSelectedField(newKey);
  };

  const removeField = (key: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[key];
      return newMapping;
    });
    if (selectedField === key) {
      setSelectedField(null);
    }
  };

  const updateField = (key: string, updates: Partial<FieldConfig>) => {
    setMapping(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates
      }
    }));
  };

  const handleSave = () => {
    onSave(mapping);
  };

  const renderFieldEditor = (key: string, field: FieldConfig) => {
    const isSelected = selectedField === key;
    
    return (
      <Card key={key} className={`mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedField(isSelected ? null : key)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <CardTitle className="text-sm">{field.label}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {field.type}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeField(key)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isSelected && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              {/* 基本設定 */}
              <div>
                <Label htmlFor={`${key}-label`}>ラベル</Label>
                <Input
                  id={`${key}-label`}
                  value={field.label}
                  onChange={(e) => updateField(key, { label: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor={`${key}-type`}>タイプ</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(key, { type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">テキスト</SelectItem>
                    <SelectItem value="number">数値</SelectItem>
                    <SelectItem value="date">日付</SelectItem>
                    <SelectItem value="multiline">複数行</SelectItem>
                    <SelectItem value="checkbox">チェックボックス</SelectItem>
                    <SelectItem value="select">選択</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* フォームフィールド名 */}
              <div className="col-span-2">
                <Label htmlFor={`${key}-fieldName`}>フォームフィールド名</Label>
                <Select
                  value={field.fieldName || ''}
                  onValueChange={(value) => updateField(key, { fieldName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="フォームフィールドを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">座標ベース</SelectItem>
                    {detectedFields.map(fieldName => (
                      <SelectItem key={fieldName} value={fieldName}>
                        {fieldName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 座標設定 */}
              {(!field.fieldName || showCoordinates) && (
                <>
                  <div>
                    <Label htmlFor={`${key}-page`}>ページ</Label>
                    <Input
                      id={`${key}-page`}
                      type="number"
                      value={field.coordinates?.page || 1}
                      onChange={(e) => updateField(key, {
                        coordinates: {
                          ...field.coordinates,
                          page: parseInt(e.target.value) || 1,
                          x: field.coordinates?.x || 0,
                          y: field.coordinates?.y || 0
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`${key}-x`}>X座標</Label>
                    <Input
                      id={`${key}-x`}
                      type="number"
                      value={field.coordinates?.x || 0}
                      onChange={(e) => updateField(key, {
                        coordinates: {
                          ...field.coordinates,
                          page: field.coordinates?.page || 1,
                          x: parseInt(e.target.value) || 0,
                          y: field.coordinates?.y || 0
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`${key}-y`}>Y座標</Label>
                    <Input
                      id={`${key}-y`}
                      type="number"
                      value={field.coordinates?.y || 0}
                      onChange={(e) => updateField(key, {
                        coordinates: {
                          ...field.coordinates,
                          page: field.coordinates?.page || 1,
                          x: field.coordinates?.x || 0,
                          y: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`${key}-width`}>幅</Label>
                    <Input
                      id={`${key}-width`}
                      type="number"
                      value={field.coordinates?.width || ''}
                      onChange={(e) => updateField(key, {
                        coordinates: {
                          ...field.coordinates,
                          page: field.coordinates?.page || 1,
                          x: field.coordinates?.x || 0,
                          y: field.coordinates?.y || 0,
                          width: parseInt(e.target.value) || undefined
                        }
                      })}
                    />
                  </div>
                </>
              )}

              {/* フォーマット設定 */}
              <div>
                <Label htmlFor={`${key}-fontSize`}>フォントサイズ</Label>
                <Input
                  id={`${key}-fontSize`}
                  type="number"
                  value={field.format?.fontSize || 10}
                  onChange={(e) => updateField(key, {
                    format: {
                      ...field.format,
                      fontSize: parseInt(e.target.value) || 10
                    }
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor={`${key}-fontColor`}>フォント色</Label>
                <Input
                  id={`${key}-fontColor`}
                  type="color"
                  value={field.format?.fontColor || '#000000'}
                  onChange={(e) => updateField(key, {
                    format: {
                      ...field.format,
                      fontColor: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">フィールドマッピング設定</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="show-coordinates">座標表示</Label>
            <Switch
              id="show-coordinates"
              checked={showCoordinates}
              onCheckedChange={setShowCoordinates}
            />
          </div>
          <Button onClick={addField} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            フィールド追加
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {detectedFields.length > 0 && (
        <Alert>
          <AlertDescription>
            PDFから{detectedFields.length}個のフォームフィールドが検出されました。
            フィールドマッピングで選択できます。
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {Object.entries(mapping).map(([key, field]) => 
          renderFieldEditor(key, field)
        )}
      </div>

      {Object.keys(mapping).length === 0 && (
        <Alert>
          <AlertDescription>
            フィールドマッピングが設定されていません。
            「フィールド追加」ボタンから設定を開始してください。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>クイック設定</CardTitle>
          <CardDescription>
            標準的なフィールドを一括で追加できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {standardFields.map(field => (
              <Button
                key={field.key}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!mapping[field.key]) {
                    setMapping(prev => ({
                      ...prev,
                      [field.key]: {
                        type: field.type as any,
                        label: field.label,
                        format: {
                          fontSize: 10,
                          fontColor: '#000000'
                        }
                      }
                    }));
                  }
                }}
                disabled={!!mapping[field.key]}
              >
                {field.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}