<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    testId?: string;
  }>(),
  {
    testId: "empty-state",
  },
);
</script>

<template>
  <p class="status-text feedback-state" :data-testid="testId">
    {{ message }}
  </p>
</template>
