import { api } from "./client";
import type { BoardComment, BoardPostDetail, BoardPostSummary } from "../types";

export async function fetchBoardPosts(keyword?: string) {
  const params = keyword && keyword.trim().length > 0 ? { keyword: keyword.trim() } : undefined;
  const { data } = await api.get<BoardPostSummary[]>("/api/board/posts", { params });
  if (!Array.isArray(data)) {
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
