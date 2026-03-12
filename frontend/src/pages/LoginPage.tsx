import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(state?.from ?? "/lms", { replace: true });
    } catch {
      setError("로그인에 실패했습니다. 계정 정보를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card fade-up mx-auto max-w-4xl overflow-hidden">
      <div className="grid md:grid-cols-[1fr_1.15fr]">
        <aside className="bg-gradient-to-br from-[#0d274d] via-[#1a4174] to-[#2e5c97] px-7 py-8 text-white md:px-8 md:py-10">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#f6d89d]">CAMPUS SSO</p>
          <h1 className="mt-4 text-3xl leading-tight">
            포털 계정으로
            <br />
            LMS에 접속하세요
          </h1>
          <p className="mt-4 text-sm text-white/85">
            학생, 교수, 관리자 권한별로 강의와 과제 화면이 다르게 제공됩니다.
          </p>
        </aside>

        <div className="bg-[#fffdf9] px-7 py-8 md:px-9 md:py-10">
          <h2 className="font-display text-2xl text-[#0d274d]">로그인</h2>
          <p className="mt-2 text-sm text-slate-600">캠퍼스 서비스 이용을 위해 인증이 필요합니다.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-[#173f72]">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#cfd9e9] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-[#173f72]">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#cfd9e9] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                required
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
