import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAssignmentDetail, gradeSubmission, submitAssignment } from "../api/lmsApi";
import { useAuth } from "../auth/AuthContext";
import type { AssignmentDetail, Submission } from "../types";
import { formatDateTime } from "../utils/date";

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitText, setSubmitText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mySubmission = useMemo(() => {
    if (!assignment || !user || user.role !== "STUDENT") {
      return null;
    }
    return assignment.submissions.find((submission) => submission.studentId === user.id) ?? null;
  }, [assignment, user]);

  const load = async () => {
    if (!id) {
      setError("assignment id가 필요합니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignmentDetail(id);
      setAssignment(data);
    } catch {
      setError("과제 상세를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitAssignment(id, submitText);
      setSubmitText("");
      await load();
    } catch {
      setError("제출 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (
    event: React.FormEvent<HTMLFormElement>,
    submission: Submission,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const scoreValue = Number(formData.get("score"));
    const feedback = String(formData.get("feedback") ?? "");

    if (Number.isNaN(scoreValue)) {
      setError("점수는 숫자로 입력해 주세요.");
      return;
    }

    setError(null);
    try {
      await gradeSubmission(submission.id, scoreValue, feedback);
      await load();
    } catch {
      setError("채점 저장에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">과제 상세를 불러오는 중입니다...</div>;
  }

  if (!assignment) {
    return <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error ?? "데이터 없음"}</p>;
  }

  const canGrade = user?.role === "PROFESSOR" || user?.role === "ADMIN";
  const canSubmit = user?.role === "STUDENT";

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <header className="border-b border-[#dce4f1] bg-gradient-to-r from-[#f8efe0] to-[#f4f8ff] px-7 py-6 md:px-9">
          <span className="brand-chip">Assignment</span>
          <h1 className="mt-3 text-3xl text-[#0d274d]">{assignment.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>강의: {assignment.courseTitle}</span>
            <span>마감: {formatDateTime(assignment.dueAt)}</span>
          </div>
        </header>
        <div className="px-7 py-7 md:px-9">
          <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">
            {assignment.description}
          </p>
        </div>
      </section>

      {error && (
        <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>
      )}

      {canSubmit && (
        <section className="surface-card p-6 md:p-7">
          <h2 className="font-display text-2xl text-[#0d274d]">학생 제출</h2>
          {mySubmission ? (
            <div className="surface-soft mt-4 p-5">
              <p className="text-xs text-slate-500">제출일 {formatDateTime(mySubmission.submittedAt)}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{mySubmission.contentText}</p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  점수: <strong>{mySubmission.score ?? "-"}</strong>
                </p>
                <p>피드백: {mySubmission.feedback ?? "-"}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <textarea
                value={submitText}
                onChange={(event) => setSubmitText(event.target.value)}
                className="h-44 w-full rounded-xl border border-[#cfd9e9] bg-white px-4 py-3 text-sm outline-none ring-[#173f72]/30 transition focus:ring-2"
                placeholder="과제 제출 내용을 입력하세요."
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? "제출 중..." : "과제 제출"}
              </button>
            </form>
          )}
        </section>
      )}

      {canGrade && (
        <section className="surface-card p-6 md:p-7">
          <h2 className="font-display text-2xl text-[#0d274d]">교수/관리자 채점</h2>
          <div className="mt-4 space-y-4">
            {assignment.submissions.map((submission) => (
              <article key={submission.id} className="surface-soft p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0d274d]">{submission.studentName}</p>
                  <p className="text-xs text-slate-500">
                    제출일 {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{submission.contentText}</p>
                <form
                  onSubmit={(event) => void handleGrade(event, submission)}
                  className="mt-4 grid gap-2 md:grid-cols-[120px_1fr_110px]"
                >
                  <input
                    type="number"
                    name="score"
                    min={0}
                    max={100}
                    defaultValue={submission.score ?? ""}
                    className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
                    placeholder="점수"
                    required
                  />
                  <input
                    type="text"
                    name="feedback"
                    defaultValue={submission.feedback ?? ""}
                    className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
                    placeholder="피드백"
                  />
                  <button type="submit" className="btn-primary px-3 py-2 text-sm font-semibold">
                    채점 저장
                  </button>
                </form>
              </article>
            ))}
            {assignment.submissions.length === 0 && (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                아직 제출된 과제가 없습니다.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
