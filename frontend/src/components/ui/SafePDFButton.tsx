'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { BusinessImprovementApplicationData } from '@/utils/business-improvement-pdf';
import { 
  generateBusinessImprovementPDFSafely, 
  fillPDFTemplateSafely, 
  downloadPDF,
  PDFGenerationOptions 
} from '@/utils/pdf-client-only';

interface SafePDFButtonProps {
  data: BusinessImprovementApplicationData;
  templateBuffer?: ArrayBuffer;
  fileName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  options?: PDFGenerationOptions;
}

export const SafePDFButton: React.FC<SafePDFButtonProps> = ({
  data,
  templateBuffer,
  fileName = '業務改善助成金申請書.pdf',
  className = '',
  variant = 'default',
  size = 'default',
  options
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePDFGeneration = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // データの検証
      if (!data || !data.basicInfo) {
        throw new Error('申請データが不完全です。基本情報を確認してください。');
      }

      let result;
      
      if (templateBuffer) {
        // 既存PDFテンプレートへの埋め込み
        result = await fillPDFTemplateSafely(templateBuffer, data, options);
      } else {
        // React-PDFでの新規生成
        result = await generateBusinessImprovementPDFSafely(data, options);
      }

      if (result.success) {
        downloadPDF(result, fileName);
      } else {
        // 詳細なエラー情報を提供
        let errorMessage = result.error || 'PDF生成に失敗しました';
        
        if (errorMessage.includes('Invalid border style')) {
          errorMessage = 'PDF生成エラー: スタイル設定に問題があります。システム管理者に報告してください。';
        } else if (errorMessage.includes('fontkit')) {
          errorMessage = 'PDF生成エラー: フォント処理に問題があります。ページを再読み込みしてください。';
        } else if (errorMessage.includes('canvas')) {
          errorMessage = 'PDF生成エラー: ブラウザの機能に問題があります。別のブラウザで試してください。';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      
      let errorMessage = 'PDF生成中にエラーが発生しました';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid border style')) {
          errorMessage = 'PDF生成エラー: スタイル設定に問題があります。システム管理者に報告してください。';
        } else if (error.message.includes('window')) {
          errorMessage = 'PDF生成エラー: ブラウザ環境でのみ動作します。';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={handlePDFGeneration}
          className={`${className} border-red-300 text-red-600 hover:bg-red-50`}
        >
          <FileText className="h-4 w-4 mr-2" />
          再試行
        </Button>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePDFGeneration}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          PDF生成中...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          PDF形式でダウンロード
        </>
      )}
    </Button>
  );
};

export default SafePDFButton;