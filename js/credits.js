// 상품 사진 출처 (자동 생성)
const PHOTO_CREDITS = [
  {
    "id": 1,
    "name": "한우 1++ 등심",
    "title": "Raw beef steak, 2011.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Raw_beef_steak,_2011.jpg",
    "artist": "Jellaluna",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "id": 2,
    "name": "한우 1+ 안심 스테이크",
    "title": "Fresh Bio Range Land Filet Beef (164927627).jpeg",
    "page": "https://commons.wikimedia.org/wiki/File:Fresh_Bio_Range_Land_Filet_Beef_(164927627).jpeg",
    "artist": "Markus Spiske Freeforcommercialuse Net",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  {
    "id": 3,
    "name": "미국산 척아이롤",
    "title": "Raw steak.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Raw_steak.jpg",
    "artist": "ohallmann (Oliver Hallmann)",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "id": 4,
    "name": "호주산 차돌박이",
    "title": "HK SKD TKO 寶琳 Po Lam 新都城中心商場 Metro City Plaza MCP Two Central mall 日牛涮涮鍋專門店 Nichigyu Shabu Shabu & Sukiyaki Restaurant buffet hotpot lunch December 2022 Px3 Beef slices 02.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:HK_SKD_TKO_%E5%AF%B6%E7%90%B3_Po_Lam_%E6%96%B0%E9%83%BD%E5%9F%8E%E4%B8%AD%E5%BF%83%E5%95%86%E5%A0%B4_Metro_City_Plaza_MCP_Two_Central_mall_%E6%97%A5%E7%89%9B%E6%B6%AE%E6%B6%AE%E9%8D%8B%E5%B0%88%E9%96%80%E5%BA%97_Nichigyu_Shabu_Shabu_%26_Sukiyaki_Restaurant_buffet_hotpot_lunch_December_2022_Px3_Beef_slices_02.jpg",
    "artist": "AASJAJDHagb HUYING",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "id": 5,
    "name": "한돈 삼겹살 구이용",
    "title": "Korean.cuisine-Samgyeopsal-01.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Korean.cuisine-Samgyeopsal-01.jpg",
    "artist": "by hellochris",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "id": 6,
    "name": "한돈 목살 구이용",
    "title": "Moksal-gui 2.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Moksal-gui_2.jpg",
    "artist": "mino park",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "id": 7,
    "name": "스페인산 이베리코 꽃목살",
    "title": "HK food ingredient red meat frozen pork chop raw butt steak October 2021 SS2 013.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:HK_food_ingredient_red_meat_frozen_pork_chop_raw_butt_steak_October_2021_SS2_013.jpg",
    "artist": "Presixlla MOON",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "id": 8,
    "name": "한돈 앞다리 불고기용",
    "title": "Spicy Pork Bulgogi, L'Arbre de Sel, Montparnasse, Paris 001.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Spicy_Pork_Bulgogi,_L%27Arbre_de_Sel,_Montparnasse,_Paris_001.jpg",
    "artist": "Guilhem Vellut from Paris, France",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "id": 9,
    "name": "국내산 닭가슴살",
    "title": "Raw chicken slices.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Raw_chicken_slices.jpg",
    "artist": "kakyusei",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "id": 10,
    "name": "국내산 닭다리살 정육",
    "title": "Raw chicken thighs.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Raw_chicken_thighs.jpg",
    "artist": "gran",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  {
    "id": 11,
    "name": "훈제 오리 슬라이스",
    "title": "Duck breast, smoked and panfried.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Duck_breast,_smoked_and_panfried.jpg",
    "artist": "FotoosVanRobin from Netherlands",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  {
    "id": 12,
    "name": "호주산 양갈비 프렌치랙",
    "title": "Rack of lamb cutlets dinner at Black Horse Inn, West Sussex, England.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Rack_of_lamb_cutlets_dinner_at_Black_Horse_Inn,_West_Sussex,_England.jpg",
    "artist": "Acabashi",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "id": 13,
    "name": "양꼬치용 어깨살 큐브",
    "title": "Kawap.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Kawap.jpg",
    "artist": "Mizu basyo at Japanese Wikipedia",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "id": 14,
    "name": "한우 1++ 구이 선물세트",
    "title": "Beef steak (8718075995).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Beef_steak_(8718075995).jpg",
    "artist": "pelican from Tokyo, Japan",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  {
    "id": 15,
    "name": "한돈 구이 실속세트",
    "title": "SZ 深圳 Shenzhen 光明新區 Guangming N 次方公園商場 N Square Park Mall shop 聖琼韓式烤肉自助餐廳 Saint Joan Korean Barbecue Beef Buffet Restaurant pork n raw beef November 2025 R12S 07.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:SZ_%E6%B7%B1%E5%9C%B3_Shenzhen_%E5%85%89%E6%98%8E%E6%96%B0%E5%8D%80_Guangming_N_%E6%AC%A1%E6%96%B9%E5%85%AC%E5%9C%92%E5%95%86%E5%A0%B4_N_Square_Park_Mall_shop_%E8%81%96%E7%90%BC%E9%9F%93%E5%BC%8F%E7%83%A4%E8%82%89%E8%87%AA%E5%8A%A9%E9%A4%90%E5%BB%B3_Saint_Joan_Korean_Barbecue_Beef_Buffet_Restaurant_pork_n_raw_beef_November_2025_R12S_07.jpg",
    "artist": "BEien Sahwo TAoo MMP",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "id": 16,
    "name": "한우 사골곰탕",
    "title": "Seolleongtang.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Seolleongtang.jpg",
    "artist": "이동원",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "id": 17,
    "name": "양념 소불고기",
    "title": "Korean.cuisine-Bulgogi-01.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Korean.cuisine-Bulgogi-01.jpg",
    "artist": "by ayustety",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  {
    "id": 18,
    "name": "수제 함박스테이크",
    "title": "Hamburg-Steak.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Hamburg-Steak.jpg",
    "artist": "MaedaAkihiko",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  }
];
