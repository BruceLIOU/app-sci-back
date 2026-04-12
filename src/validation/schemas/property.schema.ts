import { z } from 'zod'

const numericString = (label: string) =>
  z.string().refine((v) => v.length > 0 && !isNaN(Number(v)), { message: `${label} doit être un nombre valide.` })

export const propertyCreateSchema = z.object({
  address: z.string().min(1, "L'adresse est requise."),
  zipcode: numericString('Le code postal'),
  city: z.string().min(1, 'La ville est requise.'),
  type: z.enum(['Maison', 'Appartement'], 'Le type est invalide.').optional(),
  pieces: numericString('Le nombre de pièces').optional(),
  area: numericString('La superficie').optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  comments: z.string().optional(),
})

export const propertyUpdateSchema = z.object({
  address: z.string().min(1, "L'adresse est requise.").optional(),
  zipcode: numericString('Le code postal').optional(),
  city: z.string().min(1, 'La ville est requise.').optional(),
  type: z.enum(['Maison', 'Appartement'], 'Le type est invalide.').optional(),
  pieces: numericString('Le nombre de pièces').optional(),
  area: numericString('La superficie').optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  comments: z.string().optional(),
})
