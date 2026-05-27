export interface EstimateOneRepMaxInput {
  readonly weight: number;
  readonly reps: number;
}

const validateFiniteNumber = (name: string, value: number): void => {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
};

export function estimateOneRepMax(input: EstimateOneRepMaxInput): number {
  const { weight, reps } = input;

  validateFiniteNumber("weight", weight);
  validateFiniteNumber("reps", reps);

  if (weight < 0) {
    throw new RangeError("weight must be greater than or equal to 0.");
  }

  if (!Number.isInteger(reps) || reps < 1) {
    throw new RangeError("reps must be a whole number greater than or equal to 1.");
  }

  if (reps === 1) {
    return weight;
  }

  return weight * (1 + reps / 30);
}
