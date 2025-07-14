'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Edit, 
  Save,
  Eye,
  EyeOff,
  Printer
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ApplicationPreviewProps {
  data: any;
  onUpdate?: (updatedData: any) => void;
  allowEdit?: boolean;
}

export default function ApplicationPreview({ 
  data, 
  onUpdate, 
  allowEdit = true 
}: ApplicationPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedData);
    }
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatSection = (title: string, content: any) => {
    if (!content) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        {typeof content === 'object' ? (
          <div className="space-y-2">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-medium min-w-[200px]">{key}:</span>
                <span className="text-gray-700">{String(value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            申請書プレビュー
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  非表示
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  表示
                </>
              )}
            </Button>
            {allowEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              印刷
            </Button>
          </div>
        </div>
      </CardHeader>

      {showPreview && (
        <CardContent>
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formatted">整形表示</TabsTrigger>
              <TabsTrigger value="raw">テキスト表示</TabsTrigger>
            </TabsList>

            <TabsContent value="formatted" className="mt-6">
              <div className="border rounded-lg p-6 bg-white print:border-0">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">業務改善助成金申請書</h1>
                  <p className="text-gray-600">
                    申請日: {new Date().toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {formatSection('1. 申請事業者情報', {
                  事業者名: editedData.companyName,
                  代表者役職氏名: editedData.representativeName,
                  所在地: editedData.address,
                  業種: editedData.industry,
                  従業員数: editedData.employeeCount,
                  現在の最低賃金: `${editedData.currentMinimumWage}円`
                })}

                {formatSection('2. 生産性向上計画', editedData.productivityPlan)}

                {formatSection('3. 賃金引上げ計画', {
                  引上げ後の時間給: `${editedData.targetWage}円`,
                  引上げ額: `${Number(editedData.targetWage) - Number(editedData.currentMinimumWage)}円`,
                  引上げ対象労働者数: `${editedData.targetEmployeeCount}名`,
                  引上げ実施予定日: editedData.wageIncreaseDate
                })}

                {formatSection('4. 所要経費', {
                  総額: `${editedData.totalCost}円`,
                  内訳: editedData.costBreakdown
                })}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="mt-6">
              {isEditing ? (
                <Textarea
                  value={JSON.stringify(editedData, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditedData(JSON.parse(e.target.value));
                    } catch (error) {
                      // JSONパースエラーの場合は無視
                    }
                  }}
                  className="font-mono text-sm h-96"
                />
              ) : (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto h-96">
                  <code className="text-sm">
                    {JSON.stringify(editedData, null, 2)}
                  </code>
                </pre>
              )}
              {isEditing && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedData(data);
                      setIsEditing(false);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleSave}>
                    変更を保存
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}