import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("core-engine foundation", () => {
  it("exposes an empty public entrypoint", () => {
    const source = readFileSync(join(packageRoot, "src/index.ts"), "utf8");
    expect(source).toMatch(/export\s*\{\s*\}\s*;/);
  });

  it("runs vitest", () => {
    expect(true).toBe(true);
  });
});
