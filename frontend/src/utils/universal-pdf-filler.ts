// 汎用PDF記入システム - 原型を変えずに空欄のみ記入

import { PDFTemplateInfo, FieldMapping, FieldConfig, StandardApplicationFields, PDFProcessResult } from '@/types/pdf-template';

interface PDFLibTypes {
  PDFDocument: any;
  PDFForm: any;
  PDFTextField: any;
  PDFCheckBox: any;
  PDFDropdown: any;
  rgb: any;
  StandardFonts: any;
  degrees: any;
}

export class UniversalPDFFiller {
  private pdfDoc: any = null;
  private form: any = null;
  private pdfLib: PDFLibTypes | null = null;
  private templateInfo: PDFTemplateInfo | null = null;

  /**
   * pdf-libライブラリの初期化（クライアントサイドのみ）
   */
  private async initializePDFLib(): Promise<PDFLibTypes> {
    if (typeof window === 'undefined') {
      throw new Error('PDF処理はクライアントサイドでのみ実行可能です');
    }
    
    if (!this.pdfLib) {
      const pdfLibModule = await import('pdf-lib');
      this.pdfLib = {
        PDFDocument: pdfLibModule.PDFDocument,
        PDFForm: pdfLibModule.PDFForm,
        PDFTextField: pdfLibModule.PDFTextField,
        PDFCheckBox: pdfLibModule.PDFCheckBox,
        PDFDropdown: pdfLibModule.PDFDropdown,
        rgb: pdfLibModule.rgb,
        StandardFonts: pdfLibModule.StandardFonts,
        degrees: pdfLibModule.degrees
      };
    }
    
    return this.pdfLib;
  }

  /**
   * PDFテンプレートを読み込み、フォームを準備
   */
  async loadTemplate(pdfBytes: ArrayBuffer, templateInfo: PDFTemplateInfo): Promise<void> {
    try {
      const { PDFDocument } = await this.initializePDFLib();
      
      // PDFドキュメントを読み込み（原型を保持）
      this.pdfDoc = await PDFDocument.load(pdfBytes);
      this.templateInfo = templateInfo;
      
      // フォームが存在する場合は取得
      try {
        this.form = this.pdfDoc.getForm();
        console.log('フォームフィールド検出:', this.form ? '成功' : '失敗');
      } catch (error) {
        console.log('フォームフィールドが存在しません。座標ベースで処理します。');
        this.form = null;
      }
      
    } catch (error) {
      console.error('PDFテンプレート読み込みエラー:', error);
      throw new Error('PDFテンプレートの読み込みに失敗しました: ' + (error as Error).message);
    }
  }

  /**
   * 申請データを使用してPDFの空欄を記入
   */
  async fillApplication(applicationData: StandardApplicationFields): Promise<PDFProcessResult> {
    if (!this.pdfDoc || !this.templateInfo) {
      throw new Error('PDFテンプレートが読み込まれていません');
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // フィールドマッピングに基づいて記入
      for (const [dataKey, fieldConfig] of Object.entries(this.templateInfo.fieldMapping)) {
        try {
          const value = this.getValueFromData(applicationData, dataKey);
          if (value !== undefined && value !== null && value !== '') {
            await this.fillField(fieldConfig, value);
          }
        } catch (error) {
          errors.push(`フィールド "${dataKey}" の記入エラー: ${(error as Error).message}`);
        }
      }

      // フォームを平坦化（編集不可にして原型を保持）
      if (this.form) {
        try {
          this.form.flatten();
        } catch (error) {
          warnings.push('フォームの平坦化に失敗しました。手動で編集される可能性があります。');
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 ? '申請書の記入が完了しました' : '一部フィールドの記入に失敗しました',
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: 'PDF記入処理中にエラーが発生しました',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 個別フィールドの記入処理
   */
  private async fillField(fieldConfig: FieldConfig, value: any): Promise<void> {
    const { rgb, StandardFonts } = await this.initializePDFLib();

    // フォームフィールドが存在する場合
    if (this.form && fieldConfig.fieldName) {
      try {
        await this.fillFormField(fieldConfig, value);
        return;
      } catch (error) {
        console.warn(`フォームフィールド "${fieldConfig.fieldName}" への記入に失敗。座標ベースで試行します。`);
      }
    }

    // 座標ベースで記入
    if (fieldConfig.coordinates) {
      await this.fillByCoordinates(fieldConfig, value);
    }
  }

  /**
   * フォームフィールドへの記入
   */
  private async fillFormField(fieldConfig: FieldConfig, value: any): Promise<void> {
    if (!this.form || !fieldConfig.fieldName) return;

    const field = this.form.getField(fieldConfig.fieldName);
    if (!field) {
      throw new Error(`フィールド "${fieldConfig.fieldName}" が見つかりません`);
    }

    const stringValue = String(value);

    switch (fieldConfig.type) {
      case 'text':
      case 'multiline':
      case 'number':
      case 'date':
        if (field.constructor.name === 'PDFTextField') {
          field.setText(stringValue);
          if (fieldConfig.format?.fontSize) {
            field.setFontSize(fieldConfig.format.fontSize);
          }
        }
        break;

      case 'checkbox':
        if (field.constructor.name === 'PDFCheckBox') {
          if (value === true || value === 'true' || value === '1') {
            field.check();
          } else {
            field.uncheck();
          }
        }
        break;

      case 'select':
        if (field.constructor.name === 'PDFDropdown') {
          field.select(stringValue);
        }
        break;
    }
  }

  /**
   * 座標ベースでの記入
   */
  private async fillByCoordinates(fieldConfig: FieldConfig, value: any): Promise<void> {
    if (!fieldConfig.coordinates) return;

    const { rgb, StandardFonts } = await this.initializePDFLib();
    const pages = this.pdfDoc.getPages();
    const page = pages[fieldConfig.coordinates.page - 1]; // 1-indexed to 0-indexed

    if (!page) {
      throw new Error(`ページ ${fieldConfig.coordinates.page} が見つかりません`);
    }

    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = fieldConfig.format?.fontSize || 10;
    const fontColor = this.parseColor(fieldConfig.format?.fontColor || '#000000');

    const stringValue = String(value);

    if (fieldConfig.type === 'multiline') {
      // 複数行テキストの処理
      await this.drawMultilineText(page, stringValue, fieldConfig, font, fontSize, fontColor);
    } else {
      // 単一行テキストの処理
      page.drawText(stringValue, {
        x: fieldConfig.coordinates.x,
        y: fieldConfig.coordinates.y,
        size: fontSize,
        font: font,
        color: fontColor,
        maxWidth: fieldConfig.coordinates.width,
      });
    }
  }

  /**
   * 複数行テキストの描画
   */
  private async drawMultilineText(
    page: any,
    text: string,
    fieldConfig: FieldConfig,
    font: any,
    fontSize: number,
    color: any
  ): Promise<void> {
    const coords = fieldConfig.coordinates!;
    const lineHeight = fieldConfig.format?.lineHeight || fontSize * 1.2;
    const maxWidth = coords.width || 500;
    
    // 日本語対応: 文字単位で改行判定
    const lines = this.wrapText(text, font, fontSize, maxWidth);
    
    lines.forEach((line, index) => {
      const y = coords.y - (index * lineHeight);
      page.drawText(line, {
        x: coords.x,
        y: y,
        size: fontSize,
        font: font,
        color: color,
      });
    });
  }

  /**
   * テキストの折り返し処理（日本語対応）
   */
  private wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      
      let currentLine = '';
      for (const char of paragraph) {
        const testLine = currentLine + char;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = char;
          } else {
            lines.push(char);
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
    }
    
    return lines;
  }

  /**
   * 申請データから値を取得
   */
  private getValueFromData(data: StandardApplicationFields, key: string): any {
    const keys = key.split('.');
    let value: any = data;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value;
  }

  /**
   * 色文字列をRGBオブジェクトに変換
   */
  private parseColor(colorStr: string): any {
    const { rgb } = this.pdfLib!;
    
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    
    return rgb(0, 0, 0); // デフォルト: 黒
  }

  /**
   * 記入済みPDFを保存
   */
  async save(): Promise<Uint8Array> {
    if (!this.pdfDoc) {
      throw new Error('PDFドキュメントが読み込まれていません');
    }
    
    return await this.pdfDoc.save();
  }

  /**
   * PDFテンプレートの分析（フィールド検出）
   */
  async analyzeTemplate(): Promise<{
    hasFormFields: boolean;
    fieldNames: string[];
    pageCount: number;
    formFieldTypes: { [key: string]: string };
  }> {
    if (!this.pdfDoc) {
      throw new Error('PDFドキュメントが読み込まれていません');
    }

    const pages = this.pdfDoc.getPages();
    const hasFormFields = this.form !== null;
    const fieldNames: string[] = [];
    const formFieldTypes: { [key: string]: string } = {};

    if (hasFormFields) {
      const fields = this.form.getFields();
      fields.forEach((field: any) => {
        const name = field.getName();
        const type = field.constructor.name;
        fieldNames.push(name);
        formFieldTypes[name] = type;
      });
    }

    return {
      hasFormFields,
      fieldNames,
      pageCount: pages.length,
      formFieldTypes
    };
  }
}

// ヘルパー関数
export async function fillPDFWithUniversalFiller(
  pdfBytes: ArrayBuffer,
  templateInfo: PDFTemplateInfo,
  applicationData: StandardApplicationFields
): Promise<{ success: boolean; pdfBytes?: Uint8Array; error?: string }> {
  try {
    const filler = new UniversalPDFFiller();
    await filler.loadTemplate(pdfBytes, templateInfo);
    const result = await filler.fillApplication(applicationData);
    
    if (result.success) {
      const filledPdfBytes = await filler.save();
      return { success: true, pdfBytes: filledPdfBytes };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}