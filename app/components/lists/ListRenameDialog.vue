<script setup lang="ts">
const listName = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    errorMessage?: string | null;
    isOpen?: boolean;
    isSubmitting?: boolean;
  }>(),
  {
    errorMessage: null,
    isOpen: false,
    isSubmitting: false,
  },
);

defineEmits<{
  cancel: [];
  submit: [];
}>();
</script>

<template>
  <section
    v-if="isOpen"
    aria-labelledby="list-rename-title"
    class="management-panel"
    data-testid="list-rename-panel"
  >
    <p class="workspace-kicker">Rename list</p>
    <h3 id="list-rename-title">Update this workspace name</h3>
    <p class="field-help">
      Choose a clear name that still fits the work tracked in this list.
    </p>

    <form class="list-form" novalidate @submit.prevent="$emit('submit')">
      <div class="field-group">
        <label class="field-label" for="list-rename-input">List name</label>
        <input
          id="list-rename-input"
          v-model="listName"
          class="input-control"
          data-testid="list-rename-input"
          :disabled="isSubmitting"
          maxlength="80"
          name="name"
          placeholder="Enter a new list name"
          type="text"
        />
      </div>

      <p
        v-if="errorMessage"
        class="error-text"
        data-testid="rename-error-banner"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="button-row">
        <button
          class="button-primary"
          data-testid="list-rename-submit"
          :disabled="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? "Saving..." : "Save name" }}
        </button>

        <button
          class="button-secondary"
          data-testid="list-rename-cancel"
          :disabled="isSubmitting"
          type="button"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
      </div>
    </form>
  </section>
</template>
