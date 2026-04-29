import type { Task, TaskTag } from "~~/shared/types/api";

import {
  normalizeTaskTagName,
  normalizeTaskTagNameForComparison,
} from "~~/shared/schemas/tag";

export function normalizeTaskFilterTag(
  value: string | null | undefined,
): TaskTag | null {
  if (!value) {
    return null;
  }

  const normalizedTag = normalizeTaskTagName(value);

  return normalizedTag.length > 0 ? normalizedTag : null;
}

export function doesTaskMatchTagFilter(
  task: Task,
  tag: string | null | undefined,
): boolean {
  const normalizedFilter = normalizeTaskFilterTag(tag);

  if (!normalizedFilter) {
    return true;
  }

  const comparisonValue = normalizeTaskTagNameForComparison(normalizedFilter);

  return task.tags.some(
    (taskTag) => normalizeTaskTagNameForComparison(taskTag) === comparisonValue,
  );
}

export function filterTasksByTag(
  tasks: Task[],
  tag: string | null | undefined,
): Task[] {
  const normalizedFilter = normalizeTaskFilterTag(tag);

  if (!normalizedFilter) {
    return [...tasks];
  }

  return tasks.filter((task) => doesTaskMatchTagFilter(task, normalizedFilter));
}

export function collectAvailableTaskTags(tasks: Task[]): TaskTag[] {
  const tagsByComparisonValue = new Map<string, TaskTag>();

  tasks.forEach((task) => {
    task.tags.forEach((tag) => {
      const normalizedTag = normalizeTaskFilterTag(tag);

      if (!normalizedTag) {
        return;
      }

      const comparisonValue = normalizeTaskTagNameForComparison(normalizedTag);

      if (!tagsByComparisonValue.has(comparisonValue)) {
        tagsByComparisonValue.set(comparisonValue, normalizedTag);
      }
    });
  });

  return [...tagsByComparisonValue.values()].sort((left, right) =>
    normalizeTaskTagNameForComparison(left).localeCompare(
      normalizeTaskTagNameForComparison(right),
    ),
  );
}
