import { z } from 'zod'

const positiveNumericString = (label: string) =>
  z
    .string()
    .min(1, `${label} est requis.`)
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, `${label} doit être un nombre positif.`)

export const chargeCreateSchema = z.object({
  amount: positiveNumericString('Le montant'),
  date: z
    .string()
    .min(1, 'La date est requise.')
    .refine((v) => !isNaN(Date.parse(v)), 'Date invalide.'),
  property_id: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  frequency: z.enum(['unique', 'mensuel', 'trimestriel', 'annuel']).optional(),
})

export const chargeUpdateSchema = z.object({
  amount: z
    .string()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Le montant doit être un nombre positif.')
    .optional(),
  date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date invalide.')
    .optional(),
  property_id: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  frequency: z.enum(['unique', 'mensuel', 'trimestriel', 'annuel']).optional(),
})
