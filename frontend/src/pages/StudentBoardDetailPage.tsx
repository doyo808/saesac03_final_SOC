import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createBoardComment, fetchBoardPost } from "../api/boardApi";
import type { BoardPostDetail } from "../types";
import { formatDateTime } from "../utils/date";

export function StudentBoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BoardPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      setError("게시글 상세를 불러오지 못했습니다.");
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

    setSubmitting(true);
    setError(null);
    try {
      await createBoardComment(id, commentContent);
      setCommentContent("");
      await load();
    } catch {
      setError("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
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
          <span className="brand-chip">Post Detail</span>
          <h1 className="mt-3 text-3xl text-[#0d274d]">{post.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>작성자 {post.authorName}</span>
            <span>{formatDateTime(post.createdAt)}</span>
          </div>
        </header>
        <div className="px-7 py-7 md:px-9">
          <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">{post.content}</p>
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
            disabled={submitting}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "등록 중..." : "댓글 등록"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {post.comments.map((comment) => (
            <article key={comment.id} className="surface-soft p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0d274d]">{comment.authorName}</p>
                <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {comment.content}
              </p>
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
