export {}

declare module 'express-serve-static-core' {
  interface FormidableFile {
    name: string
    path: string
    size: number
    type: string
    lastModifiedDate?: Date
  }

  interface Request {
    fields: Record<string, string | string[] | undefined>
    files: Record<string, FormidableFile | FormidableFile[] | undefined>
  }
}
