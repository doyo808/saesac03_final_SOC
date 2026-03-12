export function AcademicGuidePage() {
  const guides = [
    { title: "수강신청 안내", detail: "학기별 수강신청 일정과 정정 절차를 확인할 수 있습니다." },
    { title: "학사일정", detail: "개강, 시험, 종강 등 주요 학사 일정을 제공합니다." },
    { title: "성적 처리", detail: "성적 입력/정정 기간과 이의신청 방법을 확인하세요." },
  ];

  return (
    <section className="space-y-5">
      <header className="surface-card fade-up p-7 md:p-8">
        <span className="brand-chip">Academic Guide</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">학사 안내</h1>
        <p className="mt-2 text-sm text-slate-600">
          학사 운영에 필요한 핵심 정보를 한 곳에서 확인할 수 있습니다.
        </p>
      </header>

      <ul className="data-list stagger">
        {guides.map((item) => (
          <li key={item.title} className="surface-card p-5 md:p-6">
            <h2 className="font-display text-2xl text-[#0d274d]">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
