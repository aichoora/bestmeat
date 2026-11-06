// 이벤트 (시안용). 기간이 지나면 자동으로 '종료'로 표시됩니다.
// 관리자가 한 번이라도 저장하면 localStorage("bestmeat_events")의 목록을 쓰고, 아니면 아래 기본 이벤트를 씁니다.
const EVENT_DEFAULTS = [
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

const Events = {
  key: "bestmeat_events",
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.key));
      if (Array.isArray(saved)) return saved;
    } catch {}
    return EVENT_DEFAULTS.map((e) => ({ ...e }));
  },
  // 저장 성공 여부를 돌려줌 (배너 사진이 많으면 저장 공간이 부족할 수 있음)
  save(list) {
    try { localStorage.setItem(this.key, JSON.stringify(list)); } catch { return false; }
    EVENTS.splice(0, EVENTS.length, ...list);
    return true;
  },
  // 관리자 입력 정리
  clean(ev) {
    const text = (v, n) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);
    const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
    return {
      id: ev.id,
      title: text(ev.title, 40), sub: text(ev.sub, 60), tag: text(ev.tag, 16) || "이벤트",
      start: date(ev.start), end: date(ev.end),
      img: /^(images\/[\w./-]+\.(jpe?g|png|webp)|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/i.test(ev.img || "") ? ev.img : "",
      benefits: (Array.isArray(ev.benefits) ? ev.benefits : []).map((b) => text(b, 40)).filter(Boolean).slice(0, 5),
      products: [...new Set((ev.products || []).map(Number).filter(Boolean))],
      visible: ev.visible !== false,
    };
  },
  upsert(ev) {
    const item = this.clean(ev);
    const list = EVENTS.map((e) => ({ ...e }));
    if (!item.id) item.id = Math.max(0, ...list.map((e) => e.id)) + 1;
    const i = list.findIndex((e) => e.id === item.id);
    if (i >= 0) list[i] = item; else list.push(item);
    return this.save(list) ? item : null;
  },
  remove(id) { return this.save(EVENTS.filter((e) => e.id !== id)); },
  reset() {
    try { localStorage.removeItem(this.key); } catch {}
    EVENTS.splice(0, EVENTS.length, ...EVENT_DEFAULTS.map((e) => ({ ...e })));
  },
};
// 모든 이벤트 (관리자용, 숨긴 것 포함)
const EVENTS = Events.load();
// 고객 화면에 보이는 이벤트 (관리자가 숨긴 것 제외)
const publicEvents = () => EVENTS.filter((e) => e.visible !== false);

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
const findEvent = (id) => publicEvents().find((e) => e.id === Number(id));

// 배너 사진이 없으면 첫 번째 상품 사진을 씀
const eventImg = (ev) => ev.img || (typeof findProduct === "function" && ev.products.map(findProduct).find((p) => p && p.img)?.img) || "images/banners/1.jpg";

// 이벤트 카드 (이벤트 목록, 메인에서 사용)
function eventCard(ev) {
  const s = eventStatus(ev);
  return `<a href="event.html?id=${ev.id}" class="event-card ${s.cls}">
    <div class="event-img"><img src="${eventImg(ev)}" alt="" loading="lazy">
      <span class="event-state ${s.cls}">${s.label}${s.dday ? ` · ${s.dday}` : ""}</span></div>
    <div class="event-body">
      <small>${ev.tag}</small>
      <b>${ev.title}</b>
      <p>${ev.sub}</p>
      <span class="event-period">${eventPeriod(ev)}</span>
    </div>
  </a>`;
}
