import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAcademicEvents, fetchAnnouncements } from "../api/publicApi";
import { useAuth } from "../auth/AuthContext";
import type { AcademicEvent, AnnouncementSummary } from "../types";
import { formatDate, formatDateTime } from "../utils/date";

interface HeroSlide {
  badge: string;
  title: string;
  description: string;
  gradient: string;
}

const heroSlides: HeroSlide[] = [
  {
    badge: "KWANJAE CAMPUS",
    title: "미래를 준비하는\n스마트 캠퍼스",
    description: "학사, 공지, LMS 서비스를 통합한 대학교 메인 포털",
    gradient: "from-[#0a4f9f] via-[#1f64b8] to-[#3d84d6]",
  },
  {
    badge: "ACADEMIC SUPPORT",
    title: "학생 중심\n학사정보 서비스",
    description: "공지사항과 학사일정을 한 화면에서 확인하세요",
    gradient: "from-[#00538f] via-[#1b7cb7] to-[#4fa0d6]",
  },
  {
    badge: "DIGITAL LMS",
    title: "강의와 과제,\n효율적인 학습관리",
    description: "로그인 후 LMS에서 강의별 과제 제출 및 채점 확인",
    gradient: "from-[#00406f] via-[#0b629f] to-[#32a2c5]",
  },
];

export function HomePage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [announcementsData, eventsData] = await Promise.all([
          fetchAnnouncements({ size: 6 }),
          fetchAcademicEvents(),
        ]);
        setAnnouncements(announcementsData.items);
        setEvents(eventsData.slice(0, 6));
      } catch {
        setError("홈 메인 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">메인 데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>;
  }

  const slide = heroSlides[activeSlide];

  return (
    <div className="space-y-7">
      <section className="grid gap-4 lg:grid-cols-[1.65fr_0.95fr]">
        <article className="surface-card fade-up overflow-hidden">
          <div className={`relative h-[320px] bg-gradient-to-r ${slide.gradient} px-7 py-8 text-white md:h-[360px] md:px-10`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_18%,rgba(255,255,255,0.32),transparent_34%)]" />
            <div className="relative z-10 max-w-lg">
              <span className="inline-flex rounded-full border border-white/50 bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.1em]">
                {slide.badge}
              </span>
              <h1 className="mt-4 whitespace-pre-line text-4xl leading-tight text-white md:text-5xl">
                {slide.title}
              </h1>
              <p className="mt-3 text-sm text-white/90 md:text-base">{slide.description}</p>
              <div className="mt-6 flex gap-2">
                <Link
                  to="/announcements"
                  className="rounded-md border border-white/65 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/22"
                >
                  공지사항
                </Link>
                {user ? (
                  <Link
                    to="/lms"
                    className="rounded-md border border-white/65 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/22"
                  >
                    LMS 바로가기
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="rounded-md border border-white/65 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/22"
                  >
                    포털 로그인
                  </Link>
                )}
              </div>
            </div>

            <div className="absolute bottom-5 right-5 flex gap-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 w-8 rounded-full transition ${
                    activeSlide === index ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`배너 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </article>

        <aside className="surface-card p-5 md:p-6">
          <h2 className="font-display text-2xl text-[#0f4f9b]">바로가기</h2>
          <ul className="mt-4 space-y-2">
            <li className="surface-soft flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-slate-700">학사일정</span>
              <span className="text-xs text-[#0f4f9b]">DETAIL</span>
            </li>
            <li className="surface-soft flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-slate-700">장학안내</span>
              <span className="text-xs text-[#0f4f9b]">DETAIL</span>
            </li>
            <li className="surface-soft flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-slate-700">도서관</span>
              <span className="text-xs text-[#0f4f9b]">DETAIL</span>
            </li>
            <li className="surface-soft px-4 py-3">
              <Link to="/support-center" className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">문의/제보 센터</span>
                <span className="text-xs text-[#0f4f9b]">DETAIL</span>
              </Link>
            </li>
          </ul>

          <div className="mt-4 rounded-lg border border-[#cedcf0] bg-[#f6fbff] px-4 py-3">
            <p className="text-xs text-slate-500">오늘의 캠퍼스</p>
            <p className="mt-1 text-sm text-slate-700">공지 {announcements.length}건 · 일정 {events.length}건</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="surface-card p-5">
          <h3 className="text-lg font-semibold text-[#0f4f9b]">재학생</h3>
          <p className="mt-1 text-sm text-slate-600">수강신청 · 성적조회 · LMS</p>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-lg font-semibold text-[#0f4f9b]">교직원</h3>
          <p className="mt-1 text-sm text-slate-600">강의관리 · 학사행정 · 연구지원</p>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-lg font-semibold text-[#0f4f9b]">동문/방문자</h3>
          <p className="mt-1 text-sm text-slate-600">대학소식 · 발전기금 · 캠퍼스 안내</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card p-6 md:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-[#0f4f9b]">관제대 공지</h2>
            <Link to="/announcements" className="text-sm font-semibold text-[#0f4f9b] hover:underline">
              + 더보기
            </Link>
          </div>
          <ul className="data-list">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="border-b border-[#e6edf7] py-3 last:border-none">
                <Link
                  to={`/announcements/${announcement.id}`}
                  className="line-clamp-1 text-sm font-medium text-slate-800 hover:text-[#0f4f9b] hover:underline"
                >
                  {announcement.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(announcement.createdAt)}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-card p-6 md:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-[#0f4f9b]">관제대 일정</h2>
          </div>
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="surface-soft flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">{event.title}</span>
                <span className="text-xs font-medium text-[#0f4f9b]">{formatDate(event.date)}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
