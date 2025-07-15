import { jsPDF } from 'jspdf';

export interface BusinessImprovementApplicationData {
  basicInfo: {
    companyName: string;
    representative: string;
    address: string;
    phone: string;
    email: string;
    industry: string;
    employeeCount: number;
  };
  course: {
    name: string;
    wageIncrease: number;
    targetEmployees: number;
    maxSubsidy: number;
  };
  equipment: {
    equipment: string;
    estimatedCost: number;
    expectedEffect: string;
  };
  plan: {
    necessity: string;
    businessPlan: string;
    effectPlan: string;
    sustainability: string;
  };
  costs: {
    equipmentCost: number;
    totalCost: number;
    subsidyAmount: number;
  };
}

export class BusinessImprovementPDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
  }

  generatePDF(data: BusinessImprovementApplicationData): void {
    this.setupFonts();
    this.addHeader();
    this.addBasicInfo(data.basicInfo);
    this.addCourseInfo(data.course);
    this.addEquipmentInfo(data.equipment);
    this.addBusinessPlan(data.plan);
    this.addCostCalculation(data.costs);
    this.addFooter();
    
    this.savePDF(data.basicInfo.companyName);
  }

  private setupFonts(): void {
    // フォント設定（日本語対応の改善）
    this.doc.setFont('helvetica');
  }

  private addHeader(): void {
    // ヘッダー部分
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.centerText('業務改善助成金申請書', this.currentY);
    this.currentY += 15;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.centerText(`申請日: ${new Date().toLocaleDateString('ja-JP')}`, this.currentY);
    this.currentY += 20;
    
    // 罫線
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addBasicInfo(basicInfo: BusinessImprovementApplicationData['basicInfo']): void {
    this.addSectionTitle('1. 申請事業者情報');
    
    const infoItems = [
      ['事業者名', basicInfo.companyName],
      ['代表者名', basicInfo.representative],
      ['所在地', basicInfo.address],
      ['電話番号', basicInfo.phone],
      ['メールアドレス', basicInfo.email],
      ['業種', basicInfo.industry],
      ['従業員数', `${basicInfo.employeeCount}名`]
    ];
    
    this.addInfoTable(infoItems);
  }

  private addCourseInfo(course: BusinessImprovementApplicationData['course']): void {
    this.addSectionTitle('2. 申請コース・賃金引上げ計画');
    
    const courseItems = [
      ['申請コース', course.name],
      ['賃金引上げ額', `${course.wageIncrease}円/時間`],
      ['対象従業員数', `${course.targetEmployees}名`],
      ['助成上限額', `${course.maxSubsidy.toLocaleString()}円`]
    ];
    
    this.addInfoTable(courseItems);
  }

  private addEquipmentInfo(equipment: BusinessImprovementApplicationData['equipment']): void {
    this.addSectionTitle('3. 導入予定設備');
    
    const equipmentItems = [
      ['設備・機器名', equipment.equipment],
      ['設備費', `${equipment.estimatedCost.toLocaleString()}円`],
      ['期待される効果', equipment.expectedEffect]
    ];
    
    this.addInfoTable(equipmentItems);
  }

  private addBusinessPlan(plan: BusinessImprovementApplicationData['plan']): void {
    this.addSectionTitle('4. 事業計画');
    
    this.addSubSection('4-1. 導入の必要性', plan.necessity);
    this.addSubSection('4-2. 事業実施計画', plan.businessPlan);
    this.addSubSection('4-3. 効果・目標', plan.effectPlan);
    this.addSubSection('4-4. 持続性・発展性', plan.sustainability);
  }

  private addCostCalculation(costs: BusinessImprovementApplicationData['costs']): void {
    this.addSectionTitle('5. 経費計算');
    
    const costItems = [
      ['設備費', `${costs.equipmentCost.toLocaleString()}円`],
      ['総事業費', `${costs.totalCost.toLocaleString()}円`],
      ['申請助成額', `${costs.subsidyAmount.toLocaleString()}円`],
      ['自己負担額', `${(costs.totalCost - costs.subsidyAmount).toLocaleString()}円`],
      ['助成率', `${Math.round((costs.subsidyAmount / costs.totalCost) * 100)}%`]
    ];
    
    this.addInfoTable(costItems);
  }

  private addSectionTitle(title: string): void {
    this.checkPageBreak(15);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 12;
    
    // セクション下線
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
    this.currentY += 5;
  }

  private addSubSection(title: string, content: string): void {
    this.checkPageBreak(30);
    
    // サブセクションタイトル
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
    
    // コンテンツ
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin);
    
    for (const line of lines) {
      this.checkPageBreak(6);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    }
    
    this.currentY += 5;
  }

  private addInfoTable(items: string[][]): void {
    const rowHeight = 8;
    const labelWidth = 50;
    
    for (const [label, value] of items) {
      this.checkPageBreak(rowHeight + 2);
      
      // ラベル部分（背景色付き）
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(this.margin, this.currentY - 4, labelWidth, rowHeight, 'F');
      
      // 罫線
      this.doc.setLineWidth(0.2);
      this.doc.rect(this.margin, this.currentY - 4, this.pageWidth - 2 * this.margin, rowHeight);
      this.doc.line(this.margin + labelWidth, this.currentY - 4, this.margin + labelWidth, this.currentY + 4);
      
      // テキスト
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin + 2, this.currentY);
      
      this.doc.setFont('helvetica', 'normal');
      const valueLines = this.doc.splitTextToSize(value, this.pageWidth - 2 * this.margin - labelWidth - 4);
      this.doc.text(valueLines, this.margin + labelWidth + 2, this.currentY);
      
      this.currentY += rowHeight;
    }
    
    this.currentY += 5;
  }

  private addFooter(): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // ページ番号
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `${i} / ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
      
      // 生成情報
      this.doc.text(
        `AI申請書作成システム - 生成日時: ${new Date().toLocaleString('ja-JP')}`,
        this.pageWidth / 2,
        this.pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  private centerText(text: string, y: number): void {
    const textWidth = this.doc.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    this.doc.text(text, x, y);
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private savePDF(companyName: string): void {
    const fileName = `業務改善助成金申請書_${companyName}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }
}

// 使用例関数
export function generateBusinessImprovementPDF(data: BusinessImprovementApplicationData): void {
  const generator = new BusinessImprovementPDFGenerator();
  generator.generatePDF(data);
}

// Word形式での出力
export function generateBusinessImprovementWord(data: BusinessImprovementApplicationData): void {
  const content = `
業務改善助成金申請書
===================

申請日: ${new Date().toLocaleDateString('ja-JP')}

1. 申請事業者情報
-----------------
事業者名: ${data.basicInfo.companyName}
代表者名: ${data.basicInfo.representative}
所在地: ${data.basicInfo.address}
電話番号: ${data.basicInfo.phone}
メールアドレス: ${data.basicInfo.email}
業種: ${data.basicInfo.industry}
従業員数: ${data.basicInfo.employeeCount}名

2. 申請コース・賃金引上げ計画
---------------------------
申請コース: ${data.course.name}
賃金引上げ額: ${data.course.wageIncrease}円/時間
対象従業員数: ${data.course.targetEmployees}名
助成上限額: ${data.course.maxSubsidy.toLocaleString()}円

3. 導入予定設備
--------------
設備・機器名: ${data.equipment.equipment}
設備費: ${data.equipment.estimatedCost.toLocaleString()}円
期待される効果: ${data.equipment.expectedEffect}

4. 事業計画
----------

4-1. 導入の必要性
${data.plan.necessity}

4-2. 事業実施計画
${data.plan.businessPlan}

4-3. 効果・目標
${data.plan.effectPlan}

4-4. 持続性・発展性
${data.plan.sustainability}

5. 経費計算
----------
設備費: ${data.costs.equipmentCost.toLocaleString()}円
総事業費: ${data.costs.totalCost.toLocaleString()}円
申請助成額: ${data.costs.subsidyAmount.toLocaleString()}円
自己負担額: ${(data.costs.totalCost - data.costs.subsidyAmount).toLocaleString()}円
助成率: ${Math.round((data.costs.subsidyAmount / data.costs.totalCost) * 100)}%

---
AI申請書作成システム
生成日時: ${new Date().toLocaleString('ja-JP')}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `業務改善助成金申請書_${data.basicInfo.companyName}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}