import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import {
  useRecipeFormViewModel,
  type RecipeFormExisting,
  type RecipeFormViewModel,
} from '@/module/recipe-authoring/viewModels/use-recipe-form-view-model';

const MY_RECIPES_ROUTE = '/profile/my-recipes' as Href;
const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
};

export interface RecipeFormScreenViewModel extends RecipeFormViewModel {
  pickCoverImageFromLibrary: () => Promise<void>;
  captureCoverImage: () => Promise<void>;
}

// Thin screen-level wiring over Task 3's use-recipe-form-view-model: adds
// expo-image-picker invocation and post-submit navigation, no authoring
// business logic of its own. `existing` must already be fully resolved by
// use-resolve-recipe-form-existing before this hook is ever mounted.
export function useRecipeFormScreenViewModel(existing?: RecipeFormExisting): RecipeFormScreenViewModel {
  const router = useRouter();
  const form = useRecipeFormViewModel(existing);

  const pickCoverImageFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      form.setCoverImage(result.assets[0].uri);
    }
  }, [form]);

  const captureCoverImage = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      form.setCoverImage(result.assets[0].uri);
    }
  }, [form]);

  // Navigates back to the list once a real submit attempt (isSubmitting
  // true -> false) finishes with no error. Reading form.submitError right
  // after `await form.submit()` would close over a stale pre-await snapshot,
  // so completion is detected via the fresh state on the next render instead.
  const wasSubmittingRef = useRef(false);
  useEffect(() => {
    if (wasSubmittingRef.current && !form.isSubmitting && !form.submitError) {
      router.replace(MY_RECIPES_ROUTE);
    }
    wasSubmittingRef.current = form.isSubmitting;
  }, [form.isSubmitting, form.submitError, router]);

  return {
    ...form,
    pickCoverImageFromLibrary,
    captureCoverImage,
  };
}
