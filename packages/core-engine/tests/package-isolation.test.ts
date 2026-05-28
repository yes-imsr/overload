import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(packageRoot, "src");
const forbiddenImportPattern =
  /from\s+["'](?:react-native|expo(?:\/[^"']*)?|@supabase\/[^"']+|supabase)["']|import\s*\(\s*["'](?:react-native|expo(?:\/[^"']*)?|@supabase\/[^"']+|supabase)["']\s*\)/;

const collectTypeScriptFiles = (directory: string): string[] => {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectTypeScriptFiles(fullPath);
    }

    return entry.endsWith(".ts") ? [fullPath] : [];
  });
};

describe("package isolation", () => {
  it("does not import React Native, Expo, or Supabase clients", () => {
    const violations = collectTypeScriptFiles(sourceRoot).filter((filePath) => {
      const source = readFileSync(filePath, "utf8");
      return forbiddenImportPattern.test(source);
    });

    expect(violations).toEqual([]);
  });
});
