import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import Handlebars from 'handlebars';

const prisma = new PrismaClient();

interface CreateTemplateData {
  documentType: string;
  templateName: string;
  description?: string;
  structure: any;
  defaultContent: any;
  requiredFields: string[];
  placeholders?: any;
  formatOptions?: any;
  validationRules?: any;
  category?: string;
  tags?: string[];
}

interface UpdateTemplateData {
  templateName?: string;
  description?: string;
  structure?: any;
  defaultContent?: any;
  requiredFields?: string[];
  placeholders?: any;
  formatOptions?: any;
  validationRules?: any;
  isActive?: boolean;
  category?: string;
  tags?: string[];
}

interface GetTemplatesFilters {
  documentType?: string;
  category?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

interface GetUserDocumentsFilters {
  status?: string;
  templateId?: string;
  page: number;
  limit: number;
}

class DocumentTemplateService {
  /**
   * テンプレートを作成
   */
  async createTemplate(data: CreateTemplateData) {
    try {
      // テンプレート名の重複チェック
      const existingTemplate = await prisma.documentTemplate.findFirst({
        where: {
          templateName: data.templateName,
          documentType: data.documentType
        }
      });

      if (existingTemplate) {
        throw new Error('Template with this name already exists for this document type');
      }

      const template = await prisma.documentTemplate.create({
        data: {
          documentType: data.documentType,
          templateName: data.templateName,
          description: data.description,
          structure: data.structure,
          defaultContent: data.defaultContent,
          requiredFields: data.requiredFields,
          placeholders: data.placeholders,
          formatOptions: data.formatOptions,
          validationRules: data.validationRules,
          category: data.category,
          tags: data.tags || [],
          version: '1.0',
          isActive: true
        }
      });

      logger.info('✅ Document template created', {
        templateId: template.id,
        documentType: data.documentType,
        templateName: data.templateName
      });

      return template;

    } catch (error) {
      logger.error('❌ Failed to create document template', {
        documentType: data.documentType,
        templateName: data.templateName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * テンプレート一覧を取得
   */
  async getTemplates(filters: GetTemplatesFilters) {
    try {
      const { documentType, category, isActive, page, limit } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (documentType) {
        where.documentType = documentType;
      }
      
      if (category) {
        where.category = category;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [templates, total] = await Promise.all([
        prisma.documentTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { usageCount: 'desc' },
            { createdAt: 'desc' }
          ],
          select: {
            id: true,
            documentType: true,
            templateName: true,
            description: true,
            category: true,
            tags: true,
            version: true,
            isActive: true,
            usageCount: true,
            lastUsedAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                generatedDocuments: true
              }
            }
          }
        }),
        prisma.documentTemplate.count({ where })
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ Failed to get templates', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * テンプレート詳細を取得
   */
  async getTemplateById(templateId: string) {
    try {
      const template = await prisma.documentTemplate.findFirst({
        where: {
          id: templateId,
          isActive: true
        },
        include: {
          _count: {
            select: {
              generatedDocuments: true
            }
          }
        }
      });

      return template;

    } catch (error) {
      logger.error('❌ Failed to get template', {
        templateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * テンプレートを更新
   */
  async updateTemplate(templateId: string, data: UpdateTemplateData) {
    try {
      const existingTemplate = await prisma.documentTemplate.findUnique({
        where: { id: templateId }
      });

      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // バージョン更新の判定
      const shouldUpdateVersion = data.structure || data.defaultContent || data.requiredFields;
      const newVersion = shouldUpdateVersion 
        ? this.incrementVersion(existingTemplate.version)
        : existingTemplate.version;

      const template = await prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          ...data,
          version: newVersion,
          updatedAt: new Date()
        },
        include: {
          _count: {
            select: {
              generatedDocuments: true
            }
          }
        }
      });

      logger.info('✅ Document template updated', {
        templateId,
        newVersion,
        changes: Object.keys(data)
      });

      return template;

    } catch (error) {
      logger.error('❌ Failed to update template', {
        templateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ドキュメントを生成
   */
  async generateDocument(
    templateId: string,
    inputData: any,
    title: string,
    fileFormat: string,
    userId: string
  ) {
    try {
      const template = await prisma.documentTemplate.findFirst({
        where: {
          id: templateId,
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Template not found or inactive');
      }

      // 必須フィールドの検証
      await this.validateRequiredFields(template.requiredFields, inputData);

      // バリデーションルールの適用
      if (template.validationRules) {
        await this.applyValidationRules(template.validationRules as any, inputData);
      }

      // テンプレートエンジンでコンテンツ生成
      const generatedContent = this.processTemplate(template, inputData);

      // ドキュメント作成
      const document = await prisma.generatedDocument.create({
        data: {
          templateId,
          userId,
          title,
          content: generatedContent,
          metadata: {
            inputData: inputData,
            templateVersion: template.version,
            generatedAt: new Date(),
            fileFormat
          },
          fileFormat,
          status: 'DRAFT'
        },
        include: {
          template: {
            select: {
              id: true,
              templateName: true,
              documentType: true
            }
          }
        }
      });

      // テンプレートの使用統計を更新
      await prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1
          },
          lastUsedAt: new Date()
        }
      });

      logger.info('📄 Document generated from template', {
        templateId,
        documentId: document.id,
        title,
        fileFormat,
        userId
      });

      return document;

    } catch (error) {
      logger.error('❌ Failed to generate document', {
        templateId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ユーザーの生成済みドキュメント一覧を取得
   */
  async getUserDocuments(userId: string, filters: GetUserDocumentsFilters) {
    try {
      const { status, templateId, page, limit } = filters;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      
      if (status) {
        where.status = status;
      }
      
      if (templateId) {
        where.templateId = templateId;
      }

      const [documents, total] = await Promise.all([
        prisma.generatedDocument.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            template: {
              select: {
                id: true,
                templateName: true,
                documentType: true,
                category: true
              }
            }
          }
        }),
        prisma.generatedDocument.count({ where })
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ Failed to get user documents', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 生成済みドキュメント詳細を取得
   */
  async getGeneratedDocument(documentId: string, userId: string) {
    try {
      const document = await prisma.generatedDocument.findFirst({
        where: {
          id: documentId,
          userId
        },
        include: {
          template: {
            select: {
              id: true,
              templateName: true,
              documentType: true,
              category: true,
              structure: true,
              formatOptions: true
            }
          }
        }
      });

      return document;

    } catch (error) {
      logger.error('❌ Failed to get generated document', {
        documentId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ドキュメントを確定
   */
  async finalizeDocument(documentId: string, userId: string) {
    try {
      const document = await prisma.generatedDocument.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      if (document.status !== 'DRAFT') {
        throw new Error('Only draft documents can be finalized');
      }

      // ここでPDF/Word生成処理を実行
      const fileUrl = await this.generateFile(document);

      const finalizedDocument = await prisma.generatedDocument.update({
        where: { id: documentId },
        data: {
          status: 'FINALIZED',
          finalizedAt: new Date(),
          fileUrl
        },
        include: {
          template: {
            select: {
              id: true,
              templateName: true,
              documentType: true
            }
          }
        }
      });

      logger.info('✅ Document finalized', {
        documentId,
        userId,
        finalizedAt: finalizedDocument.finalizedAt
      });

      return finalizedDocument;

    } catch (error) {
      logger.error('❌ Failed to finalize document', {
        documentId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * テンプレートを複製
   */
  async duplicateTemplate(templateId: string, newTemplateName: string) {
    try {
      const originalTemplate = await prisma.documentTemplate.findUnique({
        where: { id: templateId }
      });

      if (!originalTemplate) {
        throw new Error('Original template not found');
      }

      // 新しい名前の重複チェック
      const existingTemplate = await prisma.documentTemplate.findFirst({
        where: {
          templateName: newTemplateName,
          documentType: originalTemplate.documentType
        }
      });

      if (existingTemplate) {
        throw new Error('Template with this name already exists');
      }

      const duplicatedTemplate = await prisma.documentTemplate.create({
        data: {
          documentType: originalTemplate.documentType,
          templateName: newTemplateName,
          description: `Copy of ${originalTemplate.templateName}`,
          structure: originalTemplate.structure,
          defaultContent: originalTemplate.defaultContent,
          requiredFields: originalTemplate.requiredFields,
          placeholders: originalTemplate.placeholders,
          formatOptions: originalTemplate.formatOptions,
          validationRules: originalTemplate.validationRules,
          category: originalTemplate.category,
          tags: originalTemplate.tags,
          version: '1.0',
          isActive: true
        }
      });

      logger.info('📄 Template duplicated', {
        originalTemplateId: templateId,
        newTemplateId: duplicatedTemplate.id,
        newTemplateName
      });

      return duplicatedTemplate;

    } catch (error) {
      logger.error('❌ Failed to duplicate template', {
        templateId,
        newTemplateName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * テンプレートを削除
   */
  async deleteTemplate(templateId: string) {
    try {
      // 関連する生成済みドキュメントの確認
      const documentCount = await prisma.generatedDocument.count({
        where: { templateId }
      });

      if (documentCount > 0) {
        // 論理削除（関連ドキュメントがある場合）
        await prisma.documentTemplate.update({
          where: { id: templateId },
          data: { isActive: false }
        });

        logger.info('📄 Template deactivated (soft delete)', {
          templateId,
          relatedDocuments: documentCount
        });
      } else {
        // 物理削除（関連ドキュメントがない場合）
        await prisma.documentTemplate.delete({
          where: { id: templateId }
        });

        logger.info('🗑️ Template deleted (hard delete)', {
          templateId
        });
      }

    } catch (error) {
      logger.error('❌ Failed to delete template', {
        templateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * テンプレートエンジンでコンテンツを処理
   */
  private processTemplate(template: any, inputData: any) {
    try {
      // Handlebarsテンプレートとして処理
      const content = template.defaultContent;
      
      // カスタムヘルパーの登録
      this.registerHandlebarsHelpers();

      const processedContent: any = {};

      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string') {
          const template = Handlebars.compile(value);
          processedContent[key] = template(inputData);
        } else {
          processedContent[key] = value;
        }
      }

      return processedContent;

    } catch (error) {
      logger.error('❌ Template processing failed', {
        templateId: template.id,
        error: error.message
      });
      throw new Error('Template processing failed');
    }
  }

  /**
   * Handlebarsカスタムヘルパーを登録
   */
  private registerHandlebarsHelpers() {
    // 日付フォーマット
    Handlebars.registerHelper('formatDate', (date: any, format?: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'YYYY-MM-DD') {
        return d.toISOString().split('T')[0];
      }
      return d.toLocaleDateString('ja-JP');
    });

    // 数値フォーマット（カンマ区切り）
    Handlebars.registerHelper('formatNumber', (number: any) => {
      if (typeof number !== 'number') return '';
      return number.toLocaleString('ja-JP');
    });

    // 条件分岐
    Handlebars.registerHelper('ifEquals', (arg1: any, arg2: any, options: any) => {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // 配列の結合
    Handlebars.registerHelper('join', (array: any[], separator = ', ') => {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    });
  }

  /**
   * 必須フィールドを検証
   */
  private async validateRequiredFields(requiredFields: any, inputData: any) {
    if (!Array.isArray(requiredFields)) return;

    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!this.hasValue(inputData, field)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * バリデーションルールを適用
   */
  private async applyValidationRules(rules: any, inputData: any) {
    // 実装例：文字数制限、形式チェックなど
    for (const [field, rule] of Object.entries(rules)) {
      const value = this.getValue(inputData, field);
      
      if (rule && typeof rule === 'object') {
        const r = rule as any;
        
        // 最小・最大文字数
        if (r.minLength && value.length < r.minLength) {
          throw new Error(`Field ${field} must be at least ${r.minLength} characters`);
        }
        
        if (r.maxLength && value.length > r.maxLength) {
          throw new Error(`Field ${field} must be at most ${r.maxLength} characters`);
        }
        
        // 正規表現パターン
        if (r.pattern && !new RegExp(r.pattern).test(value)) {
          throw new Error(`Field ${field} format is invalid`);
        }
      }
    }
  }

  /**
   * オブジェクトの値を取得（ドット記法対応）
   */
  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj) || '';
  }

  /**
   * オブジェクトの値が存在するかチェック
   */
  private hasValue(obj: any, path: string): boolean {
    const value = this.getValue(obj, path);
    return value !== undefined && value !== null && value !== '';
  }

  /**
   * バージョン番号を増加
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0] || '1');
    const minor = parseInt(parts[1] || '0');
    
    return `${major}.${minor + 1}`;
  }

  /**
   * ファイル生成（PDF/Word）
   */
  private async generateFile(document: any): Promise<string> {
    try {
      // 開発環境では模擬URLを返す
      if (process.env.NODE_ENV === 'development') {
        return `/api/files/generated/${document.id}.${document.fileFormat.toLowerCase()}`;
      }

      // 実際のファイル生成処理は後で実装
      // PDFKit, Puppeteer, docxtemplater等を使用
      
      throw new Error('File generation not implemented in production yet');

    } catch (error) {
      logger.error('❌ File generation failed', {
        documentId: document.id,
        error: error.message
      });
      throw error;
    }
  }
}

export const documentTemplateService = new DocumentTemplateService();