import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCourseAssignments } from "../api/lmsApi";
import type { AssignmentSummary } from "../types";
import { formatDateTime } from "../utils/date";

export function CourseAssignmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setError("courseId가 필요합니다.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCourseAssignments(courseId);
        setAssignments(data);
      } catch {
        setError("과제 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [courseId]);

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">과제 목록을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>;
  }

  return (
    <section className="space-y-5">
      <header className="surface-card fade-up p-7">
        <span className="brand-chip">Assignments</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">과제 목록</h1>
        <p className="mt-2 text-sm text-slate-600">
          과제 상세에서 학생은 제출, 교수/관리자는 제출물 확인 및 채점이 가능합니다.
        </p>
      </header>

      <ul className="data-list stagger">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="surface-card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-[#0d274d]">{assignment.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  마감일 {formatDateTime(assignment.dueAt)}
                </p>
              </div>
              <Link
                to={`/lms/assignments/${assignment.id}`}
                className="btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                과제 상세 보기
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
