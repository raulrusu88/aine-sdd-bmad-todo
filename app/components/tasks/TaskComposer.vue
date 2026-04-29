<script setup lang="ts">
const taskTitle = defineModel<string>("title", { default: "" });
const taskDescription = defineModel<string>("description", { default: "" });

withDefaults(
  defineProps<{
    errorMessage?: string | null;
    helpMessage?: string;
    isDisabled?: boolean;
    isSubmitting?: boolean;
  }>(),
  {
    errorMessage: null,
    helpMessage:
      "Use a short title for quick scanning and add details only when they help.",
    isDisabled: false,
    isSubmitting: false,
  },
);

defineEmits<{
  submit: [];
}>();
</script>

<template>
  <section class="task-panel" aria-labelledby="task-create-title">
    <p class="workspace-kicker">Add a task</p>
    <h3 id="task-create-title">Capture the next item</h3>
    <p class="field-help">
      {{ helpMessage }}
    </p>

    <form class="list-form" novalidate @submit.prevent="$emit('submit')">
      <div class="field-group">
        <label class="field-label" for="task-title-input">Task title</label>
        <input
          id="task-title-input"
          v-model="taskTitle"
          class="input-control"
          data-testid="task-title-input"
          :disabled="isDisabled || isSubmitting"
          maxlength="200"
          name="title"
          placeholder="Enter a short task title"
          type="text"
        />
      </div>

      <div class="field-group">
        <label class="field-label" for="task-description-input">
          Description
        </label>
        <textarea
          id="task-description-input"
          v-model="taskDescription"
          class="input-control textarea-control"
          data-testid="task-description-input"
          :disabled="isDisabled || isSubmitting"
          maxlength="2000"
          name="description"
          placeholder="Add more detail if it helps later"
          rows="4"
        />
      </div>

      <p
        v-if="errorMessage"
        class="error-text"
        data-testid="task-error-banner"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <button
        class="button-primary"
        data-testid="task-create-button"
        :disabled="isDisabled || isSubmitting"
        type="submit"
      >
        {{ isSubmitting ? "Saving..." : "Add task" }}
      </button>
    </form>
  </section>
</template>
