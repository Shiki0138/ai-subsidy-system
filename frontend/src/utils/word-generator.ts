import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';

interface GeneratedContent {
  事業概要: string;
  実施計画: string;
  期待効果: string;
  資金計画: string;
  添付書類?: {
    事業計画書: string;
    収支計画書: string;
  };
}

interface ApplicationData {
  subsidyType: string;
  companyInfo: {
    name: string;
    address: string;
    employees: number;
    revenue: string;
    industry: string;
  };
  projectInfo: {
    title: string;
    purpose: string;
    content: string;
    budget: string;
    period: string;
  };
}

export async function generateWordDocument(
  content: GeneratedContent,
  applicationData: ApplicationData
): Promise<void> {
  const subsidyNames: { [key: string]: string } = {
    jizokuka: '小規模企業持続化補助金',
    gyomukaizen: '業務改善助成金',
    it: 'IT導入補助金',
    monozukuri: 'ものづくり補助金',
    saikochiku: '事業再構築補助金'
  };

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // タイトル
        new Paragraph({
          text: `${subsidyNames[applicationData.subsidyType]} 申請書`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // 作成日
        new Paragraph({
          text: `作成日：${new Date().toLocaleDateString('ja-JP')}`,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 400 }
        }),

        // 企業情報セクション
        new Paragraph({
          text: '1. 申請者情報',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        createInfoTable(applicationData.companyInfo),

        // 事業概要セクション
        new Paragraph({
          text: '2. 事業概要',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        ...createContentParagraphs(content.事業概要),

        // 実施計画セクション
        new Paragraph({
          text: '3. 実施計画',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        ...createContentParagraphs(content.実施計画),

        // 期待効果セクション
        new Paragraph({
          text: '4. 期待される効果',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        ...createContentParagraphs(content.期待効果),

        // 資金計画セクション
        new Paragraph({
          text: '5. 資金計画',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        ...createContentParagraphs(content.資金計画),

        // 添付書類がある場合
        ...(content.添付書類 ? [
          new Paragraph({
            text: '【添付書類】',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 800, after: 400 }
          }),
          new Paragraph({
            text: '事業計画書',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          ...createContentParagraphs(content.添付書類.事業計画書),
          new Paragraph({
            text: '収支計画書',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          ...createContentParagraphs(content.添付書類.収支計画書)
        ] : [])
      ]
    }]
  });

  const blob = await doc.save();
  const fileName = `${subsidyNames[applicationData.subsidyType]}_申請書_${applicationData.companyInfo.name}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob as Blob, fileName);
}

function createInfoTable(companyInfo: any): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('企業名')],
            width: { size: 30, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph(companyInfo.name)],
            width: { size: 70, type: WidthType.PERCENTAGE }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('所在地')]
          }),
          new TableCell({
            children: [new Paragraph(companyInfo.address)]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('業種')]
          }),
          new TableCell({
            children: [new Paragraph(companyInfo.industry)]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('従業員数')]
          }),
          new TableCell({
            children: [new Paragraph(`${companyInfo.employees}名`)]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('年間売上高')]
          }),
          new TableCell({
            children: [new Paragraph(companyInfo.revenue)]
          })
        ]
      })
    ]
  });
}

function createContentParagraphs(content: string): Paragraph[] {
  return content.split('\n').map(line => 
    new Paragraph({
      text: line,
      spacing: { after: 200 }
    })
  );
}