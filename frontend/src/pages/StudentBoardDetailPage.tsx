import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createBoardComment,
  deleteBoardComment,
  deleteBoardPost,
  fetchBoardPost,
  updateBoardComment,
  updateBoardPost,
} from "../api/boardApi";
import { useAuth } from "../auth/AuthContext";
import type { BoardPostDetail } from "../types";
import { getErrorMessage } from "../utils/apiError";
import { formatDateTime } from "../utils/date";

export function StudentBoardDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<BoardPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [postActionLoading, setPostActionLoading] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentActionLoading, setCommentActionLoading] = useState<number | null>(null);

  const load = async () => {
    if (!id) {
      setError("post id가 필요합니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchBoardPost(id);
      setPost(data);
      setEditTitle(data.title);
      setEditContent(data.content);
    } catch (error) {
      setError(getErrorMessage(error, "게시글 상세를 불러오지 못했습니다.", user?.email));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setSubmittingComment(true);
    setError(null);
    try {
      await createBoardComment(id, commentContent);
      setCommentContent("");
      await load();
    } catch (error) {
      setError(getErrorMessage(error, "댓글 등록에 실패했습니다.", user?.email));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setPostActionLoading(true);
    setError(null);
    try {
      const updated = await updateBoardPost(id, editTitle, editContent);
      setPost(updated);
      setEditingPost(false);
    } catch (error) {
      setError(getErrorMessage(error, "게시글 수정에 실패했습니다.", user?.email));
    } finally {
      setPostActionLoading(false);
    }
  };

  const handlePostDelete = async () => {
    if (!id) {
      return;
    }

    if (!window.confirm("게시글을 삭제하시겠습니까?")) {
      return;
    }

    setPostActionLoading(true);
    setError(null);
    try {
      await deleteBoardPost(id);
      navigate("/student-board");
    } catch (error) {
      setError(getErrorMessage(error, "게시글 삭제에 실패했습니다.", user?.email));
    } finally {
      setPostActionLoading(false);
    }
  };

  const startCommentEdit = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
  };

  const handleCommentUpdate = async (commentId: number) => {
    if (!id) {
      return;
    }

    setCommentActionLoading(commentId);
    setError(null);
    try {
      await updateBoardComment(id, commentId, editingCommentContent);
      setEditingCommentId(null);
      setEditingCommentContent("");
      await load();
    } catch (error) {
      setError(getErrorMessage(error, "댓글 수정에 실패했습니다.", user?.email));
    } finally {
      setCommentActionLoading(null);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!id) {
      return;
    }

    if (!window.confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    setCommentActionLoading(commentId);
    setError(null);
    try {
      await deleteBoardComment(id, commentId);
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentContent("");
      }
      await load();
    } catch (error) {
      setError(getErrorMessage(error, "댓글 삭제에 실패했습니다.", user?.email));
    } finally {
      setCommentActionLoading(null);
    }
  };

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">게시글을 불러오는 중입니다...</div>;
  }

  if (!post) {
    return (
      <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
        {error ?? "데이터 없음"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/student-board" className="btn-secondary inline-flex px-4 py-2 text-sm font-semibold">
          게시판 목록
        </Link>
        <p className="text-sm text-slate-500">댓글 {post.comments.length}개</p>
      </div>

      <section className="surface-card fade-up overflow-hidden">
        <header className="border-b border-[#dce4f1] bg-gradient-to-r from-[#eef6ff] to-[#f9f3e5] px-7 py-6 md:px-9">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="brand-chip">Post Detail</span>
              <h1 className="mt-3 text-3xl text-[#0d274d]">{post.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>작성자 {post.authorName}</span>
                <span>{formatDateTime(post.createdAt)}</span>
              </div>
            </div>
            {user?.id === post.authorId && (
              <div className="flex flex-wrap gap-2">
                {!editingPost && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(true);
                      setEditTitle(post.title);
                      setEditContent(post.content);
                    }}
                    disabled={postActionLoading}
                    className="btn-secondary px-3 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    수정
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePostDelete}
                  disabled={postActionLoading}
                  className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="px-7 py-7 md:px-9">
          {editingPost ? (
            <form onSubmit={handlePostUpdate} className="space-y-3">
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                className="w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                placeholder="제목을 입력하세요."
                maxLength={120}
                required
              />
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                className="h-40 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                placeholder="내용을 입력하세요."
                maxLength={10000}
                required
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={postActionLoading}
                  className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {postActionLoading ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(false);
                    setEditTitle(post.title);
                    setEditContent(post.content);
                  }}
                  disabled={postActionLoading}
                  className="btn-secondary px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">{post.content}</p>
          )}
        </div>
      </section>

      {error && (
        <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>
      )}

      <section className="surface-card p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="brand-chip">Comments</span>
            <h2 className="mt-3 font-display text-2xl text-[#0d274d]">댓글</h2>
          </div>
          <p className="text-sm text-slate-500">학생 계정으로 댓글을 작성할 수 있습니다.</p>
        </div>

        <form onSubmit={handleCommentSubmit} className="mt-5 space-y-3">
          <textarea
            value={commentContent}
            onChange={(event) => setCommentContent(event.target.value)}
            className="h-32 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            placeholder="댓글을 입력하세요."
            maxLength={4000}
            required
          />
          <button
            type="submit"
            disabled={submittingComment}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {submittingComment ? "등록 중..." : "댓글 등록"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {post.comments.map((comment) => (
            <article key={comment.id} className="surface-soft p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0d274d]">{comment.authorName}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                  {user?.id === comment.authorId && (
                    <div className="flex flex-wrap gap-2">
                      {editingCommentId !== comment.id && (
                        <button
                          type="button"
                          onClick={() => startCommentEdit(comment.id, comment.content)}
                          disabled={commentActionLoading !== null}
                          className="text-xs font-semibold text-[#1d4f91] hover:underline disabled:opacity-60"
                        >
                          수정
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCommentDelete(comment.id)}
                        disabled={commentActionLoading !== null}
                        className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-60"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={editingCommentContent}
                    onChange={(event) => setEditingCommentContent(event.target.value)}
                    className="h-28 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                    maxLength={4000}
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCommentUpdate(comment.id)}
                      disabled={commentActionLoading !== null || editingCommentContent.trim().length === 0}
                      className="btn-primary px-3 py-2 text-xs font-semibold disabled:opacity-60"
                    >
                      {commentActionLoading === comment.id ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingCommentContent("");
                      }}
                      disabled={commentActionLoading !== null}
                      className="btn-secondary px-3 py-2 text-xs font-semibold disabled:opacity-60"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {comment.content}
                </p>
              )}
            </article>
          ))}
          {post.comments.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
