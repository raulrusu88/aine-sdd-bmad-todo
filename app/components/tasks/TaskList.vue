<script setup lang="ts">
import type { Task } from "~~/shared/types/api";

withDefaults(
  defineProps<{
    emptyMessage?: string;
    emptyTestId?: string;
    isLoading?: boolean;
    loadError?: string | null;
    tasks: Task[];
  }>(),
  {
    emptyMessage:
      "No tasks yet. Add the first task for this list to get started.",
    emptyTestId: "task-list-empty-state",
    isLoading: false,
    loadError: null,
  },
);
</script>

<template>
  <section class="task-panel" aria-labelledby="task-list-title">
    <p class="workspace-kicker">Tasks in this list</p>
    <h3 id="task-list-title">Active tasks</h3>

    <FeedbackLoadingState
      v-if="isLoading && !tasks.length"
      message="Loading saved tasks..."
      test-id="task-list-loading-state"
    />

    <p
      v-if="loadError"
      class="error-text"
      data-testid="task-list-error-banner"
      role="alert"
    >
      {{ loadError }}
    </p>

    <FeedbackEmptyState
      v-if="!isLoading && !loadError && !tasks.length"
      :message="emptyMessage"
      :test-id="emptyTestId"
    />

    <ul v-if="tasks.length" class="task-list" aria-label="Tasks in this list">
      <li v-for="task in tasks" :key="task.id">
        <TasksTaskItem :task="task" />
      </li>
    </ul>
  </section>
</template>
