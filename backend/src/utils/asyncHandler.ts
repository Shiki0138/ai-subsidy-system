import { Request, Response, NextFunction } from 'express'

/**
 * Express用の非同期エラーハンドラー
 * async/awaitを使用したルートハンドラーのエラーを自動的にキャッチ
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}