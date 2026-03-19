import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAnnouncements } from "../api/publicApi";
import type { AnnouncementPage, AnnouncementSearchParams, AnnouncementSort } from "../types";
import { formatDate, formatDateTime } from "../utils/date";

const DEFAULT_PAGE_SIZE = 10;

export function AnnouncementsPage() {
  const [announcementPage, setAnnouncementPage] = useState<AnnouncementPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keywordInput, setKeywordInput] = useState("");
  const [sortInput, setSortInput] = useState<AnnouncementSort>("latest");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [sizeInput, setSizeInput] = useState(DEFAULT_PAGE_SIZE);

  const [searchParams, setSearchParams] = useState<AnnouncementSearchParams>({
    sort: "latest",
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  });

  const announcements = announcementPage?.items ?? [];

  const activeFilterSummary = useMemo(() => {
    const filters: string[] = [];
    if (searchParams.keyword) {
      filters.push(`키워드: ${searchParams.keyword}`);
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnnouncements(searchParams);
        setAnnouncementPage(data);
      } catch {
        setError("공지사항 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [searchParams]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({
      keyword: keywordInput.trim() || undefined,
      sort: sortInput,
      page: 0,
      size: sizeInput,
      dateFrom: dateFromInput || undefined,
      dateTo: dateToInput || undefined,
    });
  };

  const handleReset = () => {
    setKeywordInput("");
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
    <section className="space-y-5">
      <header className="surface-card fade-up p-7 md:p-8">
        <span className="brand-chip">Newsroom</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">학교 공지사항</h1>
        <p className="mt-2 text-sm text-slate-600">
          학사, 행정, 시설 관련 중요 공지를 검색하고 기간·정렬 조건으로 세밀하게 확인할 수 있습니다.
        </p>
      </header>

      {error && (
        <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSearchSubmit} className="surface-card space-y-4 p-5 md:p-6">
        <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            placeholder="제목/본문 검색"
            maxLength={120}
          />
          <select
            value={sortInput}
            onChange={(event) => setSortInput(event.target.value as AnnouncementSort)}
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
            onClick={handleReset}
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
        <div className="surface-card p-8 text-sm text-slate-600">공지사항을 불러오는 중입니다...</div>
      ) : announcements.length === 0 ? (
        <div className="surface-card p-8 text-sm text-slate-600">
          {activeFilterSummary.length > 0
            ? "검색 조건에 맞는 공지사항이 없습니다. 다른 조합으로 다시 시도해 보세요."
            : "등록된 공지사항이 없습니다."}
        </div>
      ) : (
        <>
          {announcementPage && (
            <div className="flex justify-end">
              <p className="text-sm text-slate-500">
                총 {announcementPage.totalElements}건 · {announcementPage.page + 1}/
                {Math.max(announcementPage.totalPages, 1)} 페이지
              </p>
            </div>
          )}

          <ul className="data-list stagger">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="surface-card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="text-lg font-semibold text-[#122e56] hover:underline"
                  >
                    {announcement.title}
                  </Link>
                  <span className="rounded-full bg-[#e9f0fb] px-3 py-1 text-xs font-semibold text-[#2e5c97]">
                    Notice
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">등록일 {formatDateTime(announcement.createdAt)}</p>
              </li>
            ))}
          </ul>

          {announcementPage && announcementPage.totalPages > 1 && (
            <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-slate-500">
                총 {announcementPage.totalElements}건 중 {(announcementPage.page * announcementPage.size) + 1}-
                {Math.min((announcementPage.page + 1) * announcementPage.size, announcementPage.totalElements)}건 표시
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChangePage(Math.max(announcementPage.page - 1, 0))}
                  disabled={!announcementPage.hasPrevious}
                  className="btn-secondary px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePage(announcementPage.page + 1)}
                  disabled={!announcementPage.hasNext}
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
  );
}
