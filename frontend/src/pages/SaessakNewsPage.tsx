export function SaessakNewsPage() {
  const news = [
    {
      title: "캠퍼스 리모델링 완료",
      summary: "중앙도서관 라운지와 학습공간 리모델링이 완료되었습니다.",
    },
    {
      title: "산학협력 프로젝트 모집",
      summary: "재학생 대상 산학협력 프로젝트 참여자를 모집합니다.",
    },
    {
      title: "봄 학술제 일정 공개",
      summary: "학과별 연구 발표와 특강 일정이 공개되었습니다.",
    },
  ];

  return (
    <section className="space-y-5">
      <header className="surface-card fade-up p-7 md:p-8">
        <span className="brand-chip">Saessak News</span>
        <h1 className="mt-4 text-3xl text-[#0d274d]">새싹 소식</h1>
        <p className="mt-2 text-sm text-slate-600">
          대학 주요 행사, 공지, 프로젝트 소식을 확인할 수 있습니다.
        </p>
      </header>

      <ul className="data-list stagger">
        {news.map((item) => (
          <li key={item.title} className="surface-card p-5 md:p-6">
            <h2 className="font-display text-2xl text-[#0d274d]">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
