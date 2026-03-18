import { api } from "./client";
import { shouldUseMockFallback } from "./fallback";
import {
  mockFetchAssignmentDetail,
  mockFetchCourseAssignments,
  mockFetchMyCourses,
  mockGradeSubmission,
  mockSubmitAssignment,
} from "./mockBackend";
import type {
  AdminCourse,
  AdminEnrollment,
  AdminStudentOverview,
  AdminUser,
  AssignmentDetail,
  AssignmentSummary,
  Course,
  SecurityEgressTestRequest,
  SecurityEgressTestResult,
  Submission,
} from "../types";

export async function fetchMyCourses() {
  try {
    const { data } = await api.get<Course[]>("/api/lms/courses/my");
    if (!Array.isArray(data)) {
      throw new Error("Invalid courses payload");
    }
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchMyCourses();
    }
    throw error;
  }
}

export async function fetchCourseAssignments(courseId: string | number) {
  try {
    const { data } = await api.get<AssignmentSummary[]>(
      `/api/lms/courses/${courseId}/assignments`,
    );
    if (!Array.isArray(data)) {
      throw new Error("Invalid assignments payload");
    }
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchCourseAssignments(courseId);
    }
    throw error;
  }
}

export async function fetchAssignmentDetail(id: string | number) {
  try {
    const { data } = await api.get<AssignmentDetail>(`/api/lms/assignments/${id}`);
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchAssignmentDetail(id);
    }
    throw error;
  }
}

export async function submitAssignment(id: string | number, contentText: string) {
  try {
    const { data } = await api.post<Submission>(`/api/lms/assignments/${id}/submissions`, {
      contentText,
    });
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockSubmitAssignment(id, contentText);
    }
    throw error;
  }
}

export async function gradeSubmission(
  submissionId: string | number,
  score: number,
  feedback: string,
) {
  try {
    const { data } = await api.post<Submission>(`/api/lms/submissions/${submissionId}/grade`, {
      score,
      feedback,
    });
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockGradeSubmission(submissionId, score, feedback);
    }
    throw error;
  }
}

export async function fetchAdminUsers() {
  const { data } = await api.get<AdminUser[]>("/api/lms/admin/users");
  if (!Array.isArray(data)) {
    throw new Error("Invalid admin users payload");
  }
  return data;
}

export async function fetchAdminCourses() {
  const { data } = await api.get<AdminCourse[]>("/api/lms/admin/courses");
  if (!Array.isArray(data)) {
    throw new Error("Invalid admin courses payload");
  }
  return data;
}

export async function fetchAdminEnrollments() {
  const { data } = await api.get<AdminEnrollment[]>("/api/lms/admin/enrollments");
  if (!Array.isArray(data)) {
    throw new Error("Invalid admin enrollments payload");
  }
  return data;
}

export async function createAdminEnrollment(courseId: number, studentId: number) {
  const { data } = await api.post<AdminEnrollment>("/api/lms/admin/enrollments", {
    courseId,
    studentId,
  });
  return data;
}

export async function deleteAdminEnrollment(enrollmentId: number) {
  await api.delete(`/api/lms/admin/enrollments/${enrollmentId}`);
}

export async function fetchAdminStudentOverviews() {
  const { data } = await api.get<AdminStudentOverview[]>("/api/lms/admin/students/overviews");
  if (!Array.isArray(data)) {
    throw new Error("Invalid admin student overview payload");
  }
  return data;
}

export async function runSecurityEgressTest(request: SecurityEgressTestRequest) {
  const payload: SecurityEgressTestRequest = {
    scenario: request.scenario.trim(),
    method: request.method,
    path: request.path.trim(),
  };
  if (request.exerciseId && request.exerciseId.trim().length > 0) {
    payload.exerciseId = request.exerciseId.trim();
  }
  if (request.body && request.body.trim().length > 0) {
    payload.body = request.body;
  }
  const { data } = await api.post<SecurityEgressTestResult>(
    "/api/lms/admin/security-egress-tests",
    payload,
  );
  return data;
}
