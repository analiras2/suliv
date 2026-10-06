import NetInfo from '@react-native-community/netinfo';

import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages';
import { requestSignature, uploadToCloudinary } from '@/module/recipe-authoring/services/recipe-image-transport';
import { recipeAuthoringService, type RecipeAuthoringService } from '@/module/recipe-authoring/services/recipe-authoring-service';
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';

export const MAX_AUTO_RETRY_ATTEMPTS = 3;

// ADR-001: POST /uploads/recipe-image-signature (Core Interfaces).
export interface RecipeImageUploadService {
  upload(localUri: string, onProgress?: (pct: number) => void): Promise<string>; // returns cover_image_url
}

export const recipeImageUploadService: RecipeImageUploadService = {
  // UT-005/UT-006: calls the signature endpoint first — a signature failure
  // short-circuits before any Cloudinary call is attempted.
  async upload(localUri, onProgress) {
    onProgress?.(0);
    const signature = await requestSignature();
    const url = await uploadToCloudinary(signature, localUri);
    onProgress?.(100);
    return url;
  },
};

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

interface PendingCoverAttach {
  coverImageUrl: string;
  authoring: RecipeAuthoringService;
}

// draft_upsert's update branch does not persist coverImageUrl server-side, so
// a failed attach PATCH cannot rely on the next text-field sync to retry it.
// Track it here instead and retry the PATCH itself on the next reconnect.
const pendingCoverAttaches = new Map<string, PendingCoverAttach>();

export function hasPendingCoverAttach(draftId: string): boolean {
  return pendingCoverAttaches.has(draftId);
}

async function attachCoverImage(
  draftId: string,
  coverImageUrl: string,
  authoring: RecipeAuthoringService,
): Promise<void> {
  useRecipeDraftsStore.getState().setCoverImageUrl(draftId, coverImageUrl);
  try {
    await authoring.update(draftId, { coverImageUrl });
    pendingCoverAttaches.delete(draftId);
  } catch {
    pendingCoverAttaches.set(draftId, { coverImageUrl, authoring });
  }
}

// Retries every attach PATCH that failed earlier, so an uploaded image whose
// PATCH failed transiently eventually reaches the server on reconnect.
export async function retryPendingCoverAttaches(): Promise<void> {
  const entries = Array.from(pendingCoverAttaches.entries());
  await Promise.all(
    entries.map(([draftId, { coverImageUrl, authoring }]) => attachCoverImage(draftId, coverImageUrl, authoring)),
  );
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
      error: getErrorMessage(error, ERROR_MESSAGES.IMAGE_UPLOAD_FAILED),
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
  if (isConnected && !wasConnected) {
    void retryPendingCoverAttaches();
    scanAndAutoUploadPendingImages();
  }
});
