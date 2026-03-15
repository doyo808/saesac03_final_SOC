export function InternationalExchangePage() {
  const programs = [
    {
      title: "해외 교환학생",
      detail: "협정 대학에서 한 학기 또는 1년간 수학하며 학점을 인정받는 프로그램입니다.",
    },
    {
      title: "단기 글로벌 트랙",
      detail: "방학 기간 동안 언어·전공 집중 과정을 수강하는 4~8주 단기 프로그램입니다.",
    },
    {
      title: "해외 인턴십 연계",
      detail: "산학협력 파트너 기관과 연계해 직무형 글로벌 실무 경험을 제공합니다.",
    },
  ];

  const partnerRegions = [
    "아시아: 일본, 싱가포르, 베트남",
    "유럽: 독일, 프랑스, 네덜란드",
    "북미: 미국, 캐나다",
  ];

  const supportItems = [
    "영어/현지어 어학컨설팅",
    "출국 전 학점설계 및 서류 코칭",
    "현지 생활·비자 가이드",
    "귀국 후 학점인정 및 진로 상담",
  ];

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f3767] via-[#1e4d82] to-[#2f679f] px-7 py-8 text-white md:px-9">
          <span className="rounded-full border border-white/35 px-3 py-1 text-xs font-semibold tracking-[0.1em]">
            GLOBAL OFFICE
          </span>
          <h1 className="mt-4 text-3xl">국제교류 안내</h1>
          <p className="mt-2 text-sm text-white/90">
            관제대학교 국제교류센터는 교환학생, 단기연수, 글로벌 인턴십을 통합 지원합니다.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {programs.map((item) => (
          <article key={item.title} className="surface-card p-5 md:p-6">
            <h2 className="font-display text-2xl text-[#0d274d]">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="surface-card p-6 md:p-7">
          <h2 className="font-display text-2xl text-[#0d274d]">협정 대학 권역</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {partnerRegions.map((item) => (
              <li key={item} className="surface-soft px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-card p-6 md:p-7">
          <h2 className="font-display text-2xl text-[#0d274d]">학생 지원</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {supportItems.map((item) => (
              <li key={item} className="surface-soft px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
