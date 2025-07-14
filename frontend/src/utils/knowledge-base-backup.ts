// 知識ベースのバックアップ・復元ユーティリティ

export interface KnowledgeBaseBackup {
  version: string
  createdAt: string
  data: any[]
}

export class KnowledgeBaseBackupService {
  private static readonly BACKUP_VERSION = '1.0.0'
  private static readonly STORAGE_KEY = 'subsidy_knowledge_bases'

  // 全知識ベースをJSONファイルにエクスポート
  static exportToFile(): void {
    const data = this.getAllKnowledgeBases()
    const backup: KnowledgeBaseBackup = {
      version: this.BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      data: data
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-base-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // JSONファイルから知識ベースをインポート
  static async importFromFile(file: File): Promise<void> {
    try {
      const text = await file.text()
      const backup: KnowledgeBaseBackup = JSON.parse(text)
      
      if (!backup.version || !backup.data) {
        throw new Error('無効なバックアップファイル形式です')
      }

      // 既存データとマージ（重複チェック）
      const existingData = this.getAllKnowledgeBases()
      const mergedData = this.mergeKnowledgeBases(existingData, backup.data)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedData))
      
      console.log(`知識ベースを復元しました: ${backup.data.length}件`)
    } catch (error) {
      console.error('インポートエラー:', error)
      throw new Error('バックアップファイルの読み込みに失敗しました')
    }
  }

  // 現在の知識ベース一覧を取得
  private static getAllKnowledgeBases(): any[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []
    
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('知識ベース読み込みエラー:', error)
      return []
    }
  }

  // 知識ベースをマージ（重複除去）
  private static mergeKnowledgeBases(existing: any[], imported: any[]): any[] {
    const merged = [...existing]
    
    imported.forEach(importedBase => {
      const existingIndex = merged.findIndex(
        base => base.subsidyId === importedBase.subsidyId
      )
      
      if (existingIndex >= 0) {
        // 既存の知識ベースがある場合は、新しいドキュメントのみ追加
        const existingBase = merged[existingIndex]
        const newDocuments = importedBase.documents.filter(
          (importedDoc: any) => !existingBase.documents.some(
            (existingDoc: any) => existingDoc.name === importedDoc.name
          )
        )
        
        existingBase.documents.push(...newDocuments)
        existingBase.updatedAt = new Date().toISOString()
      } else {
        // 新しい知識ベースを追加
        merged.push(importedBase)
      }
    })
    
    return merged
  }

  // クラウドストレージ連携用（将来拡張）
  static async syncToCloud(): Promise<void> {
    // TODO: Google Drive, Dropbox, AWS S3 などとの連携
    console.log('クラウド同期機能は今後実装予定です')
  }

  // 自動バックアップ設定
  static enableAutoBackup(intervalMinutes: number = 60): void {
    setInterval(() => {
      this.exportToFile()
      console.log('自動バックアップを実行しました')
    }, intervalMinutes * 60 * 1000)
  }
}