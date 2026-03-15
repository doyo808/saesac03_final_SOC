import axios from "axios";

interface ApiErrorPayload {
  message?: string;
}

const TEST_ACCOUNT_EMAILS = new Set([
  "student1@campus.local",
  "prof1@campus.local",
  "admin1@campus.local",
]);

function isDebugAllowed(email?: string | null) {
  if (!email) {
    return false;
  }
  return TEST_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}

export function getErrorMessage(error: unknown, fallback: string, email?: string | null) {
  if (!isDebugAllowed(email)) {
    return fallback;
  }

  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
