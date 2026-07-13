import { create } from 'zustand';

interface SavedRecipesState {
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedRecipesStore = create<SavedRecipesState>((set, get) => ({
  savedIds: new Set(),
  toggleSaved: (id) =>
    set((state) => {
      const next = new Set(state.savedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { savedIds: next };
    }),
  isSaved: (id) => get().savedIds.has(id),
}));
