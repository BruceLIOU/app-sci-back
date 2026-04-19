import { z } from "zod";

const guarantorFields = {
	guarantor_civility: z.enum(["MR", "MME"]).optional(),
	guarantor_firstname: z.string().optional(),
	guarantor_lastname: z.string().optional(),
	guarantor_email: z.email("Email garant invalide.").optional(),
	guarantor_mobile: z.string().optional(),
	guarantor_address: z.string().optional(),
	guarantor_zipcode: z.string().optional(),
	guarantor_city: z.string().optional(),
};

export const tenantCreateSchema = z.object({
	lastname: z.string().min(1, "Le nom est requis."),
	firstname: z.string().min(1, "Le prénom est requis."),
	email: z.email("Email invalide.").optional(),
	mobile: z.string().optional(),
	civility: z.enum(["MR", "MME"]).optional(),
	property_id: z.string().optional(),
	comments: z.string().optional(),
	previous_address: z.string().optional(),
	previous_zipcode: z.string().optional(),
	previous_city: z.string().optional(),
	...guarantorFields,
});

export const tenantUpdateSchema = z.object({
	lastname: z.string().min(1, "Le nom est requis.").optional(),
	firstname: z.string().min(1, "Le prénom est requis.").optional(),
	email: z.email("Email invalide.").optional(),
	mobile: z.string().optional(),
	civility: z.enum(["MR", "MME"]).optional(),
	property_id: z.string().optional(),
	comments: z.string().optional(),
	previous_address: z.string().optional(),
	previous_zipcode: z.string().optional(),
	previous_city: z.string().optional(),
	...guarantorFields,
});
