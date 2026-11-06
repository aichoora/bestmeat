// 상품 데이터 (시안용 샘플). 나중에 서버/DB로 교체합니다.
const CATEGORIES = [
  { id: "beef", name: "소고기", icon: "🐂" },
  { id: "pork", name: "돼지고기", icon: "🐖" },
  { id: "chicken", name: "닭·오리", icon: "🐓" },
  { id: "lamb", name: "양고기", icon: "🐑" },
  { id: "gift", name: "선물세트", icon: "🎁" },
  { id: "ready", name: "간편식", icon: "🍱" },
];

const PRODUCTS = [
  { id: 1, img: "images/products/1.jpg", cat: "beef", name: "한우 1++ 등심", origin: "국내산 (한우)", grade: "1++", weight: "300g", price: 69000, sale: 59000, emoji: "🥩", tone: "#b23a3a", badge: "BEST", rating: 4.9, reviews: 1284, desc: "마블링이 고르게 퍼진 1++ 등급 한우 등심입니다. 두께 2.5cm로 손질해 구이용으로 가장 좋습니다." },
  { id: 2, img: "images/products/2.jpg", cat: "beef", name: "한우 1+ 안심 스테이크", origin: "국내산 (한우)", grade: "1+", weight: "250g", price: 58000, sale: 49900, emoji: "🥩", tone: "#9e2f2f", badge: "", rating: 4.8, reviews: 642, desc: "부드러운 식감의 안심을 스테이크용 두께로 손질했습니다." },
  { id: 3, img: "images/products/3.jpg", cat: "beef", name: "미국산 척아이롤", origin: "미국산", grade: "초이스", weight: "500g", price: 22000, sale: 17900, emoji: "🥩", tone: "#a8433b", badge: "SALE", rating: 4.6, reviews: 2210, desc: "가성비 좋은 구이용 척아이롤. 캠핑, 홈파티에 잘 어울립니다." },
  { id: 4, img: "images/products/4.jpg", cat: "beef", name: "호주산 차돌박이", origin: "호주산", grade: "-", weight: "500g", price: 19000, sale: 15900, emoji: "🥓", tone: "#c0544a", badge: "", rating: 4.7, reviews: 1873, desc: "얇게 썰어 바로 구워 먹는 차돌박이. 된장찌개에도 좋습니다." },
  { id: 5, img: "images/products/5.jpg", cat: "pork", name: "한돈 삼겹살 구이용", origin: "국내산 (한돈)", grade: "1등급", weight: "600g", price: 24000, sale: 19800, emoji: "🥓", tone: "#d06a5a", badge: "BEST", rating: 4.9, reviews: 3421, desc: "두께 1.5cm로 썬 한돈 삼겹살. 비계와 살코기 비율이 좋습니다." },
  { id: 6, img: "images/products/6.jpg", cat: "pork", name: "한돈 목살 구이용", origin: "국내산 (한돈)", grade: "1등급", weight: "600g", price: 23000, sale: 18900, emoji: "🍖", tone: "#c75f50", badge: "", rating: 4.8, reviews: 2018, desc: "담백하고 쫄깃한 목살. 구이와 수육 모두 좋습니다." },
  { id: 7, img: "images/products/7.jpg", cat: "pork", name: "스페인산 이베리코 꽃목살", origin: "스페인산", grade: "베요타", weight: "500g", price: 29000, sale: 24900, emoji: "🍖", tone: "#b8574a", badge: "NEW", rating: 4.7, reviews: 534, desc: "도토리를 먹고 자란 이베리코 돼지의 꽃목살입니다." },
  { id: 8, img: "images/products/8.jpg", cat: "pork", name: "한돈 앞다리 불고기용", origin: "국내산 (한돈)", grade: "1등급", weight: "1kg", price: 16000, sale: 12900, emoji: "🥓", tone: "#d4796a", badge: "SALE", rating: 4.6, reviews: 987, desc: "얇게 썬 앞다리살. 제육볶음, 불고기에 알맞습니다." },
  { id: 9, img: "images/products/9.jpg", cat: "chicken", name: "국내산 닭가슴살", origin: "국내산", grade: "-", weight: "1kg", price: 13000, sale: 10900, emoji: "🍗", tone: "#d99a5b", badge: "", rating: 4.5, reviews: 1532, desc: "냉장 상태로 보내드리는 신선한 닭가슴살입니다." },
  { id: 10, img: "images/products/10.jpg", cat: "chicken", name: "국내산 닭다리살 정육", origin: "국내산", grade: "-", weight: "1kg", price: 14500, sale: 11900, emoji: "🍗", tone: "#cf8c4d", badge: "", rating: 4.7, reviews: 876, desc: "뼈를 발라낸 닭다리살. 닭갈비, 구이에 좋습니다." },
  { id: 11, img: "images/products/11.jpg", cat: "chicken", name: "훈제 오리 슬라이스", origin: "국내산", grade: "-", weight: "400g", price: 12000, sale: 9900, emoji: "🦆", tone: "#a8673f", badge: "", rating: 4.6, reviews: 412, desc: "데우기만 하면 되는 훈제 오리 슬라이스입니다." },
  { id: 12, img: "images/products/12.jpg", cat: "lamb", name: "호주산 양갈비 프렌치랙", origin: "호주산", grade: "-", weight: "500g", price: 38000, sale: 32900, emoji: "🍖", tone: "#8f3e3a", badge: "NEW", rating: 4.8, reviews: 301, desc: "뼈 끝을 깔끔하게 손질한 프렌치랙. 잡내가 적습니다." },
  { id: 13, img: "images/products/13.jpg", cat: "lamb", name: "양꼬치용 어깨살 큐브", origin: "호주산", grade: "-", weight: "500g", price: 18000, sale: 15500, emoji: "🍢", tone: "#9a4a40", badge: "", rating: 4.5, reviews: 220, desc: "꼬치에 바로 꽂을 수 있게 큐브로 썬 양 어깨살입니다." },
  { id: 14, img: "images/products/14.jpg", cat: "gift", name: "한우 1++ 구이 선물세트", origin: "국내산 (한우)", grade: "1++", weight: "1.2kg", price: 229000, sale: 199000, emoji: "🎁", tone: "#7a2323", badge: "BEST", rating: 4.9, reviews: 455, desc: "등심, 채끝, 안심을 한 상자에 담은 프리미엄 선물세트입니다. 보자기 포장을 해드립니다." },
  { id: 15, img: "images/products/15.jpg", cat: "gift", name: "한돈 구이 실속세트", origin: "국내산 (한돈)", grade: "1등급", weight: "1.8kg", price: 69000, sale: 59000, emoji: "🎁", tone: "#8a3b30", badge: "", rating: 4.7, reviews: 318, desc: "삼겹살, 목살, 항정살로 구성한 실속 선물세트입니다." },
  { id: 16, img: "images/products/16.jpg", cat: "ready", name: "한우 사골곰탕", origin: "국내산 (한우)", grade: "-", weight: "500g x 3팩", price: 15000, sale: 12900, emoji: "🍲", tone: "#b07a4a", badge: "", rating: 4.8, reviews: 1120, desc: "한우 사골을 오래 고아낸 곰탕입니다. 데워서 바로 드세요." },
  { id: 17, img: "images/products/17.jpg", cat: "ready", name: "양념 소불고기", origin: "호주산", grade: "-", weight: "800g", price: 17000, sale: 13900, emoji: "🍛", tone: "#9c4a35", badge: "SALE", rating: 4.6, reviews: 765, desc: "달콤 짭짤한 양념에 재운 소불고기. 굽기만 하면 됩니다." },
  { id: 18, img: "images/products/18.jpg", cat: "ready", name: "수제 함박스테이크", origin: "국내산", grade: "-", weight: "150g x 4개", price: 16000, sale: 13500, emoji: "🍔", tone: "#a65a3e", badge: "NEW", rating: 4.5, reviews: 198, desc: "소고기와 돼지고기를 섞어 만든 수제 함박스테이크입니다." },
];
