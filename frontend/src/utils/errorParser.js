/**
 * Global Frontend Error Parser and Sanitizer
 * Ensures raw database errors, Prisma exceptions, or network details are never exposed to users.
 */
export const parseError = (
  error,
  defaultMessage = "An unexpected error occurred",
) => {
  // If we have a structured API error response from the backend
  if (error?.response?.data) {
    const data = error.response.data;
    const msg = data.message || data.error;

    if (msg && typeof msg === "string") {
      const lower = msg.toLowerCase();
      // Block lists for raw database/ORM signatures
      if (
        lower.includes("prisma") ||
        lower.includes("database") ||
        lower.includes("sql") ||
        lower.includes("unique constraint") ||
        lower.includes("invocation") ||
        lower.includes("unknown argument") ||
        lower.includes("foreign key")
      ) {
        return "Unable to complete your request. Please try again later.";
      }
      return msg;
    }
  }

  // Handle standard connection or execution details
  if (error?.message && typeof error.message === "string") {
    const lower = error.message.toLowerCase();
    if (lower.includes("network error") || lower.includes("timeout")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
  }

  // Backup default fallback
  return defaultMessage;
};
