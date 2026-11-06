// 이벤트 데이터 (시안용). 기간이 지나면 자동으로 '종료'로 표시됩니다.
const EVENTS = [
  {
    id: 1, tag: "PREMIUM 한우", title: "한우 프리미엄 위크", sub: "1++ 등급 한우를 특별한 가격에",
    img: "images/banners/1.jpg", start: "2026-11-01", end: "2026-11-30",
    benefits: ["이벤트 상품 최대 14% 할인", "5만원 이상 무료배송", "보자기 선물 포장 무료"],
    products: [1, 2, 14],
  },
  {
    id: 2, tag: "이번 주 특가", title: "집에서 즐기는 한돈 구이 파티", sub: "삼겹살·목살·이베리코까지 최대 20% 할인",
    img: "images/banners/2.jpg", start: "2026-11-01", end: "2026-11-15",
    benefits: ["한돈·이베리코 구이용 최대 20% 할인", "대용량 옵션일수록 더 저렴하게", "오후 3시 전 주문 시 오늘 출발"],
    products: [5, 6, 7, 8, 15],
  },
  {
    id: 3, tag: "홈파티 · 캠핑", title: "주말 고기 준비, 한 번에", sub: "홈파티와 캠핑에 꼭 필요한 고기만 모았어요",
    img: "images/banners/3.jpg", start: "2026-11-01", end: "2026-12-31",
    benefits: ["구이용·꼬치용·간편식 한 번에", "2kg 대용량 옵션 준비", "아이스박스 냉장 포장"],
    products: [3, 4, 12, 13, 17, 18],
  },
  {
    id: 4, tag: "NEW", title: "가볍고 든든하게, 닭·오리 & 간편식", sub: "다이어트 식단부터 바쁜 날 한 끼까지",
    img: "images/products/11.jpg", start: "2026-11-05", end: "2026-12-31",
    benefits: ["닭가슴살·닭다리살 2kg 대용량", "데우기만 하면 되는 간편식", "냉장 상태로 신선하게 배송"],
    products: [9, 10, 11, 16, 17],
  },
];

// 이벤트 상태: { label: "진행중" | "오픈 예정" | "종료", dday: "D-9" | "오늘 마감" | "" }
function eventStatus(ev, now = new Date()) {
  const start = new Date(ev.start + "T00:00:00");
  const end = new Date(ev.end + "T23:59:59");
  if (now < start) return { label: "오픈 예정", cls: "soon", dday: "" };
  if (now > end) return { label: "종료", cls: "ended", dday: "" };
  const days = Math.floor((new Date(ev.end + "T00:00:00") - new Date(now.toDateString())) / 86400000);
  return { label: "진행중", cls: "live", dday: days === 0 ? "오늘 마감" : `D-${days}` };
}
const eventPeriod = (ev) => `${ev.start.replace(/-/g, ".")} ~ ${ev.end.slice(5).replace("-", ".")}`;
const findEvent = (id) => EVENTS.find((e) => e.id === Number(id));

// 이벤트 카드 (이벤트 목록, 메인에서 사용)
function eventCard(ev) {
  const s = eventStatus(ev);
  return `<a href="event.html?id=${ev.id}" class="event-card ${s.cls}">
    <div class="event-img"><img src="${ev.img}" alt="" loading="lazy">
      <span class="event-state ${s.cls}">${s.label}${s.dday ? ` · ${s.dday}` : ""}</span></div>
    <div class="event-body">
      <small>${ev.tag}</small>
      <b>${ev.title}</b>
      <p>${ev.sub}</p>
      <span class="event-period">${eventPeriod(ev)}</span>
    </div>
  </a>`;
}
