import PDFFormFillerDemo from '@/components/business-improvement/PDFFormFillerDemo';

export default function PDFDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF申請書フォーム埋め込みデモ
          </h1>
          <p className="text-gray-600">
            AIで生成した申請書データをPDFテンプレートに自動埋め込みする機能のデモです。
          </p>
        </div>
        
        <PDFFormFillerDemo />
      </div>
    </div>
  );
}