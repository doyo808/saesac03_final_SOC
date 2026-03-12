import { api } from "./client";
import type { BoardComment, BoardPostDetail, BoardPostSummary } from "../types";

export async function fetchBoardPosts() {
  const { data } = await api.get<BoardPostSummary[]>("/api/board/posts");
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
