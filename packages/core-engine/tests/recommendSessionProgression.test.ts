import { describe, expect, it } from "vitest";
import {
  pickHardestEffortFromRpeLabels,
  recommendProgressionForSession,
} from "../src/progression";

describe("pickHardestEffortFromRpeLabels", () => {
  it("returns the hardest effort label from a session", () => {
    expect(pickHardestEffortFromRpeLabels(["easy", "medium", "hard"])).toBe("Hard");
    expect(pickHardestEffortFromRpeLabels(["medium", "near_death"])).toBe("Near Death");
  });
});

describe("recommendProgressionForSession", () => {
  it("generates per-exercise recommendations from session effort", () => {
    const recommendations = recommendProgressionForSession(
      [
        { exerciseId: "squat", currentWeight: 200, currentRepTarget: 5 },
        { exerciseId: "bench", currentWeight: 135, currentRepTarget: 8 },
      ],
      [
        { exerciseId: "squat", efforts: ["Hard"] },
        { exerciseId: "bench", efforts: ["Easy"] },
      ],
    );

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatchObject({
      exerciseId: "squat",
      action: "hold",
      reasonCode: "effort_hard_hold",
    });
    expect(recommendations[1]).toMatchObject({
      exerciseId: "bench",
      action: "increase",
      reasonCode: "effort_easy_weight_up",
    });
  });
});
