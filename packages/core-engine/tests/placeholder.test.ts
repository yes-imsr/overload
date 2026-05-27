import { describe, expect, it } from "vitest";
import { CORE_ENGINE_VERSION, placeholder } from "../src/index";

describe("core-engine foundation", () => {
  it("exports version", () => {
    expect(CORE_ENGINE_VERSION).toBe("0.0.0");
  });

  it("runs vitest", () => {
    expect(placeholder()).toBe(true);
  });
});
