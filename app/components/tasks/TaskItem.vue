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
const tagInput = ref<HTMLInputElement | null>(null);
const titleInput = ref<HTMLInputElement | null>(null);

const isDeletePanelOpen = ref(false);
const isEditPanelOpen = ref(false);
const localUpdateError = ref<string | null>(null);
const taskDescriptionDraft = ref("");
const taskTagInputDraft = ref("");
const taskTagsDraft = ref<string[]>([]);
const taskTitleDraft = ref("");

const completeError = computed(() =>
  taskStore.completeErrorForTask(props.task.id),
);
const deleteError = computed(() => taskStore.deleteErrorForTask(props.task.id));
const isCompleting = computed(() => taskStore.isCompletingTask(props.task.id));
const isDeleting = computed(() => taskStore.isDeletingTask(props.task.id));
const isMutating = computed(
  () => isCompleting.value || isDeleting.value || isUpdating.value,
);
const isCompleteActionDisabled = computed(
  () => isMutating.value || isDeletePanelOpen.value || isEditPanelOpen.value,
);
const isTaskCompleted = computed(() => props.task.isCompleted);
const isUpdating = computed(() => taskStore.isUpdatingTask(props.task.id));
const normalizedTaskDescription = computed(() => props.task.description ?? "");
const taskStatusLabel = computed(() =>
  isTaskCompleted.value ? "Completed" : "Active",
);
const updateError = computed(
  () => localUpdateError.value ?? taskStore.updateErrorForTask(props.task.id),
);

function syncDraftValues() {
  taskTitleDraft.value = props.task.title;
  taskDescriptionDraft.value = props.task.description ?? "";
  taskTagInputDraft.value = "";
  taskTagsDraft.value = [...props.task.tags];
}

function normalizeDraftTagName(value: string) {
  return value.trim().normalize("NFC");
}

function normalizeDraftTagNameForComparison(value: string) {
  return normalizeDraftTagName(value).toLocaleLowerCase();
}

function areTaskTagsEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every(
      (tag, index) =>
        normalizeDraftTagName(tag) ===
        normalizeDraftTagName(right[index] ?? ""),
    )
  );
}

async function focusTagInput() {
  await nextTick();
  tagInput.value?.focus();
}

async function addTaskTagFromDraft() {
  const normalizedTagName = normalizeDraftTagName(taskTagInputDraft.value);

  localUpdateError.value = null;
  taskStore.clearUpdateError(props.task.id);

  if (!normalizedTagName) {
    localUpdateError.value = "Tag is required.";
    await focusTagInput();

    return false;
  }

  if (normalizedTagName.length > 40) {
    localUpdateError.value = "Tag must be 40 characters or fewer.";
    await focusTagInput();

    return false;
  }

  if (
    taskTagsDraft.value.some(
      (tag) =>
        normalizeDraftTagNameForComparison(tag) ===
        normalizeDraftTagNameForComparison(normalizedTagName),
    )
  ) {
    localUpdateError.value = "Duplicate tags are not allowed.";
    await focusTagInput();

    return false;
  }

  taskTagsDraft.value = [...taskTagsDraft.value, normalizedTagName];
  taskTagInputDraft.value = "";
  await focusTagInput();

  return true;
}

function removeTaskTag(index: number) {
  localUpdateError.value = null;
  taskStore.clearUpdateError(props.task.id);
  taskTagsDraft.value = taskTagsDraft.value.filter(
    (_, draftIndex) => draftIndex !== index,
  );
}

function clearMutationErrors() {
  localUpdateError.value = null;
  taskStore.clearCompleteError(props.task.id);
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
  taskStore.clearCompleteError(props.task.id);
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

  if (taskTagInputDraft.value.trim()) {
    const didAddTaskTag = await addTaskTagFromDraft();

    if (!didAddTaskTag) {
      return;
    }
  }

  if (
    title === props.task.title &&
    normalizeDraftDescription() === normalizedTaskDescription.value &&
    areTaskTagsEqual(taskTagsDraft.value, props.task.tags)
  ) {
    closeEditPanel();

    return;
  }

  const updatedTask = await taskStore.updateTask(props.task.id, {
    description: taskDescriptionDraft.value,
    tags: taskTagsDraft.value,
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

async function handleCompleteTask() {
  uiFeedbackStore.clearSuccess();
  clearMutationErrors();
  const requestPath = route.path;

  const completedTask = await taskStore.completeTask(props.task.id);

  if (!completedTask || route.path !== requestPath) {
    return;
  }

  uiFeedbackStore.showSuccess(
    `Completed task "${completedTask.title}".`,
    route.path,
  );
}

async function handleDeleteTask() {
  uiFeedbackStore.clearSuccess();
  clearMutationErrors();
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
  () => [
    props.task.completedAt,
    props.task.description,
    props.task.isCompleted,
    props.task.title,
    props.task.tags.join("\u0000"),
  ],
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
  <article
    class="task-item"
    :class="{ 'task-item--completed': isTaskCompleted }"
    data-testid="task-item"
  >
    <div class="task-item__header">
      <div class="task-item__copy">
        <div class="task-item__title-row">
          <h4 class="task-item__title">{{ task.title }}</h4>

          <span
            class="task-status-badge"
            :class="
              isTaskCompleted
                ? 'task-status-badge--completed'
                : 'task-status-badge--active'
            "
            data-testid="task-status-badge"
          >
            {{ taskStatusLabel }}
          </span>
        </div>

        <p
          v-if="task.description"
          class="task-item__description"
          data-testid="task-item-description"
        >
          {{ task.description }}
        </p>

        <ul
          v-if="task.tags.length"
          class="task-tag-list"
          data-testid="task-tag-list"
          aria-label="Task tags"
        >
          <li v-for="(tag, index) in task.tags" :key="`${tag}-${index}`">
            <span class="task-tag" data-testid="task-tag-chip">{{ tag }}</span>
          </li>
        </ul>
      </div>

      <TasksTaskMetadataBadge
        :completed-at="task.completedAt"
        :created-at="task.createdAt"
      />
    </div>

    <div class="task-item__actions">
      <button
        v-if="!isTaskCompleted"
        class="button-primary"
        :disabled="isCompleteActionDisabled"
        data-testid="task-complete-toggle"
        type="button"
        @click="handleCompleteTask"
      >
        Mark completed
      </button>

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

    <p
      v-if="completeError"
      class="error-text"
      data-testid="task-complete-error-banner"
      role="alert"
    >
      {{ completeError }}
    </p>

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

      <div class="field-group">
        <label class="field-label" :for="`task-edit-tag-${task.id}`"
          >Tags</label
        >
        <p class="field-help">
          Add short labels one at a time to keep the task easy to scan.
        </p>

        <div class="task-tag-input-row">
          <input
            :id="`task-edit-tag-${task.id}`"
            ref="tagInput"
            v-model="taskTagInputDraft"
            class="input-control"
            data-testid="task-tag-input"
            :disabled="isUpdating"
            maxlength="40"
            name="tag"
            placeholder="Add a tag"
            type="text"
            @keydown.enter.prevent="addTaskTagFromDraft"
          />

          <button
            class="button-secondary"
            data-testid="task-tag-add-button"
            :disabled="isUpdating"
            type="button"
            @click="addTaskTagFromDraft"
          >
            Add tag
          </button>
        </div>

        <ul
          v-if="taskTagsDraft.length"
          class="task-tag-list task-tag-list--editable"
          data-testid="task-tag-draft-list"
          aria-label="Draft task tags"
        >
          <li v-for="(tag, index) in taskTagsDraft" :key="`${tag}-${index}`">
            <span class="task-tag task-tag--removable">
              <span data-testid="task-tag-draft-chip">{{ tag }}</span>
              <button
                class="task-tag__remove"
                :aria-label="`Remove ${tag} tag`"
                data-testid="task-tag-remove"
                :disabled="isUpdating"
                type="button"
                @click="removeTaskTag(index)"
              >
                Remove
              </button>
            </span>
          </li>
        </ul>
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
