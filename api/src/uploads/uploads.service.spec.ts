import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadsService } from './uploads.service';

const CLOUDINARY_CONFIG: Record<string, string> = {
  'cloudinary.cloudName': 'suliv-dev',
  'cloudinary.apiKey': 'dev-api-key',
  'cloudinary.apiSecret': 'dev-api-secret',
  'cloudinary.uploadPreset': 'recipe_image_moderated',
};

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn((key: string) => CLOUDINARY_CONFIG[key]),
    } as unknown as ConfigService;
    service = new UploadsService(configService);
  });

  it('returns exactly signature, timestamp, apiKey, cloudName and uploadPreset', () => {
    const result = service.createRecipeImageSignature();

    expect(Object.keys(result).sort()).toEqual(
      ['apiKey', 'cloudName', 'signature', 'timestamp', 'uploadPreset'].sort(),
    );
    expect(result.apiKey).toBe('dev-api-key');
    expect(result.cloudName).toBe('suliv-dev');
    expect(result.uploadPreset).toBe('recipe_image_moderated');
    expect(typeof result.timestamp).toBe('number');
    expect(typeof result.signature).toBe('string');
    expect(result.signature).not.toContain('dev-api-secret');
  });

  it('signs the timestamp and upload preset with the configured API secret', () => {
    const result = service.createRecipeImageSignature();

    const expectedSignature = cloudinary.utils.api_sign_request(
      { timestamp: result.timestamp, upload_preset: result.uploadPreset },
      'dev-api-secret',
    );
    expect(result.signature).toBe(expectedSignature);
  });
});
