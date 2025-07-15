import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import { BusinessImprovementApplicationData } from './business-improvement-pdf';

// 日本語フォントの登録（安定性向上）
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf',
      fontWeight: 700,
    },
  ],
});

// フォールバック用のフォント設定
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf',
});

// スタイル定義
const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 5,
    marginTop: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#000000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: '1px',
    borderBottomColor: '#000000',
    minHeight: 25,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 25,
  },
  tableColLabel: {
    width: '30%',
    borderRightWidth: '1px',
    borderRightColor: '#000000',
    padding: 5,
    backgroundColor: '#f8f8f8',
  },
  tableColValue: {
    width: '70%',
    padding: 5,
  },
  tableText: {
    fontSize: 10,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 5,
  },
  longText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: 'justify',
  },
  box: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#000000',
    padding: 10,
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    fontSize: 8,
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: 'center',
    color: '#666666',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666666',
  },
  officialBox: {
    position: 'absolute',
    top: 35,
    right: 35,
    width: 200,
    height: 80,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#000000',
  },
  officialBoxTitle: {
    fontSize: 8,
    padding: 5,
    textAlign: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
  },
  stampArea: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampText: {
    fontSize: 8,
    color: '#999999',
  },
});

// データ検証とフォールバック用のヘルパー関数
const safeText = (text: string | undefined | null, fallback: string = '（未入力）'): string => {
  if (!text || text.trim() === '') {
    return fallback;
  }
  return text;
};

const safeNumber = (num: number | undefined | null, fallback: number = 0): number => {
  if (num === undefined || num === null || isNaN(num)) {
    return fallback;
  }
  return num;
};

// PDFドキュメントコンポーネント
const BusinessImprovementPDFDocument: React.FC<{ data: BusinessImprovementApplicationData }> = ({ data }) => (
  <Document>
    {/* 表紙 */}
    <Page size="A4" style={styles.page}>
      <View style={styles.officialBox}>
        <Text style={styles.officialBoxTitle}>受付印欄</Text>
        <View style={styles.stampArea}>
          <Text style={styles.stampText}>（労働局使用欄）</Text>
        </View>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.title}>業務改善助成金交付申請書</Text>
        <Text style={styles.subtitle}>申請日: {new Date().toLocaleDateString('ja-JP')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 申請事業者情報</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>事業者名</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.basicInfo?.companyName)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>代表者名</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.basicInfo?.representative)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>所在地</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.basicInfo?.address)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>電話番号</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.basicInfo?.phone)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>メールアドレス</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.basicInfo?.email)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>業種</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.basicInfo?.industry)}</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>従業員数</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.basicInfo?.employeeCount)}名</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 申請コース・賃金引上げ計画</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>申請コース</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.course?.name)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>賃金引上げ額</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.course?.wageIncrease)}円/時間</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>対象従業員数</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.course?.targetEmployees)}名</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>助成上限額</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.course?.maxSubsidy).toLocaleString()}円</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 導入予定設備</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>設備・機器名</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.equipment?.equipment)}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>設備費</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.equipment?.estimatedCost).toLocaleString()}円</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>期待される効果</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeText(data.equipment?.expectedEffect)}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.pageNumber}>1</Text>
    </Page>

    {/* 事業計画書ページ */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 事業計画書</Text>
        
        <Text style={styles.subsectionTitle}>4-1. 導入の必要性</Text>
        <View style={styles.box}>
          <Text style={styles.longText}>
            {safeText(data.plan?.necessity, 'AIによる分析結果に基づき、自動生成されます。')}
          </Text>
        </View>

        <Text style={styles.subsectionTitle}>4-2. 事業実施計画</Text>
        <View style={styles.box}>
          <Text style={styles.longText}>
            {safeText(data.plan?.businessPlan, 'AIによる分析結果に基づき、自動生成されます。')}
          </Text>
        </View>
      </View>

      <Text style={styles.pageNumber}>2</Text>
    </Page>

    {/* 効果・目標、持続性ページ */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>4-3. 効果・目標</Text>
        <View style={styles.box}>
          <Text style={styles.longText}>
            {safeText(data.plan?.effectPlan, 'AIによる分析結果に基づき、自動生成されます。')}
          </Text>
        </View>

        <Text style={styles.subsectionTitle}>4-4. 持続性・発展性</Text>
        <View style={styles.box}>
          <Text style={styles.longText}>
            {safeText(data.plan?.sustainability, 'AIによる分析結果に基づき、自動生成されます。')}
          </Text>
        </View>
      </View>

      <Text style={styles.pageNumber}>3</Text>
    </Page>

    {/* 経費計算ページ */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. 経費計算書</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>設備費</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.costs?.equipmentCost).toLocaleString()}円</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>総事業費</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.costs?.totalCost).toLocaleString()}円</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>申請助成額</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{safeNumber(data.costs?.subsidyAmount).toLocaleString()}円</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>自己負担額</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>{(safeNumber(data.costs?.totalCost) - safeNumber(data.costs?.subsidyAmount)).toLocaleString()}円</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableText}>助成率</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableText}>
                {safeNumber(data.costs?.totalCost) > 0 
                  ? Math.round((safeNumber(data.costs?.subsidyAmount) / safeNumber(data.costs?.totalCost)) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. 誓約事項</Text>
        <View style={styles.box}>
          <Text style={styles.text}>
            私は、本申請書に記載の内容が事実と相違ないことを誓約し、業務改善助成金の交付を申請します。
          </Text>
          <Text style={styles.text}>
            また、助成金の交付決定を受けた場合は、交付要綱及び関係法令を遵守し、適正に事業を実施することを誓約します。
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 40 }}>
        <Text style={{ textAlign: 'right', marginBottom: 30 }}>
          申請日: {new Date().toLocaleDateString('ja-JP')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View style={{ width: 300 }}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableColLabel}>
                  <Text style={styles.tableText}>事業者名</Text>
                </View>
                <View style={styles.tableColValue}>
                  <Text style={styles.tableText}>{safeText(data.basicInfo?.companyName)}</Text>
                </View>
              </View>
              <View style={styles.tableRowLast}>
                <View style={styles.tableColLabel}>
                  <Text style={styles.tableText}>代表者名</Text>
                </View>
                <View style={styles.tableColValue}>
                  <Text style={styles.tableText}>{safeText(data.basicInfo?.representative)} 印</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        AI申請書作成システム - 生成日時: {new Date().toLocaleString('ja-JP')}
      </Text>
      <Text style={styles.pageNumber}>4</Text>
    </Page>
  </Document>
);

// PDFダウンロードボタンコンポーネント（改良版）
export const ImprovedBusinessImprovementPDFDownloadButton: React.FC<{
  data: BusinessImprovementApplicationData;
  className?: string;
}> = ({ data, className }) => {
  const fileName = `業務改善助成金申請書_${safeText(data.basicInfo?.companyName, '申請書')}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={<BusinessImprovementPDFDocument data={data} />}
      fileName={fileName}
      className={className}
    >
      {({ blob, url, loading, error }) => {
        if (error) {
          return (
            <div className="text-red-500 text-sm">
              PDF生成エラー: {error.message}
            </div>
          );
        }
        
        return loading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            PDFを生成中...
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF形式でダウンロード
          </div>
        );
      }}
    </PDFDownloadLink>
  );
};

// 既存の関数との互換性のためのラッパー
export function generateBusinessImprovementPDFReact(data: BusinessImprovementApplicationData): React.ReactElement {
  return <BusinessImprovementPDFDocument data={data} />;
}

// 互換性のためのエイリアス
export const BusinessImprovementPDFDownloadButton = ImprovedBusinessImprovementPDFDownloadButton;