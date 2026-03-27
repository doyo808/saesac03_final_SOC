import type {
  AcademicEvent,
  AdminCourse,
  AdminEnrollment,
  AdminStudentOverview,
  AdminUser,
  AssignmentDetail,
  AssignmentSummary,
  Course,
  Role,
  Submission,
  User,
  AnnouncementDetail,
  AnnouncementPage,
  AnnouncementSearchParams,
  AnnouncementSort,
  AnnouncementSummary,
  SupportRequestForm,
  SupportRequestReceipt,
} from "../types";

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: Role;
}

interface LoginResponse {
  accessToken: string;
}

interface MockUser extends User {
  password: string;
}

interface MockAssignment {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dueAt: string;
}

interface MockEnrollment {
  id: number;
  courseId: number;
  studentId: number;
}

interface MockSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  contentText: string;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
}

interface MockSupportRequest {
  id: number;
  category: string;
  subject: string;
  message: string;
  contactEmail: string;
  referenceUrl: string | null;
  submittedAt: string;
}

interface MockState {
  users: MockUser[];
  announcements: AnnouncementDetail[];
  academicEvents: AcademicEvent[];
  courses: Course[];
  assignments: MockAssignment[];
  enrollments: MockEnrollment[];
  submissions: MockSubmission[];
  supportRequests: MockSupportRequest[];
  sessionUserId: number | null;
  nextIds: {
    user: number;
    enrollment: number;
    submission: number;
    supportRequest: number;
  };
}

class MockApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

const STORAGE_KEY = "saessak-campus-mock-backend-v2";
const DEFAULT_USERS: MockUser[] = [
  {
    id: 1,
    email: "student1@campus.local",
    name: "student1",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 2,
    email: "prof1@campus.local",
    name: "prof1",
    role: "PROFESSOR",
    password: "Password123!",
  },
  {
    id: 3,
    email: "admin1@campus.local",
    name: "admin1",
    role: "ADMIN",
    password: "Password123!",
  },
  {
    id: 4,
    email: "student2@campus.local",
    name: "student2",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 5,
    email: "student3@campus.local",
    name: "student3",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 6,
    email: "student4@campus.local",
    name: "student4",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 7,
    email: "student5@campus.local",
    name: "student5",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 8,
    email: "student11@campus.local",
    name: "김민지",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 9,
    email: "student12@campus.local",
    name: "강해린",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 10,
    email: "student13@campus.local",
    name: "장원영",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 11,
    email: "student14@campus.local",
    name: "유지민",
    role: "STUDENT",
    password: "Password123!",
  },
  {
    id: 12,
    email: "student15@campus.local",
    name: "안유진",
    role: "STUDENT",
    password: "Password123!",
  },
];

let stateCache: MockState | null = null;

function toIsoDateTime(daysOffset: number) {
  return new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString();
}

function toIsoDate(daysOffset: number) {
  return new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function seedState(): MockState {
  return {
    users: DEFAULT_USERS.map((user) => ({ ...user })),
    announcements: [
      {
        id: 1,
        title: "2026학년도 1학기 개강 안내",
        content: "개강일은 2026-03-04이며 첫 주는 수강정정 기간입니다.",
        createdAt: toIsoDateTime(-7),
      },
      {
        id: 2,
        title: "도서관 운영시간 변경",
        content: "중간고사 기간 동안 도서관이 24시간 운영됩니다.",
        createdAt: toIsoDateTime(-4),
      },
      {
        id: 3,
        title: "캠퍼스 네트워크 점검",
        content: "주말 오전 2시부터 5시까지 네트워크 점검이 예정되어 있습니다.",
        createdAt: toIsoDateTime(-2),
      },
      {
        id: 4,
        title: "웹보안 실습 문자열 안내",
        content:
          "이번 주 실습 자료에는 union select, <script>alert(1)</script>, ../admin 같은 문자열이 포함되어 있습니다. 실제 공격이 아니라 탐지와 과탐 사례 분석용 예시입니다.",
        createdAt: toIsoDateTime(-3),
      },
      {
        id: 5,
        title: "보안과목 과제 제출 유의사항",
        content:
          "네트워크 보안 및 웹애플리케이션보안 과제에는 select 문, script 태그, ../ 경로 예시가 들어갈 수 있으니 본문 맥락을 함께 작성하세요.",
        createdAt: toIsoDateTime(-1),
      },
    ],
    academicEvents: [
      { id: 1, title: "개강", date: toIsoDate(5) },
      { id: 2, title: "수강정정 마감", date: toIsoDate(12) },
      { id: 3, title: "중간고사", date: toIsoDate(45) },
    ],
    courses: [
      {
        id: 1,
        code: "CS101",
        title: "웹프로그래밍 기초",
        professorId: 2,
        professorName: "prof1",
      },
      {
        id: 2,
        code: "SE320",
        title: "소프트웨어공학",
        professorId: 2,
        professorName: "prof1",
      },
      {
        id: 3,
        code: "DB204",
        title: "데이터베이스 시스템",
        professorId: 2,
        professorName: "prof1",
      },
      {
        id: 4,
        code: "OS220",
        title: "운영체제",
        professorId: 2,
        professorName: "prof1",
      },
      {
        id: 5,
        code: "SEC210",
        title: "네트워크 보안",
        professorId: 2,
        professorName: "prof1",
      },
      {
        id: 6,
        code: "SEC330",
        title: "웹애플리케이션보안",
        professorId: 2,
        professorName: "prof1",
      },
      {
        id: 7,
        code: "IR310",
        title: "디지털 포렌식 개론",
        professorId: 2,
        professorName: "prof1",
      },
    ],
    assignments: [
      {
        id: 1,
        courseId: 1,
        title: "과제 1 - 자기소개 페이지",
        description: "React로 간단한 자기소개 페이지를 구현하세요.",
        dueAt: toIsoDateTime(10),
      },
      {
        id: 2,
        courseId: 1,
        title: "과제 2 - REST API 연동",
        description: "axios를 사용해 공지사항 API를 연동하세요.",
        dueAt: toIsoDateTime(20),
      },
      {
        id: 3,
        courseId: 5,
        title: "실습 1 - 네트워크 보안 로그 읽기",
        description: "방화벽과 IDS 로그 샘플을 비교하고, nmap -sS, ping sweep, alert tcp 예시가 어떤 식으로 남는지 정리하세요.",
        dueAt: toIsoDateTime(14),
      },
      {
        id: 4,
        courseId: 6,
        title: "실습 1 - 웹보안 사례 조사",
        description: "최근 웹보안 사고 사례 하나를 골라 union select, <script>alert(1)</script>, ../admin 같은 문자열이 어떤 맥락에서 등장했는지 요약하세요.",
        dueAt: toIsoDateTime(18),
      },
      {
        id: 5,
        courseId: 6,
        title: "실습 2 - WAF 혼동 문자열 분석",
        description: "보고서에 select, union, ../uploads, <script> 같은 문자열을 정상 문맥과 공격 문맥으로 나눠 정리하세요.",
        dueAt: toIsoDateTime(24),
      },
    ],
    enrollments: [
      { id: 1, courseId: 1, studentId: 1 },
      { id: 2, courseId: 1, studentId: 8 },
      { id: 3, courseId: 2, studentId: 8 },
      { id: 4, courseId: 3, studentId: 8 },
      { id: 5, courseId: 5, studentId: 8 },
      { id: 6, courseId: 1, studentId: 9 },
      { id: 7, courseId: 4, studentId: 9 },
      { id: 8, courseId: 6, studentId: 9 },
      { id: 9, courseId: 7, studentId: 9 },
      { id: 10, courseId: 2, studentId: 10 },
      { id: 11, courseId: 3, studentId: 10 },
      { id: 12, courseId: 4, studentId: 10 },
      { id: 13, courseId: 5, studentId: 10 },
      { id: 14, courseId: 6, studentId: 10 },
      { id: 15, courseId: 1, studentId: 11 },
      { id: 16, courseId: 2, studentId: 11 },
      { id: 17, courseId: 7, studentId: 11 },
      { id: 18, courseId: 3, studentId: 12 },
      { id: 19, courseId: 4, studentId: 12 },
      { id: 20, courseId: 5, studentId: 12 },
      { id: 21, courseId: 6, studentId: 12 },
    ],
    submissions: [],
    supportRequests: [],
    sessionUserId: null,
    nextIds: {
      user: 13,
      enrollment: 22,
      submission: 1,
      supportRequest: 1,
    },
  };
}

function hasWindow() {
  return typeof window !== "undefined";
}

function loadState() {
  if (!hasWindow()) {
    return seedState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedState();
  }

  try {
    const parsed = JSON.parse(raw) as MockState;
    if (!parsed || !Array.isArray(parsed.users)) {
      return seedState();
    }
    return ensureDefaultUsers(parsed);
  } catch {
    return seedState();
  }
}

function ensureDefaultUsers(state: MockState) {
  for (const user of DEFAULT_USERS) {
    const existing = state.users.find(
      (item) => item.email.toLowerCase() === user.email.toLowerCase(),
    );
    if (!existing) {
      state.users.push({ ...user });
      continue;
    }

    existing.name = user.name;
    existing.role = user.role;
    existing.password = user.password;
  }

  const maxUserId = state.users.reduce((max, user) => Math.max(max, user.id), 0);
  if (state.nextIds.user <= maxUserId) {
    state.nextIds.user = maxUserId + 1;
  }
  if (!Array.isArray(state.supportRequests)) {
    state.supportRequests = [];
  }
  if (typeof state.nextIds.supportRequest !== "number" || state.nextIds.supportRequest < 1) {
    const maxSupportRequestId = state.supportRequests.reduce(
      (max, request) => Math.max(max, request.id),
      0,
    );
    state.nextIds.supportRequest = maxSupportRequestId + 1;
  }

  return state;
}

function saveState() {
  if (!stateCache || !hasWindow()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
}

function getState() {
  if (!stateCache) {
    stateCache = loadState();
  }
  return stateCache;
}

function asUser(user: MockUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function makeMockToken(userId: number) {
  return `mock-token-${userId}-${Date.now()}`;
}

function parseId(value: string | number, name: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new MockApiError(400, `${name} is invalid`);
  }
  return id;
}

function getCurrentUser() {
  const state = getState();
  if (!state.sessionUserId) {
    throw new MockApiError(401, "Authentication is required");
  }
  const user = state.users.find((item) => item.id === state.sessionUserId);
  if (!user) {
    state.sessionUserId = null;
    saveState();
    throw new MockApiError(401, "Authentication is required");
  }
  return user;
}

function requireAdmin(user: MockUser) {
  if (user.role !== "ADMIN") {
    throw new MockApiError(403, "Admin permission is required");
  }
}

function getCourseOrThrow(courseId: number) {
  const course = getState().courses.find((item) => item.id === courseId);
  if (!course) {
    throw new MockApiError(404, "Course not found");
  }
  return course;
}

function isEnrolled(courseId: number, studentId: number) {
  return getState().enrollments.some(
    (enrollment) => enrollment.courseId === courseId && enrollment.studentId === studentId,
  );
}

function assertCanViewCourse(courseId: number, user: MockUser) {
  const course = getCourseOrThrow(courseId);

  if (user.role === "ADMIN") {
    return;
  }

  if (user.role === "PROFESSOR") {
    if (course.professorId !== user.id) {
      throw new MockApiError(403, "Course is not assigned to this professor");
    }
    return;
  }

  if (user.role === "STUDENT") {
    if (!isEnrolled(course.id, user.id)) {
      throw new MockApiError(403, "Not enrolled in this course");
    }
    return;
  }

  throw new MockApiError(403, "Access denied");
}

function toSubmissionResponse(submission: MockSubmission): Submission {
  const state = getState();
  const student = state.users.find((item) => item.id === submission.studentId);
  if (!student) {
    throw new MockApiError(404, "Student not found");
  }
  return {
    id: submission.id,
    studentId: submission.studentId,
    studentName: student.name,
    contentText: submission.contentText,
    submittedAt: submission.submittedAt,
    score: submission.score,
    feedback: submission.feedback,
  };
}

function sortByDateAsc<T>(items: T[], selector: (item: T) => string) {
  return [...items].sort(
    (a, b) => new Date(selector(a)).getTime() - new Date(selector(b)).getTime(),
  );
}

function sortByDateDesc<T>(items: T[], selector: (item: T) => string) {
  return [...items].sort(
    (a, b) => new Date(selector(b)).getTime() - new Date(selector(a)).getTime(),
  );
}

export async function mockLogin(email: string, password: string): Promise<LoginResponse> {
  const state = getState();
  const user = state.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new MockApiError(401, "Invalid credentials");
  }
  state.sessionUserId = user.id;
  saveState();
  return { accessToken: makeMockToken(user.id) };
}

export async function mockRegister(payload: RegisterPayload): Promise<User> {
  const state = getState();
  const exists = state.users.some(
    (item) => item.email.toLowerCase() === payload.email.toLowerCase(),
  );
  if (exists) {
    throw new MockApiError(409, "Email already exists");
  }

  const nextId = state.nextIds.user++;
  const user: MockUser = {
    id: nextId,
    email: payload.email,
    password: payload.password,
    name: payload.name,
    role: payload.role,
  };

  state.users.push(user);
  saveState();
  return asUser(user);
}

export async function mockRefresh(): Promise<LoginResponse> {
  const user = getCurrentUser();
  return { accessToken: makeMockToken(user.id) };
}

export async function mockLogout() {
  const state = getState();
  state.sessionUserId = null;
  saveState();
}

export async function mockMe(): Promise<User> {
  return asUser(getCurrentUser());
}

export async function mockFetchAnnouncements(
  searchParams: AnnouncementSearchParams = {},
): Promise<AnnouncementPage> {
  const keyword = searchParams.keyword?.trim().toLowerCase();
  const dateFrom = searchParams.dateFrom ? new Date(`${searchParams.dateFrom}T00:00:00`) : null;
  const dateTo = searchParams.dateTo ? new Date(`${searchParams.dateTo}T23:59:59.999`) : null;

  if (dateFrom && dateTo && dateTo.getTime() < dateFrom.getTime()) {
    throw new MockApiError(400, "종료일은 시작일보다 빠를 수 없습니다.");
  }

  let announcements = [...getState().announcements];
  if (keyword) {
    announcements = announcements.filter((item) => {
      const haystack = `${item.title} ${item.content}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }
  if (dateFrom) {
    announcements = announcements.filter(
      (item) => new Date(item.createdAt).getTime() >= dateFrom.getTime(),
    );
  }
  if (dateTo) {
    announcements = announcements.filter(
      (item) => new Date(item.createdAt).getTime() <= dateTo.getTime(),
    );
  }

  const sort = (searchParams.sort ?? "latest") as AnnouncementSort;
  if (sort === "oldest") {
    announcements = sortByDateAsc(announcements, (item) => item.createdAt);
  } else if (sort === "title") {
    announcements = [...announcements].sort((a, b) => {
      const titleCompare = a.title.localeCompare(b.title, "ko");
      if (titleCompare !== 0) {
        return titleCompare;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else {
    announcements = sortByDateDesc(announcements, (item) => item.createdAt);
  }

  const size = Math.min(Math.max(searchParams.size ?? 10, 1), 20);
  const page = Math.max(searchParams.page ?? 0, 0);
  const totalElements = announcements.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const pageItems = announcements
    .slice(page * size, page * size + size)
    .map<AnnouncementSummary>(({ id, title, createdAt }) => ({ id, title, createdAt }));

  return {
    items: pageItems,
    page,
    size,
    totalElements,
    totalPages,
    hasPrevious: page > 0,
    hasNext: page + 1 < totalPages,
  };
}

export async function mockFetchAnnouncement(id: string | number): Promise<AnnouncementDetail> {
  const announcementId = parseId(id, "announcement id");
  const announcement = getState().announcements.find((item) => item.id === announcementId);
  if (!announcement) {
    throw new MockApiError(404, "Announcement not found");
  }
  return announcement;
}

export async function mockFetchAcademicEvents(): Promise<AcademicEvent[]> {
  return sortByDateAsc(getState().academicEvents, (item) => item.date);
}

export async function mockCreateSupportRequest(
  payload: SupportRequestForm,
): Promise<SupportRequestReceipt> {
  const state = getState();
  const supportRequest: MockSupportRequest = {
    id: state.nextIds.supportRequest++,
    category: payload.category.trim(),
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    contactEmail: payload.contactEmail.trim(),
    referenceUrl: payload.referenceUrl?.trim() || null,
    submittedAt: nowIso(),
  };

  state.supportRequests.push(supportRequest);
  saveState();

  return {
    id: supportRequest.id,
    category: supportRequest.category,
    subject: supportRequest.subject,
    contactEmail: supportRequest.contactEmail,
    referenceUrl: supportRequest.referenceUrl,
    submittedAt: supportRequest.submittedAt,
  };
}

export async function mockFetchMyCourses(): Promise<Course[]> {
  const user = getCurrentUser();
  const state = getState();

  if (user.role === "STUDENT") {
    const myCourseIds = state.enrollments
      .filter((item) => item.studentId === user.id)
      .map((item) => item.courseId);
    return state.courses.filter((course) => myCourseIds.includes(course.id));
  }

  if (user.role === "PROFESSOR") {
    return state.courses.filter((course) => course.professorId === user.id);
  }

  return state.courses;
}

export async function mockFetchCourseAssignments(
  courseId: string | number,
): Promise<AssignmentSummary[]> {
  const user = getCurrentUser();
  const parsedCourseId = parseId(courseId, "courseId");
  assertCanViewCourse(parsedCourseId, user);

  const assignments = getState().assignments
    .filter((item) => item.courseId === parsedCourseId)
    .map(({ id, title, dueAt }) => ({ id, title, dueAt }));

  return sortByDateAsc(assignments, (item) => item.dueAt);
}

export async function mockFetchAssignmentDetail(id: string | number): Promise<AssignmentDetail> {
  const user = getCurrentUser();
  const assignmentId = parseId(id, "assignment id");
  const state = getState();

  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment) {
    throw new MockApiError(404, "Assignment not found");
  }

  assertCanViewCourse(assignment.courseId, user);

  const course = getCourseOrThrow(assignment.courseId);

  let submissions = state.submissions.filter((item) => item.assignmentId === assignment.id);
  if (user.role === "STUDENT") {
    submissions = submissions.filter((item) => item.studentId === user.id);
  }

  const mapped = sortByDateDesc(submissions, (item) => item.submittedAt).map((item) =>
    toSubmissionResponse(item),
  );

  return {
    id: assignment.id,
    courseId: course.id,
    courseTitle: course.title,
    title: assignment.title,
    description: assignment.description,
    dueAt: assignment.dueAt,
    submissions: mapped,
  };
}

export async function mockSubmitAssignment(
  id: string | number,
  contentText: string,
): Promise<Submission> {
  const user = getCurrentUser();
  if (user.role !== "STUDENT") {
    throw new MockApiError(403, "Only students can submit assignments");
  }

  const assignmentId = parseId(id, "assignment id");
  const state = getState();
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment) {
    throw new MockApiError(404, "Assignment not found");
  }

  if (!isEnrolled(assignment.courseId, user.id)) {
    throw new MockApiError(403, "Not enrolled in this course");
  }

  const submittedAt = nowIso();
  const existingSubmission = state.submissions.find(
    (submission) =>
      submission.assignmentId === assignmentId && submission.studentId === user.id,
  );

  if (existingSubmission) {
    existingSubmission.contentText = contentText;
    existingSubmission.submittedAt = submittedAt;
    existingSubmission.score = null;
    existingSubmission.feedback = null;
    saveState();
    return toSubmissionResponse(existingSubmission);
  }

  const submission: MockSubmission = {
    id: state.nextIds.submission++,
    assignmentId,
    studentId: user.id,
    contentText,
    submittedAt,
    score: null,
    feedback: null,
  };

  state.submissions.push(submission);
  saveState();
  return toSubmissionResponse(submission);
}

export async function mockGradeSubmission(
  submissionId: string | number,
  score: number,
  feedback: string,
): Promise<Submission> {
  const user = getCurrentUser();
  if (user.role !== "PROFESSOR" && user.role !== "ADMIN") {
    throw new MockApiError(403, "Only professor or admin can grade");
  }

  const parsedSubmissionId = parseId(submissionId, "submission id");
  const state = getState();
  const submission = state.submissions.find((item) => item.id === parsedSubmissionId);
  if (!submission) {
    throw new MockApiError(404, "Submission not found");
  }

  const assignment = state.assignments.find((item) => item.id === submission.assignmentId);
  if (!assignment) {
    throw new MockApiError(404, "Assignment not found");
  }

  const course = getCourseOrThrow(assignment.courseId);
  if (user.role === "PROFESSOR" && course.professorId !== user.id) {
    throw new MockApiError(403, "Only course professor can grade this submission");
  }

  submission.score = score;
  submission.feedback = feedback;
  saveState();
  return toSubmissionResponse(submission);
}

export async function mockFetchAdminUsers(): Promise<AdminUser[]> {
  requireAdmin(getCurrentUser());
  return getState().users.map(asUser);
}

export async function mockFetchAdminCourses(): Promise<AdminCourse[]> {
  requireAdmin(getCurrentUser());
  return getState().courses;
}

export async function mockFetchAdminEnrollments(): Promise<AdminEnrollment[]> {
  requireAdmin(getCurrentUser());
  const state = getState();
  const rows = [...state.enrollments].sort((a, b) => b.id - a.id);

  return rows.map((enrollment) => {
    const course = state.courses.find((item) => item.id === enrollment.courseId);
    const student = state.users.find((item) => item.id === enrollment.studentId);
    if (!course || !student) {
      throw new MockApiError(404, "Enrollment dependency not found");
    }
    return {
      id: enrollment.id,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
    };
  });
}

export async function mockCreateAdminEnrollment(
  courseId: number,
  studentId: number,
): Promise<AdminEnrollment> {
  requireAdmin(getCurrentUser());
  const state = getState();

  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    throw new MockApiError(404, "Course not found");
  }

  const student = state.users.find((item) => item.id === studentId);
  if (!student) {
    throw new MockApiError(404, "Student not found");
  }

  if (student.role !== "STUDENT") {
    throw new MockApiError(400, "Selected user is not a student");
  }

  const exists = state.enrollments.some(
    (item) => item.courseId === courseId && item.studentId === studentId,
  );
  if (exists) {
    throw new MockApiError(400, "Enrollment already exists");
  }

  const enrollment: MockEnrollment = {
    id: state.nextIds.enrollment++,
    courseId,
    studentId,
  };
  state.enrollments.push(enrollment);
  saveState();

  return {
    id: enrollment.id,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
  };
}

export async function mockDeleteAdminEnrollment(enrollmentId: number) {
  requireAdmin(getCurrentUser());
  const state = getState();
  const index = state.enrollments.findIndex((item) => item.id === enrollmentId);
  if (index < 0) {
    throw new MockApiError(404, "Enrollment not found");
  }
  state.enrollments.splice(index, 1);
  saveState();
}

export async function mockFetchAdminStudentOverviews(): Promise<AdminStudentOverview[]> {
  requireAdmin(getCurrentUser());
  const state = getState();

  return state.users
    .filter((user) => user.role === "STUDENT")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => {
      const studentSubmissions = state.submissions.filter(
        (submission) => submission.studentId === student.id,
      );
      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        enrolledCourseCount: state.enrollments.filter(
          (enrollment) => enrollment.studentId === student.id,
        ).length,
        submissionCount: studentSubmissions.length,
        gradedSubmissionCount: studentSubmissions.filter(
          (submission) => submission.score !== null,
        ).length,
      };
    });
}
