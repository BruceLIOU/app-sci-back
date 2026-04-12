import { z } from 'zod'

const positiveNumericString = (label: string) =>
  z
    .string()
    .min(1, `${label} est requis.`)
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, `${label} doit être un nombre positif.`)

export const leaseCreateSchema = z.object({
  property_id: z.string().min(1, 'Le bien est requis.'),
  start_date: z
    .string()
    .min(1, 'La date de début est requise.')
    .refine((v) => !isNaN(Date.parse(v)), 'Date de début invalide.'),
  rent_amount: positiveNumericString('Le loyer'),
  tenant_id: z.string().optional(),
  type: z.enum(['nu', 'meublé', 'commercial']).optional(),
  end_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date de fin invalide.')
    .optional(),
  charges_amount: z.string().optional(),
  deposit_amount: z.string().optional(),
  notice_period: z.string().optional(),
  status: z.enum(['active', 'expired', 'terminated']).optional(),
  notes: z.string().optional(),
})

export const leaseUpdateSchema = z.object({
  property_id: z.string().min(1, 'Le bien est requis.').optional(),
  start_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date de début invalide.')
    .optional(),
  rent_amount: z
    .string()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Le loyer doit être un nombre positif.')
    .optional(),
  tenant_id: z.string().optional(),
  type: z.enum(['nu', 'meublé', 'commercial']).optional(),
  end_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date de fin invalide.')
    .optional(),
  charges_amount: z.string().optional(),
  deposit_amount: z.string().optional(),
  notice_period: z.string().optional(),
  status: z.enum(['active', 'expired', 'terminated']).optional(),
  notes: z.string().optional(),
})
