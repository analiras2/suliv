import * as Joi from 'joi';

const AUTH_PATH = '/auth/v1';
const JWKS_PATH = `${AUTH_PATH}/.well-known/jwks.json`;

export const environmentValidationSchema = Joi.object({
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  SUPABASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  SUPABASE_JWKS_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(1).required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().min(1).required(),
  CLOUDINARY_API_KEY: Joi.string().min(1).required(),
  CLOUDINARY_API_SECRET: Joi.string().min(1).required(),
  CLOUDINARY_UPLOAD_PRESET: Joi.string().min(1).required(),
});

export function environmentConfiguration() {
  const supabaseUrl = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');

  return {
    database: {
      url: process.env.DATABASE_URL,
    },
    supabase: {
      issuer: `${supabaseUrl}${AUTH_PATH}`,
      jwksUrl: process.env.SUPABASE_JWKS_URL ?? `${supabaseUrl}${JWKS_PATH}`,
      url: supabaseUrl,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    },
  };
}
