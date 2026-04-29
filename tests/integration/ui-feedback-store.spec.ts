import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUiFeedbackStore } from "~~/app/stores/useUiFeedbackStore";

describe("useUiFeedbackStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    const store = useUiFeedbackStore();

    store.clearSuccess();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("clears success notices after the configured timeout", () => {
    const store = useUiFeedbackStore();

    store.showSuccess('Created list "Work".');

    expect(store.successMessage).toBe('Created list "Work".');

    vi.advanceTimersByTime(4000);

    expect(store.successMessage).toBeNull();
  });

  it("replaces the current success notice and resets the timeout", () => {
    const store = useUiFeedbackStore();

    store.showSuccess('Created task "Plan sprint".');

    vi.advanceTimersByTime(3000);

    store.showSuccess('Updated task "Finalize sprint plan".');

    vi.advanceTimersByTime(1500);
    expect(store.successMessage).toBe('Updated task "Finalize sprint plan".');

    vi.advanceTimersByTime(2500);
    expect(store.successMessage).toBeNull();
  });
});
