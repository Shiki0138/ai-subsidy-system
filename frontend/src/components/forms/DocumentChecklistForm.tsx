'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Alert } from '../ui/Alert';
import { Modal } from '../ui/Modal';

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  category: 'mandatory' | 'conditional' | 'optional';
  conditions?: string[];
  fileTypes: string[];
  maxSize: number;
  template?: {
    url: string;
    name: string;
    description: string;
  };
  examples?: {
    url: string;
    name: string;
    description: string;
  }[];
  checkpoints: string[];
  commonErrors: string[];
  tips: string[];
}

interface DocumentCheckResult {
  documentId: string;
  status: 'missing' | 'uploaded' | 'verified' | 'error';
  issues: string[];
  suggestions: string[];
  completeness: number;
}

interface DocumentCheckResponse {
  checklist: DocumentRequirement[];
  results: DocumentCheckResult[];
  overallCompleteness: number;
  missingDocuments: DocumentRequirement[];
  recommendations: string[];
}

interface DocumentChecklistFormProps {
  subsidyProgramId: string;
  companyProfile: any;
  onDocumentUpload: (file: File, documentId: string) => Promise<void>;
  onComplete: () => void;
}

const DocumentChecklistForm: React.FC<DocumentChecklistFormProps> = ({
  subsidyProgramId,
  companyProfile,
  onDocumentUpload,
  onComplete
}) => {
  const [checklistData, setChecklistData] = useState<DocumentCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRequirement | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDocumentChecklist();
  }, [subsidyProgramId, companyProfile]);

  const loadDocumentChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents/checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subsidyProgramId,
          companyProfile,
          uploadedDocuments: [] // 実際の実装では現在アップロード済みの書類リストを渡す
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setChecklistData(result.data);
      }
    } catch (error) {
      console.error('書類チェックリスト取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, documentId: string) => {
    setUploadingDocuments(prev => new Set(prev).add(documentId));
    
    try {
      await onDocumentUpload(file, documentId);
      await loadDocumentChecklist(); // チェックリストを再読み込み
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
    } finally {
      setUploadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      mandatory: { color: 'red', text: '必須', icon: '🔴' },
      conditional: { color: 'yellow', text: '条件付き', icon: '🟡' },
      optional: { color: 'gray', text: '任意', icon: '⚪' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig];
    
    return (
      <Badge variant={config.color as any}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = {
      missing: '❌',
      uploaded: '✅',
      verified: '✨',
      error: '⚠️'
    };
    
    return statusConfig[status as keyof typeof statusConfig] || '❓';
  };

  const getStatusText = (status: string) => {
    const statusText = {
      missing: '未提出',
      uploaded: 'アップロード済み',
      verified: '確認済み',
      error: 'エラー'
    };
    
    return statusText[status as keyof typeof statusText] || '不明';
  };

  const openDocumentDetails = (document: DocumentRequirement) => {
    setSelectedDocument(document);
  };

  const closeDocumentDetails = () => {
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">書類チェックリストを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!checklistData) {
    return (
      <Alert variant="error">
        書類チェックリストの読み込みに失敗しました。ページを再読み込みしてください。
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 進捗サマリー */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">提出書類の進捗</h3>
          <span className="text-2xl font-bold text-blue-600">
            {checklistData.overallCompleteness}%
          </span>
        </div>
        
        <Progress value={checklistData.overallCompleteness} className="mb-4" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {checklistData.results.filter(r => r.status === 'uploaded' || r.status === 'verified').length}
            </div>
            <div className="text-sm text-gray-600">提出済み</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {checklistData.missingDocuments.length}
            </div>
            <div className="text-sm text-gray-600">未提出（必須）</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {checklistData.results.filter(r => r.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">要修正</div>
          </div>
        </div>
      </Card>

      {/* 改善提案 */}
      {checklistData.recommendations.length > 0 && (
        <Alert variant="info">
          <div className="space-y-2">
            <strong>📋 提出前のチェックポイント:</strong>
            <ul className="list-disc list-inside space-y-1">
              {checklistData.recommendations.map((rec, index) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* 書類チェックリスト */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">提出書類一覧</h3>
        
        {checklistData.checklist.map((document, index) => {
          const result = checklistData.results[index];
          const isUploading = uploadingDocuments.has(document.id);
          
          return (
            <Card key={document.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <span className="text-2xl">
                    {getStatusIcon(result.status)}
                  </span>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{document.name}</h4>
                    {getCategoryBadge(document.category)}
                    <Badge variant={result.status === 'uploaded' ? 'green' : 'gray'}>
                      {getStatusText(result.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{document.description}</p>
                  
                  {/* 条件表示 */}
                  {document.conditions && document.conditions.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-blue-600">適用条件:</span>
                      <ul className="text-xs text-gray-600 list-disc list-inside ml-2">
                        {document.conditions.map((condition, idx) => (
                          <li key={idx}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* ファイル要件 */}
                  <div className="text-xs text-gray-500 mb-3">
                    形式: {document.fileTypes.join(', ').toUpperCase()} | 
                    上限: {document.maxSize}MB
                  </div>
                  
                  {/* エラー・提案表示 */}
                  {result.issues.length > 0 && (
                    <Alert variant="error" className="mb-3">
                      <ul className="text-sm space-y-1">
                        {result.issues.map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                  
                  {result.suggestions.length > 0 && (
                    <Alert variant="warning" className="mb-3">
                      <ul className="text-sm space-y-1">
                        {result.suggestions.map((suggestion, idx) => (
                          <li key={idx}>💡 {suggestion}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                </div>
                
                <div className="flex-shrink-0 space-y-2">
                  {/* ファイルアップロード */}
                  <div>
                    <input
                      type="file"
                      id={`file-${document.id}`}
                      className="hidden"
                      accept={document.fileTypes.map(type => `.${type}`).join(',')}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, document.id);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <Button
                      variant={result.status === 'uploaded' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => document.getElementById(`file-${document.id}`)?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? '🔄 アップロード中...' : 
                       result.status === 'uploaded' ? '📝 再アップロード' : '📁 ファイル選択'}
                    </Button>
                  </div>
                  
                  {/* テンプレートダウンロード */}
                  {document.template && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(document.template?.url, '_blank')}
                    >
                      📋 テンプレート
                    </Button>
                  )}
                  
                  {/* 詳細表示 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDocumentDetails(document)}
                  >
                    ℹ️ 詳細
                  </Button>
                </div>
              </div>
              
              {/* 進捗バー */}
              {result.completeness < 100 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>完了度</span>
                    <span>{result.completeness}%</span>
                  </div>
                  <Progress value={result.completeness} size="sm" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 完了ボタン */}
      <div className="flex justify-center">
        <Button
          onClick={onComplete}
          disabled={checklistData.overallCompleteness < 100}
          size="lg"
        >
          {checklistData.overallCompleteness < 100
            ? `書類提出を完了する (${checklistData.overallCompleteness}%)`
            : '✅ 書類提出完了 - 次のステップへ'
          }
        </Button>
      </div>

      {/* 書類詳細モーダル */}
      <Modal
        isOpen={!!selectedDocument}
        onClose={closeDocumentDetails}
        title={selectedDocument?.name || ''}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">📋 確認ポイント</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {selectedDocument.checkpoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚠️ よくある間違い</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                {selectedDocument.commonErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">💡 作成のコツ</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                {selectedDocument.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
            
            {selectedDocument.examples && selectedDocument.examples.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">📄 記載例</h4>
                <div className="space-y-2">
                  {selectedDocument.examples.map((example, index) => (
                    <a
                      key={index}
                      href={example.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 border rounded hover:bg-gray-50"
                    >
                      <div className="font-medium text-blue-600">{example.name}</div>
                      <div className="text-sm text-gray-600">{example.description}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentChecklistForm;