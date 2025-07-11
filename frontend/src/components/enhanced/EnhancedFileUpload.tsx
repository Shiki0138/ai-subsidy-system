'use client'

import { useState, useRef, DragEvent, ChangeEvent, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export interface EnhancedFileUploadProps {
  onUpload: (files: File[]) => Promise<UploadResult>
  accept?: string
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
  label?: string
  description?: string
  helpText?: string
  disabled?: boolean
  autoRetry?: boolean
  showPreview?: boolean
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  success: boolean
  uploadedFiles?: UploadedFileInfo[]
  errors?: string[]
  summary?: {
    totalFiles: number
    successful: number
    failed: number
  }
}

export interface UploadedFileInfo {
  id: string
  originalName: string
  size: number
  url?: string
  type: string
}

interface FileState {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying'
  progress: number
  error?: string
  url?: string
  retryCount: number
  preview?: string
}

export function EnhancedFileUpload({
  onUpload,
  accept = '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx',
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  multiple = true,
  label = 'ファイルをアップロード',
  description = 'ドラッグ&ドロップまたはクリックしてファイルを選択',
  helpText,
  disabled = false,
  autoRetry = true,
  showPreview = true,
  onProgress
}: EnhancedFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<FileState[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  // ファイル検証の強化
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // サイズチェック
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `ファイルサイズが制限を超えています（最大${formatFileSize(maxSize)}）`
      }
    }

    // 空ファイルチェック
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'ファイルが空です'
      }
    }

    // 拡張子チェック
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `対応していないファイル形式です（${extension}）`
      }
    }

    // ファイル名チェック（特殊文字）
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(file.name)) {
      return {
        isValid: false,
        error: 'ファイル名に使用できない文字が含まれています'
      }
    }

    return { isValid: true }
  }, [accept, maxSize])

  // プレビュー生成
  const generatePreview = useCallback((file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!showPreview || !file.type.startsWith('image/')) {
        resolve(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }, [showPreview])

  // ファイル選択処理
  const handleFileSelect = useCallback(async (fileList: FileList) => {
    if (disabled || isUploading) return

    const fileArray = Array.from(fileList)
    
    // ファイル数チェック
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`最大${maxFiles}ファイルまでアップロード可能です`, {
        duration: 5000,
        icon: '⚠️'
      })
      return
    }

    // 重複チェック
    const existingNames = files.map(f => f.file.name)
    const duplicates = fileArray.filter(file => existingNames.includes(file.name))
    if (duplicates.length > 0) {
      toast.error(`同名のファイルが既に存在します: ${duplicates[0].name}`, {
        duration: 5000,
        icon: '⚠️'
      })
      return
    }

    // バリデーションとプレビュー生成
    const newFiles: FileState[] = []
    for (const file of fileArray) {
      const validation = validateFile(file)
      const preview = await generatePreview(file)
      
      newFiles.push({
        file,
        id: generateId(),
        status: validation.isValid ? 'pending' : 'error',
        progress: 0,
        error: validation.error,
        preview: preview || undefined,
        retryCount: 0
      })

      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`, {
          duration: 6000,
          icon: '❌'
        })
      }
    }

    setFiles(prev => [...prev, ...newFiles])

    // 有効なファイルがあれば自動アップロード開始
    const validFiles = newFiles.filter(f => f.status === 'pending')
    if (validFiles.length > 0) {
      await handleUpload(validFiles)
    }
  }, [disabled, isUploading, files, maxFiles, validateFile, generatePreview])

  // アップロード処理
  const handleUpload = useCallback(async (filesToUpload: FileState[]) => {
    if (isUploading) return

    setIsUploading(true)
    
    // ステータスを更新
    setFiles(prev => prev.map(f => 
      filesToUpload.some(upload => upload.id === f.id)
        ? { ...f, status: 'uploading' as const, progress: 0 }
        : f
    ))

    try {
      // プログレス更新シミュレーション
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (filesToUpload.some(upload => upload.id === f.id) && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 30, 90)
            if (onProgress) {
              onProgress(newProgress)
            }
            return { ...f, progress: newProgress }
          }
          return f
        }))
      }, 500)

      // 実際のアップロード
      const result = await onUpload(filesToUpload.map(f => f.file))
      clearInterval(progressInterval)

      if (result.success) {
        // 成功時の処理
        setFiles(prev => prev.map(f => {
          if (filesToUpload.some(upload => upload.id === f.id)) {
            const uploadedInfo = result.uploadedFiles?.find(info => 
              info.originalName === f.file.name
            )
            return {
              ...f,
              status: 'success' as const,
              progress: 100,
              url: uploadedInfo?.url
            }
          }
          return f
        }))

        toast.success(
          `${result.summary?.successful || filesToUpload.length}ファイルのアップロードが完了しました`,
          {
            duration: 4000,
            icon: '✅'
          }
        )

        if (onProgress) {
          onProgress(100)
        }
      } else {
        // 失敗時の処理
        setFiles(prev => prev.map(f => {
          if (filesToUpload.some(upload => upload.id === f.id)) {
            return {
              ...f,
              status: 'error' as const,
              progress: 0,
              error: result.errors?.[0] || 'アップロードに失敗しました'
            }
          }
          return f
        }))

        toast.error(result.errors?.[0] || 'アップロードに失敗しました', {
          duration: 6000,
          icon: '❌'
        })
      }
    } catch (error) {
      // エラー時の処理
      console.error('Upload error:', error)
      
      setFiles(prev => prev.map(f => {
        if (filesToUpload.some(upload => upload.id === f.id)) {
          return {
            ...f,
            status: 'error' as const,
            progress: 0,
            error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました'
          }
        }
        return f
      }))

      toast.error('アップロード中にエラーが発生しました。ネットワーク接続を確認してください。', {
        duration: 6000,
        icon: '🔌'
      })
    } finally {
      setIsUploading(false)
    }
  }, [isUploading, onUpload, onProgress])

  // リトライ処理
  const handleRetry = useCallback(async (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId)
    if (!fileToRetry || fileToRetry.retryCount >= 3) return

    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'retrying' as const, retryCount: f.retryCount + 1 }
        : f
    ))

    // 少し遅延してからリトライ
    setTimeout(() => {
      handleUpload([fileToRetry])
    }, 1000)
  }, [files, handleUpload])

  // ドラッグ&ドロップ処理
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    dragCounterRef.current = 0
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
    // ファイル入力をリセット（同じファイルを再選択可能にする）
    e.target.value = ''
  }, [handleFileSelect])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    toast.success('ファイルを削除しました', { duration: 2000 })
  }, [])

  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />
    }
    
    return <DocumentIcon className="h-8 w-8 text-gray-500" />
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const getStatusColor = useCallback((status: FileState['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'uploading': case 'retrying': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }, [])

  const getStatusIcon = useCallback((file: FileState) => {
    switch (file.status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'uploading':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case 'retrying':
        return <ArrowPathIcon className="h-5 w-5 text-orange-500 animate-spin" />
      default:
        return null
    }
  }, [])

  // 自動リトライ
  useEffect(() => {
    if (!autoRetry) return

    const errorFiles = files.filter(f => f.status === 'error' && f.retryCount < 3)
    if (errorFiles.length > 0) {
      const retryTimer = setTimeout(() => {
        errorFiles.forEach(file => {
          if (Math.random() > 0.5) { // 50%の確率でリトライ
            handleRetry(file.id)
          }
        })
      }, 3000)

      return () => clearTimeout(retryTimer)
    }
  }, [files, autoRetry, handleRetry])

  return (
    <div className="w-full">
      {/* ラベルとヘルプ */}
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {helpText && (
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-gray-600"
          >
            <InformationCircleIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ヘルプテキスト */}
      {showHelp && helpText && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">{helpText}</p>
        </div>
      )}
      
      {/* ドロップゾーン */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled || isUploading ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <CloudArrowUpIcon className={`mx-auto h-12 w-12 transition-colors ${
          isDragging ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <p className="mt-2 text-sm text-gray-600">
          {isUploading ? 'アップロード中...' : description}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          対応形式: {accept.split(',').map(ext => ext.trim()).join(', ')}
        </p>
        <p className="text-xs text-gray-500">
          最大ファイルサイズ: {formatFileSize(maxSize)} | 最大ファイル数: {maxFiles}
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
      </div>

      {/* 進捗サマリー */}
      {files.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>進捗状況:</span>
            <span>
              {files.filter(f => f.status === 'success').length} / {files.length} 完了
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${files.length > 0 ? (files.filter(f => f.status === 'success').length / files.length) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* ファイル一覧 */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">ファイル一覧</h4>
          
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all
                ${file.status === 'success' ? 'bg-green-50 border-green-200' : 
                  file.status === 'error' ? 'bg-red-50 border-red-200' : 
                  'bg-gray-50 border-gray-200'}
              `}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* プレビューまたはアイコン */}
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.file.name}
                    className="h-10 w-10 object-cover rounded border"
                  />
                ) : (
                  getFileIcon(file.file.name)
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.file.size)}</span>
                    <span className={getStatusColor(file.status)}>
                      {file.status === 'pending' && '待機中'}
                      {file.status === 'uploading' && 'アップロード中'}
                      {file.status === 'success' && '完了'}
                      {file.status === 'error' && 'エラー'}
                      {file.status === 'retrying' && `再試行中 (${file.retryCount}/3)`}
                    </span>
                    {file.error && (
                      <span className="text-red-500 truncate max-w-xs">
                        {file.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-2">
                {/* プログレスバー */}
                {(file.status === 'uploading' || file.status === 'retrying') && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(file.progress)}%
                    </span>
                  </div>
                )}
                
                {/* ステータスアイコン */}
                {getStatusIcon(file)}
                
                {/* アクションボタン */}
                <div className="flex space-x-1">
                  {/* プレビューボタン */}
                  {file.url && (
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="プレビュー"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* リトライボタン */}
                  {file.status === 'error' && file.retryCount < 3 && (
                    <button
                      onClick={() => handleRetry(file.id)}
                      className="p-1 text-gray-400 hover:text-orange-600"
                      title="再試行"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* 削除ボタン */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="削除"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}