const mapQuery = encodeURIComponent("서울시 성동구 자동차시장1길 64");
const googleSearchMapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
const googleEmbedMapUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
const naverMapUrl = `https://map.naver.com/p/search/${mapQuery}`;

export function CampusMapPage() {
  const locationInfo = [
    "주소: 서울특별시 성동구 자동차시장1길 64",
    "시설: 청년취업사관학교 성동캠퍼스",
    "대표문의: 02-6216-3804",
  ];

  const transitInfo = [
    "지하철: 5호선 장한평역에서 도보 이동",
    "버스: 장한평역·자동차시장 인근 노선 이용",
    "자가용: 내비게이션에 '자동차시장1길 64' 검색",
  ];

  return (
    <div className="space-y-6">
      <section className="surface-card fade-up overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f3767] via-[#1e4d82] to-[#2f679f] px-7 py-8 text-white md:px-9">
          <span className="rounded-full border border-white/35 px-3 py-1 text-xs font-semibold tracking-[0.1em]">
            CAMPUS MAP
          </span>
          <h1 className="mt-4 text-3xl">캠퍼스맵</h1>
          <p className="mt-2 text-sm text-white/90">
            청년취업사관학교 성동캠퍼스 위치와 이동 정보를 확인할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-card p-6 md:p-7">
          <h2 className="font-display text-2xl text-[#0d274d]">위치 정보</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {locationInfo.map((item) => (
              <li key={item} className="surface-soft px-4 py-3">
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-lg font-semibold text-[#0d274d]">교통 안내</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {transitInfo.map((item) => (
              <li key={item} className="surface-soft px-4 py-3">
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={googleSearchMapUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              Google 지도 열기
            </a>
            <a
              href={naverMapUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex px-4 py-2 text-sm font-semibold"
            >
              네이버 지도 열기
            </a>
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <iframe
            title="청년취업사관학교 성동캠퍼스 지도"
            src={googleEmbedMapUrl}
            className="h-[480px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </article>
      </section>
    </div>
  );
}
