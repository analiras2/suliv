import { apiRequestJson } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { classifyNetworkFailure } from '@/lib/network-failure';

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
}

// ADR-001: POST /uploads/recipe-image-signature (Core Interfaces).
export function requestSignature(): Promise<UploadSignature> {
  return apiRequestJson<UploadSignature>('/uploads/recipe-image-signature', { method: 'POST' });
}

/**
 * Cloudinary is not our API, so its failures never carry an API code: a response
 * becomes `IMAGE_UPLOAD_FAILED` and a missing one a network code (ADR-004).
 */
export async function uploadToCloudinary(signature: UploadSignature, localUri: string): Promise<string> {
  const form = new FormData();
  form.append('file', { uri: localUri, type: 'image/jpeg', name: 'recipe-image.jpg' } as unknown as Blob);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('upload_preset', signature.uploadPreset);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new ApiError(await classifyNetworkFailure(), null);
  }

  if (!response.ok) {
    throw new ApiError('IMAGE_UPLOAD_FAILED', response.status);
  }

  const body = (await response.json()) as { secure_url: string };
  return body.secure_url;
}
