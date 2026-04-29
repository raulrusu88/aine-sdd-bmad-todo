<script setup lang="ts">
import type { TodoList } from "~~/shared/types/api";

withDefaults(
  defineProps<{
    activeListId?: string | null;
    isLoading?: boolean;
    lists: TodoList[];
    loadError?: string | null;
  }>(),
  {
    activeListId: null,
    isLoading: false,
    loadError: null,
  },
);

defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <section class="workspace-panel" aria-labelledby="list-sidebar-title">
    <p class="workspace-kicker">Your lists</p>
    <h2 id="list-sidebar-title">Available workspaces</h2>

    <FeedbackLoadingState
      v-if="isLoading && !lists.length"
      message="Loading saved lists..."
      test-id="list-sidebar-loading-state"
    />

    <p
      v-if="loadError"
      class="error-text"
      data-testid="list-sidebar-error-banner"
      role="alert"
    >
      {{ loadError }}
    </p>

    <FeedbackEmptyState
      v-if="!isLoading && !loadError && !lists.length"
      message="No lists yet. Create your first list to start organizing work."
      test-id="list-sidebar-empty-state"
    />

    <ul v-if="lists.length" class="list-nav" aria-label="Todo lists">
      <li v-for="list in lists" :key="list.id">
        <NuxtLink
          class="list-nav__link"
          :class="{
            'list-nav__link--active': list.id === activeListId,
          }"
          data-testid="list-nav-item"
          :data-list-id="list.id"
          :to="`/lists/${list.id}`"
          @click="$emit('select', list.id)"
        >
          <span class="list-nav__name">{{ list.name }}</span>
          <span class="list-nav__meta">Created {{ list.createdAt }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
