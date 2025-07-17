'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Upload,
  FileText,
  Globe,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { showError, showSuccess } from '@/utils/error-handler'
import { GeminiService } from '@/services/ai/geminiService'

export default function CustomSubsidyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subsidyData, setSubsidyData] = useState({
    name: '',
    organization: '',
    url: '',
    description: '',
    deadline: '',
    maxAmount: '',
    subsidyRate: ''
  })
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSubsidyData({
      ...subsidyData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      if (uploadedFile.type === 'application/pdf' || uploadedFile.type.includes('text')) {
        setFile(uploadedFile)
        showSuccess('ファイルをアップロードしました')
      } else {
        showError('PDFまたはテキストファイルをアップロードしてください')
      }
    }
  }

  const handleAnalyzeURL = async () => {
    if (!subsidyData.url) {
      showError('URLを入力してください')
      return
    }

    setAnalyzing(true)
    try {
      // 実際にはURLから情報を取得する処理
      // ここではデモとして固定値を設定
      setTimeout(() => {
        setSubsidyData({
          ...subsidyData,
          name: '地域活性化支援補助金',
          organization: '〇〇県商工会議所',
          description: '地域の中小企業の新たな取り組みを支援',
          maxAmount: '300万円',
          subsidyRate: '2/3'
        })
        setAnalyzing(false)
        showSuccess('募集要項の情報を取得しました')
      }, 2000)
    } catch (error) {
      setAnalyzing(false)
      showError('情報の取得に失敗しました')
    }
  }

  const handleSubmit = async () => {
    if (!subsidyData.name || !subsidyData.organization) {
      showError('補助金名と実施機関は必須です')
      return
    }

    setLoading(true)
    try {
      // カスタム補助金として保存し、申請画面へ遷移
      const customSubsidyId = `custom-${Date.now()}`
      
      // localStorageに一時保存
      localStorage.setItem(`custom_subsidy_${customSubsidyId}`, JSON.stringify({
        ...subsidyData,
        id: customSubsidyId,
        type: 'custom',
        createdAt: new Date().toISOString()
      }))

      showSuccess('補助金情報を登録しました')
      
      // カスタム補助金申請画面へ遷移
      router.push(`/apply/${customSubsidyId}`)
    } catch (error) {
      showError('登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">トップに戻る</span>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            <Globe className="inline-block w-6 h-6 sm:w-8 sm:h-8 mr-2 text-green-600" />
            独自補助金申請
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            全国の自治体・団体の補助金に対応します
          </p>
        </div>

        <Card className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-semibold">募集要項をお持ちですか？</p>
              <p className="text-sm mt-1">
                URLを入力するか、PDFファイルをアップロードしてください
              </p>
            </div>
          </Alert>

          <div className="space-y-6">
            {/* URL入力 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                募集要項のURL
              </label>
              <div className="flex gap-2">
                <Input
                  name="url"
                  value={subsidyData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/subsidy-guideline"
                  className="flex-1"
                />
                <Button
                  onClick={handleAnalyzeURL}
                  disabled={analyzing || !subsidyData.url}
                  variant="secondary"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      解析
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ファイルアップロード */}
            <div>
              <label className="block text-sm font-medium mb-2">
                または募集要項をアップロード
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    クリックしてファイルを選択
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, TXT, DOC, DOCX
                  </span>
                </label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">補助金情報</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    補助金名 *
                  </label>
                  <Input
                    name="name"
                    value={subsidyData.name}
                    onChange={handleInputChange}
                    placeholder="例：〇〇市創業支援補助金"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    実施機関 *
                  </label>
                  <Input
                    name="organization"
                    value={subsidyData.organization}
                    onChange={handleInputChange}
                    placeholder="例：〇〇市商工会議所"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    概要
                  </label>
                  <textarea
                    name="description"
                    value={subsidyData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="補助金の概要を入力"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      最大補助額
                    </label>
                    <Input
                      name="maxAmount"
                      value={subsidyData.maxAmount}
                      onChange={handleInputChange}
                      placeholder="例：500万円"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      補助率
                    </label>
                    <Input
                      name="subsidyRate"
                      value={subsidyData.subsidyRate}
                      onChange={handleInputChange}
                      placeholder="例：2/3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    申請期限
                  </label>
                  <Input
                    type="date"
                    name="deadline"
                    value={subsidyData.deadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !subsidyData.name || !subsidyData.organization}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  登録中...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  この補助金で申請書を作成
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Alert className="max-w-2xl mx-auto">
            <div className="text-left">
              <p className="font-semibold mb-2">対応可能な補助金</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 各都道府県・市区町村の独自補助金</li>
                <li>• 商工会議所・商工会の補助金</li>
                <li>• 業界団体・財団の助成金</li>
                <li>• その他公的機関の支援制度</li>
              </ul>
            </div>
          </Alert>
        </div>
      </main>
    </div>
  )
}