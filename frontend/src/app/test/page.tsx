export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 システム起動成功！
        </h1>
        <p className="text-gray-600 mb-8">
          フロントエンドが正常に動作しています
        </p>
        <div className="space-y-4">
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            ✅ Next.js: 正常
          </div>
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            ✅ Tailwind CSS: 正常
          </div>
          <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
            📡 localhost:7002 で稼働中
          </div>
        </div>
      </div>
    </div>
  )
}