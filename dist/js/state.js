"use strict";
/* =====================================================
   GAME STATE
===================================================== */
let state;
let selectedId = null;
let currentWaveResult = null;
// let activeTab="adventurer";
let activePeopleTab = "adventurer";
let activeWorldTab = "town";
/* =====================================================
   META / RUN
===================================================== */
function createMeta() {
    return {
        gem: CONFIG.startGem,
        permanentWaiting: 0,
        permanentGrave: 0,
        permanentInheritance: 0,
    };
}
function createRun(meta) {
    return {
        meta,
        wave: 1,
        gold: CONFIG.startGold,
        townHp: CONFIG.townHp,
        townLevel: 1,
        tempWaiting: 0,
        tempGrave: 0,
        adventurers: [],
        line1: {
            rear: [null, null],
            front: [null, null],
        },
        line2: {
            rear: [null, null],
            front: [null, null],
        },
        questBoard: [],
        activeQuests: [],
        graveyard: [],
        logs: ["작은 도시의 마지막 길드가 문을 열었습니다."],
        gameOver: false,
        inheritanceSelection: [],
    };
}
/* =====================================================
   NAME
===================================================== */
function generateUniqueName() {
    const used = new Set(state.adventurers.map((a) => a.name));
    const available = NAMES.filter((n) => !used.has(n));
    if (available.length > 0) {
        return available[randomInt(0, available.length - 1)];
    }
    return "모험가 " + (state.adventurers.length + 1);
}
/* =====================================================
   ADVENTURER CREATION
===================================================== */
function createAdventurer(level = 1) {
    const jobKeys = Object.keys(JOBS);
    const jobKey = jobKeys[randomInt(0, jobKeys.length - 1)];
    const base = JOBS[jobKey];
    /*
  같은 클래스라도
  약 ±12% 정도 개체차
  */
    const hpTalent = randomRange(0.88, 1.12);
    const attackTalent = randomRange(0.88, 1.12);
    const defenseTalent = randomRange(0.88, 1.12);
    const maxHp = Math.round((base.hp + (level - 1) * 9) * hpTalent);
    const attack = Math.round((base.attack + (level - 1) * 4) * attackTalent);
    const defense = Math.round((base.defense + (level - 1) * 2) * defenseTalent);
    return {
        id: uid(),
        name: generateUniqueName(),
        job: jobKey,
        level,
        exp: 0,
        maxHp,
        hp: maxHp,
        attack,
        defense,
        talents: {
            hp: hpTalent,
            attack: attackTalent,
            defense: defenseTalent,
        },
        status: "waiting",
        career: {
            waves: 0,
            quests: 0,
            failedQuests: 0,
            inherited: 0,
        },
        reviveRemaining: 0,
    };
}
/* =====================================================
   SAVE
===================================================== */
function save() {
    localStorage.setItem("lastGuildPrototypeV2", JSON.stringify(state));
}
function load() {
    const saved = localStorage.getItem("lastGuildPrototypeV2");
    if (saved) {
        try {
            state = migrateRunState(JSON.parse(saved));
            refreshQuestBoard();
            return;
        }
        catch (e) { }
    }
    state = createRun(createMeta());
    for (let i = 0; i < 3; i++) {
        state.adventurers.push(createAdventurer());
    }
    refreshQuestBoard();
    save();
}
function normalizeLineState(rawLine, legacyRear, legacyFront) {
    if (rawLine && !Array.isArray(rawLine) && typeof rawLine === "object") {
        const candidate = rawLine;
        return {
            rear: Array.isArray(candidate.rear) ? candidate.rear.slice(0, 2) : [null, null],
            front: Array.isArray(candidate.front) ? candidate.front.slice(0, 2) : [null, null],
        };
    }
    if (Array.isArray(legacyRear) || Array.isArray(legacyFront)) {
        return {
            rear: Array.isArray(legacyRear) ? legacyRear.slice(0, 2) : [null, null],
            front: Array.isArray(legacyFront) ? legacyFront.slice(0, 2) : [null, null],
        };
    }
    const oldSlots = Array.isArray(rawLine) ? rawLine : [];
    return {
        rear: [oldSlots[0] ?? null, null],
        front: [oldSlots[1] ?? null, oldSlots[2] ?? null],
    };
}
function migrateRunState(raw) {
    const migrated = raw;
    migrated.line1 = normalizeLineState(raw.line1, raw.line1Rear, raw.line1Front);
    migrated.line2 = normalizeLineState(raw.line2, raw.line2Rear, raw.line2Front);
    delete migrated.line1Rear;
    delete migrated.line1Front;
    delete migrated.line2Rear;
    delete migrated.line2Front;
    delete migrated.line3;
    return migrated;
}
function resetSave() {
    if (!confirm("모든 진행 데이터를 초기화할까요?"))
        return;
    localStorage.removeItem("lastGuildPrototypeV2");
    state = createRun(createMeta());
    selectedId = null;
    for (let i = 0; i < 3; i++) {
        state.adventurers.push(createAdventurer());
    }
    refreshQuestBoard();
    save();
    render();
}
