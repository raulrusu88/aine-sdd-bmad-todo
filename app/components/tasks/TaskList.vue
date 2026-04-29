<script setup lang="ts">
import type { Task } from "~~/shared/types/api";

withDefaults(
  defineProps<{
    emptyMessage?: string;
    emptyTestId?: string;
    isLoading?: boolean;
    kicker?: string;
    listAriaLabel?: string;
    loadError?: string | null;
    panelTestId?: string | null;
    tasks: Task[];
    title?: string;
    titleId?: string;
    tone?: "default" | "completed";
  }>(),
  {
    emptyMessage:
      "No tasks yet. Add the first task for this list to get started.",
    emptyTestId: "task-list-empty-state",
    isLoading: false,
    kicker: "Tasks in this list",
    listAriaLabel: "Tasks in this list",
    loadError: null,
    panelTestId: null,
    title: "Active tasks",
    titleId: "task-list-title",
    tone: "default",
  },
);
</script>

<template>
  <section
    class="task-panel"
    :class="{ 'task-panel--completed': tone === 'completed' }"
    :aria-labelledby="titleId"
    :data-testid="panelTestId || undefined"
  >
    <p class="workspace-kicker">{{ kicker }}</p>
    <h3 :id="titleId">{{ title }}</h3>

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

    <ul v-if="tasks.length" class="task-list" :aria-label="listAriaLabel">
      <li v-for="task in tasks" :key="task.id">
        <TasksTaskItem :task="task" />
      </li>
    </ul>
  </section>
</template>
