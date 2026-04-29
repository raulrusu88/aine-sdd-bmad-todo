<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    testId?: string;
  }>(),
  {
    testId: "success-notice",
  },
);

defineEmits<{
  close: [];
}>();
</script>

<template>
  <section
    aria-live="polite"
    class="success-notice"
    :data-testid="testId"
    role="status"
  >
    <div class="success-notice__copy">
      <p class="success-notice__kicker">Saved</p>
      <p class="success-notice__message">{{ message }}</p>
    </div>

    <button
      class="button-secondary success-notice__dismiss"
      data-testid="success-notice-dismiss"
      type="button"
      @click="$emit('close')"
    >
      Dismiss
    </button>
  </section>
</template>
