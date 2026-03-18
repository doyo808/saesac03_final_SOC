import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ADMIN_PAGE_ENABLED } from "../config/features";
import { isSecurityEgressAllowed } from "../config/securityEgress";

const roleDescription: Record<string, string> = {
  STUDENT: "수강 강의와 과제 제출 현황을 확인할 수 있습니다.",
  PROFESSOR: "담당 강의 과제를 확인하고 채점할 수 있습니다.",
  ADMIN: "LMS 전체 현황을 점검하고 채점 관리가 가능합니다.",
};

export function LmsDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="grid gap-6 bg-gradient-to-r from-[#112d57] to-[#2d5a94] px-7 py-8 text-white md:grid-cols-[1.3fr_1fr] md:px-9">
          <div>
            <span className="rounded-full border border-white/35 px-3 py-1 text-xs font-semibold tracking-[0.1em]">
              LMS DASHBOARD
            </span>
            <h1 className="mt-4 text-3xl">학습관리시스템</h1>
            <p className="mt-3 text-sm text-white/90">
              {user?.name}님으로 로그인됨 · {user?.role}
            </p>
            <p className="mt-1 text-sm text-white/80">{roleDescription[user?.role ?? ""]}</p>
          </div>
          <div className="hero-side-card p-5">
            <p className="hero-side-label text-xs font-semibold tracking-[0.1em]">READY TO GO</p>
            <p className="hero-side-text mt-2 text-sm leading-7">
              강의 목록으로 이동해 과제 제출 또는 채점을 진행하세요.
            </p>
            <Link
              to="/lms/courses"
              className="hero-side-button mt-4 inline-flex px-4 py-2 text-sm font-semibold"
            >
              내 강의 목록 열기
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/lms/courses"
          className="surface-card p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="font-display text-xl text-[#0d274d]">강의 및 과제</h2>
          <p className="mt-2 text-sm text-slate-600">
            수강/담당 강의를 조회하고 과제 상세 페이지로 이동합니다.
          </p>
        </Link>
        {isSecurityEgressAllowed(user?.email) && (
          <Link
            to="/lms/security-egress"
            className="surface-card p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="font-display text-xl text-[#0d274d]">보안 훈련용 서버발신</h2>
            <p className="mt-2 text-sm text-slate-600">
              화이트리스트 계정으로 훈련 시나리오를 작성하고 WAS outbound 요청을 실행합니다.
            </p>
          </Link>
        )}
        {ADMIN_PAGE_ENABLED && user?.role === "ADMIN" && (
          <Link
            to="/lms/admin"
            className="surface-card p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="font-display text-xl text-[#0d274d]">관리자 통합 관리</h2>
            <p className="mt-2 text-sm text-slate-600">
              학생별 LMS 현황과 수강신청(등록/해제)을 관리합니다.
            </p>
          </Link>
        )}
      </section>
    </div>
  );
}
