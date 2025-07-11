# モックPDFテンプレート

このディレクトリには、各補助金申請用のモックPDFテンプレートが含まれています。

## テンプレート一覧

1. **jizokuka_template.pdf** - 持続化補助金
2. **monozukuri_template.pdf** - ものづくり補助金
3. **it_template.pdf** - IT導入補助金
4. **saikochiku_template.pdf** - 事業再構築補助金
5. **gyomu_kaizen_template.pdf** - 業務改善助成金

## テンプレートの生成

新しいテンプレートを生成する場合：

```bash
npm run generate:pdf-templates
```

## テンプレートのテスト

PDFへのデータ入力をテストする場合：

```bash
npm run test:pdf-filling
```

## フィールド名一覧

### 持続化補助金
- 事業者名
- 代表者氏名
- 所在地
- 電話番号
- 従業員数
- 事業概要
- 販路開拓計画
- 補助金申請額

### ものづくり補助金
- 申請者名
- 代表者名
- 本社所在地
- 資本金
- 従業員数
- 技術課題
- 革新的サービス
- 生産プロセス改善
- 設備投資計画
- 補助事業費

### IT導入補助金
- 事業者名
- 代表者氏名
- 業種
- 従業員数
- ITツール名
- ベンダー名
- 導入目的
- 現在の課題
- 期待効果
- 導入費用
- KPI

### 事業再構築補助金
- 申請者名称
- 代表者
- 本店所在地
- 売上高減少率
- 新分野展開
- 事業転換内容
- 業態転換計画
- 投資額
- 補助金申請額

### 業務改善助成金
- 事業場名
- 事業主氏名
- 所在地
- 労働者数
- 現在の最低賃金
- 引上げ後賃金
- 引上げ額
- 設備投資内容
- 生産性向上策
- 設備投資額

## 注意事項

- これらはモックテンプレートであり、実際の公式PDFテンプレートではありません
- 本番環境では、各補助金の公式サイトから正式なPDFテンプレートを入手する必要があります
- 日本語フォントの制限により、フィールドラベルは英語で表示されています
- フィールド名（内部ID）は日本語のままですので、データマッピング時は日本語のフィールド名を使用してください

## 使用方法

`officialPdfFillService.ts`を使用してPDFにデータを入力：

```typescript
import { OfficialPdfFillService } from '../services/officialPdfFillService'

const pdfService = new OfficialPdfFillService()

// データを準備
const applicationData = {
  companyInfo: {
    name: '株式会社テスト',
    representative: '山田太郎',
    // ... その他のデータ
  },
  // ... その他のセクション
}

// PDFに入力
await pdfService.fillOfficialPDF(
  '持続化補助金',
  applicationData,
  'output/filled.pdf'
)
```