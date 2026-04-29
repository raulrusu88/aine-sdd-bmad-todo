import { z } from "zod";

export const TASK_TAG_MAX_LENGTH = 40;

export function normalizeTaskTagName(value: string): string {
  return value.trim().normalize("NFC");
}

export function normalizeTaskTagNameForComparison(value: string): string {
  return normalizeTaskTagName(value).toLocaleLowerCase();
}

export const taskTagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag is required")
  .max(TASK_TAG_MAX_LENGTH, "Tag must be 40 characters or fewer")
  .transform((value) => value.normalize("NFC"));

export const taskTagCollectionSchema = z
  .array(taskTagNameSchema)
  .superRefine((tags, context) => {
    const seenTagNames = new Set<string>();

    tags.forEach((tag, index) => {
      const normalizedTagName = normalizeTaskTagNameForComparison(tag);

      if (seenTagNames.has(normalizedTagName)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate tags are not allowed.",
          path: [index],
        });

        return;
      }

      seenTagNames.add(normalizedTagName);
    });
  });
