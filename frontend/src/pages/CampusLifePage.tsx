export function CampusLifePage() {
  const services = [
    { title: "학생지원", detail: "상담, 진로, 심리 지원 프로그램 정보를 제공합니다." },
    { title: "장학/복지", detail: "장학금 신청 일정과 교내 복지제도를 확인할 수 있습니다." },
    { title: "시설 이용", detail: "도서관, 열람실, 체육시설 이용 안내를 확인하세요." },
  ];

  return (
    <section className="space-y-5">
      <header className="surface-card fade-up p-7 md:p-8">
        <span className="brand-chip">Campus Life</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">대학생활</h1>
        <p className="mt-2 text-sm text-slate-600">
          관제대학교의 학생지원과 캠퍼스 생활 정보를 제공합니다.
        </p>
      </header>

      <ul className="data-list stagger">
        {services.map((item) => (
          <li key={item.title} className="surface-card p-5 md:p-6">
            <h2 className="font-display text-2xl text-[#0d274d]">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
