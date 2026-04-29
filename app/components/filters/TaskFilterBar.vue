<script setup lang="ts">
import { normalizeTaskTagNameForComparison } from "~~/shared/schemas/tag";

const props = withDefaults(
  defineProps<{
    activeTag?: string | null;
    isDisabled?: boolean;
    isLoading?: boolean;
    loadError?: string | null;
    tags: string[];
  }>(),
  {
    activeTag: null,
    isDisabled: false,
    isLoading: false,
    loadError: null,
  },
);

defineEmits<{
  clear: [];
  select: [tag: string];
}>();

function isTagActive(tag: string): boolean {
  if (!props.activeTag) {
    return false;
  }

  return (
    normalizeTaskTagNameForComparison(tag) ===
    normalizeTaskTagNameForComparison(props.activeTag)
  );
}
</script>

<template>
  <section
    v-if="tags.length || activeTag || loadError"
    class="task-panel task-filter-bar"
    aria-labelledby="task-filter-title"
    data-testid="tag-filter-bar"
  >
    <div class="task-filter-bar__header">
      <div class="task-filter-bar__copy">
        <p class="workspace-kicker">Filter tasks</p>
        <h3 id="task-filter-title">Focus by tag</h3>
      </div>

      <button
        v-if="activeTag || loadError"
        class="button-secondary task-filter-bar__clear"
        data-testid="tag-filter-clear"
        :disabled="isDisabled || isLoading"
        type="button"
        @click="$emit('clear')"
      >
        {{
          isLoading
            ? "Updating..."
            : activeTag
              ? "Clear filter"
              : "Dismiss error"
        }}
      </button>
    </div>

    <p class="field-help">
      Select one tag to narrow the visible task list without changing the
      underlying saved tasks.
    </p>

    <p
      v-if="activeTag"
      class="task-filter-bar__status"
      data-testid="tag-filter-status"
    >
      Showing tasks tagged "{{ activeTag }}".
    </p>

    <ul v-if="tags.length" class="task-tag-list" aria-label="Task tag filters">
      <li v-for="tag in tags" :key="tag">
        <button
          class="task-tag task-filter-chip"
          :class="{ 'task-filter-chip--active': isTagActive(tag) }"
          :aria-pressed="isTagActive(tag)"
          data-testid="tag-filter-chip"
          :disabled="isDisabled || isLoading"
          type="button"
          @click="$emit('select', tag)"
        >
          {{ tag }}
        </button>
      </li>
    </ul>
  </section>
</template>
