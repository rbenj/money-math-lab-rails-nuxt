interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[]>;
}

const FALLBACK = "An error occurred. Please try again.";

/**
 * Parse API error responses into a human-readable message, handles both singular errors
 * ({ error: "msg" }) and validation errors ({ errors: { field: ["msgs"] } }).
 */
export function parseApiError(err: unknown, fallbackMessage = FALLBACK): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data: ApiErrorData }).data;

    if (data?.error) {
      return data.error;
    }

    if (data?.errors) {
      const messages = Object.entries(data.errors)
        .map(([field, msgs]) => {
          const fieldName = field.replace(/_/g, " ");
          const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          return `${capitalized}: ${msgs.join(", ")}`;
        })
        .join("; ");
      return messages || fallbackMessage;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallbackMessage;
}
