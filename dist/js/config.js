"use strict";
/* =====================================================
   CONFIG
===================================================== */
const CONFIG = {
    startGold: 500,
    startGem: 20,
    townHp: 100,
    baseWaiting: 4,
    baseGrave: 3,
    baseInheritance: 1,
    hireBaseCost: 100,
    reviveGold: 800,
    reviveGem: 3,
    reviveWaves: 3,
    waitingExpandGold: 500,
    graveExpandGold: 600,
    waitingHealRate: 0.2, // 대기 중 최대 HP 20% 회복
    frontlineHealRate: 0.08, // 방어 중 최대 HP 8%회복
    questMinHpRate: 0.2, // 퀘스트 파견 최소 HP 비율
    retreatChance: 0.7, // 방어전 전투불능 시 후퇴 확률
    townUpgradeCosts: [0, 350, 700, 1300, 2200, 3500],
    enemyBase: 28,
    enemyGrowth: 9,
};
