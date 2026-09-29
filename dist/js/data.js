"use strict";
/* =====================================================
   TOWN LEVEL
===================================================== */
const TOWN_LEVELS = {
    1: {
        defenseSlots: {
            line1: { rear: 1, front: 1 },
            line2: { rear: 0, front: 0 },
        },
        maxDeploy: 1,
        questSlots: 1,
        maxQuestRank: 1,
    },
    2: {
        defenseSlots: {
            line1: { rear: 2, front: 2 },
            line2: { rear: 0, front: 0 },
        },
        maxDeploy: 2,
        questSlots: 2,
        maxQuestRank: 1,
    },
    3: {
        defenseSlots: {
            line1: { rear: 2, front: 2 },
            line2: { rear: 1, front: 1 },
        },
        maxDeploy: 4,
        questSlots: 2,
        maxQuestRank: 2,
    },
    4: {
        defenseSlots: {
            line1: { rear: 2, front: 2 },
            line2: { rear: 2, front: 2 },
        },
        maxDeploy: 5,
        questSlots: 3,
        maxQuestRank: 2,
    },
    5: {
        defenseSlots: {
            line1: { rear: 2, front: 2 },
            line2: { rear: 2, front: 2 },
        },
        maxDeploy: 6,
        questSlots: 3,
        maxQuestRank: 3,
    },
};
/* =====================================================
   JOBS
===================================================== */
const JOBS = {
    // 전투력 계산식 : 공격력 + 방어력 * 0.6 + 체력 * 0.08
    warrior: {
        name: "전사",
        hp: 140,
        attack: 20,
        defense: 20,
        colorClass: "warrior",
        positionBonus: {
            front: {
                attack: 1.0,
                defense: 1.3,
                heal: 0.90,
            },
            rear: {
                attack: 0.90,
                defense: 1.0,
                heal: 1.30,
            },
        },
    },
    archer: {
        name: "궁수",
        hp: 100,
        attack: 25,
        defense: 15,
        colorClass: "archer",
        positionBonus: {
            front: {
                attack: 1.15,
                defense: 0.90,
                heal: 1.0,
            },
            rear: {
                attack: 1.00,
                defense: 1.20,
                heal: 1.15,
            },
        },
    },
    mage: {
        name: "마법사",
        hp: 70,
        attack: 35,
        defense: 6,
        colorClass: "mage",
        positionBonus: {
            front: {
                attack: 1.6,
                defense: 0.3,
                heal: 0.9,
            },
            rear: {
                attack: 1.00,
                defense: 1.10,
                heal: 1.15,
            },
        },
    },
    priest: {
        name: "사제",
        hp: 85,
        attack: 15,
        defense: 10,
        healRate: 0.1,
        colorClass: "priest",
        positionBonus: {
            front: {
                attack: 0.90,
                defense: 0.90,
                heal: 1.0,
            },
            rear: {
                attack: 1.00,
                defense: 1.20,
                heal: 1.30,
            },
        },
    }
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
   LINES
===================================================== */
const LINES = {
    line1: {
        id: "line1",
        label: "최종 방어선",
        positions: ["rear", "front"],
    },
    line2: {
        id: "line2",
        label: "외곽 방어선",
        positions: ["rear", "front"],
    }
};
const LINE_POSITIONS = ["rear", "front"];
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
/* =====================================================
   SYNERGIES
===================================================== */
const SYNERGIES = [
    {
        id: "",
        name: "",
        requires: {
            warrior: 1,
            archer: 1,
            mage: 1,
            priest: 1,
        },
        effects: [
            {
                target: "",
                job: "",
                stat: "",
                value: 0.0,
            },
        ],
    }, // template
    {
        id: "cover_fire",
        name: "엄호",
        requires: {
            warrior: 1,
            archer: 1,
        },
        effects: [
            {
                target: "ally",
                job: "archer",
                stat: "defense",
                value: 0.25,
            },
        ],
    },
    {
        id: "magic_barrier",
        name: "마법 방벽",
        requires: {
            warrior: 1,
            mage: 1,
        },
        effects: [
            {
                target: "ally",
                job: "mage",
                stat: "attack",
                value: 0.15,
            },
            {
                target: "ally",
                job: "warrior",
                stat: "defense",
                value: 0.10,
            },
        ],
    },
    {
        id: "focused_fire",
        name: "집중 사격",
        requires: {
            archer: 2,
        },
        effects: [
            {
                target: "ally",
                job: "archer",
                stat: "attack",
                value: 0.20,
            },
        ],
    },
    {
        id: "mana_resonance",
        name: "마법 공명",
        requires: {
            mage: 2,
        },
        effects: [
            {
                target: "ally",
                job: "mage",
                stat: "attack",
                value: 0.25,
            },
        ],
    },
    {
        id: "balanced_party",
        name: "균형 파티",
        requires: {
            warrior: 1,
            archer: 1,
            mage: 1,
        },
        effects: [
            {
                target: "ally",
                stat: "attack",
                value: 0.10,
            },
            {
                target: "ally",
                stat: "defense",
                value: 0.10,
            },
        ],
    },
];
