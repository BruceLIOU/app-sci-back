import 'express'

declare global {
  namespace Express {
    interface Request {
      fields: Record<string, string | string[] | undefined>
      files: Record<string, {
        name: string
        path: string
        size: number
        type: string
        lastModifiedDate?: Date
      } | undefined>
    }
  }
}
