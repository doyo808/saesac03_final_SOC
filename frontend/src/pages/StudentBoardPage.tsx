import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createBoardPost, fetchBoardPosts } from "../api/boardApi";
import type { BoardPostSummary } from "../types";
import { formatDateTime } from "../utils/date";

export function StudentBoardPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BoardPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBoardPosts();
      setPosts(data);
    } catch {
      setError("학생 게시판을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const post = await createBoardPost(title, content);
      setTitle("");
      setContent("");
      navigate(`/student-board/${post.id}`);
    } catch {
      setError("게시글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="grid gap-6 bg-gradient-to-r from-[#102c57] to-[#2d6aa6] px-7 py-8 text-white md:grid-cols-[1.2fr_0.8fr] md:px-9">
          <div>
            <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold tracking-[0.1em]">
              STUDENT BOARD
            </span>
            <h1 className="mt-4 text-3xl">학생 게시판</h1>
            <p className="mt-3 text-sm text-white/85">
              학생 계정으로 자유롭게 글을 남기고 댓글로 대화를 이어갈 수 있습니다.
            </p>
          </div>
          <div className="hero-side-card p-5">
            <p className="hero-side-label text-xs font-semibold tracking-[0.1em]">BOARD RULE</p>
            <p className="hero-side-text mt-2 text-sm leading-7">
              수업, 생활, 시설, 수강신청 관련 정보 공유를 위한 공간입니다.
            </p>
            <p className="mt-3 text-xs font-medium tracking-[0.04em] text-white/72">
              예의를 지키고 개인정보가 포함된 내용은 올리지 마세요.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>
      )}

      <section className="surface-card p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="brand-chip">Write Post</span>
            <h2 className="mt-3 font-display text-2xl text-[#0d274d]">새 글 작성</h2>
          </div>
          <p className="text-sm text-slate-500">제목과 내용을 입력하면 바로 게시됩니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            placeholder="제목을 입력하세요."
            maxLength={120}
            required
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="h-40 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            placeholder="학생들과 공유할 내용을 작성하세요."
            maxLength={10000}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "등록 중..." : "게시글 등록"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="brand-chip">Recent Posts</span>
            <h2 className="mt-3 font-display text-2xl text-[#0d274d]">최근 글</h2>
          </div>
          {!loading && <p className="text-sm text-slate-500">총 {posts.length}개의 글</p>}
        </div>

        {loading ? (
          <div className="surface-card p-8 text-sm text-slate-600">게시글 목록을 불러오는 중입니다...</div>
        ) : posts.length === 0 ? (
          <div className="surface-card p-8 text-sm text-slate-600">
            아직 등록된 게시글이 없습니다. 첫 글을 작성해 보세요.
          </div>
        ) : (
          <div className="grid gap-4 stagger">
            {posts.map((post) => (
              <article key={post.id} className="surface-card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>작성자 {post.authorName}</span>
                      <span>{formatDateTime(post.createdAt)}</span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl text-[#0d274d]">
                      <Link to={`/student-board/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                  </div>
                  <Link
                    to={`/student-board/${post.id}`}
                    className="btn-secondary inline-flex px-4 py-2 text-sm font-semibold"
                  >
                    상세 보기
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
