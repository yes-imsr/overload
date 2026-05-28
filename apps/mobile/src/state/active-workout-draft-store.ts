import { create } from "zustand";

export type ActiveWorkoutDraft = {
  movementName: string;
  loadText: string;
  repsText: string;
  notes: string;
};

type ActiveWorkoutDraftStore = {
  draft: ActiveWorkoutDraft | null;
  setDraft: (draft: ActiveWorkoutDraft) => void;
  updateDraft: (patch: Partial<ActiveWorkoutDraft>) => void;
  clearDraft: () => void;
};

export const useActiveWorkoutDraftStore = create<ActiveWorkoutDraftStore>(
  (set) => ({
    draft: null,
    setDraft: (draft) => set({ draft }),
    updateDraft: (patch) =>
      set((state) => ({
        draft: state.draft ? { ...state.draft, ...patch } : null,
      })),
    clearDraft: () => set({ draft: null }),
  }),
);
