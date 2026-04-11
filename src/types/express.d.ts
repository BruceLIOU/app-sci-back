export {}

declare module 'express-serve-static-core' {
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
