import NetInfo from '@react-native-community/netinfo';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { recipeAuthoringService, type RecipeAuthoringService } from '@/module/recipe-authoring/services/recipe-authoring-service';
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const MAX_AUTO_RETRY_ATTEMPTS = 3;

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
}

// ADR-001: POST /uploads/recipe-image-signature (Core Interfaces).
export interface RecipeImageUploadService {
  upload(localUri: string, onProgress?: (pct: number) => void): Promise<string>; // returns cover_image_url
}

export class RecipeImageUploadServiceError extends Error {
  constructor(readonly status: number) {
    super(`Recipe image upload request failed with status ${status}.`);
  }
}

async function requestSignature(authentication: AuthService): Promise<UploadSignature> {
  const session = await authentication.getSession();
  const headers: Record<string, string> = {};
  if (session) headers.Authorization = `Bearer ${session.access_token}`;

  const response = await fetch(`${API_BASE_URL}/uploads/recipe-image-signature`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new RecipeImageUploadServiceError(response.status);
  }

  return response.json() as Promise<UploadSignature>;
}

async function uploadToCloudinary(signature: UploadSignature, localUri: string): Promise<string> {
  const form = new FormData();
  form.append('file', { uri: localUri, type: 'image/jpeg', name: 'recipe-image.jpg' } as unknown as Blob);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('upload_preset', signature.uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new RecipeImageUploadServiceError(response.status);
  }

  const body = (await response.json()) as { secure_url: string };
  return body.secure_url;
}

export function createRecipeImageUploadService(
  authentication: AuthService = authService,
): RecipeImageUploadService {
  return {
    // UT-005/UT-006: calls the signature endpoint first — a signature failure
    // short-circuits before any Cloudinary call is attempted.
    async upload(localUri, onProgress) {
      onProgress?.(0);
      const signature = await requestSignature(authentication);
      const url = await uploadToCloudinary(signature, localUri);
      onProgress?.(100);
      return url;
    },
  };
}

export const recipeImageUploadService: RecipeImageUploadService = createRecipeImageUploadService();

// --- Reconnect-driven auto-upload with a capped retry (ADR-003, subtask 3.6) ---

export type ImageUploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'needs_manual_retry';

export interface ImageUploadState {
  status: ImageUploadStatus;
  attempts: number;
  error: string | null;
}

const uploadStates = new Map<string, ImageUploadState>();

export function getImageUploadState(draftId: string): ImageUploadState {
  return uploadStates.get(draftId) ?? { status: 'idle', attempts: 0, error: null };
}

export function resetImageUploadState(draftId: string): void {
  uploadStates.delete(draftId);
}

async function attachCoverImage(
  draftId: string,
  coverImageUrl: string,
  authoring: RecipeAuthoringService,
): Promise<void> {
  useRecipeDraftsStore.getState().setCoverImageUrl(draftId, coverImageUrl);
  try {
    await authoring.update(draftId, { coverImageUrl });
  } catch {
    // The local draft already reflects the uploaded image; a failed PATCH
    // here is retried the next time the draft's text fields sync (the field
    // is included in that same payload once set locally).
  }
}

// UT-007/UT-008: triggered per pending draft on reconnect. Stops auto-
// retrying after MAX_AUTO_RETRY_ATTEMPTS failures and surfaces a manual
// "tentar novamente" state instead of retrying a 4th time.
export async function attemptAutoUpload(
  draftId: string,
  localUri: string,
  imageUpload: RecipeImageUploadService = recipeImageUploadService,
  authoring: RecipeAuthoringService = recipeAuthoringService,
): Promise<void> {
  const state = getImageUploadState(draftId);
  if (state.status === 'needs_manual_retry' || state.attempts >= MAX_AUTO_RETRY_ATTEMPTS) {
    uploadStates.set(draftId, { ...state, status: 'needs_manual_retry' });
    return;
  }

  uploadStates.set(draftId, { status: 'uploading', attempts: state.attempts, error: null });
  try {
    const coverImageUrl = await imageUpload.upload(localUri);
    uploadStates.set(draftId, { status: 'success', attempts: state.attempts + 1, error: null });
    await attachCoverImage(draftId, coverImageUrl, authoring);
  } catch (error) {
    const attempts = state.attempts + 1;
    const status: ImageUploadStatus = attempts >= MAX_AUTO_RETRY_ATTEMPTS ? 'needs_manual_retry' : 'error';
    uploadStates.set(draftId, {
      status,
      attempts,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}

// Fires once per reconnect for every draft with an unresolved local image
// whose text fields have already synced at least once (lastSyncedAt !== null,
// TechSpec Data Flow step 3 / ADR-003).
export function scanAndAutoUploadPendingImages(): void {
  const { drafts } = useRecipeDraftsStore.getState();
  for (const draft of Object.values(drafts)) {
    if (!draft.localImageUri || draft.coverImageUrl || draft.lastSyncedAt === null) continue;
    void attemptAutoUpload(draft.id, draft.localImageUri);
  }
}

let isConnected = true;
NetInfo.addEventListener((state) => {
  const wasConnected = isConnected;
  isConnected = Boolean(state.isConnected);
  if (isConnected && !wasConnected) scanAndAutoUploadPendingImages();
});
