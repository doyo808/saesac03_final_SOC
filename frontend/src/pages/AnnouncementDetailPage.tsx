import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAnnouncement } from "../api/publicApi";
import type { AnnouncementDetail } from "../types";
import { formatDateTime } from "../utils/date";

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("잘못된 요청입니다.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnnouncement(id);
        setAnnouncement(data);
      } catch {
        setError("공지사항 상세를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">공지 상세를 불러오는 중입니다...</div>;
  }

  if (error || !announcement) {
    return <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error ?? "데이터 없음"}</p>;
  }

  return (
    <article className="surface-card fade-up overflow-hidden">
      <header className="border-b border-[#dce4f1] bg-gradient-to-r from-[#f6efe0] to-[#f4f8ff] px-7 py-6 md:px-10">
        <span className="brand-chip">Announcement</span>
        <h1 className="mt-3 text-3xl leading-tight text-[#0d274d]">{announcement.title}</h1>
        <p className="mt-2 text-xs text-slate-500">{formatDateTime(announcement.createdAt)}</p>
      </header>

      <div className="px-7 py-8 md:px-10">
        <p className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
          {announcement.content}
        </p>
        <Link
          to="/announcements"
          className="btn-secondary mt-8 inline-flex px-4 py-2 text-sm font-semibold"
        >
          목록으로 돌아가기
        </Link>
      </div>
    </article>
  );
}
