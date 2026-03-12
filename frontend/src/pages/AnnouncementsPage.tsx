import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAnnouncements } from "../api/publicApi";
import type { AnnouncementSummary } from "../types";
import { formatDateTime } from "../utils/date";

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnnouncements();
        setAnnouncements(data);
      } catch {
        setError("공지사항 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">공지사항을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>;
  }

  return (
    <section className="space-y-5">
      <header className="surface-card fade-up p-7 md:p-8">
        <span className="brand-chip">Newsroom</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">학교 공지사항</h1>
        <p className="mt-2 text-sm text-slate-600">
          학사, 행정, 시설 관련 중요 공지를 최신순으로 제공합니다.
        </p>
      </header>

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
            <p className="mt-3 text-xs text-slate-500">
              등록일 {formatDateTime(announcement.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
