export type Role = "STUDENT" | "PROFESSOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AnnouncementSummary {
  id: number;
  title: string;
  createdAt: string;
}

export type AnnouncementSort = "latest" | "oldest" | "title";

export interface AnnouncementSearchParams {
  keyword?: string;
  sort?: AnnouncementSort;
  page?: number;
  size?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnnouncementPage {
  items: AnnouncementSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AnnouncementDetail {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface AcademicEvent {
  id: number;
  title: string;
  date: string;
}

export interface BoardPostSummary {
  id: number;
  title: string;
  excerpt: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export type BoardPostSort = "latest" | "oldest" | "title";

export interface BoardPostSearchParams {
  keyword?: string;
  author?: string;
  sort?: BoardPostSort;
  page?: number;
  size?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface BoardPostPage {
  items: BoardPostSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface BoardComment {
  id: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface BoardPostDetail {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  comments: BoardComment[];
}

export interface Course {
  id: number;
  code: string;
  title: string;
  professorId: number;
  professorName: string;
}

export interface AssignmentSummary {
  id: number;
  title: string;
  dueAt: string;
}

export interface Submission {
  id: number;
  studentId: number;
  studentName: string;
  contentText: string;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
}

export interface AssignmentDetail {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description: string;
  dueAt: string;
  submissions: Submission[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AdminCourse {
  id: number;
  code: string;
  title: string;
  professorId: number;
  professorName: string;
}

export interface AdminEnrollment {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
}

export interface AdminStudentOverview {
  studentId: number;
  studentName: string;
  studentEmail: string;
  enrolledCourseCount: number;
  submissionCount: number;
  gradedSubmissionCount: number;
}

export interface SecurityEgressTestResult {
  requestId: string;
  scenario: string;
  targetUrl: string;
  exerciseId: string | null;
  method: string;
  statusCode: number;
  durationMs: number;
  result: string;
}

export interface SecurityEgressTestRequest {
  scenario: string;
  method: "GET" | "POST";
  path: string;
  exerciseId?: string;
  body?: string;
}

export type RequestScenarioClass = "benign" | "ambiguous" | "attack-like";

export type RequestScenarioMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestScenarioTemplate {
  id: string;
  title: string;
  category: string;
  expectedClass: RequestScenarioClass;
  expectedOutcome: "allow" | "alert" | "block";
  method: RequestScenarioMethod;
  rawUrl: string;
  body?: string;
  contentType?: string;
  requiresAuth: boolean;
  allowedRoles?: Role[];
  notes?: string;
  source: "built-in" | "custom";
}

export interface RequestScenarioRun {
  id: string;
  scenarioId: string;
  title: string;
  expectedClass: RequestScenarioClass;
  method: RequestScenarioMethod;
  rawUrl: string;
  status: number;
  durationMs: number;
  responseSnippet: string;
  executedAt: string;
  userEmail: string;
}
