import axios from "axios";

interface ApiErrorPayload {
  message?: string;
  reasonCode?: string;
  requestId?: string;
  source?: string;
  detail?: string | null;
  hint?: string | null;
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

function isTraceAllowed(email?: string | null) {
  if (!email) {
    return false;
  }
  return email.trim().toLowerCase() === "student1@campus.local";
}

function isBoardMutation(method?: string, url?: string) {
  const normalizedMethod = method?.trim().toUpperCase();
  const normalizedUrl = url ?? "";
  if (!normalizedUrl.includes("/api/board/posts/")) {
    return false;
  }
  if (normalizedMethod === "POST") {
    return normalizedUrl.endsWith("/update") || normalizedUrl.endsWith("/delete");
  }
  return normalizedMethod === "PUT" || normalizedMethod === "DELETE" || normalizedMethod === "PATCH";
}

export function getErrorMessage(error: unknown, fallback: string, email?: string | null) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (isTraceAllowed(email)) {
      const method = error.config?.method?.toUpperCase() ?? "UNKNOWN";
      const url = error.config?.url ?? "UNKNOWN";
      const status = error.response?.status;
      const payload = error.response?.data;
      const requestId = error.response?.headers?.["x-request-id"] ?? payload?.requestId;
      const source = error.response?.headers?.["x-error-source"] ?? payload?.source;
      const reasonCode = payload?.reasonCode;
      const message =
        typeof payload?.message === "string" && payload.message.trim().length > 0
          ? payload.message.trim()
          : fallback;

      const lines = [message];
      lines.push(`status=${status ?? "NO_RESPONSE"} method=${method} url=${url}`);

      if (reasonCode || source || requestId) {
        lines.push(
          `reasonCode=${reasonCode ?? "-"} source=${source ?? "-"} requestId=${requestId ?? "-"}`,
        );
      } else if (status === 403 && isBoardMutation(method, url)) {
        lines.push(
          "reasonCode/source/requestId가 없어 앱 미도달 403으로 보입니다. DMZ WAF 또는 리버스프록시에서 게시판 변경 요청을 선차단했을 가능성이 큽니다.",
        );
      }

      if (typeof payload?.detail === "string" && payload.detail.trim().length > 0) {
        lines.push(payload.detail.trim());
      }

      if (typeof payload?.hint === "string" && payload.hint.trim().length > 0) {
        lines.push(`hint=${payload.hint.trim()}`);
      }

      return lines.join("\n");
    }

    if (isDebugAllowed(email)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }

  if (error instanceof Error && isDebugAllowed(email) && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
