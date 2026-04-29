import { defineStore } from "pinia";

const SUCCESS_NOTICE_DURATION_MS = 4000;

let clearSuccessTimer: ReturnType<typeof setTimeout> | null = null;

function resetSuccessTimer() {
  if (!clearSuccessTimer) {
    return;
  }

  clearTimeout(clearSuccessTimer);
  clearSuccessTimer = null;
}

export const useUiFeedbackStore = defineStore("ui-feedback", {
  state: () => ({
    successMessage: null as string | null,
    successPath: null as string | null,
  }),
  actions: {
    clearSuccess() {
      resetSuccessTimer();
      this.successMessage = null;
      this.successPath = null;
    },
    showSuccess(message: string, path: string | null = null) {
      resetSuccessTimer();
      this.successMessage = message;
      this.successPath = path;

      clearSuccessTimer = setTimeout(() => {
        this.successMessage = null;
        this.successPath = null;
        clearSuccessTimer = null;
      }, SUCCESS_NOTICE_DURATION_MS);
    },
  },
});
