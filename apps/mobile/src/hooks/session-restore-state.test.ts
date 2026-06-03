import { describe, expect, it } from "vitest";
import {
  resolveSessionRestoreFailureState,
  SESSION_RESTORE_ERROR_MESSAGE,
} from "./session-restore-state";

describe("session restore failure state", () => {
  it("routes session restore failures to welcome without blocking auth screens", () => {
    expect(resolveSessionRestoreFailureState()).toEqual({
      redirect: "/welcome",
      isLoading: false,
      sessionRestoreError: SESSION_RESTORE_ERROR_MESSAGE,
    });
  });
});
