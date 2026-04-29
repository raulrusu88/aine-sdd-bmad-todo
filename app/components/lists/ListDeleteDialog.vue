<script setup lang="ts">
withDefaults(
  defineProps<{
    errorMessage?: string | null;
    isOpen?: boolean;
    isSubmitting?: boolean;
    listName: string;
  }>(),
  {
    errorMessage: null,
    isOpen: false,
    isSubmitting: false,
  },
);

defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<template>
  <section
    v-if="isOpen"
    aria-labelledby="list-delete-title"
    class="management-panel management-panel--danger"
    data-testid="list-delete-panel"
  >
    <p class="workspace-kicker">Delete list</p>
    <h3 id="list-delete-title">Remove this workspace</h3>
    <p class="field-help">
      Delete <strong>{{ listName }}</strong> if you no longer need it. This
      action cannot be undone.
    </p>

    <p
      v-if="errorMessage"
      class="error-text"
      data-testid="delete-error-banner"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div class="button-row">
      <button
        class="button-danger"
        data-testid="list-delete-confirm"
        :disabled="isSubmitting"
        type="button"
        @click="$emit('confirm')"
      >
        {{ isSubmitting ? "Deleting..." : "Delete list" }}
      </button>

      <button
        class="button-secondary"
        data-testid="list-delete-cancel"
        :disabled="isSubmitting"
        type="button"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </section>
</template>
