import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";
import { ADMIN_PAGE_ENABLED } from "./config/features";
import { AcademicGuidePage } from "./pages/AcademicGuidePage";
import { AnnouncementDetailPage } from "./pages/AnnouncementDetailPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { AdminLmsPage } from "./pages/AdminLmsPage";
import { AssignmentDetailPage } from "./pages/AssignmentDetailPage";
import { CampusMapPage } from "./pages/CampusMapPage";
import { CampusLifePage } from "./pages/CampusLifePage";
import { CourseAssignmentsPage } from "./pages/CourseAssignmentsPage";
import { HomePage } from "./pages/HomePage";
import { InternationalExchangePage } from "./pages/InternationalExchangePage";
import { LmsDashboardPage } from "./pages/LmsDashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MyCoursesPage } from "./pages/MyCoursesPage";
import { SaessakNewsPage } from "./pages/SaessakNewsPage";

function NotFoundPage() {
  return (
    <div className="surface-card p-8">
      <h1 className="font-display text-3xl text-[#0d274d]">페이지를 찾을 수 없습니다.</h1>
      <p className="mt-2 text-sm text-slate-600">요청한 주소가 유효한지 확인해 주세요.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="/academic-guide" element={<AcademicGuidePage />} />
        <Route path="/international-exchange" element={<InternationalExchangePage />} />
        <Route path="/campus-map" element={<CampusMapPage />} />
        <Route path="/campus-life" element={<CampusLifePage />} />
        <Route path="/saessak-news" element={<SaessakNewsPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/lms" element={<LmsDashboardPage />} />
          <Route path="/lms/courses" element={<MyCoursesPage />} />
          <Route path="/lms/courses/:courseId" element={<CourseAssignmentsPage />} />
          <Route path="/lms/assignments/:id" element={<AssignmentDetailPage />} />
        </Route>

        {ADMIN_PAGE_ENABLED && (
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/lms/admin" element={<AdminLmsPage />} />
          </Route>
        )}

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
