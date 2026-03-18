import { useState } from "react";
import axios from "axios";
import { runSecurityEgressTest } from "../api/lmsApi";
import { useAuth } from "../auth/AuthContext";
import type { SecurityEgressTestRequest, SecurityEgressTestResult } from "../types";

function resolveApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return fallback;
}

export function SecurityEgressPage() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [scenario, setScenario] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [path, setPath] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SecurityEgressTestResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!scenario.trim()) {
      setError("시나리오 라벨을 입력해 주세요.");
      return;
    }

    if (!path.trim()) {
      setError("요청 경로를 입력해 주세요.");
      return;
    }

    const normalizedPath = path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`;

    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const request: SecurityEgressTestRequest = {
        scenario: scenario.trim(),
        method,
        path: normalizedPath,
      };
      if (exerciseId.trim().length > 0) {
        request.exerciseId = exerciseId.trim();
      }
      if (method === "POST" && body.trim().length > 0) {
        request.body = body;
      }
      const response = await runSecurityEgressTest(request);
      setResult(response);
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, "훈련용 서버 발신 실행에 실패했습니다."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="grid gap-5 bg-gradient-to-r from-[#0f305d] via-[#15538d] to-[#5a7aa2] px-7 py-8 text-white md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold tracking-[0.08em]">
              SECURITY EGRESS
            </span>
            <h1 className="mt-4 text-3xl">보안 훈련용 서버발신</h1>
            <p className="mt-2 text-sm text-white/85">
              로그인 사용자가 시나리오 라벨과 경로를 작성하면, WAS가 고정 타깃으로 outbound 요청을 보냅니다.
            </p>
            <p className="mt-3 text-xs text-white/75">
              로그인 계정: {user?.name} ({user?.email})
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-sm text-white/90 backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.08em] text-white/75">FLOW</p>
            <p className="mt-3 leading-7">
              외부 사용자 요청
              <br />
              → WEB
              <br />
              → WAS
              <br />
              → 고정 target
            </p>
            <p className="mt-4 text-xs text-white/75">
              최종 target URL은 백엔드 설정값으로 고정되고, 여기서는 path와 body만 작성합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-[#0d274d]">실행 입력</h2>
            <p className="mt-2 text-sm text-slate-600">
              허용된 계정만 실행 가능하며, path는 `/healthz`, `/webhook/test` 같은 상대 경로만 허용됩니다.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            WHITELIST ONLY
          </span>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <input
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
              className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
              placeholder="시나리오 라벨 예: fw-probe, dmz-webhook"
              maxLength={64}
              required
            />

            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as "GET" | "POST")}
              className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
            placeholder="요청 경로 예: /healthz 또는 /webhook/test"
            maxLength={256}
            required
          />

          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <input
              value={exerciseId}
              onChange={(event) => setExerciseId(event.target.value)}
              className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
              placeholder="Exercise ID (선택)"
              maxLength={64}
            />

            <div className="rounded-xl border border-[#d8deea] bg-[#f8fbff] px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-[#365b89]">TARGET</p>
              <p className="mt-1">최종 URL은 백엔드 base URL + path 조합으로 실행됩니다.</p>
            </div>
          </div>

          {method === "POST" && (
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-32 w-full rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
              placeholder='POST body (선택) 예: {"source":"campus-platform"}'
              maxLength={4000}
            />
          )}

          <button
            type="submit"
            disabled={processing}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            실행
          </button>
        </form>

        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-emerald-700">LAST RUN</p>
            <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">시나리오</p>
                <p className="mt-1 font-medium text-[#0d274d]">{result.scenario}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">대상 URL</p>
                <p className="mt-1 break-all font-medium text-[#0d274d]">{result.targetUrl}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">응답 코드</p>
                <p className="mt-1 font-medium text-[#0d274d]">{result.statusCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">소요 시간</p>
                <p className="mt-1 font-medium text-[#0d274d]">{result.durationMs} ms</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">메서드</p>
                <p className="mt-1 font-medium text-[#0d274d]">{result.method}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Request ID</p>
                <p className="mt-1 break-all font-medium text-[#0d274d]">{result.requestId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Exercise ID</p>
                <p className="mt-1 font-medium text-[#0d274d]">{result.exerciseId ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Result</p>
                <p className="mt-1 font-medium text-[#0d274d]">{result.result}</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
