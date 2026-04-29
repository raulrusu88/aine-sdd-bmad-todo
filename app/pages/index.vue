<script setup lang="ts">
const listStore = useListStore();
const uiFeedbackStore = useUiFeedbackStore();
const draftListName = ref("");
const isInteractive = ref(false);
const localCreateError = ref<string | null>(null);

void callOnce("todo-lists", () => listStore.loadLists());

onMounted(() => {
  isInteractive.value = true;
});

const createErrorMessage = computed(
  () => localCreateError.value ?? listStore.createError,
);
const isLoadingLists = computed(
  () => listStore.isLoading && !listStore.hasLists && !listStore.loadError,
);
const isRootLoadError = computed(
  () => Boolean(listStore.loadError) && !listStore.hasLists,
);

async function handleCreateList() {
  const trimmedName = draftListName.value.trim();

  uiFeedbackStore.clearSuccess();
  localCreateError.value = null;
  listStore.clearCreateError();

  if (!trimmedName) {
    localCreateError.value = "List name is required.";

    return;
  }

  const createdList = await listStore.createList({
    name: trimmedName,
  });

  if (!createdList) {
    return;
  }

  draftListName.value = "";
  await navigateTo(`/lists/${createdList.id}`);
  await nextTick();
  uiFeedbackStore.showSuccess(
    `Created list "${createdList.name}".`,
    `/lists/${createdList.id}`,
  );
}

function handleSelectList(id: string) {
  uiFeedbackStore.clearSuccess();
  listStore.selectList(id);
}
</script>

<template>
  <div class="workspace-grid">
    <aside class="workspace-stack">
      <ListsListCreateForm
        v-model="draftListName"
        :error-message="createErrorMessage"
        :is-disabled="!isInteractive"
        :is-submitting="listStore.isCreating"
        @submit="handleCreateList"
      />

      <ListsListSidebar
        :active-list-id="listStore.activeListId"
        :is-loading="listStore.isLoading"
        :lists="listStore.lists"
        :load-error="listStore.loadError"
        @select="handleSelectList"
      />
    </aside>

    <section
      v-if="isLoadingLists"
      class="workspace-panel workspace-panel--hero"
      data-testid="loading-state"
    >
      <p class="workspace-kicker">Restoring workspace</p>
      <h2>Loading your saved lists</h2>
      <FeedbackLoadingState
        message="Loading saved workspaces..."
        test-id="root-loading-state"
      />
    </section>

    <section
      v-else-if="isRootLoadError"
      class="workspace-panel workspace-panel--hero"
    >
      <p class="workspace-kicker">Workspace unavailable</p>
      <h2>We couldn’t load your saved lists</h2>
      <p data-testid="error-banner">{{ listStore.loadError }}</p>
    </section>

    <section
      v-else-if="!listStore.hasLists"
      class="workspace-panel workspace-panel--hero"
      data-testid="empty-state"
    >
      <p class="workspace-kicker">First step</p>
      <h2>Create your first todo list</h2>
      <p>
        Start with a single named list so the workspace has a clear home for
        tasks. You can add more lists later for other areas of work.
      </p>

      <ul class="workspace-list">
        <li>Use short, recognizable list names such as Work or Personal.</li>
        <li>Your saved lists stay available through the application API.</li>
        <li>Selecting a list opens its dedicated workspace route.</li>
      </ul>
    </section>

    <section v-else class="workspace-panel workspace-panel--hero">
      <p class="workspace-kicker">Workspace ready</p>
      <h2>Open a saved list to continue</h2>
      <p>
        Choose a saved list from the sidebar to reopen its workspace, restore
        its saved tasks, and continue where you left off.
      </p>
    </section>
  </div>
</template>
