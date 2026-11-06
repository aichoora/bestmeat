// 공통 기능: 헤더/푸터, 장바구니, 상품 카드
const won = (n) => n.toLocaleString("ko-KR") + "원";
const discount = (p) => Math.round((1 - p.sale / p.price) * 100);
const findProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));
// 상품 옵션 (중량별 가격). 옵션이 없으면 기본 중량 하나만 있는 것으로 봄
const productOptions = (p) => (p.options?.length ? p.options : [{ label: p.weight, price: p.price, sale: p.sale }]);
// 옵션 이름으로 찾기. 없어진 옵션이면 기본 옵션으로
const findOption = (p, label) => productOptions(p).find((o) => o.label === label) || productOptions(p)[0];
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
    guest.forEach((i) => this.add(i.id, i.qty, i.opt));
    try { localStorage.removeItem(this.guestKey); } catch {}
  },
  clearFor(email) {
    try { localStorage.removeItem(this.keyFor(email)); } catch {}
  },
  // 같은 상품이라도 옵션(중량)이 다르면 따로 담김
  add(id, qty = 1, opt) {
    const p = findProduct(id);
    const label = p ? findOption(p, opt).label : opt;
    const optOf = (i) => { const q = findProduct(i.id); return q ? findOption(q, i.opt).label : i.opt; };
    const items = this.get();
    const found = items.find((i) => i.id === id && optOf(i) === label);
    if (found) { found.qty += qty; found.opt = label; } else items.push({ id, opt: label, qty });
    this.save(items);
  },
  // 장바구니 화면에서는 몇 번째 줄인지로 수량 변경/삭제
  setQtyAt(index, qty) {
    this.save(this.get().map((i, n) => (n === index ? { ...i, qty: Math.max(1, qty) } : i)));
  },
  removeAt(index) { this.save(this.get().filter((_, n) => n !== index)); },
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
    Recent.mergeGuest();
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
    Wish.clearFor(me.email);
    Recent.clearFor(me.email);
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

// ---------- 리뷰 (샘플 리뷰 + 회원이 쓴 리뷰는 localStorage에 저장) ----------
// 회원은 '배송완료'된 주문의 상품에만, 주문 상품(옵션)마다 한 번씩 리뷰를 쓸 수 있습니다.
const maskName = (n) => {
  n = String(n || "").trim();
  if (n.length <= 1) return (n || "고") + "*";
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length - 2) + n.slice(-1);
};
const Reviews = {
  key: "bestmeat_reviews",
  saved() { return Auth.read(this.key, []); },
  all() { return [...(typeof SAMPLE_REVIEWS !== "undefined" ? SAMPLE_REVIEWS : []), ...this.saved()]; },
  forProduct(id) {
    return this.all().filter((r) => r.productId === Number(id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  // 평균 별점(소수 첫째 자리), 개수, 별점별 개수 [5점, 4점, 3점, 2점, 1점]
  stats(id) {
    const list = this.forProduct(id);
    const n = list.length;
    const avg = n ? Math.round((list.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10 : 0;
    return { n, avg, dist: [5, 4, 3, 2, 1].map((k) => list.filter((r) => r.rating === k).length) };
  },
  mine() {
    const me = Auth.current();
    return me ? this.saved().filter((r) => r.email === me.email) : [];
  },
  // 리뷰를 쓸 수 있는 주문 상품 목록 (productId, orderId를 주면 그것만)
  writable({ productId, orderId } = {}) {
    const done = new Set(this.mine().map((r) => `${r.orderId}|${r.productId}|${r.opt}`));
    const out = [];
    Orders.mine().filter((o) => o.status === "배송완료" && (!orderId || o.id === orderId)).forEach((o) => {
      o.items.forEach((i) => {
        const opt = i.opt ?? i.weight;
        if (productId != null && i.id !== Number(productId)) return;
        if (!done.has(`${o.id}|${i.id}|${opt}`)) out.push({ orderId: o.id, productId: i.id, name: i.name, opt });
      });
    });
    return out;
  },
  add({ orderId, productId, opt, rating, text }) {
    const me = Auth.profile();
    if (!me) return null;
    if (!this.writable({ productId, orderId }).some((w) => w.opt === opt)) return null;
    const r = {
      id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      productId: Number(productId), orderId, opt: String(opt), email: me.email, name: maskName(me.name),
      rating: Math.min(5, Math.max(1, Math.round(Number(rating) || 0))),
      text: String(text || "").replace(/[<>]/g, "").trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    this.write([...this.saved(), r]);
    return r;
  },
  remove(id) { this.write(this.saved().filter((r) => r.id !== id)); },
  write(list) { Auth.write(this.key, list); },
};

// 별 5개 (평점만큼 노란색으로 채움)
const stars = (v) => `<span class="stars" style="--v:${(Math.max(0, Math.min(5, v)) / 5) * 100}%" role="img" aria-label="별점 ${v}점"></span>`;
const reviewDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };

// 리뷰 쓰기 창. targets: Reviews.writable()에서 받은 목록 (여러 개면 고르는 칸이 나옴)
function openReviewForm(targets, onDone) {
  if (!targets.length) return;
  document.getElementById("review-layer")?.remove();
  const layer = document.createElement("div");
  layer.className = "overlay";
  layer.id = "review-layer";
  const label = (t) => `${t.name} (${t.opt}) · 주문 ${t.orderId}`;
  layer.innerHTML = `
    <form class="modal" novalidate>
      <div class="addr-head"><b>리뷰 쓰기</b><button type="button" data-close aria-label="닫기">✕</button></div>
      <div class="modal-body">
        ${targets.length > 1
          ? `<div class="field"><label for="rv-target">리뷰를 쓸 상품</label><select id="rv-target">${targets.map((t, i) => `<option value="${i}">${escapeHtml(label(t))}</option>`).join("")}</select></div>`
          : `<div class="review-target"><b>${escapeHtml(targets[0].name)}</b><small>옵션 ${escapeHtml(targets[0].opt)} · 주문번호 ${escapeHtml(targets[0].orderId)}</small></div>`}
        <div class="field" id="rv-star-field"><label>별점</label>
          <div class="star-pick" role="radiogroup" aria-label="별점">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" aria-label="${n}점" data-v="${n}">★</button>`).join("")}<span id="rv-star-text">별을 눌러 주세요</span></div>
          <p class="msg"></p></div>
        <div class="field"><label for="rv-text">리뷰 내용</label>
          <textarea id="rv-text" rows="5" maxlength="500" placeholder="고기의 신선도, 맛, 포장 상태 등을 알려주세요. (10자 이상)"></textarea>
          <p class="msg"><span id="rv-count">0</span> / 500자</p></div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-line" data-close>취소</button>
        <button class="btn btn-red">등록하기</button>
      </div>
    </form>`;
  document.body.appendChild(layer);
  const form = layer.querySelector("form");
  const text = layer.querySelector("#rv-text");
  const WORDS = ["", "별로예요", "그저 그래요", "괜찮아요", "좋아요", "최고예요"];
  let rating = 0;
  const close = () => { layer.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (ev) => ev.key === "Escape" && close();
  document.addEventListener("keydown", onKey);
  layer.addEventListener("click", (ev) => { if (ev.target === layer || ev.target.closest("[data-close]")) close(); });
  layer.querySelectorAll(".star-pick button").forEach((b) => b.addEventListener("click", () => {
    rating = Number(b.dataset.v);
    layer.querySelectorAll(".star-pick button").forEach((x) => {
      x.classList.toggle("on", Number(x.dataset.v) <= rating);
      x.setAttribute("aria-checked", Number(x.dataset.v) === rating);
    });
    layer.querySelector("#rv-star-text").textContent = `${rating}점 · ${WORDS[rating]}`;
    layer.querySelector("#rv-star-field").classList.remove("invalid");
    layer.querySelector("#rv-star-field .msg").textContent = "";
  }));
  text.addEventListener("input", () => (layer.querySelector("#rv-count").textContent = text.value.length));
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const starField = layer.querySelector("#rv-star-field");
    const textField = text.closest(".field");
    const starErr = rating ? "" : "별점을 골라 주세요.";
    const len = text.value.trim().length;
    const textErr = len < 10 ? `10자 이상 써 주세요. (지금 ${len}자)` : "";
    starField.classList.toggle("invalid", !!starErr);
    starField.querySelector(".msg").textContent = starErr;
    textField.classList.toggle("invalid", !!textErr);
    if (textErr) textField.querySelector(".msg").textContent = textErr;
    if (starErr || textErr) return;
    const t = targets[Number(layer.querySelector("#rv-target")?.value || 0)];
    const saved = Reviews.add({ ...t, rating, text: text.value });
    if (!saved) { alert("리뷰를 등록할 수 없습니다. 이미 리뷰를 쓴 상품인지 확인해 주세요."); close(); return; }
    close();
    toast("리뷰를 등록했습니다. 감사합니다!");
    onDone?.(saved);
  });
  layer.querySelector(".star-pick button").focus();
}

// ---------- 상품 (관리자가 수정하면 localStorage에 저장, 없으면 data.js 기본값) ----------
const Products = {
  key: "bestmeat_products",
  defaults: PRODUCTS.map((p) => ({ ...p })),
  // 저장된 상품 목록이 있으면 PRODUCTS 내용을 그것으로 교체 (모든 페이지가 PRODUCTS를 사용)
  apply() {
    const saved = Auth.read(this.key, null);
    if (!Array.isArray(saved)) return;
    // 사진 기능 이전에 저장된 상품은 img 항목이 없으므로 기본 사진을 채워줌
    const defaultImg = Object.fromEntries(this.defaults.map((p) => [p.id, p.img]));
    // 옵션 기능 이전에 저장된 상품은 options 항목이 없으므로 기본 옵션을 채워줌
    const defaultOpts = Object.fromEntries(this.defaults.map((p) => [p.id, p.options || []]));
    PRODUCTS.splice(0, PRODUCTS.length, ...saved.map((p) => {
      let q = "img" in p ? p : { ...p, img: defaultImg[p.id] || "" };
      if (!("options" in q)) q = { ...q, options: defaultOpts[q.id] || [] };
      return q;
    }));
  },
  // 저장 성공 여부를 돌려줌 (업로드한 사진이 많으면 브라우저 저장 공간이 부족할 수 있음)
  saveAll(list) {
    try {
      localStorage.setItem(this.key, JSON.stringify(list));
    } catch {
      return false;
    }
    PRODUCTS.splice(0, PRODUCTS.length, ...list);
    return true;
  },
  // 관리자 입력값 정리: 태그 문자 제거, 색상/배지 형식 제한
  clean(p) {
    const text = (s) => String(s ?? "").replace(/[<>]/g, "").trim();
    const int = (n) => Math.max(0, Math.round(Number(n) || 0));
    // 옵션: 이름이 있고 판매가가 정가 이하인 것만, 이름 중복 없이 최대 10개
    const seen = new Set();
    const options = (Array.isArray(p.options) ? p.options : [])
      .map((o) => ({ label: text(o.label).slice(0, 20), price: int(o.price), sale: int(o.sale) }))
      .filter((o) => o.label && o.price > 0 && o.sale > 0 && o.sale <= o.price && !seen.has(o.label) && seen.add(o.label))
      .slice(0, 10);
    // 옵션이 2개 이상이면 첫 번째 옵션이 곧 기본 중량/가격
    const base = options.length > 1 ? { weight: options[0].label, price: options[0].price, sale: options[0].sale } : {};
    return {
      ...p,
      name: text(p.name), origin: text(p.origin), grade: text(p.grade) || "-", weight: text(p.weight),
      desc: text(p.desc), emoji: text(p.emoji).slice(0, 4) || "🥩",
      // 사진: images 폴더의 파일이나 관리자가 올린 사진(data:image)만 허용
      img: /^(images\/[\w./-]+\.(jpe?g|png|webp)|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/i.test(p.img || "") ? p.img : "",
      tone: /^#[0-9a-f]{6}$/i.test(p.tone) ? p.tone : "#b23a3a",
      badge: ["BEST", "NEW", "SALE"].includes(p.badge) ? p.badge : "",
      cat: CATEGORIES.some((c) => c.id === p.cat) ? p.cat : CATEGORIES[0].id,
      price: Math.max(0, Math.round(Number(p.price) || 0)),
      sale: Math.max(0, Math.round(Number(p.sale) || 0)),
      soldOut: !!p.soldOut,
      options: options.length > 1 ? options : [],
      ...base,
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
    const ok = this.saveAll(exists ? PRODUCTS.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [...PRODUCTS, item]);
    return ok ? item : null;
  },
  remove(id) { return this.saveAll(PRODUCTS.filter((x) => x.id !== id)); },
  reset() {
    try { localStorage.removeItem(this.key); } catch {}
    PRODUCTS.splice(0, PRODUCTS.length, ...this.defaults.map((p) => ({ ...p })));
  },
};
Products.apply();

// 인기(판매) 순위: 상품 데이터의 기본 판매량(reviews 값) + 이 쇼핑몰에서 실제 주문된 수량 (취소 제외)
function salesMap() {
  const m = {};
  Orders.all().filter((o) => o.status !== "주문취소")
    .forEach((o) => o.items.forEach((i) => (m[i.id] = (m[i.id] || 0) + i.qty)));
  return m;
}
function byPopularity(list) {
  const m = salesMap();
  const score = (p) => (p.reviews || 0) + (m[p.id] || 0);
  return [...list].sort((a, b) => score(b) - score(a));
}

// 장바구니 금액 계산 (장바구니, 주문서에서 함께 사용). 품절 상품은 주문에서 제외.
function cartSummary() {
  // idx: 장바구니에서 몇 번째 줄인지, o: 고른 옵션 (중량, 정가, 판매가)
  const all = Cart.get().map((i, idx) => ({ ...i, idx, p: findProduct(i.id) })).filter((i) => i.p)
    .map((i) => ({ ...i, o: findOption(i.p, i.opt) }));
  const items = all.filter((i) => !i.p.soldOut);
  const soldOut = all.filter((i) => i.p.soldOut);
  const subtotal = items.reduce((s, i) => s + i.o.sale * i.qty, 0);
  const saved = items.reduce((s, i) => s + (i.o.price - i.o.sale) * i.qty, 0);
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

// opt를 안 주면 (상품 카드의 '담기') 기본 옵션으로 담음
function addToCart(id, qty = 1, opt) {
  const p = findProduct(id);
  if (!p) return false;
  if (p.soldOut) { toast("품절된 상품입니다."); return false; }
  const o = findOption(p, opt);
  Cart.add(id, qty, o.label);
  toast(productOptions(p).length > 1 ? `장바구니에 담았습니다 (${o.label})` : "장바구니에 담았습니다");
  return true;
}

// ---------- 찜 · 최근 본 상품 (회원별로 localStorage에 저장) ----------
// 찜은 회원만, 최근 본 상품은 비회원도 저장 (로그인하면 회원 쪽으로 합쳐짐)
const Wish = {
  base: "bestmeat_wish",
  get key() { const me = Auth.current(); return me ? `${this.base}:${me.email}` : null; },
  ids() { return this.key ? Auth.read(this.key, []) : []; },
  has(id) { return this.ids().includes(Number(id)); },
  // 찜 상태를 바꾸고, 바뀐 뒤 찜 여부를 돌려줌
  toggle(id) {
    id = Number(id);
    const list = this.ids();
    const on = !list.includes(id);
    Auth.write(this.key, on ? [id, ...list] : list.filter((x) => x !== id));
    return on;
  },
  products() { return this.ids().map(findProduct).filter(Boolean); },
  clearFor(email) { try { localStorage.removeItem(`${this.base}:${email}`); } catch {} },
};
const Recent = {
  base: "bestmeat_recent",
  max: 20,
  keyFor(email) { return email ? `${this.base}:${email}` : this.base; },
  get key() { return this.keyFor(Auth.current()?.email); },
  ids() { return Auth.read(this.key, []); },
  add(id) {
    id = Number(id);
    Auth.write(this.key, [id, ...this.ids().filter((x) => x !== id)].slice(0, this.max));
  },
  clear() { try { localStorage.removeItem(this.key); } catch {} },
  products() { return this.ids().map(findProduct).filter(Boolean); },
  mergeGuest() {
    const guest = Auth.read(this.base, []);
    if (!guest.length) return;
    Auth.write(this.key, [...new Set([...guest, ...this.ids()])].slice(0, this.max));
    try { localStorage.removeItem(this.base); } catch {}
  },
  clearFor(email) { try { localStorage.removeItem(this.keyFor(email)); } catch {} },
};

// 하트 버튼 (상품 카드, 상품 상세에서 사용)
function wishButton(p, cls = "btn-wish") {
  const on = Wish.has(p.id);
  return `<button type="button" class="${cls} ${on ? "on" : ""}" data-wish="${p.id}" aria-pressed="${on}" aria-label="찜하기" onclick="toggleWish(${p.id})">${icon("heart")}</button>`;
}
function toggleWish(id) {
  if (!Auth.current()) {
    const here = (location.pathname.split("/").pop() || "index.html") + location.search;
    if (confirm("찜하려면 로그인이 필요합니다. 로그인 하시겠어요?")) location.href = `login.html?next=${encodeURIComponent(here)}`;
    return;
  }
  const on = Wish.toggle(id);
  // 같은 상품의 하트가 화면에 여러 개 있어도 함께 바뀌게
  document.querySelectorAll(`[data-wish="${Number(id)}"]`).forEach((b) => {
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
  toast(on ? "찜한 상품에 담았습니다" : "찜을 해제했습니다");
  document.dispatchEvent(new CustomEvent("wishchange"));
}

// 넓은 화면 오른쪽에 붙는 '최근 본 상품' 바
function renderQuickBar() {
  document.querySelector(".quick-recent")?.remove();
  const list = Recent.products().slice(0, 3);
  const bar = document.createElement("aside");
  bar.className = "quick-recent";
  bar.setAttribute("aria-label", "최근 본 상품");
  bar.innerHTML = `
    <b>최근 본 상품</b>
    ${list.length ? list.map((p) => `<a href="product.html?id=${p.id}" class="q" title="${escapeHtml(p.name)}">${thumb(p)}</a>`).join("")
      : `<p class="none">아직 없어요</p>`}
    ${Recent.ids().length > 3 ? `<a href="mypage.html#recent" class="more">더보기</a>` : ""}
    <button type="button" class="top" onclick="scrollTo({ top: 0, behavior: 'smooth' })">▲ TOP</button>`;
  document.body.appendChild(bar);
}

// ---------- 상품 카드 ----------
// 사진이 있으면 사진, 없거나 불러오지 못하면 이모지를 보여줌
function thumb(p, big = false) {
  return `<div class="thumb ${big ? "big" : ""} ${p.soldOut ? "soldout" : ""} ${p.img ? "has-img" : ""}" style="--tone:${p.tone}">
    <span>${p.emoji}</span>
    ${p.img ? `<img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.parentNode.classList.remove('has-img'); this.remove()">` : ""}
    ${p.badge ? `<em class="badge badge-${p.badge.toLowerCase()}">${p.badge}</em>` : ""}
    ${p.soldOut ? `<b class="soldout-label">품절</b>` : ""}
  </div>`;
}

function productCard(p) {
  return `<article class="card">
    <div class="thumb-wrap">
      <a href="product.html?id=${p.id}">${thumb(p)}</a>
      ${wishButton(p)}
      ${p.soldOut ? "" : `<button class="btn-cart" onclick="addToCart(${p.id})" aria-label="장바구니 담기">${icon("cart")} 담기</button>`}
    </div>
    <div class="card-body">
      <p class="origin">${p.origin}${p.grade !== "-" ? " · " + p.grade : ""}</p>
      <a href="product.html?id=${p.id}" class="name">${p.name} <small>${p.weight}</small></a>
      <p class="price"><b class="rate">${discount(p)}%</b> <strong>${won(p.sale)}</strong> <del>${won(p.price)}</del>${productOptions(p).length > 1 ? `<em class="opt-chip">옵션 ${productOptions(p).length}</em>` : ""}</p>
      ${(() => { const r = Reviews.stats(p.id); return r.n ? `<p class="rating">★ ${r.avg.toFixed(1)} <span>(${r.n.toLocaleString()})</span></p>` : `<p class="rating"><span>새 상품</span></p>`; })()}
    </div>
  </article>`;
}

// ---------- 아이콘 ----------
// 글자 옆에 쓰는 선 아이콘. 글자색을 따라간다. 사용: icon("cart")
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16 16"/>',
  cart: '<path d="M2.5 4h2.4l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.5L20.5 8H6.1"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  chart: '<path d="M3.5 3.5v17h17"/><path d="M8 16v-4M12.5 16V8M17 16v-6"/>',
  box: '<path d="M20.5 7.5 12 3 3.5 7.5 12 12z"/><path d="M3.5 7.5v9L12 21l8.5-4.5v-9M12 12v9"/>',
  tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.4 3.5 5.2"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 8l-4 4 4 4M5 12h10"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M15 7v2M15 11v2M15 15v2"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.2-9.4A4.9 4.9 0 0 1 12 6.4a4.9 4.9 0 0 1 9.2 4.2C19.5 15.4 12 20 12 20z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
};
function icon(name) {
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
// HTML에 직접 쓴 <i data-icon="이름"></i> 자리를 아이콘으로 채운다
function fillIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
}
fillIcons();

// ---------- 헤더 / 푸터 ----------
// 로고: 뼈다귀 고기 아이콘 + 둥근 한글 이름
function logoHtml(sub = "BESTMEAT") {
  return `<img src="images/logo-icon.svg" alt="" class="logo-icon"><span class="logo-text"><span class="logo-name">베스트<em>미트</em></span><span class="logo-sub">${sub}</span></span>`;
}

function renderLayout() {
  const page = location.pathname.split("/").pop() || "index.html";
  const header = document.getElementById("header");
  if (header) {
    header.innerHTML = `
      <div class="topbar">오후 3시 전 주문 시 <b>오늘 출발</b> · 5만원 이상 <b>무료배송</b></div>
      <div class="header-inner">
        <a href="index.html" class="logo" aria-label="베스트미트 홈">${logoHtml()}</a>
        <form class="search" action="products.html">
          <input name="q" placeholder="오늘은 어떤 고기가 필요하세요?" value="${escapeHtml(param("q") || "")}">
          <button aria-label="검색">${icon("search")}</button>
        </form>
        <nav class="util">
          ${Auth.current()
            ? `${Auth.isAdmin() ? `<a href="admin.html" class="admin-link">${icon("sliders")} 관리자</a>` : ""}<a href="mypage.html"><b>${escapeHtml(Auth.current().name)}</b>님 · 마이페이지</a><a href="#" onclick="Auth.logout(); return false;">로그아웃</a>`
            : `<a href="login.html">로그인</a><a href="signup.html">회원가입</a>`}
          <a href="cart.html" class="cart-link">${icon("cart")} 장바구니 <i id="cart-count" hidden>0</i></a>
        </nav>
      </div>
      <nav class="gnb">
        <a href="products.html" class="${page === "products.html" && !param("cat") && !param("q") ? "on" : ""}">전체</a>
        ${CATEGORIES.map((c) => `<a href="products.html?cat=${c.id}" class="${page === "products.html" && param("cat") === c.id ? "on" : ""}">${c.name}</a>`).join("")}
        <span class="gnb-sep" aria-hidden="true"></span>
        <a href="ranking.html" class="${page === "ranking.html" ? "on" : ""}">랭킹</a>
        <a href="events.html" class="gnb-event ${page === "events.html" || page === "event.html" ? "on" : ""}">기획전</a>
      </nav>`;
  }
  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `
      <div class="footer-inner">
        <div>
          <p class="logo small dark">${logoHtml()}</p>
          <p>믿을 수 있는 고기를 산지에서 식탁까지.</p>
        </div>
        <div class="footer-info">
          <p>고객센터 1588-0000 (평일 09:00~18:00)</p>
          <p>(주)베스트미트 · 대표 홍길동 · 사업자등록번호 000-00-00000</p>
          <p class="copy">© 2026 BESTMEAT. 시안용 페이지입니다. · <a href="credits.html">사진 출처</a></p>
        </div>
      </div>`;
  }
  if (header) renderQuickBar();
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", renderLayout);
