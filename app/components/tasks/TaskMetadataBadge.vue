<script setup lang="ts">
const props = defineProps<{
  createdAt: string;
}>();

const formattedCreatedAt = computed(() => {
  const createdAt = new Date(props.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return props.createdAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt);
});
</script>

<template>
  <p class="task-meta" data-testid="task-metadata">
    Created {{ formattedCreatedAt }}
  </p>
</template>
