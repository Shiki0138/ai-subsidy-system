// PDF-libはクライアントサイドでのみ動作するため、動的インポートを使用
let PDFDocument: any, PDFForm: any, PDFTextField: any, PDFCheckBox: any, PDFDropdown: any, rgb: any, StandardFonts: any;
import { BusinessImprovementApplicationData } from './business-improvement-pdf';

export interface PDFFieldMapping {
  fieldName: string;
  dataPath: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'number' | 'date';
  format?: (value: any) => string;
  coordinates?: { x: number; y: number; width: number; height: number };
}

export class PDFFormFiller {
  private pdfDoc: any = null;
  private form: any = null;
  private initialized = false;

  private async initializePDFLib() {
    if (this.initialized) return;
    
    if (typeof window === 'undefined') {
      throw new Error('PDF-lib can only be used in the browser');
    }
    
    const pdfLib = await import('pdf-lib');
    PDFDocument = pdfLib.PDFDocument;
    PDFForm = pdfLib.PDFForm;
    PDFTextField = pdfLib.PDFTextField;
    PDFCheckBox = pdfLib.PDFCheckBox;
    PDFDropdown = pdfLib.PDFDropdown;
    rgb = pdfLib.rgb;
    StandardFonts = pdfLib.StandardFonts;
    
    this.initialized = true;
  }

  // 業務改善助成金申請書のフィールドマッピング
  private fieldMappings: PDFFieldMapping[] = [
    // 基本情報
    { fieldName: 'company_name', dataPath: 'basicInfo.companyName', type: 'text' },
    { fieldName: 'representative', dataPath: 'basicInfo.representative', type: 'text' },
    { fieldName: 'address', dataPath: 'basicInfo.address', type: 'text' },
    { fieldName: 'phone', dataPath: 'basicInfo.phone', type: 'text' },
    { fieldName: 'email', dataPath: 'basicInfo.email', type: 'text' },
    { fieldName: 'industry', dataPath: 'basicInfo.industry', type: 'text' },
    { fieldName: 'employee_count', dataPath: 'basicInfo.employeeCount', type: 'number', format: (v) => `${v}名` },
    
    // コース情報
    { fieldName: 'course_name', dataPath: 'course.name', type: 'text' },
    { fieldName: 'wage_increase', dataPath: 'course.wageIncrease', type: 'number', format: (v) => `${v}円/時間` },
    { fieldName: 'target_employees', dataPath: 'course.targetEmployees', type: 'number', format: (v) => `${v}名` },
    { fieldName: 'max_subsidy', dataPath: 'course.maxSubsidy', type: 'number', format: (v) => `${v.toLocaleString()}円` },
    
    // 設備情報
    { fieldName: 'equipment_name', dataPath: 'equipment.equipment', type: 'text' },
    { fieldName: 'equipment_cost', dataPath: 'equipment.estimatedCost', type: 'number', format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'expected_effect', dataPath: 'equipment.expectedEffect', type: 'text' },
    
    // 事業計画
    { fieldName: 'necessity', dataPath: 'plan.necessity', type: 'text' },
    { fieldName: 'business_plan', dataPath: 'plan.businessPlan', type: 'text' },
    { fieldName: 'effect_plan', dataPath: 'plan.effectPlan', type: 'text' },
    { fieldName: 'sustainability', dataPath: 'plan.sustainability', type: 'text' },
    
    // 経費計算
    { fieldName: 'equipment_cost_calc', dataPath: 'costs.equipmentCost', type: 'number', format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'total_cost', dataPath: 'costs.totalCost', type: 'number', format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'subsidy_amount', dataPath: 'costs.subsidyAmount', type: 'number', format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'self_burden', dataPath: 'costs', type: 'number', format: (costs) => `${(costs.totalCost - costs.subsidyAmount).toLocaleString()}円` },
    { fieldName: 'subsidy_rate', dataPath: 'costs', type: 'number', format: (costs) => `${Math.round((costs.subsidyAmount / costs.totalCost) * 100)}%` },
    
    // 申請日
    { fieldName: 'application_date', dataPath: '', type: 'date', format: () => new Date().toLocaleDateString('ja-JP') },
  ];

  // 座標ベースのフィールドマッピング（PDFにフォームフィールドがない場合）
  private coordinateFieldMappings: PDFFieldMapping[] = [
    // 1ページ目 - 基本情報
    { fieldName: 'company_name', dataPath: 'basicInfo.companyName', type: 'text', coordinates: { x: 150, y: 720, width: 200, height: 15 } },
    { fieldName: 'representative', dataPath: 'basicInfo.representative', type: 'text', coordinates: { x: 150, y: 700, width: 200, height: 15 } },
    { fieldName: 'address', dataPath: 'basicInfo.address', type: 'text', coordinates: { x: 150, y: 680, width: 300, height: 15 } },
    { fieldName: 'phone', dataPath: 'basicInfo.phone', type: 'text', coordinates: { x: 150, y: 660, width: 150, height: 15 } },
    { fieldName: 'email', dataPath: 'basicInfo.email', type: 'text', coordinates: { x: 150, y: 640, width: 200, height: 15 } },
    { fieldName: 'industry', dataPath: 'basicInfo.industry', type: 'text', coordinates: { x: 150, y: 620, width: 150, height: 15 } },
    { fieldName: 'employee_count', dataPath: 'basicInfo.employeeCount', type: 'number', coordinates: { x: 150, y: 600, width: 100, height: 15 }, format: (v) => `${v}名` },
    
    // コース情報
    { fieldName: 'course_name', dataPath: 'course.name', type: 'text', coordinates: { x: 150, y: 560, width: 200, height: 15 } },
    { fieldName: 'wage_increase', dataPath: 'course.wageIncrease', type: 'number', coordinates: { x: 150, y: 540, width: 150, height: 15 }, format: (v) => `${v}円/時間` },
    { fieldName: 'target_employees', dataPath: 'course.targetEmployees', type: 'number', coordinates: { x: 150, y: 520, width: 100, height: 15 }, format: (v) => `${v}名` },
    { fieldName: 'max_subsidy', dataPath: 'course.maxSubsidy', type: 'number', coordinates: { x: 150, y: 500, width: 150, height: 15 }, format: (v) => `${v.toLocaleString()}円` },
    
    // 設備情報
    { fieldName: 'equipment_name', dataPath: 'equipment.equipment', type: 'text', coordinates: { x: 150, y: 460, width: 200, height: 15 } },
    { fieldName: 'equipment_cost', dataPath: 'equipment.estimatedCost', type: 'number', coordinates: { x: 150, y: 440, width: 150, height: 15 }, format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'expected_effect', dataPath: 'equipment.expectedEffect', type: 'text', coordinates: { x: 150, y: 420, width: 300, height: 40 } },
    
    // 2ページ目 - 事業計画
    { fieldName: 'necessity', dataPath: 'plan.necessity', type: 'text', coordinates: { x: 50, y: 650, width: 500, height: 100 } },
    { fieldName: 'business_plan', dataPath: 'plan.businessPlan', type: 'text', coordinates: { x: 50, y: 500, width: 500, height: 100 } },
    
    // 3ページ目 - 効果・持続性
    { fieldName: 'effect_plan', dataPath: 'plan.effectPlan', type: 'text', coordinates: { x: 50, y: 650, width: 500, height: 100 } },
    { fieldName: 'sustainability', dataPath: 'plan.sustainability', type: 'text', coordinates: { x: 50, y: 500, width: 500, height: 100 } },
    
    // 4ページ目 - 経費計算
    { fieldName: 'equipment_cost_calc', dataPath: 'costs.equipmentCost', type: 'number', coordinates: { x: 150, y: 680, width: 150, height: 15 }, format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'total_cost', dataPath: 'costs.totalCost', type: 'number', coordinates: { x: 150, y: 660, width: 150, height: 15 }, format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'subsidy_amount', dataPath: 'costs.subsidyAmount', type: 'number', coordinates: { x: 150, y: 640, width: 150, height: 15 }, format: (v) => `${v.toLocaleString()}円` },
    { fieldName: 'self_burden', dataPath: 'costs', type: 'number', coordinates: { x: 150, y: 620, width: 150, height: 15 }, format: (costs) => `${(costs.totalCost - costs.subsidyAmount).toLocaleString()}円` },
    { fieldName: 'subsidy_rate', dataPath: 'costs', type: 'number', coordinates: { x: 150, y: 600, width: 100, height: 15 }, format: (costs) => `${Math.round((costs.subsidyAmount / costs.totalCost) * 100)}%` },
    
    // 申請日と署名
    { fieldName: 'application_date', dataPath: '', type: 'date', coordinates: { x: 400, y: 200, width: 150, height: 15 }, format: () => new Date().toLocaleDateString('ja-JP') },
    { fieldName: 'signature_company', dataPath: 'basicInfo.companyName', type: 'text', coordinates: { x: 350, y: 150, width: 200, height: 15 } },
    { fieldName: 'signature_representative', dataPath: 'basicInfo.representative', type: 'text', coordinates: { x: 350, y: 130, width: 200, height: 15 }, format: (v) => `${v} 印` },
  ];

  async loadPDFTemplate(templateBuffer: ArrayBuffer): Promise<void> {
    try {
      await this.initializePDFLib();
      this.pdfDoc = await PDFDocument.load(templateBuffer);
      this.form = this.pdfDoc.getForm();
      console.log('PDF template loaded successfully');
    } catch (error) {
      console.error('Error loading PDF template:', error);
      throw error;
    }
  }

  async fillPDFForm(applicationData: BusinessImprovementApplicationData): Promise<Uint8Array> {
    if (!this.pdfDoc) {
      throw new Error('PDF template not loaded');
    }

    try {
      // フォームフィールドを使用した埋め込みを試行
      if (this.form) {
        await this.fillFormFields(applicationData);
      } else {
        // フォームフィールドがない場合は座標ベースで埋め込み
        await this.fillByCoordinates(applicationData);
      }

      return await this.pdfDoc.save();
    } catch (error) {
      console.error('Error filling PDF form:', error);
      throw error;
    }
  }

  private async fillFormFields(applicationData: BusinessImprovementApplicationData): Promise<void> {
    if (!this.form) return;

    const fields = this.form.getFields();
    console.log('Available form fields:', fields.map(f => f.getName()));

    for (const mapping of this.fieldMappings) {
      try {
        const value = this.getValueFromPath(applicationData, mapping.dataPath);
        if (value === undefined || value === null) continue;

        const formattedValue = mapping.format ? mapping.format(value) : String(value);
        const field = this.form.getField(mapping.fieldName);

        if (field instanceof PDFTextField) {
          field.setText(formattedValue);
        } else if (field instanceof PDFCheckBox) {
          field.check(Boolean(value));
        } else if (field instanceof PDFDropdown) {
          field.select(formattedValue);
        }
      } catch (error) {
        console.warn(`Warning: Could not fill field ${mapping.fieldName}:`, error);
      }
    }
  }

  private async fillByCoordinates(applicationData: BusinessImprovementApplicationData): Promise<void> {
    if (!this.pdfDoc) return;

    const pages = this.pdfDoc.getPages();
    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    for (const mapping of this.coordinateFieldMappings) {
      try {
        const value = this.getValueFromPath(applicationData, mapping.dataPath);
        if (value === undefined || value === null) continue;

        const formattedValue = mapping.format ? mapping.format(value) : String(value);
        const coords = mapping.coordinates;
        if (!coords) continue;

        // ページを特定（簡略化のため、座標のy値でページを判定）
        const pageIndex = this.getPageIndexFromY(coords.y);
        if (pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        
        // 長いテキストの場合は複数行に分割
        const lines = this.wrapText(formattedValue, coords.width, font, fontSize);
        
        for (let i = 0; i < lines.length; i++) {
          const yPosition = coords.y - (i * (fontSize + 2));
          page.drawText(lines[i], {
            x: coords.x,
            y: yPosition,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not fill coordinate field ${mapping.fieldName}:`, error);
      }
    }
  }

  private getValueFromPath(obj: any, path: string): any {
    if (!path) return '';
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    
    return current;
  }

  private getPageIndexFromY(y: number): number {
    // 簡略化：y座標でページを判定
    if (y >= 600) return 0; // 1ページ目
    if (y >= 400) return 1; // 2ページ目
    if (y >= 200) return 2; // 3ページ目
    return 3; // 4ページ目
  }

  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // 単語が長すぎる場合は強制的に改行
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  // PDFテンプレートの分析
  async analyzePDFTemplate(): Promise<{
    hasFormFields: boolean;
    fieldNames: string[];
    pageCount: number;
    formFieldsInfo: any[];
  }> {
    if (!this.pdfDoc) {
      throw new Error('PDF template not loaded');
    }

    await this.initializePDFLib();
    const pages = this.pdfDoc.getPages();
    const pageCount = pages.length;
    
    let hasFormFields = false;
    let fieldNames: string[] = [];
    let formFieldsInfo: any[] = [];

    if (this.form) {
      const fields = this.form.getFields();
      hasFormFields = fields.length > 0;
      fieldNames = fields.map((f: any) => f.getName());
      formFieldsInfo = fields.map((field: any) => ({
        name: field.getName(),
        type: field.constructor.name,
        isReadOnly: field.isReadOnly(),
      }));
    }

    return {
      hasFormFields,
      fieldNames,
      pageCount,
      formFieldsInfo
    };
  }
}

// 使用例（ブラウザ環境でのみ動作）
export async function fillBusinessImprovementPDF(
  templateBuffer: ArrayBuffer,
  applicationData: BusinessImprovementApplicationData
): Promise<Uint8Array> {
  if (typeof window === 'undefined') {
    throw new Error('PDF operations can only be performed in the browser');
  }
  
  const filler = new PDFFormFiller();
  await filler.loadPDFTemplate(templateBuffer);
  return await filler.fillPDFForm(applicationData);
}

// PDFテンプレートの分析（ブラウザ環境でのみ動作）
export async function analyzePDFTemplate(templateBuffer: ArrayBuffer) {
  if (typeof window === 'undefined') {
    throw new Error('PDF operations can only be performed in the browser');
  }
  
  const filler = new PDFFormFiller();
  await filler.loadPDFTemplate(templateBuffer);
  return await filler.analyzePDFTemplate();
}