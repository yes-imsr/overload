export function formatEntropy(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
