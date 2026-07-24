import { useCallback, useMemo, useRef, useState } from 'react';

import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import {
  recipeAuthoringService,
  RecipeAuthoringServiceError,
  type RecipeAuthoringService,
} from '@/module/recipe-authoring/services/recipe-authoring-service';
import { attemptAutoUpload } from '@/module/recipe-authoring/services/recipe-image-upload-service';
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';
import type {
  DraftIngredient,
  DraftStep,
  MyRecipeStatus,
  RecipeAuthoringPayload,
  RecipeDraft,
} from '@/module/recipe-authoring/types';

export type RecipeFormFields = Omit<
  RecipeDraft,
  'id' | 'localImageUri' | 'coverImageUrl' | 'lastSyncedAt' | 'createdAt'
>;

export interface RecipeFormExisting {
  id: string;
  status: MyRecipeStatus;
  // Pre-fill for an approved recipe being edited — Task 4's screen fetches
  // this from GET /me/recipes and passes it in, since an approved recipe's
  // fields live server-side, not in the local drafts store (Data Flow step 6).
  fields?: RecipeFormFields;
  coverImageUrl?: string | null;
}

function emptyFields(): RecipeFormFields {
  return {
    title: '',
    description: '',
    categoryId: null,
    prepTimeMinutes: null,
    servings: null,
    difficulty: null,
    dietPreference: null,
    ingredients: [],
    steps: [],
    authorMessageToModerator: null,
  };
}

function toAuthoringPayload(id: string, fields: RecipeFormFields, coverImageUrl: string | null): Partial<RecipeAuthoringPayload> & { id: string } {
  const payload: Partial<RecipeAuthoringPayload> & { id: string } = {
    id,
    title: fields.title,
    description: fields.description,
    ingredients: fields.ingredients,
    steps: fields.steps,
  };
  if (fields.categoryId !== null) payload.categoryId = fields.categoryId;
  if (fields.prepTimeMinutes !== null) payload.prepTimeMinutes = fields.prepTimeMinutes;
  if (fields.servings !== null) payload.servings = fields.servings;
  if (fields.difficulty !== null) payload.difficulty = fields.difficulty;
  if (fields.dietPreference !== null) payload.dietPreference = fields.dietPreference;
  if (fields.authorMessageToModerator !== null) payload.authorMessageToModerator = fields.authorMessageToModerator;
  if (coverImageUrl !== null) payload.coverImageUrl = coverImageUrl;
  return payload;
}

function isFieldsComplete(fields: RecipeFormFields): boolean {
  return Boolean(
    fields.title &&
      fields.description &&
      fields.categoryId &&
      fields.prepTimeMinutes &&
      fields.servings &&
      fields.difficulty &&
      fields.dietPreference &&
      fields.ingredients.length > 0 &&
      fields.steps.length > 0,
  );
}

export interface RecipeFormViewModel {
  id: string;
  fields: RecipeFormFields;
  coverImageUrl: string | null;
  isApprovedEdit: boolean;
  updateField: (changes: Partial<RecipeFormFields>) => void;
  addIngredient: () => void;
  updateIngredient: (index: number, changes: Partial<DraftIngredient>) => void;
  removeIngredient: (index: number) => void;
  addStep: () => void;
  updateStep: (index: number, changes: Partial<DraftStep>) => void;
  removeStep: (index: number) => void;
  setCoverImage: (localUri: string) => void;
  missingCoverImage: boolean;
  canSubmit: boolean;
  submit: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  isRateLimited: boolean;
}

export function useRecipeFormViewModel(
  existing?: RecipeFormExisting,
  analytics: AnalyticsClient = analyticsClient,
  authoring: RecipeAuthoringService = recipeAuthoringService,
): RecipeFormViewModel {
  const isApprovedEdit = existing?.status === 'aprovada';

  // Lazy-initialized once per mount: a brand-new draft is created (client
  // UUID, zero network — UT-001) the first time the form opens with no
  // `existing` id, firing submitted_recipe_started on that first creation
  // (UT-019). Editing an existing draft/approved recipe reuses its id.
  const [id] = useState<string>(() => {
    if (existing) return existing.id;
    const created = useRecipeDraftsStore.getState().createDraft();
    analytics.track('submitted_recipe_started', { recipe_id: created.id });
    return created.id;
  });

  const storeDraft = useRecipeDraftsStore((state) => state.drafts[id]);

  const [approvedFields, setApprovedFields] = useState<RecipeFormFields>(
    () => existing?.fields ?? emptyFields(),
  );
  // React batches state updates within a single event/act(); two mutations
  // fired back-to-back (e.g. addIngredient() called twice) would otherwise
  // both read the same pre-batch `approvedFields` closure and clobber each
  // other. This ref is updated synchronously alongside setApprovedFields so
  // consecutive mutations always read the latest value.
  const approvedFieldsRef = useRef(approvedFields);
  const [approvedCoverImageUrl] = useState<string | null>(existing?.coverImageUrl ?? null);

  const fields: RecipeFormFields = useMemo(
    () => (isApprovedEdit ? approvedFields : (storeDraft ?? emptyFields())),
    [isApprovedEdit, approvedFields, storeDraft],
  );
  const coverImageUrl = isApprovedEdit ? approvedCoverImageUrl : (storeDraft?.coverImageUrl ?? null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const updateField = useCallback(
    (changes: Partial<RecipeFormFields>) => {
      if (isApprovedEdit) {
        approvedFieldsRef.current = { ...approvedFieldsRef.current, ...changes };
        setApprovedFields(approvedFieldsRef.current);
        return;
      }
      useRecipeDraftsStore.getState().updateDraft(id, changes);
    },
    [id, isApprovedEdit],
  );

  // The drafts store (getState()) and approvedFieldsRef are both synchronous
  // sources of truth, unlike the rendered `fields` above — required so two
  // list mutations issued in the same batch compose instead of overwriting.
  const getLiveIngredients = useCallback((): DraftIngredient[] => {
    if (isApprovedEdit) return approvedFieldsRef.current.ingredients;
    return useRecipeDraftsStore.getState().drafts[id]?.ingredients ?? [];
  }, [id, isApprovedEdit]);

  const getLiveSteps = useCallback((): DraftStep[] => {
    if (isApprovedEdit) return approvedFieldsRef.current.steps;
    return useRecipeDraftsStore.getState().drafts[id]?.steps ?? [];
  }, [id, isApprovedEdit]);

  const addIngredient = useCallback(() => {
    const ingredients = getLiveIngredients();
    updateField({
      ingredients: [
        ...ingredients,
        { name: '', quantity: null, unit: 'unidade', scalesWithServings: true, order: ingredients.length },
      ],
    });
  }, [getLiveIngredients, updateField]);

  const updateIngredient = useCallback(
    (index: number, changes: Partial<DraftIngredient>) => {
      const ingredients = getLiveIngredients().map((ingredient, i) =>
        i === index ? { ...ingredient, ...changes } : ingredient,
      );
      updateField({ ingredients });
    },
    [getLiveIngredients, updateField],
  );

  const removeIngredient = useCallback(
    (index: number) => {
      const ingredients = getLiveIngredients()
        .filter((_, i) => i !== index)
        .map((ingredient, i) => ({ ...ingredient, order: i }));
      updateField({ ingredients });
    },
    [getLiveIngredients, updateField],
  );

  const addStep = useCallback(() => {
    const steps = getLiveSteps();
    updateField({ steps: [...steps, { order: steps.length, description: '', stepTimeSeconds: null }] });
  }, [getLiveSteps, updateField]);

  const updateStep = useCallback(
    (index: number, changes: Partial<DraftStep>) => {
      const steps = getLiveSteps().map((step, i) => (i === index ? { ...step, ...changes } : step));
      updateField({ steps });
    },
    [getLiveSteps, updateField],
  );

  const removeStep = useCallback(
    (index: number) => {
      const steps = getLiveSteps()
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i }));
      updateField({ steps });
    },
    [getLiveSteps, updateField],
  );

  const setCoverImage = useCallback(
    (localUri: string) => {
      if (isApprovedEdit) return; // approved-edit path uploads then PATCHes directly, no local draft image queue
      useRecipeDraftsStore.getState().setLocalImageUri(id, localUri);
      const draft = useRecipeDraftsStore.getState().drafts[id];
      if (draft?.lastSyncedAt !== null) {
        void attemptAutoUpload(id, localUri);
      }
    },
    [id, isApprovedEdit],
  );

  const missingCoverImage = coverImageUrl === null;
  const canSubmit = useMemo(
    () => isFieldsComplete(fields) && !missingCoverImage && !isSubmitting,
    [fields, missingCoverImage, isSubmitting],
  );

  const submit = useCallback(async () => {
    setSubmitError(null);
    setIsRateLimited(false);

    // UT-009: blocked client-side with no coverImageUrl, no API call made —
    // mirrors, not replaces, the server-side gate (Task 2's submit()).
    if (missingCoverImage) {
      setSubmitError('Adicione uma foto de capa antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isApprovedEdit) {
        // Data Flow step 6: editing an already-live recipe goes straight
        // through PATCH, re-entering moderation server-side (ADR-002) — this
        // is not the POST /recipes/:id/submit flow, so submitted_recipe_completed
        // does not fire here.
        await authoring.update(id, toAuthoringPayload(id, fields, coverImageUrl));
        return;
      }

      await authoring.submit(id);
      analytics.track('submitted_recipe_completed', { recipe_id: id });
    } catch (error) {
      if (error instanceof RecipeAuthoringServiceError && error.status === 429) {
        setIsRateLimited(true);
        setSubmitError('Limite diário de envios atingido. Tente novamente amanhã.');
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar a receita.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [analytics, authoring, coverImageUrl, fields, id, isApprovedEdit, missingCoverImage]);

  return {
    id,
    fields,
    coverImageUrl,
    isApprovedEdit,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    addStep,
    updateStep,
    removeStep,
    setCoverImage,
    missingCoverImage,
    canSubmit,
    submit,
    isSubmitting,
    submitError,
    isRateLimited,
  };
}
