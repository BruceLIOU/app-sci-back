import { z } from 'zod'

export const paymentCreateSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis.')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Le montant doit etre un nombre positif.'),
  due_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), "Date d'echeance invalide.")
    .optional(),
  paid_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date de paiement invalide.')
    .optional(),
  status: z.enum(['pending', 'paid', 'late', 'partial'], 'Statut invalide.').optional(),
  tenant_id: z.string().optional(),
  property_id: z.string().optional(),
  month: z.string().optional(),
})

export const paymentUpdateSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis.')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Le montant doit être un nombre positif.'),
  status: z.enum(['pending', 'paid', 'late', 'partial'], 'Statut invalide.'),
  due_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date d\'échéance invalide.')
    .optional(),
  paid_date: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)), 'Date de paiement invalide.')
    .optional(),
  tenant_id: z.string().optional(),
  property_id: z.string().optional(),
  month: z.string().optional(),
})
