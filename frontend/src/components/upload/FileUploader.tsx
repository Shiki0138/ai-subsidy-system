'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
  label?: string
  description?: string
}

interface UploadedFile {
  file: File
  id: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  url?: string
}

export function FileUploader({
  onUpload,
  accept = '.jpg,.jpeg,.png,.pdf,.doc,.docx',
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 3,
  multiple = true,
  label = 'ファイルをアップロード',
  description = 'ドラッグ&ドロップまたはクリックしてファイルを選択'
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      toast.error(`ファイルサイズは${Math.round(maxSize / 1024 / 1024)}MB以下にしてください`)
      return false
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    
    if (!allowedExtensions.includes(extension)) {
      toast.error(`許可されていないファイル形式です: ${extension}`)
      return false
    }

    return true
  }

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files)
    
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast.error(`最大${maxFiles}ファイルまでアップロード可能です`)
      return
    }

    const validFiles = fileArray.filter(validateFile)
    if (validFiles.length === 0) return

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: generateId(),
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)

    try {
      // プログレス更新のシミュレーション
      for (const uploadFile of newFiles) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: 50 }
              : f
          )
        )
      }

      await onUpload(validFiles)

      // アップロード成功
      setUploadedFiles(prev => 
        prev.map(f => 
          newFiles.some(nf => nf.id === f.id)
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      )

      toast.success(`${validFiles.length}ファイルのアップロードが完了しました`)
    } catch (error) {
      console.error('Upload error:', error)
      
      // アップロード失敗
      setUploadedFiles(prev => 
        prev.map(f => 
          newFiles.some(nf => nf.id === f.id)
            ? { ...f, status: 'error', progress: 0 }
            : f
        )
      )

      toast.error('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />
    }
    
    return <DocumentIcon className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* ドロップゾーン */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {description}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          対応形式: {accept} (最大{Math.round(maxSize / 1024 / 1024)}MB, {maxFiles}ファイルまで)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">アップロード済みファイル</h4>
          
          {uploadedFiles.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(uploadFile.file.name)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {uploadFile.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{uploadFile.progress}%</span>
                  </div>
                )}
                
                {uploadFile.status === 'success' && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                
                {uploadFile.status === 'error' && (
                  <span className="text-xs text-red-500">エラー</span>
                )}

                <button
                  onClick={() => removeFile(uploadFile.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}