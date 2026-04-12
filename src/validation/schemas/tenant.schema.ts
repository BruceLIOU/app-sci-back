import { z } from 'zod'

export const tenantCreateSchema = z.object({
  lastname: z.string().min(1, 'Le nom est requis.'),
  firstname: z.string().min(1, 'Le prénom est requis.'),
  email: z.email('Email invalide.').optional(),
  mobile: z.string().optional(),
  civility: z.enum(['MR', 'MME']).optional(),
  property_id: z.string().optional(),
  comments: z.string().optional(),
  previous_address: z.string().optional(),
  previous_zipcode: z.string().optional(),
  previous_city: z.string().optional(),
})

export const tenantUpdateSchema = z.object({
  lastname: z.string().min(1, 'Le nom est requis.').optional(),
  firstname: z.string().min(1, 'Le prénom est requis.').optional(),
  email: z.email('Email invalide.').optional(),
  mobile: z.string().optional(),
  civility: z.enum(['MR', 'MME']).optional(),
  property_id: z.string().optional(),
  comments: z.string().optional(),
  previous_address: z.string().optional(),
  previous_zipcode: z.string().optional(),
  previous_city: z.string().optional(),
})
