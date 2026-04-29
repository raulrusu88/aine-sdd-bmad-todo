import { describe, expect, it } from "vitest";

import { createErrorResponse } from "./http";

describe("createErrorResponse", () => {
  it("returns the structured error payload expected by the API contract", () => {
    expect(
      createErrorResponse("VALIDATION_ERROR", "Title is required", {
        field: "title",
      }),
    ).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          field: "title",
        },
        message: "Title is required",
      },
    });
  });
});
