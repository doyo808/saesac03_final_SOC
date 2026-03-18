import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createAdminEnrollment,
  deleteAdminEnrollment,
  fetchAdminCourses,
  fetchAdminEnrollments,
  fetchAdminStudentOverviews,
  fetchAdminUsers,
  runSecurityEgressTest,
} from "../api/lmsApi";
import { useAuth } from "../auth/AuthContext";
import type {
  AdminCourse,
  AdminEnrollment,
  AdminStudentOverview,
  AdminUser,
  SecurityEgressTestRequest,
  SecurityEgressTestResult,
} from "../types";

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

export function AdminLmsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
  const [studentOverviews, setStudentOverviews] = useState<AdminStudentOverview[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityProcessing, setSecurityProcessing] = useState(false);
  const [securityScenario, setSecurityScenario] = useState("");
  const [securityMethod, setSecurityMethod] = useState<"GET" | "POST">("GET");
  const [securityPath, setSecurityPath] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [securityBody, setSecurityBody] = useState("");
  const [securityEgressError, setSecurityEgressError] = useState<string | null>(null);
  const [securityEgressResult, setSecurityEgressResult] = useState<SecurityEgressTestResult | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, coursesData, enrollmentsData, overviewsData] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminCourses(),
        fetchAdminEnrollments(),
        fetchAdminStudentOverviews(),
      ]);
      setUsers(usersData);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setStudentOverviews(overviewsData);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "관리자 데이터를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const students = useMemo(
    () => users.filter((item) => item.role === "STUDENT"),
    [users],
  );

  const handleCreateEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudentId || !selectedCourseId) {
      setError("학생과 강의를 선택해 주세요.");
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      await createAdminEnrollment(Number(selectedCourseId), Number(selectedStudentId));
      await loadAll();
    } catch (error) {
      setError(resolveApiErrorMessage(error, "수강 등록에 실패했습니다."));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    setProcessing(true);
    setError(null);
    try {
      await deleteAdminEnrollment(enrollmentId);
      await loadAll();
    } catch (error) {
      setError(resolveApiErrorMessage(error, "수강 등록 해제에 실패했습니다."));
    } finally {
      setProcessing(false);
    }
  };

  const handleRunSecurityEgress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!securityScenario.trim()) {
      setSecurityEgressError("시나리오 라벨을 입력해 주세요.");
      return;
    }
    if (!securityPath.trim()) {
      setSecurityEgressError("요청 경로를 입력해 주세요.");
      return;
    }
    const normalizedPath = securityPath.trim().startsWith("/")
      ? securityPath.trim()
      : `/${securityPath.trim()}`;

    setSecurityProcessing(true);
    setSecurityEgressError(null);
    setSecurityEgressResult(null);
    try {
      const request: SecurityEgressTestRequest = {
        scenario: securityScenario.trim(),
        method: securityMethod,
        path: normalizedPath,
      };
      if (exerciseId.trim().length > 0) {
        request.exerciseId = exerciseId.trim();
      }
      if (securityMethod === "POST" && securityBody.trim().length > 0) {
        request.body = securityBody;
      }
      const result = await runSecurityEgressTest(request);
      setSecurityEgressResult(result);
    } catch (error) {
      setSecurityEgressError(resolveApiErrorMessage(error, "훈련용 서버 발신 실행에 실패했습니다."));
    } finally {
      setSecurityProcessing(false);
    }
  };

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">관리자 페이지 로딩 중입니다...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="grid gap-5 bg-gradient-to-r from-[#102b53] to-[#275386] px-7 py-8 text-white md:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold tracking-[0.08em]">
              ADMIN PANEL
            </span>
            <h1 className="mt-4 text-3xl">LMS 통합 접근 관리</h1>
            <p className="mt-2 text-sm text-white/85">
              학생 수강신청과 개인 LMS 활동 현황을 통합 관리합니다.
            </p>
            <p className="mt-3 text-xs text-white/75">
              로그인 계정: {user?.name} ({user?.role})
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="surface-soft border-white/25 bg-white/10 p-4">
              <p className="text-xs text-white/80">학생 수</p>
              <p className="mt-1 text-2xl font-semibold">{students.length}</p>
            </div>
            <div className="surface-soft border-white/25 bg-white/10 p-4">
              <p className="text-xs text-white/80">강의 수</p>
              <p className="mt-1 text-2xl font-semibold">{courses.length}</p>
            </div>
            <div className="surface-soft col-span-2 border-white/25 bg-white/10 p-4">
              <p className="text-xs text-white/80">전체 수강등록 건수</p>
              <p className="mt-1 text-2xl font-semibold">{enrollments.length}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>
      )}

      <section className="surface-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-[#0d274d]">보안 훈련용 서버발신</h2>
            <p className="mt-2 text-sm text-slate-600">
              관리자 요청으로 서버가 사전 설정된 내부 타깃으로 발신합니다. 여기서는 시나리오 라벨과 경로만 작성합니다.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            CUSTOM FLOW
          </span>
        </div>

        {securityEgressError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {securityEgressError}
          </p>
        )}

        <form onSubmit={handleRunSecurityEgress} className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <input
              value={securityScenario}
              onChange={(event) => setSecurityScenario(event.target.value)}
              className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
              placeholder="시나리오 라벨 예: login-probe, webhook-test"
              maxLength={64}
              required
            />

            <select
              value={securityMethod}
              onChange={(event) => setSecurityMethod(event.target.value as "GET" | "POST")}
              className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <input
            value={securityPath}
            onChange={(event) => setSecurityPath(event.target.value)}
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
              <p className="mt-1">최종 대상 URL은 백엔드 설정에 따라 고정됩니다.</p>
            </div>
          </div>

          {securityMethod === "POST" && (
            <textarea
              value={securityBody}
              onChange={(event) => setSecurityBody(event.target.value)}
              className="min-h-32 w-full rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
              placeholder='POST body (선택) 예: {"source":"campus-platform"}'
              maxLength={4000}
            />
          )}

          <button
            type="submit"
            disabled={securityProcessing}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            실행
          </button>
        </form>

        {securityEgressResult && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-emerald-700">LAST RUN</p>
            <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">시나리오</p>
                <p className="mt-1 font-medium text-[#0d274d]">{securityEgressResult.scenario}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">대상 URL</p>
                <p className="mt-1 break-all font-medium text-[#0d274d]">{securityEgressResult.targetUrl}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">응답 코드</p>
                <p className="mt-1 font-medium text-[#0d274d]">{securityEgressResult.statusCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">소요 시간</p>
                <p className="mt-1 font-medium text-[#0d274d]">{securityEgressResult.durationMs} ms</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">메서드</p>
                <p className="mt-1 font-medium text-[#0d274d]">{securityEgressResult.method}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Request ID</p>
                <p className="mt-1 break-all font-medium text-[#0d274d]">{securityEgressResult.requestId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Exercise ID</p>
                <p className="mt-1 font-medium text-[#0d274d]">
                  {securityEgressResult.exerciseId ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Result</p>
                <p className="mt-1 font-medium text-[#0d274d]">{securityEgressResult.result}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="surface-card p-6 md:p-7">
        <h2 className="font-display text-2xl text-[#0d274d]">수강신청 등록/해제 관리</h2>
        <p className="mt-2 text-sm text-slate-600">
          학생과 강의를 선택하여 수강등록을 추가하고, 기존 등록을 해제할 수 있습니다.
        </p>

        <form onSubmit={handleCreateEnrollment} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_130px]">
          <select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
            required
          >
            <option value="">학생 선택</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>

          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="rounded-xl border border-[#cfd9e9] bg-white px-3 py-2 text-sm outline-none ring-[#173f72]/30 focus:ring-2"
            required
          >
            <option value="">강의 선택</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                [{course.code}] {course.title}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={processing}
            className="btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            등록
          </button>
        </form>

        <div className="mt-5 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#d8deea] text-xs text-slate-500">
                <th className="px-3 py-2">학생</th>
                <th className="px-3 py-2">강의</th>
                <th className="px-3 py-2">동작</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-[#eef2f8]">
                  <td className="px-3 py-2">
                    <p className="font-medium text-[#0d274d]">{enrollment.studentName}</p>
                    <p className="text-xs text-slate-500">{enrollment.studentEmail}</p>
                  </td>
                  <td className="px-3 py-2">
                    [{enrollment.courseCode}] {enrollment.courseTitle}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleDeleteEnrollment(enrollment.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      disabled={processing}
                    >
                      등록 해제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-card p-6 md:p-7">
        <h2 className="font-display text-2xl text-[#0d274d]">학생별 LMS 개인 현황</h2>
        <p className="mt-2 text-sm text-slate-600">
          학생 단위의 수강 강의 수, 과제 제출 수, 채점 완료 수를 확인할 수 있습니다.
        </p>

        <div className="mt-5 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#d8deea] text-xs text-slate-500">
                <th className="px-3 py-2">학생</th>
                <th className="px-3 py-2">수강 강의 수</th>
                <th className="px-3 py-2">과제 제출 수</th>
                <th className="px-3 py-2">채점 완료 수</th>
              </tr>
            </thead>
            <tbody>
              {studentOverviews.map((overview) => (
                <tr key={overview.studentId} className="border-b border-[#eef2f8]">
                  <td className="px-3 py-2">
                    <p className="font-medium text-[#0d274d]">{overview.studentName}</p>
                    <p className="text-xs text-slate-500">{overview.studentEmail}</p>
                  </td>
                  <td className="px-3 py-2">{overview.enrolledCourseCount}</td>
                  <td className="px-3 py-2">{overview.submissionCount}</td>
                  <td className="px-3 py-2">{overview.gradedSubmissionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
