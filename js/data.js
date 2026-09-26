/* =====================================================
   TOWN LEVEL
===================================================== */

const TOWN_LEVELS = {
  1: {
    line1: 1,
    line2: 0,

    questSlots: 1,
    maxQuestRank: 1,
  },

  2: {
    line1: 2,
    line2: 0,

    questSlots: 2,
    maxQuestRank: 1,
  },

  3: {
    line1: 3,
    line2: 1,

    questSlots: 2,
    maxQuestRank: 2,
  },

  4: {
    line1: 3,
    line2: 2,

    questSlots: 3,
    maxQuestRank: 2,
  },

  5: {
    line1: 3,
    line2: 3,

    questSlots: 3,
    maxQuestRank: 3,
  },
};

/* =====================================================
   JOBS
===================================================== */

const JOBS = {
  warrior: {
    name: "전사",

    hp: 115,
    attack: 22,
    defense: 18,

    colorClass: "warrior",
  },

  archer: {
    name: "궁수",

    hp: 85,
    attack: 28,
    defense: 10,

    colorClass: "archer",
  },

  mage: {
    name: "마법사",

    hp: 72,
    attack: 34,
    defense: 7,

    colorClass: "mage",
  },
};

/* =====================================================
   NAMES
===================================================== */

const NAMES = [
  "아렌",
  "리아",
  "테오",
  "세라",
  "로안",
  "미라",
  "엘린",
  "루카",

  "카일",
  "아델",
  "레온",
  "레이나",
  "테라",
  "시아",
  "렌",
  "엘라",

  "라온",
  "네아",
  "에단",
  "유리아",
  "카렌",
  "벨",
  "리오",
  "제나",

  "루엔",
  "셀린",
  "데온",
  "리엘",
  "에일",
  "세인",
  "노아",
  "카엘",
];

/* =====================================================
   QUEST POOL
===================================================== */

const QUEST_POOL = [
  {
    rank: 1,

    name: "길 잃은 상인 구조",

    duration: 1,
    expiry: 2,

    power: 20,
    reward: 120,
  },

  {
    rank: 1,

    name: "고블린 정찰대 추적",

    duration: 1,
    expiry: 3,

    power: 25,
    reward: 150,
  },

  {
    rank: 1,

    name: "피난민 호위",

    duration: 2,
    expiry: 2,

    power: 30,
    reward: 210,
  },

  {
    rank: 1,

    name: "버려진 창고 조사",

    duration: 1,
    expiry: 2,

    power: 22,
    reward: 140,
  },

  {
    rank: 2,

    name: "오크 보급대 습격",

    duration: 2,
    expiry: 3,

    power: 50,
    reward: 380,
  },

  {
    rank: 2,

    name: "마왕군 전초기지 정찰",

    duration: 2,
    expiry: 2,

    power: 55,
    reward: 420,
  },

  {
    rank: 2,

    name: "포위된 마을 구조",

    duration: 3,
    expiry: 2,

    power: 65,
    reward: 520,
  },

  {
    rank: 2,

    name: "마법 재료 확보",

    duration: 2,
    expiry: 3,

    power: 58,
    reward: 460,
  },

  {
    rank: 3,

    name: "마왕군 장교 암살",

    duration: 3,
    expiry: 2,

    power: 90,
    reward: 850,
  },

  {
    rank: 3,

    name: "성채 생존자 구출",

    duration: 3,
    expiry: 3,

    power: 100,
    reward: 950,
  },

  {
    rank: 3,

    name: "마왕군 보급기지 파괴",

    duration: 4,
    expiry: 2,

    power: 110,
    reward: 1150,
  },
];
