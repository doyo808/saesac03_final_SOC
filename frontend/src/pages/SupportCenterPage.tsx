import { useEffect, useState } from "react";
import axios from "axios";
import { createSupportRequest } from "../api/publicApi";
import { useAuth } from "../auth/AuthContext";
import type { SupportRequestForm, SupportRequestReceipt } from "../types";
import { formatDateTime } from "../utils/date";

const defaultForm: SupportRequestForm = {
  category: "GENERAL",
  subject: "",
  message: "",
  contactEmail: "",
  referenceUrl: "",
};

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

export function SupportCenterPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SupportRequestForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SupportRequestReceipt | null>(null);

  useEffect(() => {
    if (!user?.email) {
      return;
    }
    setForm((current) => ({
      ...current,
      contactEmail: current.contactEmail || user.email,
    }));
  }, [user?.email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setReceipt(null);
    try {
      const response = await createSupportRequest(form);
      setReceipt(response);
      setForm({
        ...defaultForm,
        contactEmail: user?.email ?? "",
      });
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, "문의/제보 접수에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="grid gap-5 bg-gradient-to-r from-[#14355e] via-[#1a5b92] to-[#5f7da0] px-7 py-8 text-white md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold tracking-[0.08em]">
              SUPPORT CENTER
            </span>
            <h1 className="mt-4 text-3xl">문의 / 제보 센터</h1>
            <p className="mt-2 text-sm text-white/85">
              학사, 시설, 보안, 서비스 오동작 관련 문의를 남길 수 있습니다. URL이나 검색어 예시가 들어가도 문맥과 함께 작성하면 됩니다.
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-sm text-white/90 backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.08em] text-white/75">EXAMPLE</p>
            <p className="mt-3 leading-7">
              게시판 검색어에 select 문 정리, script 태그 예시, ../ 경로 설명이 포함돼도
              <br />
              정상 문의로 접수할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>
      )}

      {receipt && (
        <div className="surface-card border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-800">
          <p className="font-semibold">접수가 완료되었습니다.</p>
          <p className="mt-2">
            접수번호 #{receipt.id} · {receipt.category} · {formatDateTime(receipt.submittedAt)}
          </p>
          <p className="mt-1">{receipt.subject}</p>
        </div>
      )}

      <section className="surface-card p-6 md:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            >
              <option value="GENERAL">일반 문의</option>
              <option value="ACADEMIC">학사 문의</option>
              <option value="FACILITY">시설 문의</option>
              <option value="SECURITY_REPORT">보안 제보</option>
            </select>
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="제목"
              maxLength={160}
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                setForm((current) => ({ ...current, contactEmail: event.target.value }))
              }
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="회신 이메일"
              maxLength={160}
              required
            />
            <input
              value={form.referenceUrl ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, referenceUrl: event.target.value }))
              }
              className="rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
              placeholder="참고 URL 또는 경로 (선택)"
              maxLength={500}
            />
          </div>

          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className="min-h-48 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
            placeholder="문의 또는 제보 내용을 자세히 작성하세요."
            maxLength={4000}
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "접수 중..." : "문의 접수"}
          </button>
        </form>
      </section>
    </div>
  );
}
