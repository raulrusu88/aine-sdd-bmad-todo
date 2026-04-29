<script setup lang="ts">
import { useTaskStore } from "~~/app/stores/useTaskStore";
import { useUiFeedbackStore } from "~~/app/stores/useUiFeedbackStore";

const route = useRoute();
const listStore = useListStore();
const taskStore = useTaskStore();
const uiFeedbackStore = useUiFeedbackStore();
const draftListName = ref("");
const draftRenameName = ref("");
const draftTaskDescription = ref("");
const draftTaskTitle = ref("");
const isInteractive = ref(false);
const isDeleteOpen = ref(false);
const isRenameOpen = ref(false);
const isRestoringWorkspace = ref(false);
const localCreateError = ref<string | null>(null);
const localRenameError = ref<string | null>(null);
const localTaskError = ref<string | null>(null);
let createTaskRequestId = 0;
let restoreWorkspaceRequestId = 0;

const routeListId = computed(() => String(route.params.id ?? ""));
const createErrorMessage = computed(
  () => localCreateError.value ?? listStore.createError,
);
const deleteErrorMessage = computed(() => listStore.deleteError);
const currentList = computed(() => listStore.getListById(routeListId.value));
const renameErrorMessage = computed(
  () => localRenameError.value ?? listStore.renameError,
);
const shouldShowTaskFilterBar = computed(
  () =>
    taskStore.availableTaskTags.length > 0 ||
    taskStore.hasActiveTagFilter ||
    Boolean(taskStore.loadError),
);
const taskCreateErrorMessage = computed(
  () => localTaskError.value ?? taskStore.createError,
);
const taskComposerHelpMessage = computed(() =>
  taskStore.activeTagFilter
    ? `Clear the "${taskStore.activeTagFilter}" tag filter before adding a new task so the new item stays visible.`
    : "Use a short title for quick scanning and add details only when they help.",
);
const isTaskComposerDisabled = computed(
  () => !isInteractive.value || taskStore.hasActiveTagFilter,
);
const taskListEmptyMessage = computed(() =>
  taskStore.activeTagFilter
    ? `No tasks match the "${taskStore.activeTagFilter}" tag yet. Clear the filter or choose another tag.`
    : "No tasks yet. Add the first task for this list to get started.",
);
const taskListEmptyTestId = computed(() =>
  taskStore.activeTagFilter
    ? "task-list-filter-empty-state"
    : "task-list-empty-state",
);
const isWorkspaceLoading = computed(
  () =>
    isRestoringWorkspace.value && !currentList.value && !listStore.loadError,
);

async function loadSelectedWorkspace(listId: string) {
  const requestId = ++restoreWorkspaceRequestId;

  if (!listId) {
    isRestoringWorkspace.value = false;
    taskStore.resetTasks();

    return null;
  }

  isRestoringWorkspace.value = true;

  try {
    const todoList = await listStore.loadList(listId);

    if (requestId !== restoreWorkspaceRequestId) {
      return null;
    }

    if (!todoList) {
      taskStore.resetTasks();

      return null;
    }

    await taskStore.loadTasks(todoList.id);

    if (requestId !== restoreWorkspaceRequestId) {
      return null;
    }

    return todoList;
  } finally {
    if (requestId === restoreWorkspaceRequestId) {
      isRestoringWorkspace.value = false;
    }
  }
}

void callOnce("todo-lists", () => listStore.loadLists());
void loadSelectedWorkspace(routeListId.value);

onMounted(() => {
  isInteractive.value = true;
});

onBeforeUnmount(() => {
  createTaskRequestId += 1;
});

function resetTaskDrafts() {
  draftTaskDescription.value = "";
  draftTaskTitle.value = "";
  localTaskError.value = null;
  taskStore.clearCreateError();
}

watch(
  routeListId,
  async (nextId) => {
    createTaskRequestId += 1;
    uiFeedbackStore.clearSuccess();
    closeDeletePanel();
    closeRenamePanel();
    resetTaskDrafts();

    if (!nextId) {
      taskStore.resetTasks();

      return;
    }

    await loadSelectedWorkspace(nextId);
  },
  { immediate: false },
);

watch(
  currentList,
  (nextList) => {
    if (!nextList) {
      draftRenameName.value = "";

      return;
    }

    draftRenameName.value = nextList.name;
  },
  { immediate: true },
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

async function handleCreateTask() {
  const selectedList = currentList.value;

  if (!selectedList || taskStore.hasActiveTagFilter) {
    return;
  }

  const requestId = ++createTaskRequestId;
  const requestListId = selectedList.id;
  const trimmedTitle = draftTaskTitle.value.trim();

  localTaskError.value = null;
  taskStore.clearCreateError();

  if (!trimmedTitle) {
    localTaskError.value = "Task title is required.";

    return;
  }

  uiFeedbackStore.clearSuccess();
  const createdTask = await taskStore.createTask({
    description: draftTaskDescription.value,
    listId: selectedList.id,
    title: trimmedTitle,
  });

  if (
    !createdTask ||
    requestId !== createTaskRequestId ||
    routeListId.value !== requestListId
  ) {
    return;
  }

  resetTaskDrafts();
  uiFeedbackStore.showSuccess(
    `Created task "${createdTask.title}".`,
    route.path,
  );
}

async function handleApplyTaskFilter(tag: string) {
  uiFeedbackStore.clearSuccess();
  await taskStore.applyTagFilter(tag);
}

function handleClearTaskFilter() {
  uiFeedbackStore.clearSuccess();
  taskStore.clearTagFilter();
}

function handleSelectList(id: string) {
  uiFeedbackStore.clearSuccess();
  closeDeletePanel();
  closeRenamePanel();
  listStore.selectList(id);
}

function openRenamePanel() {
  if (!currentList.value) {
    return;
  }

  draftRenameName.value = currentList.value.name;
  isDeleteOpen.value = false;
  listStore.clearDeleteError();
  localRenameError.value = null;
  listStore.clearRenameError();
  isRenameOpen.value = true;
}

function closeRenamePanel() {
  draftRenameName.value = currentList.value?.name ?? "";
  localRenameError.value = null;
  listStore.clearRenameError();
  isRenameOpen.value = false;
}

function openDeletePanel() {
  if (!currentList.value) {
    return;
  }

  isRenameOpen.value = false;
  localRenameError.value = null;
  listStore.clearRenameError();
  listStore.clearDeleteError();
  isDeleteOpen.value = true;
}

function closeDeletePanel() {
  listStore.clearDeleteError();
  isDeleteOpen.value = false;
}

async function handleRenameList() {
  const selectedList = currentList.value;

  if (!selectedList) {
    return;
  }

  const trimmedName = draftRenameName.value.trim();

  uiFeedbackStore.clearSuccess();
  localRenameError.value = null;
  listStore.clearRenameError();

  if (!trimmedName) {
    localRenameError.value = "List name is required.";

    return;
  }

  if (trimmedName === selectedList.name) {
    closeRenamePanel();

    return;
  }

  const renamedList = await listStore.renameList(selectedList.id, {
    name: trimmedName,
  });

  if (!renamedList) {
    return;
  }

  draftRenameName.value = renamedList.name;
  isRenameOpen.value = false;
  uiFeedbackStore.showSuccess(
    `Renamed list to "${renamedList.name}".`,
    route.path,
  );
}

async function handleDeleteList() {
  const selectedList = currentList.value;

  if (!selectedList) {
    return;
  }

  uiFeedbackStore.clearSuccess();
  const deletedList = await listStore.deleteList(selectedList.id);

  if (!deletedList) {
    return;
  }

  isDeleteOpen.value = false;
  taskStore.resetTasks();
  await navigateTo("/");
  await nextTick();
  uiFeedbackStore.showSuccess(`Deleted list "${selectedList.name}".`, "/");
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
      v-if="currentList"
      class="workspace-panel workspace-panel--hero"
      data-testid="list-workspace"
    >
      <div class="workspace-header">
        <div class="workspace-header__copy">
          <p class="workspace-kicker">Active workspace</p>
          <h2>{{ currentList.name }}</h2>
        </div>

        <div class="button-row button-row--compact">
          <button
            class="button-secondary"
            data-testid="list-rename-toggle"
            type="button"
            @click="openRenamePanel"
          >
            Rename list
          </button>
          <button
            class="button-danger"
            data-testid="list-delete-toggle"
            type="button"
            @click="openDeletePanel"
          >
            Delete list
          </button>
        </div>
      </div>

      <p>
        Capture the active work for this list with short, scannable tasks and
        optional detail when more context helps.
      </p>

      <div class="task-workspace" data-testid="task-workspace">
        <TasksTaskComposer
          v-model:description="draftTaskDescription"
          v-model:title="draftTaskTitle"
          :error-message="taskCreateErrorMessage"
          :help-message="taskComposerHelpMessage"
          :is-disabled="isTaskComposerDisabled"
          :is-submitting="taskStore.isCreating"
          @submit="handleCreateTask"
        />

        <FiltersTaskFilterBar
          v-if="shouldShowTaskFilterBar"
          :active-tag="taskStore.activeTagFilter"
          :is-disabled="!isInteractive"
          :is-loading="taskStore.isLoading"
          :load-error="taskStore.loadError"
          :tags="taskStore.availableTaskTags"
          @clear="handleClearTaskFilter"
          @select="handleApplyTaskFilter"
        />

        <TasksTaskList
          :empty-message="taskListEmptyMessage"
          :empty-test-id="taskListEmptyTestId"
          :is-loading="taskStore.isLoading"
          :load-error="taskStore.loadError"
          :tasks="taskStore.tasks"
        />
      </div>

      <dl class="workspace-details">
        <div>
          <dt>List id</dt>
          <dd>{{ currentList.id }}</dd>
        </div>
        <div>
          <dt>Created at</dt>
          <dd>{{ currentList.createdAt }}</dd>
        </div>
      </dl>

      <div v-if="isRenameOpen || isDeleteOpen" class="management-stack">
        <ListsListRenameDialog
          v-model="draftRenameName"
          :error-message="renameErrorMessage"
          :is-open="isRenameOpen"
          :is-submitting="listStore.isRenaming"
          @cancel="closeRenamePanel"
          @submit="handleRenameList"
        />

        <ListsListDeleteDialog
          :error-message="deleteErrorMessage"
          :is-open="isDeleteOpen"
          :is-submitting="listStore.isDeleting"
          :list-name="currentList.name"
          @cancel="closeDeletePanel"
          @confirm="handleDeleteList"
        />
      </div>
    </section>

    <section
      v-else-if="isWorkspaceLoading"
      class="workspace-panel workspace-panel--hero"
      data-testid="loading-state"
    >
      <p class="workspace-kicker">Restoring workspace</p>
      <h2>Loading your saved list</h2>
      <FeedbackLoadingState
        message="Loading saved workspace details..."
        test-id="list-workspace-loading-state"
      />
    </section>

    <section v-else class="workspace-panel workspace-panel--hero">
      <p class="workspace-kicker">Workspace unavailable</p>
      <h2>We couldn’t open that list</h2>
      <p data-testid="error-banner">
        {{ listStore.loadError ?? "Choose a saved list or create a new one." }}
      </p>
    </section>
  </div>
</template>
