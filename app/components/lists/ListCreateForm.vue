<script setup lang="ts">
const listName = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    errorMessage?: string | null;
    isDisabled?: boolean;
    isSubmitting?: boolean;
  }>(),
  {
    errorMessage: null,
    isDisabled: false,
    isSubmitting: false,
  },
);

defineEmits<{
  submit: [];
}>();
</script>

<template>
  <section class="workspace-panel" aria-labelledby="list-create-title">
    <p class="workspace-kicker">Create a list</p>
    <h2 id="list-create-title">Start a new workspace</h2>
    <p class="field-help">
      Create a named todo list for an area of work such as Personal, Work, or
      Errands.
    </p>

    <form class="list-form" novalidate @submit.prevent="$emit('submit')">
      <div class="field-group">
        <label class="field-label" for="list-name-input">List name</label>
        <input
          id="list-name-input"
          v-model="listName"
          class="input-control"
          data-testid="list-name-input"
          :disabled="isDisabled || isSubmitting"
          maxlength="80"
          name="name"
          placeholder="Enter a list name"
          type="text"
        />
      </div>

      <p
        v-if="errorMessage"
        class="error-text"
        data-testid="error-banner"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <button
        @click="$emit('submit')"
        class="button-primary"
        data-testid="list-create-button"
        :disabled="isDisabled || isSubmitting"
        type="button"
      >
        {{ isSubmitting ? "Creating..." : "Create list" }}
      </button>
    </form>
  </section>
</template>
