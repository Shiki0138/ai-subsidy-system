// PDF関連ライブラリのクライアントサイドでのみ動作する統一インターフェース

import { BusinessImprovementApplicationData } from './business-improvement-pdf';

// 型定義
export interface PDFGenerationOptions {
  fileName?: string;
  format?: 'a4' | 'letter';
  margin?: number;
}

export interface PDFGenerationResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  url?: string;
}

// クライアントサイドでのみ動作することを保証
export const isClientSide = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

// エラーハンドリング付きのPDF生成クラス
export class SafePDFGenerator {
  private static instance: SafePDFGenerator;
  private initialized: boolean = false;
  private reactPDFRenderer: any = null;
  private pdfLib: any = null;

  private constructor() {}

  public static getInstance(): SafePDFGenerator {
    if (!SafePDFGenerator.instance) {
      SafePDFGenerator.instance = new SafePDFGenerator();
    }
    return SafePDFGenerator.instance;
  }

  // PDF-libの初期化
  private async initializePDFLib() {
    if (this.pdfLib) return;
    
    if (!isClientSide()) {
      throw new Error('PDF generation can only be performed on the client side');
    }

    try {
      this.pdfLib = await import('pdf-lib');
      console.log('PDF-lib initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PDF-lib:', error);
      throw error;
    }
  }

  // React-PDF-Rendererの初期化
  private async initializeReactPDFRenderer() {
    if (this.reactPDFRenderer) return;
    
    if (!isClientSide()) {
      throw new Error('PDF generation can only be performed on the client side');
    }

    try {
      this.reactPDFRenderer = await import('@react-pdf/renderer');
      console.log('React-PDF-Renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize React-PDF-Renderer:', error);
      throw error;
    }
  }

  // 既存PDFテンプレートへの埋め込み
  public async fillPDFTemplate(
    templateBuffer: ArrayBuffer,
    data: BusinessImprovementApplicationData,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      if (!isClientSide()) {
        return {
          success: false,
          error: 'PDF generation can only be performed on the client side'
        };
      }

      await this.initializePDFLib();
      
      const { PDFDocument, StandardFonts, rgb } = this.pdfLib;
      const pdfDoc = await PDFDocument.load(templateBuffer);
      
      // 基本情報の埋め込み
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // データの埋め込み処理
      this.embedDataToPage(firstPage, data, font);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      return {
        success: true,
        blob,
        url
      };
    } catch (error) {
      console.error('PDF template fill error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // React-PDFでの新規PDF生成
  public async generateReactPDF(
    data: BusinessImprovementApplicationData,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      if (!isClientSide()) {
        return {
          success: false,
          error: 'PDF generation can only be performed on the client side'
        };
      }

      await this.initializeReactPDFRenderer();
      
      // React-PDFコンポーネントの動的インポート
      const { generateBusinessImprovementPDFReact } = await import('./business-improvement-pdf-react-improved');
      
      const MyDocument = generateBusinessImprovementPDFReact(data);
      const blob = await this.reactPDFRenderer.pdf(MyDocument).toBlob();
      const url = URL.createObjectURL(blob);
      
      return {
        success: true,
        blob,
        url
      };
    } catch (error) {
      console.error('React-PDF generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // データをPDFページに埋め込む
  private embedDataToPage(page: any, data: BusinessImprovementApplicationData, font: any) {
    const { rgb } = this.pdfLib;
    
    // 基本情報の埋め込み
    if (data.basicInfo) {
      page.drawText(data.basicInfo.companyName || '', {
        x: 150,
        y: 720,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(data.basicInfo.representative || '', {
        x: 150,
        y: 700,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(data.basicInfo.address || '', {
        x: 150,
        y: 680,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // 申請日の埋め込み
    page.drawText(new Date().toLocaleDateString('ja-JP'), {
      x: 400,
      y: 750,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // リソースのクリーンアップ
  public cleanup() {
    this.initialized = false;
    this.reactPDFRenderer = null;
    this.pdfLib = null;
  }
}

// 便利な関数
export const generateBusinessImprovementPDFSafely = async (
  data: BusinessImprovementApplicationData,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> => {
  const generator = SafePDFGenerator.getInstance();
  return await generator.generateReactPDF(data, options);
};

export const fillPDFTemplateSafely = async (
  templateBuffer: ArrayBuffer,
  data: BusinessImprovementApplicationData,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> => {
  const generator = SafePDFGenerator.getInstance();
  return await generator.fillPDFTemplate(templateBuffer, data, options);
};

// PDFダウンロード用のヘルパー関数
export const downloadPDF = (result: PDFGenerationResult, fileName: string = 'document.pdf') => {
  if (!result.success || !result.url) {
    console.error('PDF download failed:', result.error);
    return;
  }

  const link = document.createElement('a');
  link.href = result.url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // URLをクリーンアップ
  URL.revokeObjectURL(result.url);
};