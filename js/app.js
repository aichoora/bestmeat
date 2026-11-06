// 공통 기능: 헤더/푸터, 장바구니, 상품 카드
const won = (n) => n.toLocaleString("ko-KR") + "원";
const discount = (p) => Math.round((1 - p.sale / p.price) * 100);
const findProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));
const param = (key) => new URLSearchParams(location.search).get(key);

// ---------- 장바구니 (브라우저 localStorage에 저장) ----------
// 회원마다 따로 저장합니다. 비회원은 "bestmeat_cart", 회원은 "bestmeat_cart:이메일".
const Cart = {
  guestKey: "bestmeat_cart",
  keyFor(email) { return email ? `${this.guestKey}:${email}` : this.guestKey; },
  get key() { return this.keyFor(Auth.current()?.email); },
  load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  get() { return this.load(this.key); },
  save(items) {
    try { localStorage.setItem(this.key, JSON.stringify(items)); } catch {}
    updateCartCount();
  },
  // 로그인 직후: 비회원일 때 담은 상품을 회원 장바구니로 옮김
  mergeGuest() {
    const guest = this.load(this.guestKey);
    if (!guest.length) return;
    guest.forEach((i) => this.add(i.id, i.qty));
    try { localStorage.removeItem(this.guestKey); } catch {}
  },
  clearFor(email) {
    try { localStorage.removeItem(this.keyFor(email)); } catch {}
  },
  add(id, qty = 1) {
    const items = this.get();
    const found = items.find((i) => i.id === id);
    if (found) found.qty += qty; else items.push({ id, qty });
    this.save(items);
  },
  setQty(id, qty) {
    this.save(this.get().map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  },
  remove(id) { this.save(this.get().filter((i) => i.id !== id)); },
  count() { return this.get().reduce((s, i) => s + i.qty, 0); },
};

// ---------- 회원 (시안용: 브라우저 localStorage에 저장) ----------
const ADMIN = { email: "admin@bestmeat.com", password: "admin1234", name: "관리자" };

// 실제 서비스에서는 반드시 서버에서 회원 정보와 비밀번호를 관리해야 합니다.
const Auth = {
  usersKey: "bestmeat_users",
  sessionKey: "bestmeat_session",
  read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  async hash(text) {
    if (!window.crypto?.subtle) return text;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  },
  users() { return this.read(this.usersKey, []); },
  exists(email) {
    const e = email.toLowerCase();
    return e === ADMIN.email || this.users().some((u) => u.email === e);
  },
  // 시안용 관리자 계정: 처음 로그인할 때 자동으로 만들어집니다.
  async ensureAdmin() {
    if (this.users().some((u) => u.email === ADMIN.email)) return;
    this.write(this.usersKey, [...this.users(), {
      email: ADMIN.email, password: await this.hash(ADMIN.password), name: ADMIN.name,
      phone: "010-0000-0000", role: "admin", joinedAt: new Date().toISOString(),
    }]);
  },
  isAdmin() { return this.current()?.role === "admin"; },
  async signup({ email, password, name, phone, marketing }) {
    const users = this.users();
    users.push({ email: email.toLowerCase(), password: await this.hash(password), name, phone, marketing, joinedAt: new Date().toISOString() });
    this.write(this.usersKey, users);
  },
  async login(email, password) {
    await this.ensureAdmin();
    const hashed = await this.hash(password);
    const user = this.users().find((u) => u.email === email.toLowerCase() && u.password === hashed);
    if (!user) return false;
    this.write(this.sessionKey, { email: user.email, name: user.name, role: user.role || "member" });
    Cart.mergeGuest();
    return true;
  },
  logout() {
    try { localStorage.removeItem(this.sessionKey); } catch {}
    location.href = "index.html";
  },
  current() { return this.read(this.sessionKey, null); },
  profile() {
    const s = this.current();
    return s ? this.users().find((u) => u.email === s.email) || null : null;
  },
  // 로그인한 회원 정보 수정 (이름이 바뀌면 헤더 표시용 세션도 갱신)
  updateProfile(patch) {
    const me = this.current();
    if (!me) return;
    this.write(this.usersKey, this.users().map((u) => (u.email === me.email ? { ...u, ...patch } : u)));
    if (patch.name) this.write(this.sessionKey, { ...me, name: patch.name });
  },
  async checkPassword(password) {
    const user = this.profile();
    return !!user && user.password === (await this.hash(password));
  },
  async changePassword(password) {
    this.updateProfile({ password: await this.hash(password) });
  },
  withdraw() {
    const me = this.current();
    if (!me || me.role === "admin") return;
    this.write(this.usersKey, this.users().filter((u) => u.email !== me.email));
    Cart.clearFor(me.email);
    try { localStorage.removeItem(this.sessionKey); } catch {}
  },
};

// ---------- 주문 (시안용: localStorage에 저장) ----------
const SHIPPING = { free: 50000, fee: 3500 };
const FIRST_COUPON = { rate: 0.1, max: 10000 }; // 첫 구매 10% (최대 1만원)

// 주문 상태 흐름: 입금대기 → 결제완료 → 상품준비중 → 배송중 → 배송완료 (언제든 주문취소 가능)
const ORDER_STATUS = {
  all: ["입금대기", "결제완료", "상품준비중", "배송중", "배송완료", "주문취소"],
  active: ["입금대기", "결제완료", "상품준비중", "배송중"],
  css: { 입금대기: "wait", 결제완료: "ok", 상품준비중: "prep", 배송중: "ship", 배송완료: "done", 주문취소: "cancel" },
};
const statusBadge = (s) => `<em class="status ${ORDER_STATUS.css[s] || ""}">${s}</em>`;

const Orders = {
  key: "bestmeat_orders",
  all() { return Auth.read(this.key, []); },
  mine() {
    const me = Auth.current();
    return me ? this.all().filter((o) => o.email === me.email) : [];
  },
  find(id) { return this.all().find((o) => o.id === id); },
  update(id, patch) {
    Auth.write(this.key, this.all().map((o) => (o.id === id ? { ...o, ...patch } : o)));
  },
  // 결제완료/입금대기 상태일 때만 취소 가능 (상품 준비가 시작되면 불가)
  canCancel(o) { return o.status === "결제완료" || o.status === "입금대기"; },
  isActive(o) { return ORDER_STATUS.active.includes(o.status); },
  create(order) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const id = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`;
    const saved = { ...order, id, createdAt: d.toISOString() };
    Auth.write(this.key, [...this.all(), saved]);
    return saved;
  },
};

// ---------- 상품 (관리자가 수정하면 localStorage에 저장, 없으면 data.js 기본값) ----------
const Products = {
  key: "bestmeat_products",
  defaults: PRODUCTS.map((p) => ({ ...p })),
  // 저장된 상품 목록이 있으면 PRODUCTS 내용을 그것으로 교체 (모든 페이지가 PRODUCTS를 사용)
  apply() {
    const saved = Auth.read(this.key, null);
    if (Array.isArray(saved)) PRODUCTS.splice(0, PRODUCTS.length, ...saved);
  },
  saveAll(list) {
    Auth.write(this.key, list);
    PRODUCTS.splice(0, PRODUCTS.length, ...list);
  },
  // 관리자 입력값 정리: 태그 문자 제거, 색상/배지 형식 제한
  clean(p) {
    const text = (s) => String(s ?? "").replace(/[<>]/g, "").trim();
    return {
      ...p,
      name: text(p.name), origin: text(p.origin), grade: text(p.grade) || "-", weight: text(p.weight),
      desc: text(p.desc), emoji: text(p.emoji).slice(0, 4) || "🥩",
      tone: /^#[0-9a-f]{6}$/i.test(p.tone) ? p.tone : "#b23a3a",
      badge: ["BEST", "NEW", "SALE"].includes(p.badge) ? p.badge : "",
      cat: CATEGORIES.some((c) => c.id === p.cat) ? p.cat : CATEGORIES[0].id,
      price: Math.max(0, Math.round(Number(p.price) || 0)),
      sale: Math.max(0, Math.round(Number(p.sale) || 0)),
      soldOut: !!p.soldOut,
    };
  },
  upsert(p) {
    const item = this.clean(p);
    if (!item.id) {
      item.id = Math.max(0, ...PRODUCTS.map((x) => x.id)) + 1;
      item.rating = 0;
      item.reviews = 0;
    }
    const exists = PRODUCTS.some((x) => x.id === item.id);
    this.saveAll(exists ? PRODUCTS.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [...PRODUCTS, item]);
    return item;
  },
  remove(id) { this.saveAll(PRODUCTS.filter((x) => x.id !== id)); },
  reset() {
    try { localStorage.removeItem(this.key); } catch {}
    PRODUCTS.splice(0, PRODUCTS.length, ...this.defaults.map((p) => ({ ...p })));
  },
};
Products.apply();

// 장바구니 금액 계산 (장바구니, 주문서에서 함께 사용). 품절 상품은 주문에서 제외.
function cartSummary() {
  const all = Cart.get().map((i) => ({ ...i, p: findProduct(i.id) })).filter((i) => i.p);
  const items = all.filter((i) => !i.p.soldOut);
  const soldOut = all.filter((i) => i.p.soldOut);
  const subtotal = items.reduce((s, i) => s + i.p.sale * i.qty, 0);
  const saved = items.reduce((s, i) => s + (i.p.price - i.p.sale) * i.qty, 0);
  const ship = !items.length || subtotal >= SHIPPING.free ? 0 : SHIPPING.fee;
  return { items, soldOut, subtotal, saved, ship };
}

// 휴대폰 번호 입력칸에 자동 하이픈 (010-1234-5678)
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;
function phoneInput(input) {
  input.addEventListener("input", () => {
    const d = input.value.replace(/\D/g, "").slice(0, 11);
    input.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  });
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const n = Cart.count();
  el.textContent = n;
  el.hidden = n === 0;
}

function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 1800);
}

function addToCart(id, qty = 1) {
  if (findProduct(id)?.soldOut) { toast("품절된 상품입니다."); return false; }
  Cart.add(id, qty);
  toast("장바구니에 담았습니다 🛒");
  return true;
}

// ---------- 상품 카드 ----------
function thumb(p, big = false) {
  return `<div class="thumb ${big ? "big" : ""} ${p.soldOut ? "soldout" : ""}" style="--tone:${p.tone}">
    <span>${p.emoji}</span>
    ${p.badge ? `<em class="badge badge-${p.badge.toLowerCase()}">${p.badge}</em>` : ""}
    ${p.soldOut ? `<b class="soldout-label">품절</b>` : ""}
  </div>`;
}

function productCard(p) {
  return `<article class="card">
    <div class="thumb-wrap">
      <a href="product.html?id=${p.id}">${thumb(p)}</a>
      ${p.soldOut ? "" : `<button class="btn-cart" onclick="addToCart(${p.id})" aria-label="장바구니 담기">🛒 담기</button>`}
    </div>
    <div class="card-body">
      <p class="origin">${p.origin}${p.grade !== "-" ? " · " + p.grade : ""}</p>
      <a href="product.html?id=${p.id}" class="name">${p.name} <small>${p.weight}</small></a>
      <p class="price"><b class="rate">${discount(p)}%</b> <strong>${won(p.sale)}</strong> <del>${won(p.price)}</del></p>
      ${p.reviews ? `<p class="rating">★ ${p.rating} <span>(${p.reviews.toLocaleString()})</span></p>` : `<p class="rating"><span>새 상품</span></p>`}
    </div>
  </article>`;
}

// ---------- 헤더 / 푸터 ----------
function renderLayout() {
  const header = document.getElementById("header");
  if (header) {
    header.innerHTML = `
      <div class="topbar">오후 3시 전 주문 시 <b>오늘 출발</b> · 5만원 이상 <b>무료배송</b></div>
      <div class="header-inner">
        <a href="index.html" class="logo">BEST<span>MEAT</span></a>
        <form class="search" action="products.html">
          <input name="q" placeholder="오늘은 어떤 고기가 필요하세요?" value="${escapeHtml(param("q") || "")}">
          <button aria-label="검색">🔍</button>
        </form>
        <nav class="util">
          ${Auth.current()
            ? `${Auth.isAdmin() ? `<a href="admin.html" class="admin-link">⚙️ 관리자</a>` : ""}<a href="mypage.html"><b>${escapeHtml(Auth.current().name)}</b>님 · 마이페이지</a><a href="#" onclick="Auth.logout(); return false;">로그아웃</a>`
            : `<a href="login.html">로그인</a><a href="signup.html">회원가입</a>`}
          <a href="cart.html" class="cart-link">🛒 장바구니 <i id="cart-count" hidden>0</i></a>
        </nav>
      </div>
      <nav class="gnb">
        <a href="products.html">전체</a>
        ${CATEGORIES.map((c) => `<a href="products.html?cat=${c.id}" class="${param("cat") === c.id ? "on" : ""}">${c.name}</a>`).join("")}
      </nav>`;
  }
  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `
      <div class="footer-inner">
        <div>
          <p class="logo small">BEST<span>MEAT</span></p>
          <p>믿을 수 있는 고기를 산지에서 식탁까지.</p>
        </div>
        <div class="footer-info">
          <p>고객센터 1588-0000 (평일 09:00~18:00)</p>
          <p>(주)베스트미트 · 대표 홍길동 · 사업자등록번호 000-00-00000</p>
          <p class="copy">© 2026 BESTMEAT. 시안용 페이지입니다.</p>
        </div>
      </div>`;
  }
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", renderLayout);
