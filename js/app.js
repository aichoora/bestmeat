// 공통 기능: 헤더/푸터, 장바구니, 상품 카드
const won = (n) => n.toLocaleString("ko-KR") + "원";
const discount = (p) => Math.round((1 - p.sale / p.price) * 100);
const findProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));
const param = (key) => new URLSearchParams(location.search).get(key);

// ---------- 장바구니 (브라우저 localStorage에 저장) ----------
const Cart = {
  key: "bestmeat_cart",
  get() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; }
  },
  save(items) {
    try { localStorage.setItem(this.key, JSON.stringify(items)); } catch {}
    updateCartCount();
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
  Cart.add(id, qty);
  toast("장바구니에 담았습니다 🛒");
}

// ---------- 상품 카드 ----------
function thumb(p, big = false) {
  return `<div class="thumb ${big ? "big" : ""}" style="--tone:${p.tone}">
    <span>${p.emoji}</span>
    ${p.badge ? `<em class="badge badge-${p.badge.toLowerCase()}">${p.badge}</em>` : ""}
  </div>`;
}

function productCard(p) {
  return `<article class="card">
    <div class="thumb-wrap">
      <a href="product.html?id=${p.id}">${thumb(p)}</a>
      <button class="btn-cart" onclick="addToCart(${p.id})" aria-label="장바구니 담기">🛒 담기</button>
    </div>
    <div class="card-body">
      <p class="origin">${p.origin}${p.grade !== "-" ? " · " + p.grade : ""}</p>
      <a href="product.html?id=${p.id}" class="name">${p.name} <small>${p.weight}</small></a>
      <p class="price"><b class="rate">${discount(p)}%</b> <strong>${won(p.sale)}</strong> <del>${won(p.price)}</del></p>
      <p class="rating">★ ${p.rating} <span>(${p.reviews.toLocaleString()})</span></p>
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
          <input name="q" placeholder="오늘은 어떤 고기가 필요하세요?" value="${param("q") || ""}">
          <button aria-label="검색">🔍</button>
        </form>
        <nav class="util">
          <a href="#">로그인</a>
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
