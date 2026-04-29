<script setup lang="ts">
import {
  appName,
  appShellDescription,
  appShellStatusLabel,
} from "~~/shared/constants/ui";

const uiFeedbackStore = useUiFeedbackStore();
const route = useRoute();
const visibleSuccessMessage = computed(() => {
  if (!uiFeedbackStore.successMessage) {
    return null;
  }

  if (!uiFeedbackStore.successPath) {
    return uiFeedbackStore.successMessage;
  }

  return uiFeedbackStore.successPath === route.path
    ? uiFeedbackStore.successMessage
    : null;
});
</script>

<template>
  <div class="app-shell" data-testid="app-shell">
    <header class="app-shell__header">
      <p class="app-shell__eyebrow">{{ appShellStatusLabel }}</p>
      <h1>{{ appName }}</h1>
      <p class="app-shell__description">{{ appShellDescription }}</p>

      <nav aria-label="Primary navigation">
        <ul class="app-shell__nav-list">
          <li>
            <NuxtLink to="/">Workspace</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/history">History</NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <FeedbackSuccessNotice
      v-if="visibleSuccessMessage"
      :message="visibleSuccessMessage"
      @close="uiFeedbackStore.clearSuccess"
    />

    <main class="app-shell__main">
      <slot />
    </main>
  </div>
</template>
