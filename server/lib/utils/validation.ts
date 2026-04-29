import { ZodError } from "zod";

export function formatZodIssues(error: ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>(
    (issuesByPath, issue) => {
      const pathKey = issue.path.join(".") || "root";

      issuesByPath[pathKey] ??= [];
      issuesByPath[pathKey].push(issue.message);

      return issuesByPath;
    },
    {},
  );
}
