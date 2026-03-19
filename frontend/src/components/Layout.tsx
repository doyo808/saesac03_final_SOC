import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ADMIN_PAGE_ENABLED } from "../config/features";

function navClassName(isActive: boolean) {
  return `${isActive ? "global-nav-link global-nav-link-active" : "global-nav-link"}`;
}

const roleLabel: Record<string, string> = {
  STUDENT: "학생",
  PROFESSOR: "교수",
  ADMIN: "관리자",
};

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <div className="bg-[#0a4f9f] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <p className="text-[11px] font-medium tracking-[0.06em] text-white/90">
            관제대학교 통합 캠퍼스 포털
          </p>
          <div className="flex items-center gap-3">
            <Link className="utility-link" to="/academic-guide">
              입학안내
            </Link>
            <Link className="utility-link" to="/international-exchange">
              국제교류
            </Link>
            <Link className="utility-link" to="/campus-map">
              캠퍼스맵
            </Link>
          </div>
        </div>
      </div>

      <header className="border-b border-[#d7e2f2] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#0a4f9f] text-xs font-bold text-[#0a4f9f]">
              관제대
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-[#2f67ae]">
                KWANJAE UNIVERSITY
              </p>
              <p className="font-display text-[1.35rem] text-[#0d3f7f] group-hover:underline">
                관제대학교 포털
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden rounded-lg border border-[#d8e3f3] bg-[#f8fbff] px-3 py-2 text-right sm:block">
                  <p className="text-xs text-slate-500">로그인 계정</p>
                  <p className="text-sm font-semibold text-[#0d3f7f]">
                    {user.name} · {roleLabel[user.role] ?? user.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="btn-secondary px-3 py-2 text-sm font-semibold"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary px-4 py-2 text-sm font-semibold">
                포털 로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-[#0054a6]">
        <div className="mx-auto flex max-w-6xl items-center overflow-x-auto px-1 sm:px-3">
          <NavLink to="/" end className={({ isActive }) => navClassName(isActive)}>
            홈
          </NavLink>
          <NavLink to="/announcements" className={({ isActive }) => navClassName(isActive)}>
            공지사항
          </NavLink>
          {user?.role === "STUDENT" && (
            <NavLink to="/student-board" className={({ isActive }) => navClassName(isActive)}>
              학생게시판
            </NavLink>
          )}
          {user && (
            <NavLink to="/lms" className={({ isActive }) => navClassName(isActive)}>
              LMS
            </NavLink>
          )}
          {ADMIN_PAGE_ENABLED && user?.role === "ADMIN" && (
            <NavLink to="/lms/admin" className={({ isActive }) => navClassName(isActive)}>
              관리자
            </NavLink>
          )}
          <NavLink to="/academic-guide" className={({ isActive }) => navClassName(isActive)}>
            학사 안내
          </NavLink>
          <NavLink to="/campus-life" className={({ isActive }) => navClassName(isActive)}>
            대학생활
          </NavLink>
          <NavLink to="/saessak-news" className={({ isActive }) => navClassName(isActive)}>
            관제 소식
          </NavLink>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-[#d8e3f3] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>관제대학교 · 621 Hwarang-ro, Seoul</p>
          <p>대표전화 02-970-5000 · 입학상담 02-970-5051</p>
        </div>
      </footer>
    </div>
  );
}
