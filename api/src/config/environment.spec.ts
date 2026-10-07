import { environmentValidationSchema } from './environment';

const VALID_ENVIRONMENT = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/suliv',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
  CLOUDINARY_UPLOAD_PRESET: 'preset',
  ADMIN_JWT_SECRET: 'admin-secret',
  SPOONACULAR_API_KEY: 'spoonacular',
  APP_ENV: 'dev',
  PAGINATION_CURSOR_SECRET: 'cursor-secret',
};

describe('environmentValidationSchema', () => {
  it('accepts a complete environment', () => {
    const { error } = environmentValidationSchema.validate(VALID_ENVIRONMENT);

    expect(error).toBeUndefined();
  });

  // UT-012: fails fast exactly like the other required keys.
  it('fails when APP_ENV is missing', () => {
    const { error } = environmentValidationSchema.validate({
      ...VALID_ENVIRONMENT,
      APP_ENV: undefined,
    });

    expect(error?.message).toContain('"APP_ENV" is required');
  });

  it('rejects an APP_ENV outside dev, staging and prod', () => {
    const { error } = environmentValidationSchema.validate({
      ...VALID_ENVIRONMENT,
      APP_ENV: 'qa',
    });

    expect(error?.message).toContain('"APP_ENV" must be one of');
  });

  it('fails when PAGINATION_CURSOR_SECRET is missing', () => {
    const { error } = environmentValidationSchema.validate({
      ...VALID_ENVIRONMENT,
      PAGINATION_CURSOR_SECRET: undefined,
    });

    expect(error?.message).toContain('"PAGINATION_CURSOR_SECRET" is required');
  });
});
