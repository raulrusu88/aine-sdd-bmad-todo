<script setup lang="ts">
import type { Task } from "~~/shared/types/api";

import { useTaskStore } from "~~/app/stores/useTaskStore";
import { useUiFeedbackStore } from "~~/app/stores/useUiFeedbackStore";

const props = defineProps<{
  task: Task;
}>();

const route = useRoute();
const taskStore = useTaskStore();
const uiFeedbackStore = useUiFeedbackStore();
const titleInput = ref<HTMLInputElement | null>(null);

const isDeletePanelOpen = ref(false);
const isEditPanelOpen = ref(false);
const localUpdateError = ref<string | null>(null);
const taskDescriptionDraft = ref("");
const taskTitleDraft = ref("");

const deleteError = computed(() => taskStore.deleteErrorForTask(props.task.id));
const isDeleting = computed(() => taskStore.isDeletingTask(props.task.id));
const isMutating = computed(() => isDeleting.value || isUpdating.value);
const isUpdating = computed(() => taskStore.isUpdatingTask(props.task.id));
const normalizedTaskDescription = computed(() => props.task.description ?? "");
const updateError = computed(
  () => localUpdateError.value ?? taskStore.updateErrorForTask(props.task.id),
);

function syncDraftValues() {
  taskTitleDraft.value = props.task.title;
  taskDescriptionDraft.value = props.task.description ?? "";
}

function clearMutationErrors() {
  localUpdateError.value = null;
  taskStore.clearDeleteError(props.task.id);
  taskStore.clearUpdateError(props.task.id);
}

function closeDeletePanel() {
  isDeletePanelOpen.value = false;
  taskStore.clearDeleteError(props.task.id);
}

function closeEditPanel() {
  isEditPanelOpen.value = false;
  clearMutationErrors();
  syncDraftValues();
}

function normalizeDraftDescription() {
  return taskDescriptionDraft.value.trim();
}

async function openEditPanel() {
  isDeletePanelOpen.value = false;
  clearMutationErrors();
  syncDraftValues();
  isEditPanelOpen.value = true;

  await nextTick();

  titleInput.value?.focus();
}

function openDeletePanel() {
  isEditPanelOpen.value = false;
  localUpdateError.value = null;
  taskStore.clearUpdateError(props.task.id);
  taskStore.clearDeleteError(props.task.id);
  isDeletePanelOpen.value = true;
}

async function handleUpdateTask() {
  uiFeedbackStore.clearSuccess();
  clearMutationErrors();

  const title = taskTitleDraft.value.trim();

  if (!title) {
    localUpdateError.value = "Task title is required.";
    await nextTick();
    titleInput.value?.focus();

    return;
  }

  if (
    title === props.task.title &&
    normalizeDraftDescription() === normalizedTaskDescription.value
  ) {
    closeEditPanel();

    return;
  }

  const updatedTask = await taskStore.updateTask(props.task.id, {
    description: taskDescriptionDraft.value,
    title,
  });

  if (!updatedTask) {
    return;
  }

  uiFeedbackStore.showSuccess(
    `Updated task "${updatedTask.title}".`,
    route.path,
  );
  closeEditPanel();
}

async function handleDeleteTask() {
  uiFeedbackStore.clearSuccess();
  const deletedTask = await taskStore.deleteTask(props.task.id);

  if (!deletedTask) {
    return;
  }

  uiFeedbackStore.showSuccess(
    `Deleted task "${props.task.title}".`,
    route.path,
  );
  closeDeletePanel();
}

watch(
  () => [props.task.description, props.task.title],
  () => {
    if (!isEditPanelOpen.value) {
      syncDraftValues();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <article class="task-item" data-testid="task-item">
    <div class="task-item__header">
      <div class="task-item__copy">
        <h4 class="task-item__title">{{ task.title }}</h4>

        <p
          v-if="task.description"
          class="task-item__description"
          data-testid="task-item-description"
        >
          {{ task.description }}
        </p>
      </div>

      <TasksTaskMetadataBadge :created-at="task.createdAt" />
    </div>

    <div class="task-item__actions">
      <button
        class="button-secondary"
        :disabled="isMutating"
        data-testid="task-edit-toggle"
        type="button"
        @click="openEditPanel"
      >
        Edit task
      </button>

      <button
        class="button-danger"
        :disabled="isMutating"
        data-testid="task-delete-toggle"
        type="button"
        @click="openDeletePanel"
      >
        Delete task
      </button>
    </div>

    <form
      v-if="isEditPanelOpen"
      class="task-item__panel"
      data-testid="task-edit-form"
      @submit.prevent="handleUpdateTask"
    >
      <div class="field-group">
        <label class="field-label" :for="`task-edit-title-${task.id}`">
          Task title
        </label>
        <input
          :id="`task-edit-title-${task.id}`"
          ref="titleInput"
          v-model="taskTitleDraft"
          class="input-control"
          data-testid="task-edit-title-input"
          maxlength="200"
          name="title"
          type="text"
        />
      </div>

      <div class="field-group">
        <label class="field-label" :for="`task-edit-description-${task.id}`">
          Description
        </label>
        <textarea
          :id="`task-edit-description-${task.id}`"
          v-model="taskDescriptionDraft"
          class="input-control textarea-control"
          data-testid="task-edit-description-input"
          maxlength="2000"
          name="description"
        />
      </div>

      <p
        v-if="updateError"
        class="error-text"
        data-testid="task-edit-error-banner"
        role="alert"
      >
        {{ updateError }}
      </p>

      <div class="button-row button-row--compact">
        <button
          class="button-secondary"
          :disabled="isUpdating"
          data-testid="task-edit-cancel"
          type="button"
          @click="closeEditPanel"
        >
          Cancel
        </button>

        <button
          class="button-primary"
          :disabled="isUpdating"
          data-testid="task-edit-submit"
          type="submit"
        >
          Save changes
        </button>
      </div>
    </form>

    <section
      v-if="isDeletePanelOpen"
      class="task-item__panel task-item__panel--danger"
      data-testid="task-delete-panel"
    >
      <p class="task-item__confirm-copy">
        Delete <strong>{{ task.title }}</strong
        >? This removes the task from the current list.
      </p>

      <p
        v-if="deleteError"
        class="error-text"
        data-testid="task-delete-error-banner"
        role="alert"
      >
        {{ deleteError }}
      </p>

      <div class="button-row button-row--compact">
        <button
          class="button-secondary"
          :disabled="isDeleting"
          data-testid="task-delete-cancel"
          type="button"
          @click="closeDeletePanel"
        >
          Keep task
        </button>

        <button
          class="button-danger"
          :disabled="isDeleting"
          data-testid="task-delete-confirm"
          type="button"
          @click="handleDeleteTask"
        >
          Delete permanently
        </button>
      </div>
    </section>
  </article>
</template>
