import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createBoardPost, fetchBoardPosts } from "../api/boardApi";
import { useAuth } from "../auth/AuthContext";
import type { BoardPostPage, BoardPostSearchParams, BoardPostSort } from "../types";
import { getErrorMessage } from "../utils/apiError";
import { formatDate, formatDateTime } from "../utils/date";

const DEFAULT_PAGE_SIZE = 6;

export function StudentBoardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boardPage, setBoardPage] = useState<BoardPostPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [keywordInput, setKeywordInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [sortInput, setSortInput] = useState<BoardPostSort>("latest");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [sizeInput, setSizeInput] = useState(DEFAULT_PAGE_SIZE);

  const [searchParams, setSearchParams] = useState<BoardPostSearchParams>({
    sort: "latest",
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  });

  const posts = boardPage?.items ?? [];

  const activeFilterSummary = useMemo(() => {
    const filters: string[] = [];
    if (searchParams.keyword) {
      filters.push(`키워드: ${searchParams.keyword}`);
    }
    if (searchParams.author) {
      filters.push(`작성자: ${searchParams.author}`);
    }
    if (searchParams.sort && searchParams.sort !== "latest") {
      filters.push(`정렬: ${searchParams.sort}`);
    }
    if (searchParams.dateFrom) {
      filters.push(`시작일: ${formatDate(searchParams.dateFrom)}`);
    }
    if (searchParams.dateTo) {
      filters.push(`종료일: ${formatDate(searchParams.dateTo)}`);
    }
    return filters;
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBoardPosts(searchParams);
      setBoardPage(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "학생 게시판을 불러오지 못했습니다.", user?.email));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const post = await createBoardPost(title, content);
      setTitle("");
      setContent("");
      navigate(`/student-board/${post.id}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "게시글 작성에 실패했습니다.", user?.email));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({
      keyword: keywordInput.trim() || undefined,
      author: authorInput.trim() || undefined,
      sort: sortInput,
      page: 0,
      size: sizeInput,
      dateFrom: dateFromInput || undefined,
      dateTo: dateToInput || undefined,
    });
  };

  const handleSearchReset = () => {
    setKeywordInput("");
    setAuthorInput("");
    setSortInput("latest");
    setDateFromInput("");
    setDateToInput("");
    setSizeInput(DEFAULT_PAGE_SIZE);
    setSearchParams({
      sort: "latest",
      page: 0,
      size: DEFAULT_PAGE_SIZE,
    });
  };

  const handleChangePage = (nextPage: number) => {
    setSearchParams((current) => ({
      ...current,
      page: nextPage,
    }));
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
              학생 계정으로 자유롭게 글을 남기고, 검색·정렬·기간 필터로 필요한 글을 세밀하게 찾을 수 있습니다.
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
        <p className="surface-card whitespace-pre-wrap border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
          {error}
        </p>
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
          {!loading && boardPage && (
            <p className="text-sm text-slate-500">
              총 {boardPage.totalElements}건 · {boardPage.page + 1}/{Math.max(boardPage.totalPages, 1)} 페이지
            </p>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="surface-card space-y-4 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_0.8fr]">
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="제목/내용 검색"
              maxLength={100}
            />
            <input
              value={authorInput}
              onChange={(event) => setAuthorInput(event.target.value)}
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="작성자 이름 또는 이메일"
              maxLength={100}
            />
            <select
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value as BoardPostSort)}
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.7fr]">
            <label className="space-y-1 text-xs text-slate-500">
              <span>시작일</span>
              <input
                type="date"
                value={dateFromInput}
                onChange={(event) => setDateFromInput(event.target.value)}
                className="block w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-[#173f72]/30 transition focus:ring-2"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-500">
              <span>종료일</span>
              <input
                type="date"
                value={dateToInput}
                onChange={(event) => setDateToInput(event.target.value)}
                className="block w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-[#173f72]/30 transition focus:ring-2"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-500">
              <span>페이지 크기</span>
              <select
                value={sizeInput}
                onChange={(event) => setSizeInput(Number(event.target.value))}
                className="block w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-[#173f72]/30 transition focus:ring-2"
              >
                <option value={6}>6개</option>
                <option value={10}>10개</option>
                <option value={15}>15개</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary px-4 py-2 text-sm font-semibold">
              검색 적용
            </button>
            <button
              type="button"
              onClick={handleSearchReset}
              className="btn-secondary px-4 py-2 text-sm font-semibold"
            >
              초기화
            </button>
          </div>
        </form>

        {activeFilterSummary.length > 0 && (
          <div className="surface-card flex flex-wrap gap-2 p-4">
            {activeFilterSummary.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#d1dceb] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#315c8f]"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="surface-card p-8 text-sm text-slate-600">게시글 목록을 불러오는 중입니다...</div>
        ) : posts.length === 0 ? (
          <div className="surface-card p-8 text-sm text-slate-600">
            {activeFilterSummary.length > 0
              ? "검색 조건에 맞는 게시글이 없습니다. 다른 조합으로 다시 시도해 보세요."
              : "아직 등록된 게시글이 없습니다. 첫 글을 작성해 보세요."}
          </div>
        ) : (
          <>
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

            {boardPage && boardPage.totalPages > 1 && (
              <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="text-sm text-slate-500">
                  총 {boardPage.totalElements}건 중 {(boardPage.page * boardPage.size) + 1}-
                  {Math.min((boardPage.page + 1) * boardPage.size, boardPage.totalElements)}건 표시
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChangePage(Math.max(boardPage.page - 1, 0))}
                    disabled={!boardPage.hasPrevious}
                    className="btn-secondary px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangePage(boardPage.page + 1)}
                    disabled={!boardPage.hasNext}
                    className="btn-secondary px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
