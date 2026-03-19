import { api } from "./client";
import type {
  BoardComment,
  BoardPostDetail,
  BoardPostPage,
  BoardPostSearchParams,
} from "../types";

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
  const { data } = await api.put<BoardPostDetail>(`/api/board/posts/${id}`, {
    title,
    content,
  });
  return data;
}

export async function deleteBoardPost(id: string | number) {
  await api.delete(`/api/board/posts/${id}`);
}

export async function updateBoardComment(
  postId: string | number,
  commentId: string | number,
  content: string,
) {
  const { data } = await api.put<BoardComment>(
    `/api/board/posts/${postId}/comments/${commentId}`,
    { content },
  );
  return data;
}

export async function deleteBoardComment(postId: string | number, commentId: string | number) {
  await api.delete(`/api/board/posts/${postId}/comments/${commentId}`);
}
