/**
 * 公式PDFテンプレート自動入力サービス
 * 各補助金の公式PDFテンプレートに対してデータを自動入力
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../config/logger'

interface FieldMapping {
  pdfFieldName: string
  dataPath: string
  type: 'text' | 'checkbox' | 'dropdown'
  formatter?: (value: any) => string
}

interface SubsidyPDFTemplate {
  subsidyType: string
  templatePath: string
  fieldMappings: FieldMapping[]
}

export class OfficialPdfFillService {
  // 各補助金のテンプレート設定
  private templates: SubsidyPDFTemplate[] = [
    {
      subsidyType: '持続化補助金',
      templatePath: 'templates/jizokuka_template.pdf',
      fieldMappings: [
        { pdfFieldName: '事業者名', dataPath: 'companyInfo.name', type: 'text' },
        { pdfFieldName: '代表者氏名', dataPath: 'companyInfo.representative', type: 'text' },
        { pdfFieldName: '所在地', dataPath: 'companyInfo.address', type: 'text' },
        { pdfFieldName: '電話番号', dataPath: 'companyInfo.phone', type: 'text' },
        { pdfFieldName: '従業員数', dataPath: 'companyInfo.employees', type: 'text', formatter: (v) => `${v}` },
        { pdfFieldName: '事業概要', dataPath: 'businessPlan.summary', type: 'text' },
        { pdfFieldName: '販路開拓計画', dataPath: 'businessPlan.marketExpansion', type: 'text' },
        { pdfFieldName: '補助金申請額', dataPath: 'budgetPlan.subsidyAmount', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` }
      ]
    },
    {
      subsidyType: 'ものづくり補助金',
      templatePath: 'templates/monozukuri_template.pdf',
      fieldMappings: [
        { pdfFieldName: '申請者名', dataPath: 'companyInfo.name', type: 'text' },
        { pdfFieldName: '代表者名', dataPath: 'companyInfo.representative', type: 'text' },
        { pdfFieldName: '本社所在地', dataPath: 'companyInfo.address', type: 'text' },
        { pdfFieldName: '資本金', dataPath: 'companyInfo.capital', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` },
        { pdfFieldName: '従業員数', dataPath: 'companyInfo.employees', type: 'text', formatter: (v) => `${v}` },
        { pdfFieldName: '技術課題', dataPath: 'technicalPlan.challenges', type: 'text' },
        { pdfFieldName: '革新的サービス', dataPath: 'technicalPlan.innovation', type: 'text' },
        { pdfFieldName: '生産プロセス改善', dataPath: 'technicalPlan.processImprovement', type: 'text' },
        { pdfFieldName: '設備投資計画', dataPath: 'investmentPlan.details', type: 'text' },
        { pdfFieldName: '補助事業費', dataPath: 'budget.totalCost', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` }
      ]
    },
    {
      subsidyType: 'IT導入補助金',
      templatePath: 'templates/it_template.pdf',
      fieldMappings: [
        { pdfFieldName: '事業者名', dataPath: 'companyInfo.name', type: 'text' },
        { pdfFieldName: '代表者氏名', dataPath: 'companyInfo.representative', type: 'text' },
        { pdfFieldName: '業種', dataPath: 'companyInfo.industry', type: 'text' },
        { pdfFieldName: '従業員数', dataPath: 'companyInfo.employees', type: 'text' },
        { pdfFieldName: 'ITツール名', dataPath: 'itTool.toolName', type: 'text' },
        { pdfFieldName: 'ベンダー名', dataPath: 'itTool.vendor', type: 'text' },
        { pdfFieldName: '導入目的', dataPath: 'itPlan.purpose', type: 'text' },
        { pdfFieldName: '現在の課題', dataPath: 'itPlan.currentIssues', type: 'text' },
        { pdfFieldName: '期待効果', dataPath: 'itPlan.expectedEffects', type: 'text' },
        { pdfFieldName: '導入費用', dataPath: 'itTool.price', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` },
        { pdfFieldName: 'KPI', dataPath: 'productivityPlan.kpi', type: 'text' }
      ]
    },
    {
      subsidyType: '事業再構築補助金',
      templatePath: 'templates/saikochiku_template.pdf',
      fieldMappings: [
        { pdfFieldName: '申請者名称', dataPath: 'companyInfo.name', type: 'text' },
        { pdfFieldName: '代表者', dataPath: 'companyInfo.representative', type: 'text' },
        { pdfFieldName: '本店所在地', dataPath: 'companyInfo.address', type: 'text' },
        { pdfFieldName: '売上高減少率', dataPath: 'restructuringPlan.salesDeclineRate', type: 'text', formatter: (v) => `${v}%` },
        { pdfFieldName: '新分野展開', dataPath: 'restructuringPlan.newField', type: 'text' },
        { pdfFieldName: '事業転換内容', dataPath: 'restructuringPlan.businessTransformation', type: 'text' },
        { pdfFieldName: '業態転換計画', dataPath: 'restructuringPlan.businessModelChange', type: 'text' },
        { pdfFieldName: '投資額', dataPath: 'budget.investmentAmount', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` },
        { pdfFieldName: '補助金申請額', dataPath: 'budget.subsidyAmount', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` }
      ]
    },
    {
      subsidyType: '業務改善助成金',
      templatePath: 'templates/gyomu_kaizen_template.pdf',
      fieldMappings: [
        { pdfFieldName: '事業場名', dataPath: 'companyInfo.name', type: 'text' },
        { pdfFieldName: '事業主氏名', dataPath: 'companyInfo.representative', type: 'text' },
        { pdfFieldName: '所在地', dataPath: 'companyInfo.address', type: 'text' },
        { pdfFieldName: '労働者数', dataPath: 'companyInfo.employees', type: 'text', formatter: (v) => `${v}` },
        { pdfFieldName: '現在の最低賃金', dataPath: 'wageInfo.currentMinWage', type: 'text', formatter: (v) => `¥${v}` },
        { pdfFieldName: '引上げ後賃金', dataPath: 'wageInfo.raisedWage', type: 'text', formatter: (v) => `¥${v}` },
        { pdfFieldName: '引上げ額', dataPath: 'wageInfo.raiseAmount', type: 'text', formatter: (v) => `¥${v}` },
        { pdfFieldName: '設備投資内容', dataPath: 'equipmentPlan.description', type: 'text' },
        { pdfFieldName: '生産性向上策', dataPath: 'productivityPlan.measures', type: 'text' },
        { pdfFieldName: '設備投資額', dataPath: 'budget.equipmentCost', type: 'text', formatter: (v) => `¥${v.toLocaleString()}` }
      ]
    }
  ]

  /**
   * 公式PDFテンプレートへのデータ入力
   */
  async fillOfficialPDF(
    subsidyType: string,
    applicationData: any,
    outputPath: string
  ): Promise<string> {
    try {
      logger.info('公式PDFテンプレート入力開始', { subsidyType })

      // テンプレート設定を取得
      const template = this.templates.find(t => t.subsidyType === subsidyType)
      if (!template) {
        throw new Error(`${subsidyType}のテンプレート設定が見つかりません`)
      }

      // テンプレートPDFを読み込み
      const templatePath = path.join(process.cwd(), 'assets', template.templatePath)
      const existingPdfBytes = await fs.readFile(templatePath)
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      const form = pdfDoc.getForm()

      // フィールドマッピングに従ってデータを入力
      for (const mapping of template.fieldMappings) {
        try {
          const value = this.getValueByPath(applicationData, mapping.dataPath)
          if (value === null || value === undefined) continue

          const formattedValue = mapping.formatter ? mapping.formatter(value) : String(value)

          switch (mapping.type) {
            case 'text':
              const textField = form.getTextField(mapping.pdfFieldName)
              textField.setText(formattedValue)
              break
            case 'checkbox':
              const checkBox = form.getCheckBox(mapping.pdfFieldName)
              if (value) checkBox.check()
              break
            case 'dropdown':
              const dropdown = form.getDropdown(mapping.pdfFieldName)
              dropdown.select(formattedValue)
              break
          }
        } catch (fieldError) {
          logger.warn('フィールド入力エラー', { 
            field: mapping.pdfFieldName, 
            error: fieldError instanceof Error ? fieldError.message : String(fieldError) 
          })
        }
      }

      // フォームをフラット化（編集不可にする）
      form.flatten()

      // PDFを保存
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(outputPath, pdfBytes)

      logger.info('公式PDFテンプレート入力完了', { subsidyType, outputPath })
      return outputPath

    } catch (error) {
      logger.error('公式PDFテンプレート入力エラー', { subsidyType, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * カスタムPDFテンプレートへのデータ入力
   */
  async fillCustomPDF(
    templatePath: string,
    fieldMappings: FieldMapping[],
    applicationData: any,
    outputPath: string
  ): Promise<string> {
    try {
      const existingPdfBytes = await fs.readFile(templatePath)
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      const form = pdfDoc.getForm()

      // フィールドマッピングに従ってデータを入力
      for (const mapping of fieldMappings) {
        try {
          const value = this.getValueByPath(applicationData, mapping.dataPath)
          if (value === null || value === undefined) continue

          const formattedValue = mapping.formatter ? mapping.formatter(value) : String(value)
          const textField = form.getTextField(mapping.pdfFieldName)
          textField.setText(formattedValue)
        } catch (fieldError) {
          logger.warn('カスタムPDFフィールド入力エラー', { 
            field: mapping.pdfFieldName, 
            error: fieldError instanceof Error ? fieldError.message : String(fieldError) 
          })
        }
      }

      // PDFを保存
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(outputPath, pdfBytes)

      return outputPath

    } catch (error) {
      logger.error('カスタムPDF入力エラー', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * PDFテンプレートのフィールド一覧を取得
   */
  async analyzeTemplate(templatePath: string): Promise<{ name: string; type: string }[]> {
    try {
      const pdfBytes = await fs.readFile(templatePath)
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const form = pdfDoc.getForm()
      const fields = form.getFields()

      return fields.map(field => ({
        name: field.getName(),
        type: field.constructor.name.replace('PDF', '').toLowerCase()
      }))

    } catch (error) {
      logger.error('PDFテンプレート解析エラー', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * ネストされたオブジェクトから値を取得
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  /**
   * 利用可能なテンプレート一覧を取得
   */
  getAvailableTemplates(): string[] {
    return this.templates.map(t => t.subsidyType)
  }
}

export default new OfficialPdfFillService()