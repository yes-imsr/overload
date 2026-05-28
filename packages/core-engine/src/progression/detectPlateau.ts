import { PLATEAU_FAILED_SESSION_THRESHOLD } from "./constants";
import type { SessionStruggleRecord } from "./types";

function isStruggleSession(record: SessionStruggleRecord): boolean {
  if (!record.metTargets) {
    return true;
  }
  return record.hardestEffort === "Hard" || record.hardestEffort === "Near Death";
}

export function detectPlateau(
  recentSessions: readonly SessionStruggleRecord[],
): { readonly isPlateau: boolean; readonly failedSessionCount: number } {
  let consecutiveFailures = 0;
  for (let index = recentSessions.length - 1; index >= 0; index -= 1) {
    const record = recentSessions[index]!;
    if (!isStruggleSession(record)) {
      break;
    }
    consecutiveFailures += 1;
  }

  return {
    isPlateau: consecutiveFailures >= PLATEAU_FAILED_SESSION_THRESHOLD,
    failedSessionCount: consecutiveFailures,
  };
}
