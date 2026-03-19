import { useState } from "react";
import axios from "axios";
import {
  deleteCustomRequestScenario,
  executeRequestScenario,
  loadCustomRequestScenarios,
  loadRequestScenarioRuns,
  saveCustomRequestScenario,
} from "../api/requestScenarioApi";
import { useAuth } from "../auth/AuthContext";
import { requestScenarioCatalog } from "../scenarios/requestScenarioCatalog";
import type {
  RequestScenarioClass,
  RequestScenarioMethod,
  RequestScenarioRun,
  RequestScenarioTemplate,
} from "../types";
import { formatDateTime } from "../utils/date";

type ScenarioDraft = {
  id?: string;
  title: string;
  category: string;
  expectedClass: RequestScenarioClass;
  expectedOutcome: "allow" | "alert" | "block";
  method: RequestScenarioMethod;
  rawUrl: string;
  body: string;
  contentType: string;
  requiresAuth: boolean;
  notes: string;
};

const emptyDraft: ScenarioDraft = {
  title: "",
  category: "announcement",
  expectedClass: "benign",
  expectedOutcome: "allow",
  method: "GET",
  rawUrl: "/api/public/announcements",
  body: "",
  contentType: "application/json",
  requiresAuth: true,
  notes: "",
};

function resolveErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return fallback;
}

function toDraft(scenario: RequestScenarioTemplate): ScenarioDraft {
  return {
    id: scenario.source === "custom" ? scenario.id : undefined,
    title: scenario.title,
    category: scenario.category,
    expectedClass: scenario.expectedClass,
    expectedOutcome: scenario.expectedOutcome,
    method: scenario.method,
    rawUrl: scenario.rawUrl,
    body: scenario.body ?? "",
    contentType: scenario.contentType ?? "application/json",
    requiresAuth: scenario.requiresAuth,
    notes: scenario.notes ?? "",
  };
}

export function RequestScenarioLibraryPage() {
  const { user } = useAuth();
  const [customScenarios, setCustomScenarios] = useState(() => loadCustomRequestScenarios());
  const [runs, setRuns] = useState<RequestScenarioRun[]>(() => loadRequestScenarioRuns());
  const [draft, setDraft] = useState<ScenarioDraft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<"all" | RequestScenarioClass>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allScenarios = [...customScenarios, ...requestScenarioCatalog];
  const filteredScenarios = allScenarios.filter((scenario) => {
    const matchesQuery =
      query.trim().length === 0 ||
      `${scenario.title} ${scenario.category} ${scenario.notes ?? ""} ${scenario.rawUrl}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    const matchesClass = classFilter === "all" || scenario.expectedClass === classFilter;
    const matchesCategory = categoryFilter === "all" || scenario.category === categoryFilter;
    return matchesQuery && matchesClass && matchesCategory;
  });
  const categories = Array.from(new Set(allScenarios.map((scenario) => scenario.category))).sort();

  const handleRunScenario = async (scenario: RequestScenarioTemplate) => {
    if (!user) {
      return;
    }

    if (scenario.allowedRoles && !scenario.allowedRoles.includes(user.role)) {
      setError("현재 로그인한 역할로는 이 시나리오를 실행할 수 없습니다.");
      return;
    }

    setProcessingId(scenario.id);
    setError(null);
    setMessage(null);
    try {
      const run = await executeRequestScenario(scenario, user.email);
      setRuns(loadRequestScenarioRuns());
      setMessage(`시나리오 실행 완료: ${scenario.title} · 응답 ${run.status}`);
    } catch (runError) {
      setError(resolveErrorMessage(runError, "시나리오 실행에 실패했습니다."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveScenario = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim() || !draft.rawUrl.trim()) {
      setError("제목과 raw URL은 필수입니다.");
      return;
    }

    if (draft.method === "GET" && draft.body.trim()) {
      setError("GET 시나리오에는 body를 넣지 마세요.");
      return;
    }

    const saved = saveCustomRequestScenario({
      id: draft.id,
      title: draft.title.trim(),
      category: draft.category.trim() || "custom",
      expectedClass: draft.expectedClass,
      expectedOutcome: draft.expectedOutcome,
      method: draft.method,
      rawUrl: draft.rawUrl.trim(),
      body: draft.body.trim() || undefined,
      contentType: draft.body.trim() ? draft.contentType.trim() || undefined : undefined,
      requiresAuth: draft.requiresAuth,
      notes: draft.notes.trim() || undefined,
    });

    setCustomScenarios(loadCustomRequestScenarios());
    setDraft(emptyDraft);
    setError(null);
    setMessage(`시나리오 저장 완료: ${saved.title}`);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    deleteCustomRequestScenario(scenarioId);
    setCustomScenarios(loadCustomRequestScenarios());
    if (draft.id === scenarioId) {
      setDraft(emptyDraft);
    }
    setMessage("사용자 시나리오를 삭제했습니다.");
    setError(null);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="grid gap-5 bg-gradient-to-r from-[#12355f] via-[#185a91] to-[#5b7ba2] px-7 py-8 text-white md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold tracking-[0.08em]">
              REQUEST SCENARIOS
            </span>
            <h1 className="mt-4 text-3xl">요청 시나리오 라이브러리</h1>
            <p className="mt-2 text-sm text-white/85">
              WAF 튜닝용 요청을 카탈로그로 관리하고, 브라우저에서 실제 엔드포인트로 직접 재실행할 수 있습니다.
            </p>
            <p className="mt-3 text-xs text-white/75">
              이 페이지는 네비게이션에 노출되지 않으며 직접 URL로만 접근됩니다.
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-sm text-white/90 backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.08em] text-white/75">HOW TO USE</p>
            <p className="mt-3 leading-7">
              1. 정상/애매/공격성 시나리오를 고릅니다.
              <br />
              2. 직접 실행해 WAF 반응을 확인합니다.
              <br />
              3. 실행 이력으로 전후 비교를 남깁니다.
            </p>
            <p className="mt-4 text-xs text-white/75">
              현재 로그인 계정: {user?.name} ({user?.email})
            </p>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div
          className={`surface-card p-4 text-sm ${
            error ? "border-red-200 bg-red-50/80 text-red-700" : "border-emerald-200 bg-emerald-50/80 text-emerald-700"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <section className="surface-card space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-[#0d274d]">시나리오 카탈로그</h2>
            <p className="mt-2 text-sm text-slate-600">
              기본 카탈로그와 사용자 정의 시나리오를 함께 필터링하고 직접 실행할 수 있습니다.
            </p>
          </div>
          <span className="rounded-full bg-[#e9f0fb] px-3 py-1 text-xs font-semibold text-[#315c8f]">
            총 {filteredScenarios.length}개
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            placeholder="제목, 카테고리, 경로 검색"
          />
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value as "all" | RequestScenarioClass)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
          >
            <option value="all">모든 분류</option>
            <option value="benign">정상</option>
            <option value="ambiguous">애매</option>
            <option value="attack-like">공격성</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-2 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
          >
            <option value="all">모든 카테고리</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            {filteredScenarios.map((scenario) => (
              <article key={scenario.id} className="rounded-2xl border border-[#d7e2f2] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#315c8f]">
                        {scenario.expectedClass}
                      </span>
                      <span className="rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-semibold text-slate-600">
                        {scenario.category}
                      </span>
                      <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-xs font-semibold text-[#956222]">
                        {scenario.expectedOutcome}
                      </span>
                      <span className="rounded-full bg-[#f6f1ff] px-3 py-1 text-xs font-semibold text-[#6b4bb0]">
                        {scenario.source}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[#122e56]">{scenario.title}</h3>
                    <p className="mt-2 break-all text-sm text-slate-600">
                      {scenario.method} {scenario.rawUrl}
                    </p>
                    {scenario.notes && <p className="mt-2 text-sm text-slate-500">{scenario.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRunScenario(scenario)}
                      disabled={processingId === scenario.id}
                      className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      {processingId === scenario.id ? "실행 중..." : "실행"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(toDraft(scenario));
                        setMessage("시나리오를 편집기 영역으로 불러왔습니다.");
                        setError(null);
                      }}
                      className="btn-secondary px-4 py-2 text-sm font-semibold"
                    >
                      복사
                    </button>
                    {scenario.source === "custom" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {filteredScenarios.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#cfd9e9] bg-[#fafcff] p-6 text-sm text-slate-500">
                조건에 맞는 시나리오가 없습니다.
              </div>
            )}
          </div>

          <form onSubmit={handleSaveScenario} className="surface-card space-y-4 p-5">
            <div>
              <p className="brand-chip">Custom Scenario</p>
              <h2 className="mt-3 font-display text-2xl text-[#0d274d]">사용자 시나리오 저장</h2>
            </div>

            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="시나리오 제목"
              maxLength={80}
              required
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                placeholder="카테고리"
                maxLength={40}
              />
              <select
                value={draft.expectedClass}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    expectedClass: event.target.value as RequestScenarioClass,
                  }))
                }
                className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              >
                <option value="benign">정상</option>
                <option value="ambiguous">애매</option>
                <option value="attack-like">공격성</option>
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={draft.method}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    method: event.target.value as RequestScenarioMethod,
                  }))
                }
                className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <select
                value={draft.expectedOutcome}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    expectedOutcome: event.target.value as "allow" | "alert" | "block",
                  }))
                }
                className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              >
                <option value="allow">allow</option>
                <option value="alert">alert</option>
                <option value="block">block</option>
              </select>
            </div>

            <input
              value={draft.rawUrl}
              onChange={(event) => setDraft((current) => ({ ...current, rawUrl: event.target.value }))}
              className="w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="raw URL 예: /api/board/posts?keyword=select"
              maxLength={400}
              required
            />

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={draft.requiresAuth}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, requiresAuth: event.target.checked }))
                }
              />
              인증된 세션 기준 시나리오
            </label>

            {draft.method !== "GET" && (
              <>
                <input
                  value={draft.contentType}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, contentType: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                  placeholder="Content-Type"
                  maxLength={120}
                />
                <textarea
                  value={draft.body}
                  onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                  className="min-h-32 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                  placeholder='body 예: {"title":"테스트","content":"본문"}'
                />
              </>
            )}

            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="비고"
            />

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary px-4 py-2 text-sm font-semibold">
                {draft.id ? "수정 저장" : "새 시나리오 저장"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(emptyDraft)}
                className="btn-secondary px-4 py-2 text-sm font-semibold"
              >
                초기화
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="surface-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-[#0d274d]">최근 실행 이력</h2>
            <p className="mt-2 text-sm text-slate-600">최근 30건까지 브라우저 localStorage에 보관됩니다.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {runs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cfd9e9] bg-[#fafcff] p-6 text-sm text-slate-500">
              아직 실행 이력이 없습니다.
            </div>
          ) : (
            runs.map((run) => (
              <article key={run.id} className="rounded-2xl border border-[#d7e2f2] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#315c8f]">
                        {run.expectedClass}
                      </span>
                      <span className="rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-semibold text-slate-600">
                        {run.status}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-[#122e56]">{run.title}</h3>
                    <p className="mt-1 break-all text-sm text-slate-600">
                      {run.method} {run.rawUrl}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(run.executedAt)} · {run.durationMs} ms · {run.userEmail}
                    </p>
                  </div>
                  <div className="max-w-xl rounded-xl border border-[#e0e8f5] bg-[#f8fbff] px-4 py-3 text-xs text-slate-600">
                    {run.responseSnippet || "응답 본문 없음"}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
