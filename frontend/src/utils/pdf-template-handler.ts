// 国の指定申請書フォーマットへの対応を含むPDFテンプレート処理

// クライアントサイドでのみ実行されるPDFテンプレート処理
// pdf-libは動的インポートで使用

interface PDFLibTypes {
  PDFDocument: any;
  PDFForm: any;
  PDFTextField: any;
  rgb: any;
  StandardFonts: any;
}

export interface FormFieldMapping {
  // 申請書の項目名と対応するフィールド名
  companyName?: string;          // 事業者名
  representative?: string;        // 代表者名
  address?: string;              // 所在地
  phone?: string;                // 電話番号
  email?: string;                // メールアドレス
  industry?: string;             // 業種
  employeeCount?: string;        // 従業員数
  applicationDate?: string;      // 申請日
  
  // 事業計画関連
  businessPlan?: string;         // 事業計画
  necessity?: string;            // 導入の必要性
  expectedEffect?: string;       // 期待される効果
  
  // 金額関連
  equipmentCost?: string;        // 設備費
  subsidyAmount?: string;        // 助成金申請額
  totalCost?: string;           // 総事業費
}

// 業務改善助成金の標準フィールドマッピング
export const GYOMU_KAIZEN_FIELD_MAPPING: FormFieldMapping = {
  companyName: 'company_name',
  representative: 'representative_name',
  address: 'company_address',
  phone: 'phone_number',
  email: 'email_address',
  industry: 'industry_type',
  employeeCount: 'employee_count',
  applicationDate: 'application_date',
  businessPlan: 'business_plan_detail',
  necessity: 'necessity_detail',
  expectedEffect: 'expected_effect_detail',
  equipmentCost: 'equipment_cost_amount',
  subsidyAmount: 'subsidy_request_amount',
  totalCost: 'total_project_cost'
};

export class GovernmentPDFHandler {
  private pdfDoc: any = null;
  private form: any = null;
  private pdfLib: PDFLibTypes | null = null;

  /**
   * pdf-libライブラリの初期化（クライアントサイドのみ）
   */
  private async initializePDFLib() {
    if (typeof window === 'undefined') {
      throw new Error('このコンポーネントはクライアントサイドでのみ使用できます');
    }
    
    if (!this.pdfLib) {
      const pdfLibModule = await import('pdf-lib');
      this.pdfLib = {
        PDFDocument: pdfLibModule.PDFDocument,
        PDFForm: pdfLibModule.PDFForm,
        PDFTextField: pdfLibModule.PDFTextField,
        rgb: pdfLibModule.rgb,
        StandardFonts: pdfLibModule.StandardFonts
      };
    }
    
    return this.pdfLib;
  }

  /**
   * 国の申請書PDFテンプレートを読み込む
   */
  async loadGovernmentTemplate(pdfBytes: ArrayBuffer): Promise<void> {
    try {
      const { PDFDocument } = await this.initializePDFLib();
      this.pdfDoc = await PDFDocument.load(pdfBytes);
      this.form = this.pdfDoc.getForm();
      
      // フォームフィールドが存在するか確認
      if (this.form) {
        const fields = this.form.getFields();
        console.log('検出されたフォームフィールド数:', fields.length);
        
        // デバッグ用：全フィールド名を出力
        fields.forEach(field => {
          console.log('フィールド名:', field.getName());
        });
      } else {
        console.log('フォームフィールドが存在しません。座標ベースの埋め込みを使用します。');
      }
    } catch (error) {
      console.error('PDFテンプレートの読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * フォームフィールドに値を埋め込む
   */
  async fillFormFields(data: any, mapping: FormFieldMapping = GYOMU_KAIZEN_FIELD_MAPPING): Promise<void> {
    if (!this.form) {
      console.log('フォームフィールドが存在しないため、座標ベースの埋め込みを実行します。');
      await this.fillByCoordinates(data);
      return;
    }

    try {
      // 基本情報の埋め込み
      if (mapping.companyName && data.basicInfo?.companyName) {
        const field = this.form.getTextField(mapping.companyName);
        field?.setText(data.basicInfo.companyName);
      }

      if (mapping.representative && data.basicInfo?.representative) {
        const field = this.form.getTextField(mapping.representative);
        field?.setText(data.basicInfo.representative);
      }

      if (mapping.address && data.basicInfo?.address) {
        const field = this.form.getTextField(mapping.address);
        field?.setText(data.basicInfo.address);
      }

      if (mapping.phone && data.basicInfo?.phone) {
        const field = this.form.getTextField(mapping.phone);
        field?.setText(data.basicInfo.phone);
      }

      if (mapping.email && data.basicInfo?.email) {
        const field = this.form.getTextField(mapping.email);
        field?.setText(data.basicInfo.email);
      }

      if (mapping.industry && data.basicInfo?.industry) {
        const field = this.form.getTextField(mapping.industry);
        field?.setText(data.basicInfo.industry);
      }

      if (mapping.employeeCount && data.basicInfo?.employeeCount) {
        const field = this.form.getTextField(mapping.employeeCount);
        field?.setText(String(data.basicInfo.employeeCount));
      }

      // 申請日
      if (mapping.applicationDate) {
        const field = this.form.getTextField(mapping.applicationDate);
        field?.setText(new Date().toLocaleDateString('ja-JP'));
      }

      // 事業計画関連
      if (mapping.businessPlan && data.plan?.businessPlan) {
        const field = this.form.getTextField(mapping.businessPlan);
        field?.setText(data.plan.businessPlan);
      }

      if (mapping.necessity && data.plan?.necessity) {
        const field = this.form.getTextField(mapping.necessity);
        field?.setText(data.plan.necessity);
      }

      if (mapping.expectedEffect && data.plan?.effectPlan) {
        const field = this.form.getTextField(mapping.expectedEffect);
        field?.setText(data.plan.effectPlan);
      }

      // 金額関連
      if (mapping.equipmentCost && data.costs?.equipmentCost) {
        const field = this.form.getTextField(mapping.equipmentCost);
        field?.setText(data.costs.equipmentCost.toLocaleString());
      }

      if (mapping.subsidyAmount && data.costs?.subsidyAmount) {
        const field = this.form.getTextField(mapping.subsidyAmount);
        field?.setText(data.costs.subsidyAmount.toLocaleString());
      }

      if (mapping.totalCost && data.costs?.totalCost) {
        const field = this.form.getTextField(mapping.totalCost);
        field?.setText(data.costs.totalCost.toLocaleString());
      }

      // フォームをフラット化（編集不可にする）
      this.form.flatten();
      
    } catch (error) {
      console.error('フォームフィールドへの埋め込みエラー:', error);
      throw error;
    }
  }

  /**
   * 座標ベースでの埋め込み（フォームフィールドがない場合）
   */
  private async fillByCoordinates(data: any): Promise<void> {
    if (!this.pdfDoc) return;

    const pages = this.pdfDoc.getPages();
    const firstPage = pages[0];
    
    // 日本語フォントの埋め込み
    const { StandardFonts } = await this.initializePDFLib();
    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // 座標マッピング（業務改善助成金申請書の標準レイアウト）
    const coordinateMapping = {
      companyName: { x: 200, y: 700, size: 12 },
      representative: { x: 200, y: 670, size: 12 },
      address: { x: 200, y: 640, size: 10 },
      phone: { x: 200, y: 610, size: 10 },
      email: { x: 200, y: 580, size: 10 },
      industry: { x: 200, y: 550, size: 10 },
      employeeCount: { x: 200, y: 520, size: 10 },
      applicationDate: { x: 450, y: 750, size: 10 },
    };

    // 基本情報の描画
    if (data.basicInfo?.companyName) {
      firstPage.drawText(data.basicInfo.companyName, {
        x: coordinateMapping.companyName.x,
        y: coordinateMapping.companyName.y,
        size: coordinateMapping.companyName.size,
        font: font,
        color: this.pdfLib!.rgb(0, 0, 0),
      });
    }

    if (data.basicInfo?.representative) {
      firstPage.drawText(data.basicInfo.representative, {
        x: coordinateMapping.representative.x,
        y: coordinateMapping.representative.y,
        size: coordinateMapping.representative.size,
        font: font,
        color: this.pdfLib!.rgb(0, 0, 0),
      });
    }

    if (data.basicInfo?.address) {
      firstPage.drawText(data.basicInfo.address, {
        x: coordinateMapping.address.x,
        y: coordinateMapping.address.y,
        size: coordinateMapping.address.size,
        font: font,
        color: this.pdfLib!.rgb(0, 0, 0),
      });
    }

    // 申請日
    firstPage.drawText(new Date().toLocaleDateString('ja-JP'), {
      x: coordinateMapping.applicationDate.x,
      y: coordinateMapping.applicationDate.y,
      size: coordinateMapping.applicationDate.size,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 2ページ目以降の事業計画等も同様に処理
    if (pages.length > 1 && data.plan) {
      const secondPage = pages[1];
      
      // 事業計画の描画（長文対応）
      if (data.plan.businessPlan) {
        this.drawMultilineText(
          secondPage,
          data.plan.businessPlan,
          { x: 50, y: 700, width: 500, lineHeight: 15 },
          font,
          10
        );
      }
    }
  }

  /**
   * 複数行テキストの描画
   */
  private drawMultilineText(
    page: any,
    text: string,
    position: { x: number; y: number; width: number; lineHeight: number },
    font: any,
    fontSize: number
  ): void {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // 単語を行に分割
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth <= position.width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    // 各行を描画
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: position.x,
        y: position.y - (index * position.lineHeight),
        size: fontSize,
        font: font,
        color: this.pdfLib!.rgb(0, 0, 0),
      });
    });
  }

  /**
   * 編集済みPDFを保存
   */
  async save(): Promise<Uint8Array> {
    if (!this.pdfDoc) {
      throw new Error('PDFドキュメントが読み込まれていません');
    }
    
    return await this.pdfDoc.save();
  }

  /**
   * PDFテンプレートの分析
   */
  async analyzeTemplate(): Promise<{
    hasFormFields: boolean;
    fieldNames: string[];
    pageCount: number;
    isGovernmentForm: boolean;
  }> {
    if (!this.pdfDoc) {
      throw new Error('PDFドキュメントが読み込まれていません');
    }

    const pages = this.pdfDoc.getPages();
    const hasFormFields = this.form !== null && this.form.getFields().length > 0;
    const fieldNames = hasFormFields ? this.form!.getFields().map(f => f.getName()) : [];
    
    // 政府指定フォームかどうかの判定（特定のフィールド名で判断）
    const governmentFieldKeywords = ['事業者名', '代表者', '申請日', '助成金'];
    const isGovernmentForm = fieldNames.some(name => 
      governmentFieldKeywords.some(keyword => name.includes(keyword))
    );

    return {
      hasFormFields,
      fieldNames,
      pageCount: pages.length,
      isGovernmentForm
    };
  }
}

// 使いやすいヘルパー関数
export async function fillGovernmentPDF(
  pdfBytes: ArrayBuffer,
  applicationData: any,
  customMapping?: FormFieldMapping
): Promise<Uint8Array> {
  const handler = new GovernmentPDFHandler();
  await handler.loadGovernmentTemplate(pdfBytes);
  await handler.fillFormFields(applicationData, customMapping);
  return await handler.save();
}

export async function analyzeGovernmentPDF(pdfBytes: ArrayBuffer) {
  const handler = new GovernmentPDFHandler();
  await handler.loadGovernmentTemplate(pdfBytes);
  return await handler.analyzeTemplate();
}