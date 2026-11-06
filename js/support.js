// 고객센터: 공지사항, 자주 묻는 질문, 1:1 문의 (시안용: localStorage에 저장)
// app.js 다음에 불러와야 합니다 (Auth, Orders 사용).

const SUPPORT = { phone: "1588-0000", hours: "평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00)", email: "help@bestmeat.com" };

// ---------- 공지사항 ----------
// 관리자가 한 번이라도 저장하면 그 목록을 쓰고, 아니면 아래 기본 공지를 보여줌
const NOTICE_DEFAULTS = [
  { id: 5, pinned: true, date: "2026-11-03", title: "연말 배송 일정 안내",
    body: "연말 주문량 증가로 12월 20일부터 31일까지는 배송이 하루 정도 늦어질 수 있습니다.\n\n· 12월 24일(목) 오후 3시 이후 주문 → 12월 28일(월) 출발\n· 12월 31일(목) 오후 3시 이후 주문 → 1월 4일(월) 출발\n\n선물용 주문은 여유 있게 미리 주문해 주세요." },
  { id: 4, pinned: true, date: "2026-10-15", title: "개인정보 처리방침 변경 안내",
    body: "2026년 11월 1일부터 개인정보 처리방침이 일부 변경됩니다.\n\n· 변경 내용: 배송 위탁 업체 추가, 보관 기간 표기 명확화\n· 변경 전 처리방침은 고객센터로 요청하시면 보내드립니다." },
  { id: 3, pinned: false, date: "2026-11-01", title: "한우 프리미엄 위크 이벤트 오픈",
    body: "11월 한 달 동안 1++ 등급 한우를 특별한 가격에 만나보세요.\n이벤트 상품은 상단 메뉴의 '이벤트'에서 확인하실 수 있습니다." },
  { id: 2, pinned: false, date: "2026-10-20", title: "냉장 포장재 변경 안내 (친환경 아이스팩)",
    body: "10월 20일 출고분부터 물로 채운 친환경 아이스팩을 사용합니다.\n다 쓴 아이스팩은 가위로 잘라 물은 하수구에, 비닐은 일반 쓰레기로 버려 주세요." },
  { id: 1, pinned: false, date: "2026-10-01", title: "베스트미트 오픈 안내",
    body: "믿을 수 있는 고기를 산지에서 식탁까지, 베스트미트가 문을 열었습니다.\n회원가입하시면 첫 구매 10% 할인 쿠폰을 드립니다." },
];
const Notices = {
  key: "bestmeat_notices",
  all() {
    const list = Auth.read(this.key, null) || NOTICE_DEFAULTS;
    // 중요 공지 먼저, 그다음 최신순
    return [...list].sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date) || b.id - a.id);
  },
  save(list) {
    try { localStorage.setItem(this.key, JSON.stringify(list)); return true; } catch { return false; }
  },
  upsert({ id, title, body, pinned }) {
    const clean = (s, n) => String(s || "").replace(/[<>]/g, "").trim().slice(0, n);
    const list = this.all();
    const item = { title: clean(title, 60), body: clean(body, 3000), pinned: !!pinned };
    if (id) return this.save(list.map((n) => (n.id === id ? { ...n, ...item } : n)));
    const today = new Date();
    const pad = (x) => String(x).padStart(2, "0");
    const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    return this.save([...list, { ...item, id: Math.max(0, ...list.map((n) => n.id)) + 1, date }]);
  },
  remove(id) { return this.save(this.all().filter((n) => n.id !== id)); },
};

// ---------- 자주 묻는 질문 ----------
const FAQS = [
  { cat: "주문·결제", q: "주문을 취소하고 싶어요.", a: "마이페이지 > 주문 내역에서 '주문 취소'를 누르시면 됩니다.\n결제완료, 입금대기 상태일 때만 취소할 수 있고, 상품 준비가 시작된 뒤에는 1:1 문의로 요청해 주세요." },
  { cat: "주문·결제", q: "어떤 결제 수단을 쓸 수 있나요?", a: "신용카드, 계좌이체, 무통장입금, 휴대폰 결제를 쓸 수 있습니다.\n무통장입금은 주문 후 다음 날 자정까지 입금하지 않으면 자동으로 취소됩니다." },
  { cat: "주문·결제", q: "첫 구매 쿠폰은 어떻게 쓰나요?", a: "회원가입 후 첫 주문서에서 '첫 구매 10% 할인' 쿠폰이 자동으로 선택됩니다. (최대 1만원 할인)" },
  { cat: "배송", q: "언제 받을 수 있나요?", a: "평일 오후 3시 전에 주문하시면 당일 출발해 다음 날 도착합니다.\n냉장 상품이라 일요일에는 도착하지 않도록 발송 일정을 조정합니다." },
  { cat: "배송", q: "배송비는 얼마인가요?", a: "5만원 이상 주문하시면 무료이고, 5만원 미만은 3,500원입니다." },
  { cat: "배송", q: "제주도·도서산간 지역도 배송되나요?", a: "제주도는 배송되지만 하루 정도 더 걸릴 수 있습니다.\n일부 도서산간 지역은 냉장 상태 유지가 어려워 배송이 제한될 수 있습니다." },
  { cat: "교환·환불", q: "받은 고기 상태가 좋지 않아요.", a: "받으신 날 사진과 함께 1:1 문의를 남겨 주세요.\n확인 후 새 상품으로 다시 보내드리거나 전액 환불해 드립니다." },
  { cat: "교환·환불", q: "단순 변심으로 반품할 수 있나요?", a: "신선식품 특성상 단순 변심에 의한 교환·반품은 어렵습니다. 양해 부탁드립니다." },
  { cat: "교환·환불", q: "환불은 언제 되나요?", a: "카드 결제는 취소 후 3~5영업일, 계좌이체·무통장입금은 1~2영업일 안에 환불됩니다." },
  { cat: "회원", q: "비밀번호를 바꾸고 싶어요.", a: "마이페이지 > 비밀번호 변경에서 바꾸실 수 있습니다." },
  { cat: "회원", q: "회원 탈퇴는 어떻게 하나요?", a: "마이페이지 > 회원 탈퇴에서 하실 수 있습니다. 진행 중인 주문이 있으면 탈퇴할 수 없습니다." },
  { cat: "상품", q: "고기는 얼마나 보관할 수 있나요?", a: "냉장 상태로 받으신 날부터 3일 안에 드시는 것이 가장 좋습니다.\n오래 두실 때는 한 번 먹을 양씩 나눠 냉동해 주세요." },
  { cat: "상품", q: "원산지와 등급은 어디서 확인하나요?", a: "상품 상세 페이지의 원산지·등급 칸에서 확인하실 수 있습니다." },
];

// ---------- 1:1 문의 ----------
const INQUIRY_TYPES = ["주문·결제", "배송", "상품", "교환·환불", "회원", "기타"];
const Inquiries = {
  key: "bestmeat_inquiries",
  all() { return Auth.read(this.key, []); },
  mine() {
    const me = Auth.current();
    return me ? this.all().filter((q) => q.email === me.email) : [];
  },
  find(id) { return this.all().find((q) => q.id === id); },
  pending() { return this.all().filter((q) => !q.answer).length; },
  add({ type, orderId, title, body }) {
    const me = Auth.profile();
    if (!me) return null;
    const clean = (s, n) => String(s || "").replace(/[<>]/g, "").trim().slice(0, n);
    const q = {
      id: "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      email: me.email, name: me.name,
      type: INQUIRY_TYPES.includes(type) ? type : "기타",
      orderId: Orders.mine().some((o) => o.id === orderId) ? orderId : "",
      title: clean(title, 60), body: clean(body, 1000),
      createdAt: new Date().toISOString(), answer: "", answeredAt: "",
    };
    Auth.write(this.key, [...this.all(), q]);
    return q;
  },
  answer(id, text) {
    const answer = String(text || "").replace(/[<>]/g, "").trim().slice(0, 2000);
    Auth.write(this.key, this.all().map((q) => (q.id === id ? { ...q, answer, answeredAt: answer ? new Date().toISOString() : "" } : q)));
  },
  // 회원은 답변 전인 내 문의만 삭제 가능, 관리자는 모두 가능
  remove(id) {
    const me = Auth.current();
    const q = this.find(id);
    if (!q || !me) return false;
    if (!Auth.isAdmin() && (q.email !== me.email || q.answer)) return false;
    Auth.write(this.key, this.all().filter((x) => x.id !== id));
    return true;
  },
};
const inquiryBadge = (q) => (q.answer ? `<em class="status ok">답변완료</em>` : `<em class="status wait">답변대기</em>`);
const fmtDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
