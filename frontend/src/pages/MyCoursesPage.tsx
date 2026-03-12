import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyCourses } from "../api/lmsApi";
import type { Course } from "../types";

export function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyCourses();
        setCourses(data);
      } catch {
        setError("강의 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div className="surface-card p-8 text-sm text-slate-600">강의 목록을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className="surface-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">{error}</p>;
  }

  return (
    <section className="space-y-5">
      <header className="surface-card fade-up p-7">
        <span className="brand-chip">My Courses</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">내 강의 목록</h1>
        <p className="mt-2 text-sm text-slate-600">
          강의를 선택하면 해당 강의의 과제 목록으로 이동합니다.
        </p>
      </header>

      <div className="grid gap-4 stagger">
        {courses.map((course) => (
          <article key={course.id} className="surface-card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-[#2e5c97]">{course.code}</p>
                <h2 className="mt-1 font-display text-2xl text-[#0d274d]">{course.title}</h2>
                <p className="mt-2 text-sm text-slate-600">담당교수: {course.professorName}</p>
              </div>
              <Link
                to={`/lms/courses/${course.id}`}
                className="btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                과제 목록 보기
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
