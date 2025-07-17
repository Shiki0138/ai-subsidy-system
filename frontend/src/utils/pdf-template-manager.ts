// PDF申請書テンプレート管理システム

import { PDFTemplateInfo, FieldMapping, SubsidyTypeMapping } from '@/types/pdf-template';

export class PDFTemplateManager {
  private templates: Map<string, PDFTemplateInfo> = new Map();
  private subsidyMappings: SubsidyTypeMapping = {};

  /**
   * テンプレートを登録
   */
  async registerTemplate(
    subsidyType: string,
    pdfFile: File,
    fieldMapping: FieldMapping,
    metadata: Partial<PDFTemplateInfo> = {}
  ): Promise<string> {
    const templateId = this.generateTemplateId(subsidyType);
    
    const templateInfo: PDFTemplateInfo = {
      id: templateId,
      subsidyType,
      name: metadata.name || `${subsidyType}申請書`,
      description: metadata.description || '',
      fileName: pdfFile.name,
      uploadDate: new Date().toISOString(),
      isActive: true,
      fieldMapping,
      pageCount: 0, // 後で分析時に設定
      hasFormFields: false, // 後で分析時に設定
      isGovernmentOfficial: metadata.isGovernmentOfficial || true,
      ...metadata
    };

    this.templates.set(templateId, templateInfo);
    
    // LocalStorageに保存
    this.saveToStorage();
    
    return templateId;
  }

  /**
   * テンプレートを取得
   */
  getTemplate(templateId: string): PDFTemplateInfo | undefined {
    return this.templates.get(templateId);
  }

  /**
   * 補助金タイプ別のテンプレートを取得
   */
  getTemplateBySubsidyType(subsidyType: string): PDFTemplateInfo | undefined {
    for (const template of this.templates.values()) {
      if (template.subsidyType === subsidyType && template.isActive) {
        return template;
      }
    }
    return undefined;
  }

  /**
   * すべてのテンプレートを取得
   */
  getAllTemplates(): PDFTemplateInfo[] {
    return Array.from(this.templates.values());
  }

  /**
   * アクティブなテンプレートのみを取得
   */
  getActiveTemplates(): PDFTemplateInfo[] {
    return Array.from(this.templates.values()).filter(t => t.isActive);
  }

  /**
   * テンプレートを更新
   */
  updateTemplate(templateId: string, updates: Partial<PDFTemplateInfo>): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    this.templates.set(templateId, { ...template, ...updates });
    this.saveToStorage();
    return true;
  }

  /**
   * テンプレートを削除
   */
  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * テンプレートを無効化
   */
  deactivateTemplate(templateId: string): boolean {
    return this.updateTemplate(templateId, { isActive: false });
  }

  /**
   * フィールドマッピングを更新
   */
  updateFieldMapping(templateId: string, fieldMapping: FieldMapping): boolean {
    return this.updateTemplate(templateId, { fieldMapping });
  }

  /**
   * 補助金タイプのマッピングを設定
   */
  setSubsidyMapping(subsidyType: string, mapping: SubsidyTypeMapping[string]): void {
    this.subsidyMappings[subsidyType] = mapping;
    this.saveToStorage();
  }

  /**
   * 補助金タイプのマッピングを取得
   */
  getSubsidyMapping(subsidyType: string): SubsidyTypeMapping[string] | undefined {
    return this.subsidyMappings[subsidyType];
  }

  /**
   * LocalStorageに保存
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          templates: Array.from(this.templates.entries()),
          subsidyMappings: this.subsidyMappings
        };
        localStorage.setItem('pdf-templates', JSON.stringify(data));
      } catch (error) {
        console.error('テンプレートの保存に失敗:', error);
      }
    }
  }

  /**
   * LocalStorageから読み込み
   */
  loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem('pdf-templates');
        if (data) {
          const parsed = JSON.parse(data);
          this.templates = new Map(parsed.templates || []);
          this.subsidyMappings = parsed.subsidyMappings || {};
        }
      } catch (error) {
        console.error('テンプレートの読み込みに失敗:', error);
      }
    }
  }

  /**
   * テンプレートIDを生成
   */
  private generateTemplateId(subsidyType: string): string {
    return `template_${subsidyType}_${Date.now()}`;
  }

  /**
   * 初期化
   */
  initialize(): void {
    this.loadFromStorage();
    this.setupDefaultMappings();
  }

  /**
   * デフォルトのマッピングを設定
   */
  private setupDefaultMappings(): void {
    // 業務改善助成金のデフォルトマッピング
    if (!this.subsidyMappings['gyomu-kaizen']) {
      this.subsidyMappings['gyomu-kaizen'] = {
        templateId: 'default-gyomu-kaizen',
        requiredFields: [
          'companyName', 'representative', 'address', 'phoneNumber', 'emailAddress',
          'employeeCount', 'applicationDate', 'businessPlan', 'necessity',
          'expectedEffect', 'totalProjectCost', 'subsidyRequestAmount'
        ],
        optionalFields: [
          'faxNumber', 'website', 'industryType', 'annualRevenue', 'remarks'
        ]
      };
    }

    // IT導入補助金のデフォルトマッピング
    if (!this.subsidyMappings['it-introduction']) {
      this.subsidyMappings['it-introduction'] = {
        templateId: 'default-it-introduction',
        requiredFields: [
          'companyName', 'representative', 'address', 'phoneNumber', 'emailAddress',
          'employeeCount', 'applicationDate', 'projectTitle', 'businessPlan',
          'implementationMethod', 'totalProjectCost', 'subsidyRequestAmount'
        ],
        optionalFields: [
          'faxNumber', 'website', 'industryType', 'annualRevenue', 'attachments'
        ]
      };
    }

    // 小規模事業者持続化補助金のデフォルトマッピング
    if (!this.subsidyMappings['jizokukas']) {
      this.subsidyMappings['jizokukas'] = {
        templateId: 'default-jizokukas',
        requiredFields: [
          'companyName', 'representative', 'address', 'phoneNumber', 'emailAddress',
          'employeeCount', 'applicationDate', 'businessPurpose', 'businessPlan',
          'expectedEffect', 'totalProjectCost', 'subsidyRequestAmount'
        ],
        optionalFields: [
          'faxNumber', 'website', 'industryType', 'establishedYear', 'certificationItems'
        ]
      };
    }
  }

  /**
   * 補助金タイプの検証
   */
  validateSubsidyType(subsidyType: string): boolean {
    const validTypes = [
      'gyomu-kaizen',
      'it-introduction', 
      'jizokukas',
      'monozukuri',
      'career-development',
      'green-innovation',
      'dx-investment'
    ];
    return validTypes.includes(subsidyType);
  }

  /**
   * テンプレートの検証
   */
  validateTemplate(templateInfo: PDFTemplateInfo): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!templateInfo.subsidyType) {
      errors.push('補助金タイプが指定されていません');
    } else if (!this.validateSubsidyType(templateInfo.subsidyType)) {
      errors.push('無効な補助金タイプです');
    }

    if (!templateInfo.name) {
      errors.push('テンプレート名が指定されていません');
    }

    if (!templateInfo.fileName) {
      errors.push('ファイル名が指定されていません');
    }

    if (!templateInfo.fieldMapping || Object.keys(templateInfo.fieldMapping).length === 0) {
      errors.push('フィールドマッピングが設定されていません');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// シングルトンインスタンス
export const templateManager = new PDFTemplateManager();