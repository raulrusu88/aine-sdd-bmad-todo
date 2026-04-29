<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    testId?: string;
  }>(),
  {
    testId: "loading-state",
  },
);
</script>

<template>
  <p class="status-text feedback-state" :data-testid="testId" role="status">
    {{ message }}
  </p>
</template>
