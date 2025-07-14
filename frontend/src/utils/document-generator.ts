import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import createReport from 'docx-templates';
import { saveAs } from 'file-saver';

export interface DocumentData {
  [key: string]: string | number | boolean | undefined;
}

export class DocumentGenerator {
  static async generatePDF(data: DocumentData, templateType: 'gyomu-kaizen'): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // フォント設定
    doc.setFont('helvetica');
    
    // タイトル
    doc.setFontSize(16);
    doc.text('業務改善助成金申請書', 105, 20, { align: 'center' });
    
    // 申請日
    doc.setFontSize(10);
    doc.text(`申請日: ${new Date().toLocaleDateString('ja-JP')}`, 160, 30);
    
    let yPosition = 50;
    
    // セクション1: 申請事業者情報
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. 申請事業者情報', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const applicantInfo = [
      { label: '事業者名', value: data.companyName },
      { label: '代表者役職・氏名', value: data.representativeName },
      { label: '所在地', value: data.address },
      { label: '業種', value: data.industry },
      { label: '従業員数', value: data.employeeCount },
      { label: '現在の最低賃金', value: data.currentMinimumWage }
    ];
    
    applicantInfo.forEach(item => {
      if (item.value) {
        doc.text(`${item.label}: ${item.value}`, 25, yPosition);
        yPosition += 8;
      }
    });
    
    // セクション2: 生産性向上計画
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('2. 生産性向上計画', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    if (data.productivityPlan) {
      const lines = doc.splitTextToSize(String(data.productivityPlan), 165);
      doc.text(lines, 25, yPosition);
      yPosition += lines.length * 6;
    }
    
    // セクション3: 賃金引上げ計画
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('3. 賃金引上げ計画', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    const wageInfo = [
      { label: '引上げ後の時間給', value: data.targetWage },
      { label: '引上げ対象労働者数', value: data.targetEmployeeCount },
      { label: '引上げ実施予定日', value: data.wageIncreaseDate }
    ];
    
    wageInfo.forEach(item => {
      if (item.value) {
        doc.text(`${item.label}: ${item.value}`, 25, yPosition);
        yPosition += 8;
      }
    });
    
    // セクション4: 所要経費
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('4. 所要経費', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    if (data.totalCost) {
      doc.text(`総額: ${data.totalCost}円`, 25, yPosition);
      yPosition += 8;
    }
    
    if (data.costBreakdown) {
      const lines = doc.splitTextToSize(String(data.costBreakdown), 165);
      doc.text(lines, 25, yPosition);
    }
    
    // PDFを保存
    doc.save(`業務改善助成金申請書_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static async generateDOCX(data: DocumentData, templatePath?: string): Promise<void> {
    try {
      let template: ArrayBuffer;
      
      if (templatePath) {
        // テンプレートファイルを読み込む
        const response = await fetch(templatePath);
        template = await response.arrayBuffer();
      } else {
        // デフォルトテンプレートを作成
        template = await this.createDefaultDOCXTemplate();
      }
      
      // データをテンプレートに適用
      const buffer = await createReport({
        template,
        data: {
          ...data,
          申請日: new Date().toLocaleDateString('ja-JP'),
          年度: new Date().getFullYear()
        }
      });
      
      // ファイルを保存
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      saveAs(blob, `業務改善助成金申請書_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error('DOCX生成エラー:', error);
      throw error;
    }
  }

  private static async createDefaultDOCXTemplate(): Promise<ArrayBuffer> {
    // 基本的なDOCXテンプレートを作成
    const templateContent = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>業務改善助成金申請書</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>申請日: {{申請日}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>1. 申請事業者情報</w:t></w:r></w:p>
    <w:p><w:r><w:t>事業者名: {{companyName}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>代表者: {{representativeName}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>所在地: {{address}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. 生産性向上計画</w:t></w:r></w:p>
    <w:p><w:r><w:t>{{productivityPlan}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. 賃金引上げ計画</w:t></w:r></w:p>
    <w:p><w:r><w:t>目標賃金: {{targetWage}}円</w:t></w:r></w:p>
    <w:p><w:r><w:t>4. 所要経費</w:t></w:r></w:p>
    <w:p><w:r><w:t>総額: {{totalCost}}円</w:t></w:r></w:p>
  </w:body>
</w:document>`;
    
    return new TextEncoder().encode(templateContent).buffer;
  }

  static async generateFromOfficialTemplate(
    data: DocumentData, 
    officialTemplate: ArrayBuffer
  ): Promise<void> {
    try {
      // 公式テンプレートにデータを埋め込む
      const pdfDoc = await PDFDocument.load(officialTemplate);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // フォント設定
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 10;
      
      // データを配置（座標は公式フォーマットに応じて調整が必要）
      const fields = [
        { key: 'companyName', x: 150, y: 700 },
        { key: 'representativeName', x: 150, y: 670 },
        { key: 'address', x: 150, y: 640 },
        { key: 'industry', x: 150, y: 610 },
        { key: 'employeeCount', x: 150, y: 580 },
        { key: 'currentMinimumWage', x: 150, y: 550 }
      ];
      
      fields.forEach(field => {
        if (data[field.key]) {
          firstPage.drawText(String(data[field.key]), {
            x: field.x,
            y: field.y,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
        }
      });
      
      // PDFを保存
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `業務改善助成金申請書_記入済_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('公式テンプレート処理エラー:', error);
      throw error;
    }
  }
}