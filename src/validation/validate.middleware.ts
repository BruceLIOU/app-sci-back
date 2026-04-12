import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

/**
 * Middleware de validation Zod.
 * Valide les données du formulaire (req.fields) contre le schéma fourni.
 * Renvoie 422 avec les erreurs de validation si la donnée est invalide.
 */
export const validate =
  (schema: z.ZodType) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = schema.safeParse(req.fields)
    if (!result.success) {
      const errors: Record<string, string[]> = {}
      result.error.issues.forEach((err) => {
        const key = String(err.path[0] ?? '_')
        if (!errors[key]) errors[key] = []
        errors[key].push(err.message)
      })
      res.status(422).json({ message: 'Données invalides.', errors })
      return
    }
    next()
  }
