import axios from "axios";
import { api } from "./client";
import type {
  BoardComment,
  BoardPostDetail,
  BoardPostPage,
  BoardPostSearchParams,
} from "../types";

interface BoardMutationErrorPayload {
  message?: string;
  reasonCode?: string;
  requestId?: string;
  source?: string;
}

function shouldRetryBoardMutationViaPost(error: unknown) {
  if (!axios.isAxiosError<BoardMutationErrorPayload>(error) || !error.response) {
    return false;
  }

  const status = error.response.status;
  if (status === 405 || status === 501) {
    return true;
  }
  if (status !== 403) {
    return false;
  }

  const payload = error.response.data;
  const requestId = error.response.headers?.["x-request-id"] ?? payload?.requestId;
  const source = error.response.headers?.["x-error-source"] ?? payload?.source;
  const reasonCode = payload?.reasonCode;
  return !requestId && !source && !reasonCode;
}

async function withBoardMutationPostFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
) {
  try {
    return await primary();
  } catch (primaryError) {
    if (!shouldRetryBoardMutationViaPost(primaryError)) {
      throw primaryError;
    }
    try {
      return await fallback();
    } catch (fallbackError) {
      if (isMissingBoardMutationFallbackRoute(fallbackError)) {
        throw buildMissingBoardFallbackRouteError(primaryError, fallbackError);
      }
      throw fallbackError;
    }
  }
}

function isMissingBoardMutationFallbackRoute(error: unknown) {
  if (!axios.isAxiosError<BoardMutationErrorPayload>(error) || !error.response) {
    return false;
  }

  const method = error.config?.method?.toUpperCase();
  const url = error.config?.url ?? "";
  if (method !== "POST" || !url.includes("/api/board/posts/")) {
    return false;
  }

  const payload = error.response.data;
  const message = typeof payload?.message === "string" ? payload.message.toLowerCase() : "";
  const source = error.response.headers?.["x-error-source"] ?? payload?.source;
  const reasonCode = payload?.reasonCode;

  return source === "APP"
    && (reasonCode === "BOARD_MUTATION_FALLBACK_ROUTE_MISSING"
      || reasonCode === "API_PATH_NOT_FOUND"
      || message.includes("no static resource"));
}

function buildMissingBoardFallbackRouteError(primaryError: unknown, fallbackError: unknown) {
  const primaryMethod =
    axios.isAxiosError(primaryError) ? primaryError.config?.method?.toUpperCase() ?? "UNKNOWN" : "UNKNOWN";
  const primaryUrl = axios.isAxiosError(primaryError) ? primaryError.config?.url ?? "UNKNOWN" : "UNKNOWN";
  const fallbackUrl =
    axios.isAxiosError(fallbackError) ? fallbackError.config?.url ?? "UNKNOWN" : "UNKNOWN";

  return new Error(
    `원래 요청(${primaryMethod} ${primaryUrl})이 차단되어 POST fallback(${fallbackUrl})으로 재시도했지만, 현재 WAS에는 해당 fallback 라우트가 없습니다. 배포된 campus-was가 최신 버전인지 확인하세요.`,
  );
}

export async function fetchBoardPosts(searchParams: BoardPostSearchParams = {}) {
  const params: Record<string, string | number> = {};

  if (searchParams.keyword && searchParams.keyword.trim().length > 0) {
    params.keyword = searchParams.keyword.trim();
  }
  if (searchParams.author && searchParams.author.trim().length > 0) {
    params.author = searchParams.author.trim();
  }
  if (searchParams.sort) {
    params.sort = searchParams.sort;
  }
  if (typeof searchParams.page === "number") {
    params.page = searchParams.page;
  }
  if (typeof searchParams.size === "number") {
    params.size = searchParams.size;
  }
  if (searchParams.dateFrom) {
    params.dateFrom = searchParams.dateFrom;
  }
  if (searchParams.dateTo) {
    params.dateTo = searchParams.dateTo;
  }

  const { data } = await api.get<BoardPostPage>("/api/board/posts", { params });
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid board posts payload");
  }
  return data;
}

export async function fetchBoardPost(id: string | number) {
  const { data } = await api.get<BoardPostDetail>(`/api/board/posts/${id}`);
  return data;
}

export async function createBoardPost(title: string, content: string) {
  const { data } = await api.post<BoardPostDetail>("/api/board/posts", {
    title,
    content,
  });
  return data;
}

export async function createBoardComment(postId: string | number, content: string) {
  const { data } = await api.post<BoardComment>(`/api/board/posts/${postId}/comments`, {
    content,
  });
  return data;
}

export async function updateBoardPost(id: string | number, title: string, content: string) {
  return withBoardMutationPostFallback(
    async () => {
      const { data } = await api.put<BoardPostDetail>(`/api/board/posts/${id}`, {
        title,
        content,
      });
      return data;
    },
    async () => {
      const { data } = await api.post<BoardPostDetail>(`/api/board/posts/${id}/update`, {
        title,
        content,
      });
      return data;
    },
  );
}

export async function deleteBoardPost(id: string | number) {
  await withBoardMutationPostFallback(
    async () => {
      await api.delete(`/api/board/posts/${id}`);
    },
    async () => {
      await api.post(`/api/board/posts/${id}/delete`);
    },
  );
}

export async function updateBoardComment(
  postId: string | number,
  commentId: string | number,
  content: string,
) {
  return withBoardMutationPostFallback(
    async () => {
      const { data } = await api.put<BoardComment>(
        `/api/board/posts/${postId}/comments/${commentId}`,
        { content },
      );
      return data;
    },
    async () => {
      const { data } = await api.post<BoardComment>(
        `/api/board/posts/${postId}/comments/${commentId}/update`,
        { content },
      );
      return data;
    },
  );
}

export async function deleteBoardComment(postId: string | number, commentId: string | number) {
  await withBoardMutationPostFallback(
    async () => {
      await api.delete(`/api/board/posts/${postId}/comments/${commentId}`);
    },
    async () => {
      await api.post(`/api/board/posts/${postId}/comments/${commentId}/delete`);
    },
  );
}
