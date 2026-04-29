<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    completedAt?: string | null;
    createdAt: string;
  }>(),
  {
    completedAt: null,
  },
);

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

const formattedCompletedAt = computed(() => {
  if (!props.completedAt) {
    return null;
  }

  const completedAt = new Date(props.completedAt);

  if (Number.isNaN(completedAt.getTime())) {
    return props.completedAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(completedAt);
});
</script>

<template>
  <div class="task-meta-stack">
    <p class="task-meta" data-testid="task-metadata">
      Created {{ formattedCreatedAt }}
    </p>

    <p
      v-if="formattedCompletedAt"
      class="task-meta"
      data-testid="task-completion-metadata"
    >
      Completed {{ formattedCompletedAt }}
    </p>
  </div>
</template>
