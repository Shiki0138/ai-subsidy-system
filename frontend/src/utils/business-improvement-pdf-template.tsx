import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 業務改善助成金申請書のPDFテンプレート
// 実際の申請書フィールドに対応した構造

interface ApplicationData {
  basicInfo: {
    companyName: string;
    representative: string;
    address: string;
    phone: string;
    email: string;
    industry: string;
    employeeCount: number;
  };
  applicationSections: {
    business_overview: string;
    current_issues: string;
    equipment_plan: string;
    productivity_improvement: string;
    wage_increase_plan: string;
    implementation_schedule: string;
    sustainability_plan: string;
    effect_measurement: string;
  };
  submissionDate: string;
}

// PDF用のスタイル定義
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    lineHeight: 1.4,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2 solid black',
    paddingBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
    border: '1 solid #ccc',
  },
  content: {
    fontSize: 9,
    lineHeight: 1.5,
    textAlign: 'justify',
    border: '1 solid #ddd',
    padding: 8,
    minHeight: 60,
  },
  basicInfoGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  basicInfoItem: {
    flex: 1,
    fontSize: 9,
    padding: 3,
    border: '1 solid #ddd',
  },
  basicInfoLabel: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

export const BusinessImprovementPDF: React.FC<{ data: ApplicationData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* ヘッダー */}
      <Text style={styles.header}>業務改善助成金支給申請書</Text>

      {/* 基本情報セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>申請者情報</Text>
        <View style={styles.basicInfoGrid}>
          <View style={styles.basicInfoItem}>
            <Text style={styles.basicInfoLabel}>事業者名</Text>
            <Text>{data.basicInfo.companyName}</Text>
          </View>
          <View style={styles.basicInfoItem}>
            <Text style={styles.basicInfoLabel}>代表者名</Text>
            <Text>{data.basicInfo.representative}</Text>
          </View>
        </View>
        <View style={styles.basicInfoGrid}>
          <View style={styles.basicInfoItem}>
            <Text style={styles.basicInfoLabel}>所在地</Text>
            <Text>{data.basicInfo.address}</Text>
          </View>
        </View>
        <View style={styles.basicInfoGrid}>
          <View style={styles.basicInfoItem}>
            <Text style={styles.basicInfoLabel}>電話番号</Text>
            <Text>{data.basicInfo.phone}</Text>
          </View>
          <View style={styles.basicInfoItem}>
            <Text style={styles.basicInfoLabel}>業種</Text>
            <Text>{data.basicInfo.industry}</Text>
          </View>
          <View style={styles.basicInfoItem}>
            <Text style={styles.basicInfoLabel}>従業員数</Text>
            <Text>{data.basicInfo.employeeCount}名</Text>
          </View>
        </View>
      </View>

      {/* 事業の概要 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 事業の概要</Text>
        <Text style={styles.content}>{data.applicationSections.business_overview}</Text>
      </View>

      {/* 現在の課題 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 現在の課題</Text>
        <Text style={styles.content}>{data.applicationSections.current_issues}</Text>
      </View>

      {/* 設備・機器等の導入計画 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 設備・機器等の導入計画</Text>
        <Text style={styles.content}>{data.applicationSections.equipment_plan}</Text>
      </View>

    </Page>
    
    <Page size="A4" style={styles.page}>
      {/* 生産性向上の具体的な内容 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 生産性向上の具体的な内容</Text>
        <Text style={styles.content}>{data.applicationSections.productivity_improvement}</Text>
      </View>

      {/* 賃金引上げ計画 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. 賃金引上げ計画</Text>
        <Text style={styles.content}>{data.applicationSections.wage_increase_plan}</Text>
      </View>

      {/* 事業実施スケジュール */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. 事業実施スケジュール</Text>
        <Text style={styles.content}>{data.applicationSections.implementation_schedule}</Text>
      </View>

      {/* 事業の持続性 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. 事業の持続性</Text>
        <Text style={styles.content}>{data.applicationSections.sustainability_plan}</Text>
      </View>

      {/* 効果の測定方法 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. 効果の測定方法</Text>
        <Text style={styles.content}>{data.applicationSections.effect_measurement}</Text>
      </View>

      {/* フッター */}
      <Text style={styles.footer}>
        申請日：{data.submissionDate} / 作成：AI補助金申請支援システム
      </Text>
    </Page>
  </Document>
);

// PDFダウンロード用のヘルパー関数
export const generateBusinessImprovementApplicationPDF = async (
  applicationData: ApplicationData
): Promise<Blob> => {
  const { pdf } = await import('@react-pdf/renderer');
  return await pdf(<BusinessImprovementPDF data={applicationData} />).toBlob();
};

// デモ用のサンプルデータ
export const sampleApplicationData: ApplicationData = {
  basicInfo: {
    companyName: '株式会社サンプル商事',
    representative: '山田太郎',
    address: '東京都渋谷区1-2-3',
    phone: '03-1234-5678',
    email: 'info@sample.co.jp',
    industry: '小売業',
    employeeCount: 25,
  },
  applicationSections: {
    business_overview: '弊社は小売業として、25名の従業員により事業を展開しております...',
    current_issues: '現在、当社では以下の業務課題に直面しており...',
    equipment_plan: '生産性向上を実現するため、以下の設備・機器の導入を計画しています...',
    productivity_improvement: '設備導入により、以下の具体的な生産性向上効果を実現します...',
    wage_increase_plan: '生産性向上により創出される効果を従業員に還元するため...',
    implementation_schedule: '設備導入から効果発現まで、以下のスケジュールで事業を実施します...',
    sustainability_plan: '設備導入効果を継続的に維持・発展させるため...',
    effect_measurement: '設備導入効果を客観的に測定・評価するため...',
  },
  submissionDate: new Date().toLocaleDateString('ja-JP'),
};