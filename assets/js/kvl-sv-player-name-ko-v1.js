/* Display-only Korean transliterations keyed by immutable direct Volleybox ID. Original roster fields are preserved. */
(function(root){'use strict';const names={
  "773": {
    "en": "Jonas Kvalen",
    "ko": "요나스 크발렌",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "2466": {
    "en": "Donovan Dzavoronok",
    "ko": "도노반 자보로노크",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "2790": {
    "en": "Rune Fasteland",
    "ko": "루네 파스텔란",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "2924": {
    "en": "Taylor Averill",
    "ko": "테일러 에이브릴",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "3383": {
    "en": "Hideomi Fukatsu",
    "ko": "후카쓰 히데오미",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "3570": {
    "en": "Akihiro Yamauchi",
    "ko": "야마우치 아키히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "4880": {
    "en": "Kenta Takanashi",
    "ko": "다카나시 겐타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "4881": {
    "en": "Yudai Arai",
    "ko": "아라이 유다이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "5707": {
    "en": "Haku Ri",
    "ko": "리 하쿠",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "6623": {
    "en": "Miguel Lopez",
    "ko": "미겔 로페스",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "7053": {
    "en": "Gabriel Garcia Fernandez",
    "ko": "가브리엘 가르시아 페르난데스",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "7056": {
    "en": "Shunsuke Nakamura",
    "ko": "나카무라 슌스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "7057": {
    "en": "Kenta Ichikawa",
    "ko": "이치카와 겐타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "7394": {
    "en": "Issei Otake",
    "ko": "오타케 잇세이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "8352": {
    "en": "Shuzo Yamada",
    "ko": "야마다 슈조",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "11389": {
    "en": "Chizoba Neves",
    "ko": "치조바 네베스",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "11597": {
    "en": "Anton Brehme",
    "ko": "안톤 브레메",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "14028": {
    "en": "Jordi Ramon Ferragut",
    "ko": "조르디 라몬 페라구트",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "15287": {
    "en": "Judson Nunes",
    "ko": "주드송 누니스",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "16693": {
    "en": "Jesse Elser",
    "ko": "제시 엘서",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "16703": {
    "en": "Fynnian McCarthy",
    "ko": "피니언 매카시",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "16745": {
    "en": "Kenyu Nakamoto",
    "ko": "나카모토 겐유",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "16746": {
    "en": "Jin Tsuzuki",
    "ko": "쓰즈키 진",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "16761": {
    "en": "Masaki Kaneko",
    "ko": "가네코 마사키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "21602": {
    "en": "Yuma Nagatomo",
    "ko": "나가토모 유마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "21609": {
    "en": "Ikumi Komori",
    "ko": "고모리 이쿠미",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "21614": {
    "en": "Jin Inoue",
    "ko": "이노우에 진",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "22585": {
    "en": "Edoardo Caneschi",
    "ko": "에도아르도 카네스키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "23684": {
    "en": "Ulrik Dahl",
    "ko": "울리크 달",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "24203": {
    "en": "Yoshihiko Matsumoto",
    "ko": "마쓰모토 요시히코",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "24476": {
    "en": "Mart Tammearu",
    "ko": "마르트 탐메아루",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "24495": {
    "en": "Yuki Higuchi",
    "ko": "히구치 유키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "26355": {
    "en": "Go Murayama",
    "ko": "무라야마 고",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "26358": {
    "en": "Motoki Eiro",
    "ko": "에이로 모토키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "27151": {
    "en": "Yu-Sheng Chang",
    "ko": "장위성",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "28819": {
    "en": "Pei-Chang Tsai",
    "ko": "차이페이장",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "28910": {
    "en": "Tommaso Rinaldi",
    "ko": "토마소 리날디",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "28935": {
    "en": "Filip John",
    "ko": "필리프 욘",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29055": {
    "en": "Daiki Yamada",
    "ko": "야마다 다이키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29056": {
    "en": "Yuri Yanakita",
    "ko": "야나키타 유리",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29058": {
    "en": "Tobias Takeshi Shigeto",
    "ko": "시게토 도비아스 다케시",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29060": {
    "en": "Daigo Iwamoto",
    "ko": "이와모토 다이고",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29061": {
    "en": "Riku Ito",
    "ko": "이토 리쿠",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29062": {
    "en": "Masahiro Yamazaki",
    "ko": "야마자키 마사히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29063": {
    "en": "Akira Sawada",
    "ko": "사와다 아키라",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "29066": {
    "en": "Keishiro Takaki",
    "ko": "다카키 게이시로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "31670": {
    "en": "Alex Saaremaa",
    "ko": "알렉스 사레마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "33248": {
    "en": "Chihiro Nishi",
    "ko": "니시 지히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "33852": {
    "en": "Shunsuke Watanabe",
    "ko": "와타나베 슌스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34036": {
    "en": "Daniel Chitigoi",
    "ko": "다니엘 키티고이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34349": {
    "en": "Wataru Taniguchi",
    "ko": "다니구치 와타루",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34935": {
    "en": "Yudai Minemura",
    "ko": "미네무라 유다이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34937": {
    "en": "Takahiro Tozaki",
    "ko": "도자키 다카히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34938": {
    "en": "Keisuke Sakai",
    "ko": "사카이 게이스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34940": {
    "en": "Hiroshi Sakoda",
    "ko": "사코다 히로시",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "34953": {
    "en": "Shohei Yamamoto",
    "ko": "야마모토 쇼헤이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35087": {
    "en": "Ryohei Iga",
    "ko": "이가 료헤이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35089": {
    "en": "Takahiro Shin",
    "ko": "신 다카히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35215": {
    "en": "Shingo Kasari",
    "ko": "가사리 신고",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35221": {
    "en": "Yudai Kawahigashi",
    "ko": "가와히가시 유다이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35222": {
    "en": "Kota Ikeda",
    "ko": "이케다 고타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35238": {
    "en": "Issei Maeda",
    "ko": "마에다 잇세이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35243": {
    "en": "Ryota Denda",
    "ko": "덴다 료타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35260": {
    "en": "Masaki Oya",
    "ko": "오야 마사키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35261": {
    "en": "Kenji Sato",
    "ko": "사토 겐지",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35262": {
    "en": "Kenya Fujinaka",
    "ko": "후지나카 겐야",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35266": {
    "en": "Yoshimitsu Kiire",
    "ko": "기이레 요시미쓰",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35275": {
    "en": "Yutaro Takemoto",
    "ko": "다케모토 유타로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35282": {
    "en": "Keisuke Matsuo",
    "ko": "마쓰오 게이스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "35285": {
    "en": "Kota Yamada",
    "ko": "야마다 고타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "40308": {
    "en": "Taito Mizumachi",
    "ko": "미즈마치 다이토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "40943": {
    "en": "Amin Esmaeilnezhad",
    "ko": "아민 에스마일네자드",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "40958": {
    "en": "Hiroki Ozawa",
    "ko": "오자와 히로키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "42586": {
    "en": "Keisuke Miyoshi",
    "ko": "미요시 게이스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "42588": {
    "en": "Ren Oniki",
    "ko": "오니키 렌",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "42685": {
    "en": "Kenshin Kuwada",
    "ko": "구와다 겐신",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "42686": {
    "en": "Reimondo Kamijo",
    "ko": "가미조 레이몬도",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "43327": {
    "en": "Hiroki Ito",
    "ko": "이토 히로키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "43328": {
    "en": "Daiki Abe",
    "ko": "아베 다이키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "43340": {
    "en": "Cole Watanabe",
    "ko": "와타나베 콜",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "43481": {
    "en": "Kaoru Nakaya",
    "ko": "나카야 가오루",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "43482": {
    "en": "Reon Arao",
    "ko": "아라오 레온",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "47904": {
    "en": "Aymen Bouguerra",
    "ko": "아이멘 부게라",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "49154": {
    "en": "Alain De Armas",
    "ko": "알랭 데 아르마스",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "49157": {
    "en": "Tatsuki Kashiwada",
    "ko": "가시와다 다쓰키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "49182": {
    "en": "Akito Yamazaki",
    "ko": "야마자키 아키토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "49818": {
    "en": "Shuto Kawaguchi",
    "ko": "가와구치 슈토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "49820": {
    "en": "Kosuke Yasui",
    "ko": "야스이 고스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "52045": {
    "en": "Larry Evbade-Dan",
    "ko": "래리 에브바데단",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "55000": {
    "en": "Sota Ikeda",
    "ko": "이케다 소타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "55350": {
    "en": "Ryuya Sato",
    "ko": "사토 류야",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "57762": {
    "en": "Shota Hamada",
    "ko": "하마다 쇼타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "58427": {
    "en": "Hayato Yamamoto",
    "ko": "야마모토 하야토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "58461": {
    "en": "Takahiro Namba",
    "ko": "난바 다카히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "58462": {
    "en": "Keigo Nishimoto",
    "ko": "니시모토 게이고",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "58652": {
    "en": "Kazuyuki Takahashi",
    "ko": "다카하시 가즈유키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "58654": {
    "en": "Jun Yamagishi",
    "ko": "야마기시 준",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "59204": {
    "en": "Hiroaki Maki",
    "ko": "마키 히로아키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "60058": {
    "en": "Hiroto Nishiyama",
    "ko": "니시야마 히로토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "60143": {
    "en": "Junya Sakashita",
    "ko": "사카시타 준야",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "60144": {
    "en": "Makoto Nishimura",
    "ko": "니시무라 마코토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "60381": {
    "en": "Shota Fujiwara",
    "ko": "후지와라 쇼타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "63770": {
    "en": "Sota Yoshimura",
    "ko": "요시무라 소타",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "66935": {
    "en": "Daigo Yamada",
    "ko": "야마다 다이고",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "72385": {
    "en": "Mobin Nasri",
    "ko": "모빈 나스리",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "74764": {
    "en": "Christopher Byam",
    "ko": "크리스토퍼 바이엄",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "80004": {
    "en": "Yamato Nakano",
    "ko": "나카노 야마토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "80189": {
    "en": "Rui Takahashi",
    "ko": "다카하시 루이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "81006": {
    "en": "Shodai Abe",
    "ko": "아베 쇼다이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "81018": {
    "en": "Koki Yamada",
    "ko": "야마다 고키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "81020": {
    "en": "Soshi Fujinaka",
    "ko": "후지나카 소시",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "81022": {
    "en": "Hiromasa Miwa",
    "ko": "미와 히로마사",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "81041": {
    "en": "Keitaro Nishikawa",
    "ko": "니시카와 게이타로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "82128": {
    "en": "Kazuma Sonae",
    "ko": "소나에 가즈마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "84217": {
    "en": "Shinjo Akahoshi",
    "ko": "아카호시 신조",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "84218": {
    "en": "Hyuga Shigetome",
    "ko": "시게토메 휴가",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "86708": {
    "en": "Naoya Fujiwara",
    "ko": "후지와라 나오야",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "86788": {
    "en": "Ryogo Maeda",
    "ko": "마에다 료고",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "91493": {
    "en": "Petteri Tyynismaa",
    "ko": "페테리 튀니스마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "91872": {
    "en": "Yuji Kudo",
    "ko": "구도 유지",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "91878": {
    "en": "Takamaru Ichijo",
    "ko": "이치조 다카마루",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "92139": {
    "en": "Takehiro Nakanishi",
    "ko": "나카니시 다케히로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "92206": {
    "en": "Taishu Takeda",
    "ko": "다케다 다이슈",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "93146": {
    "en": "Naoto Akima",
    "ko": "아키마 나오토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "93328": {
    "en": "Gaku Kusumoto",
    "ko": "구스모토 가쿠",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "93330": {
    "en": "Kandai Goto",
    "ko": "고토 간다이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "93331": {
    "en": "Kento Nakashima",
    "ko": "나카시마 겐토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "95950": {
    "en": "Kotaro Kai",
    "ko": "가이 고타로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "99204": {
    "en": "Mark Rura",
    "ko": "마르크 루라",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "104026": {
    "en": "Akira Kakizaki",
    "ko": "가키자키 아키라",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "104104": {
    "en": "Nikita Zolotukhin",
    "ko": "니키타 졸로투힌",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "104215": {
    "en": "Aguri Hara",
    "ko": "하라 아구리",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "105178": {
    "en": "Hiroyuki Yamane",
    "ko": "야마네 히로유키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "109395": {
    "en": "Ryo Shimokawa",
    "ko": "시모카와 료",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "109597": {
    "en": "Ryoto Honzawa",
    "ko": "혼자와 료토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "110195": {
    "en": "Ryu Nakano",
    "ko": "나카노 류",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "110311": {
    "en": "Kohei Tonozaki",
    "ko": "도노자키 고헤이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "115132": {
    "en": "Namiki Shima",
    "ko": "시마 나미키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "115135": {
    "en": "Kohei Kuboshita",
    "ko": "구보시타 고헤이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "116549": {
    "en": "Yuki Imahashi",
    "ko": "이마하시 유키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "116550": {
    "en": "Takumi Kameyama",
    "ko": "가메야마 다쿠미",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "120975": {
    "en": "Shun Shinyama",
    "ko": "신야마 슌",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "121070": {
    "en": "Aiki Mori",
    "ko": "모리 아이키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "121143": {
    "en": "Takuma Araki",
    "ko": "아라키 다쿠마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "125877": {
    "en": "Takumi Eto",
    "ko": "에토 다쿠미",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "125959": {
    "en": "Yusuke Hoshina",
    "ko": "호시나 유스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "126868": {
    "en": "Takuma Kawano",
    "ko": "가와노 다쿠마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "129087": {
    "en": "Kyosuke Higuruma",
    "ko": "히구루마 교스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "129095": {
    "en": "Takumi Mawatari",
    "ko": "마와타리 다쿠미",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "135682": {
    "en": "Taisei Deguchi",
    "ko": "데구치 다이세이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "136830": {
    "en": "Skyler Varga",
    "ko": "스카일러 바르가",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "136833": {
    "en": "Diaeris McRaven",
    "ko": "디에리스 맥레이븐",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "144908": {
    "en": "Daniel Martinez Campos",
    "ko": "다니엘 마르티네스 캄포스",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "146680": {
    "en": "Kanze Chiba",
    "ko": "지바 간제",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "156692": {
    "en": "Yukihisa Maeda",
    "ko": "마에다 유키히사",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "160987": {
    "en": "Hikaru Someno",
    "ko": "소메노 히카루",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "176454": {
    "en": "Shinnosuke Hayasaka",
    "ko": "하야사카 신노스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "178578": {
    "en": "Dai Yasuhara",
    "ko": "야스하라 다이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "184130": {
    "en": "Shotaro Sawaguchi",
    "ko": "사와구치 쇼타로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "200230": {
    "en": "Zachary Rama",
    "ko": "재커리 라마",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "207522": {
    "en": "Shusuke Sakai",
    "ko": "사카이 슈스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "209798": {
    "en": "Ken Yanagisawa",
    "ko": "야나기사와 겐",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "213804": {
    "en": "Toshinori Furui",
    "ko": "후루이 도시노리",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "223999": {
    "en": "Eiki Onodera",
    "ko": "오노데라 에이키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "232569": {
    "en": "Joseph Brian Castro",
    "ko": "조지프 브라이언 카스트로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "238076": {
    "en": "Ryunosuke Kamimura",
    "ko": "가미무라 류노스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "238084": {
    "en": "Ryuki Ohmae",
    "ko": "오마에 류키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "238085": {
    "en": "Ryusei Kurokawa",
    "ko": "구로카와 류세이",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "239589": {
    "en": "Hazuki Kishikawa",
    "ko": "기시카와 하즈키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "243140": {
    "en": "Sayato Sakai",
    "ko": "사카이 사야토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "250952": {
    "en": "Manato Nakamichi",
    "ko": "나카미치 마나토",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "251126": {
    "en": "Kaiki Takanashi",
    "ko": "다카나시 가이키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "252221": {
    "en": "Mitsuki Demizu",
    "ko": "데미즈 미쓰키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "253626": {
    "en": "Tatsuki Minamiguchi",
    "ko": "미나미구치 다쓰키",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "260930": {
    "en": "Jo Toyoda",
    "ko": "도요다 조",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "264468": {
    "en": "Kosuke Sumitomo",
    "ko": "스미토모 고스케",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "265746": {
    "en": "Ryo Nozoe",
    "ko": "노조에 료",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "277295": {
    "en": "Koshiro Nishi",
    "ko": "니시 고시로",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "278357": {
    "en": "Yusaku Takashima",
    "ko": "다카시마 유사쿠",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "279144": {
    "en": "Takumi Kunikyo",
    "ko": "구니쿄 다쿠미",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "317197": {
    "en": "Hyuga Matsushita",
    "ko": "마쓰시타 휴가",
    "status": "PROVISIONAL_TRANSLITERATION"
  },
  "335698": {
    "en": "Taishi Horiuchi",
    "ko": "호리우치 다이시",
    "status": "PROVISIONAL_TRANSLITERATION"
  }
};
if(typeof module==='object'&&module.exports)module.exports=names;else root.KVLSVPlayerNameKoV1=names;
})(typeof window==='object'?window:globalThis);
