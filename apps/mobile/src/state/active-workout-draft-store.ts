import { create } from "zustand";
import type { EffortLevel } from "@/components/RPESelector";

export type DraftSet = {
  setOrder: number;
  weight: string;
  reps: string;
  effort: EffortLevel | null;
};

export type DraftExercise = {
  exerciseId: string;
  name: string;
  equipmentId: string | null;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  plannedWeight: number | null;
  sets: DraftSet[];
};

export type ActiveWorkoutDraft = {
  clientSessionKey: string;
  sessionId: string | null;
  templateId: string;
  templateName: string;
  status: "draft" | "in_progress";
  currentExerciseIndex: number;
  exercises: DraftExercise[];
};

type ActiveWorkoutDraftStore = {
  draft: ActiveWorkoutDraft | null;
  startDraft: (draft: ActiveWorkoutDraft) => void;
  attachSessionId: (sessionId: string) => void;
  setCurrentExerciseIndex: (index: number) => void;
  updateCurrentSet: (patch: Partial<DraftSet>) => void;
  completeCurrentSet: () => void;
  editSet: (exerciseIndex: number, setOrder: number, patch: Partial<DraftSet>) => void;
  clearDraft: () => void;
};

function formatPlannedWeight(weight: number | null): string {
  if (weight === null || weight <= 0) {
    return "";
  }

  return Number.isInteger(weight) ? String(weight) : String(weight);
}

function createEmptySet(setOrder: number, plannedWeight: number | null = null): DraftSet {
  return {
    setOrder,
    weight: formatPlannedWeight(plannedWeight),
    reps: "",
    effort: null,
  };
}

export const useActiveWorkoutDraftStore = create<ActiveWorkoutDraftStore>((set) => ({
  draft: null,
  startDraft: (draft) => set({ draft }),
  attachSessionId: (sessionId) =>
    set((state) =>
      state.draft
        ? {
            draft: {
              ...state.draft,
              sessionId,
              status: "in_progress",
            },
          }
        : state,
    ),
  setCurrentExerciseIndex: (index) =>
    set((state) =>
      state.draft
        ? {
            draft: {
              ...state.draft,
              currentExerciseIndex: index,
            },
          }
        : state,
    ),
  updateCurrentSet: (patch) =>
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const exerciseIndex = state.draft.currentExerciseIndex;
      const exercise = state.draft.exercises[exerciseIndex];
      if (!exercise) {
        return state;
      }

      const nextSetOrder = exercise.sets.length + 1;
      const currentSet = exercise.sets[exercise.sets.length - 1] ?? createEmptySet(nextSetOrder);
      const updatedSet = { ...currentSet, ...patch };
      const sets =
        exercise.sets.length === 0
          ? [updatedSet]
          : exercise.sets.map((set, index) =>
              index === exercise.sets.length - 1 ? updatedSet : set,
            );

      const exercises = state.draft.exercises.map((entry, index) =>
        index === exerciseIndex ? { ...entry, sets } : entry,
      );

      return {
        draft: {
          ...state.draft,
          exercises,
        },
      };
    }),
  completeCurrentSet: () =>
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const exerciseIndex = state.draft.currentExerciseIndex;
      const exercise = state.draft.exercises[exerciseIndex];
      if (!exercise) {
        return state;
      }

      const currentSet = exercise.sets[exercise.sets.length - 1];
      if (!currentSet || !currentSet.effort) {
        return state;
      }

      const nextSet = createEmptySet(exercise.sets.length + 1, exercise.plannedWeight);
      const exercises = state.draft.exercises.map((entry, index) =>
        index === exerciseIndex ? { ...entry, sets: [...entry.sets, nextSet] } : entry,
      );

      return {
        draft: {
          ...state.draft,
          exercises,
        },
      };
    }),
  editSet: (exerciseIndex, setOrder, patch) =>
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const exercises = state.draft.exercises.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.setOrder === setOrder ? { ...set, ...patch } : set,
          ),
        };
      });

      return {
        draft: {
          ...state.draft,
          exercises,
        },
      };
    }),
  clearDraft: () => set({ draft: null }),
}));

export function getCompletedDraftSets(draft: ActiveWorkoutDraft) {
  return draft.exercises.flatMap((exercise) =>
    exercise.sets.filter((set) => set.effort && set.weight && set.reps),
  );
}

export function buildDraftFromTemplate(input: {
  templateId: string;
  templateName: string;
  clientSessionKey: string;
  exercises: Array<{
    exerciseId: string;
    name: string;
    equipmentId: string | null;
    targetSets: number;
    targetRepMin: number;
    targetRepMax: number;
    plannedWeight: number | null;
  }>;
}): ActiveWorkoutDraft {
  return {
    clientSessionKey: input.clientSessionKey,
    sessionId: null,
    templateId: input.templateId,
    templateName: input.templateName,
    status: "draft",
    currentExerciseIndex: 0,
    exercises: input.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      equipmentId: exercise.equipmentId,
      targetSets: exercise.targetSets,
      targetRepMin: exercise.targetRepMin,
      targetRepMax: exercise.targetRepMax,
      plannedWeight: exercise.plannedWeight,
      sets: [createEmptySet(1, exercise.plannedWeight)],
    })),
  };
}

export function createClientSessionKey(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createClientSetKey(
  sessionKey: string,
  exerciseId: string,
  setOrder: number,
): string {
  return `${sessionKey}:${exerciseId}:${setOrder}`;
}
