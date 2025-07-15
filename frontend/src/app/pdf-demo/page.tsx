import PDFFormFillerDemo from '@/components/business-improvement/PDFFormFillerDemo';
import { Button } from '@/components/ui/Button';

// Vercelビルド時のSSG/SSRエラーを回避
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function PDFDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-gray-900"
              >
                ← トップページ
              </Button>
              <h1 className="text-xl font-bold text-gray-900">
                PDF申請書フォーム埋め込みデモ
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <p className="text-gray-600">
            AIで生成した申請書データをPDFテンプレートに自動埋め込みする機能のデモです。
          </p>
        </div>
        
        <PDFFormFillerDemo />
      </div>
    </div>
  );
}