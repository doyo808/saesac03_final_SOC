import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createAdminEnrollment,
  deleteAdminEnrollment,
  fetchAdminCourses,
  fetchAdminEnrollments,
  fetchAdminStudentOverviews,
  fetchAdminUsers,
} from "../api/lmsApi";
import { useAuth } from "../auth/AuthContext";
import type {
  AdminCourse,
  AdminEnrollment,
  AdminStudentOverview,
  AdminUser,
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
