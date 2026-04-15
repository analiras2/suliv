import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/\d/, "A senha deve conter pelo menos 1 número"),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const socialSchema = z.object({
  provider: z.enum(["google", "apple"], {
    errorMap: () => ({ message: 'Provedor deve ser "google" ou "apple"' }),
  }),
  id_token: z.string().min(1, "id_token é obrigatório"),
});

export const onboardingSchema = z.object({
  dietaryRestrictions: z.array(z.string()),
  allergens: z.array(z.string()),
  // Optional — user may skip
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    errorMap: () => ({ message: "Nível de habilidade inválido" }),
  }).optional(),
  cookingFrequencyPerWeek: z.number().int().min(0).max(7).optional(),
  avgCookTimeMin: z.number().int().positive().optional(),
  householdSize: z.number().int().positive().optional(),
  preferredCuisines: z.array(z.string()).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().url("URL de avatar inválida").optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  cookingFrequencyPerWeek: z.number().int().min(0).max(7).optional(),
  avgCookTimeMin: z.number().int().positive().optional(),
  householdSize: z.number().int().positive().optional(),
  preferredCuisines: z.array(z.string()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SocialInput = z.infer<typeof socialSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
