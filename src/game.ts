/* =====================================================
   UTILS
===================================================== */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

function getAdv(id: AdventurerId | null): Adventurer | undefined {
  return state.adventurers.find((a) => a.id === id);
}

function log(text) {
  state.logs.push(`W${state.wave} · ${text}`);

  if (state.logs.length > 100) state.logs.shift();
}

function getLineState(lineId: LineId): LineState {
  return state[lineId];
}

function getLineAdvIds(lineId: LineId): AdventurerId[] {
  const line = getLineState(lineId);
  return [...line.rear, ...line.front].filter((id): id is AdventurerId => id !== null);
}

function getAdvPos(advId: AdventurerId): LinePlacement | null {
  for (const lineData of Object.values(LINES)) {
    const line = getLineState(lineData.id);

    if (line.front.includes(advId)) {
      return {
        lineId: lineData.id,
        position: "front",
      };
    }

    if (line.rear.includes(advId)) {
      return {
        lineId: lineData.id,
        position: "rear",
      };
    }
  }

  return null;
}

function getPositionBonus(adv: Adventurer, stat: PositionStat): number {
  const placement = getAdvPos(adv.id);

  /* 
   * 전선에 없는 모헙가는
   * 포지션 보너스 없음
   */

  if (!placement) return 1;

  const job = JOBS[adv.job];

  return (
    job.positionBonus?.[placement.position]?.[stat] ?? 1
  );
}



/* =====================================================
   CAPACITY
===================================================== */

function waitingCapacity() {
  return CONFIG.baseWaiting + state.meta.permanentWaiting + state.tempWaiting;
}

function graveCapacity() {
  return CONFIG.baseGrave + state.meta.permanentGrave + state.tempGrave;
}

function inheritanceCapacity() {
  return CONFIG.baseInheritance + state.meta.permanentInheritance;
}

function townData() {
  return TOWN_LEVELS[state.townLevel];
}

/* =====================================================
   EXP
===================================================== */

function requiredExp(level) {
  /*
초반 빠른 성장
*/

  return 25 + level * 20 + level * level * 4;
}

function gainExp(adv, amount) {
  const beforeLevel = adv.level;

  adv.exp += amount;

  while (adv.exp >= requiredExp(adv.level)) {
    adv.exp -= requiredExp(adv.level);

    adv.level++;

    const base = JOBS[adv.job];

    adv.maxHp = Math.round((base.hp + (adv.level - 1) * 9) * adv.talents.hp);

    adv.hp = adv.maxHp;

    adv.attack = Math.round(
      (base.attack + (adv.level - 1) * 4) * adv.talents.attack,
    );

    adv.defense = Math.round(
      (base.defense + (adv.level - 1) * 2) * adv.talents.defense,
    );

    log(`${adv.name}이 Lv.${adv.level}이 되었습니다.`);
  }

  const result = waveAdvResult(adv);

  if (result) {

    result.expGain += amount;

    if (adv.level > beforeLevel) {
      result.levelUp = true;

      result.events.push({
        type: "levelUp",
        from: beforeLevel,
        to: adv.level,
      })
    }
  }
}

/* =====================================================
   HIRE
===================================================== */

function waitingAdventurers() {
  return state.adventurers.filter((a) => a.status === "waiting");
}

function hireCost() {
  return CONFIG.hireBaseCost + state.adventurers.length * 15;
}

function hire() {
  if (state.gameOver) return;

  console.log("Hiring adventurer...");

  if (waitingAdventurers().length >= waitingCapacity()) {
    alert("모험가 대기소가 가득 찼습니다.");

    return;
  }

  const cost = hireCost();

  if (state.gold < cost) {
    alert("골드가 부족합니다.");

    return;
  }

  state.gold -= cost;

  const adv = createAdventurer();

  state.adventurers.push(adv);

  log(`${adv.name}(${JOBS[adv.job].name})이 길드에 가입했습니다.`);

  save();
  render();
}

/* =====================================================
   DEFENSE SLOTS
===================================================== */

function activeSlots(line) {
  const town = townData();

  switch (line) {
    case "line1Front":
      // console.log(line, line === "line1Front");
      return town.line1Front;
    case "line1Rear":
      // console.log(line, line === "line1Rear");
      return town.line1Rear;
    case "line2Front":
      // console.log(line, line === "line2Front");
      return town.line2Front;
    case "line2Rear":
      // console.log(line, line === "line2Rear");
      return town.line2Rear;
  }

  return line === "line1" ? town.line1 : town.line2;
}

function parsePositionSlotKey(slotKey: string): LinePlacement | null {
  const match = /^(line[12])(Rear|Front)$/.exec(slotKey);
  if (!match) return null;

  return {
    lineId: match[1] as LineId,
    position: match[2].toLowerCase() as Position,
  };
}

function assignSlot(line, index) {
  // if (index >= activeSlots(line)) return;
  if (!activeSlots(line)) return;

  const placement = parsePositionSlotKey(line);
  if (!placement) return;
  const slots = getLineState(placement.lineId)[placement.position];

  if (slots[index]) {
    const adv = getAdv(slots[index]);

    if (adv) {
      adv.status = "waiting";
    }

    slots[index] = null;

    log(`${adv?.name ?? "모험가"}을 방어선에서 철수시켰습니다.`);

    save();
    render();

    return;
  }

  if (!selectedId) return;

  const adv = getAdv(selectedId);

  if (!adv || adv.status !== "waiting") return;

  adv.status = "defense";

  slots[index] = adv.id;

  log(`${adv.name}을 방어선에 배치했습니다.`);

  selectedId = null;

  save();
  render();
}

/* =====================================================
   SYNERGY
===================================================== */

function lineSynergy(slots: readonly Slot[]): SynergyResult {
  const adventurers = slots
    .map(getAdv)
    .filter((adv): adv is Adventurer => adv !== undefined);

  const jobs = adventurers.map((a) => a.job);

  const result: SynergyResult = {
    allAttack: 1,
    allDefense: 1,

    warriorAttack: 1,
    warriorDefense: 1,

    archerAttack: 1,
    archerDefense: 1,

    mageAttack: 1,
    mageDefense: 1,

    effects: [],
  };

  const warriors = jobs.filter((j) => j === "warrior").length;

  const archers = jobs.filter((j) => j === "archer").length;

  const mages = jobs.filter((j) => j === "mage").length;

  /*
    전사 + 궁수
    궁수가 보호받음
    */
  if (warriors >= 1 && archers >= 1) {
    result.archerDefense *= 1.25;

    result.effects.push("엄호: 궁수 방어 +25%");
  }

  /*
    전사 + 마법사
    */
  if (warriors >= 1 && mages >= 1) {
    result.mageAttack *= 1.15;

    result.warriorDefense *= 1.1;

    result.effects.push("마법 방벽: 마법사 공격 +15%, 전사 방어 +10%");
  }

  /*
    궁수 2명 이상
    */
  if (archers >= 2) {
    result.archerAttack *= 1.2;

    result.effects.push("집중 사격: 궁수 공격 +20%");
  }

  /*
    마법사 2명 이상
    */
  if (mages >= 2) {
    result.mageAttack *= 1.25;

    result.effects.push("마력 공명: 마법사 공격 +25%");
  }

  /*
    전사 + 궁수 + 마법사
    */
  if (warriors >= 1 && archers >= 1 && mages >= 1) {
    result.allAttack *= 1.1;
    result.allDefense *= 1.1;

    result.effects.push("균형 파티: 전체 공격/방어 +10%");
  }

  return result;
}

function effectiveAttack(adv, synergy) {
  let multiplier = synergy.allAttack;

  if (adv.job === "warrior") {
    multiplier *= synergy.warriorAttack;
  } else if (adv.job === "archer") {
    multiplier *= synergy.archerAttack;
  } else if (adv.job === "mage") {
    multiplier *= synergy.mageAttack;
  }

  multiplier *= getPositionBonus(adv, "attack");

  return adv.attack * multiplier;
}

function effectiveDefense(adv, synergy) {
  let multiplier = synergy.allDefense;

  if (adv.job === "warrior") {
    multiplier *= synergy.warriorDefense;
  } else if (adv.job === "archer") {
    multiplier *= synergy.archerDefense;
  } else if (adv.job === "mage") {
    multiplier *= synergy.mageDefense;
  }

  multiplier *= getPositionBonus(adv, "defense");

  return adv.defense * multiplier;
}

/* =====================================================
   POWER
===================================================== */

function advCombatPower(adv: Adventurer, synergy?: SynergyResult): number {
  const placement = getAdvPos(adv.id);
  const effectiveSynergy = synergy ?? (placement
    ? lineSynergy(getLineAdvIds(placement.lineId))
    : lineSynergy([]));
  const attack = effectiveAttack(adv, effectiveSynergy);
  const defense = effectiveDefense(adv, effectiveSynergy);

  return attack + defense * 0.6 + adv.hp * 0.08;
}

function linePower(slots) {
  const adventurers = slots.map(getAdv).filter(Boolean);

  const synergy = lineSynergy(slots);

  let power = 0;

  for (const adv of adventurers) {
    const attack = effectiveAttack(adv, synergy);

    const defense = effectiveDefense(adv, synergy);

    power += attack + defense * 0.6 + adv.hp * 0.08;
  }

  return Math.round(power);
}

function totalDefensePower() {
  return linePower(getLineAdvIds("line1")) + linePower(getLineAdvIds("line2"));
}

function enemyPower() {
  return Math.round(
    CONFIG.enemyBase +
    (state.wave - 1) * CONFIG.enemyGrowth +
    Math.pow(state.wave, 1.25),
  );
}

function battlePrediction() {
  const ratio = totalDefensePower() / Math.max(1, enemyPower());

  if (ratio >= 1.3) {
    return {
      text: "안정적",
      className: "safe",
    };
  }

  if (ratio >= 0.85) {
    return {
      text: "접전",
      className: "normal",
    };
  }

  return {
    text: "위험",
    className: "danger-text",
  };
}

/* =====================================================
   QUEST BOARD
===================================================== */

function availableQuestPool() {
  return QUEST_POOL.filter((q) => q.rank <= townData().maxQuestRank);
}

function createQuest() {
  const pool = availableQuestPool();

  const template = pool[randomInt(0, pool.length - 1)];

  const variance = randomRange(0.9, 1.15);

  return {
    id: uid(),

    rank: template.rank,

    name: template.name,

    duration: template.duration,

    expiry: template.expiry,

    remainingExpiry: template.expiry,

    power: Math.round(template.power * variance),

    reward: Math.round(template.reward * variance),
  };
}

function refreshQuestBoard() {
  const max = townData().questSlots;

  while (state.questBoard.length < max) {
    state.questBoard.push(createQuest());
  }

  while (state.questBoard.length > max) {
    state.questBoard.pop();
  }
}

function addWaveQuests() {
  const town = townData();

  const freeSlots = town.questSlots - state.questBoard.length;

  const spawnCount = Math.min(1, freeSlots);

  for (let i = 0; i < spawnCount; i++) {
    state.questBoard.push(createQuest());
  }
}

/* =====================================================
   QUEST SUCCESS
===================================================== */

function questChance(adv, quest) {
  const power = advCombatPower(adv);

  const ratio = power / quest.power;

  return Math.max(0.2, Math.min(0.95, 0.35 + ratio * 0.45));
}

function riskText(adv, quest) {
  const chance = questChance(adv, quest);

  if (chance >= 0.8) return "안전";

  if (chance >= 0.55) return "보통";

  return "위험";
}

/* =====================================================
   QUEST START
===================================================== */

function sendQuest(questId) {
  if (!selectedId) {
    alert("모험가를 먼저 선택하세요.");

    return;
  }

  const adv = getAdv(selectedId);

  if (!adv || adv.status !== "waiting") return;

  const hpRate = adv.hp / adv.maxHp;

  if (hpRate <= CONFIG.questMinHpRate) {
    alert(`${adv.name}의 체력이 낮아 퀘스트에 파견할 수 없습니다.`);

    return;
  }

  const quest = state.questBoard.find((q) => q.id === questId);

  if (!quest) return;

  adv.status = "quest";

  state.activeQuests.push({
    quest,

    adventurerId: adv.id,

    remaining: quest.duration,
  });

  state.questBoard = state.questBoard.filter((q) => q.id !== questId);

  log(`${adv.name}이 '${quest.name}' 퀘스트를 시작했습니다.`);

  selectedId = null;

  // refreshQuestBoard();

  save();
  render();
}

/* =====================================================
   QUEST PROGRESS
===================================================== */

function progressQuestExpiry() {
  for (const quest of state.questBoard) {
    quest.remainingExpiry--;
  }

  const expired = state.questBoard.filter((q) => q.remainingExpiry <= 0);

  for (const q of expired) {
    log(`'${q.name}' 의뢰가 만료되었습니다.`);
  }

  state.questBoard = state.questBoard.filter((q) => q.remainingExpiry > 0);

  // refreshQuestBoard();
}

function progressActiveQuests() {
  for (const active of [...state.activeQuests]) {
    active.remaining--;

    if (active.remaining > 0) continue;

    const adv = getAdv(active.adventurerId);

    if (!adv) continue;

    const quest = active.quest;

    const chance = questChance(adv, quest);

    if (Math.random() < chance) {
      state.gold += quest.reward;

      gainExp(adv, 25 + quest.rank * 25);

      adv.career.quests++;

      log(`${adv.name}이 '${quest.name}'에 성공했습니다. +${quest.reward}G`);
    } else {
      const damage = Math.round(adv.maxHp * randomRange(0.25, 0.65));

      adv.hp -= damage;

      adv.career.failedQuests++;

      if (adv.hp <= 0) {
        // // killAdventurer(
        // //     adv
        // // );
        // handleKnockout(adv);
        adv.hp = 1;

        log(`${adv.name}이 빈사 상태로 귀환했습니다.`);
      } else {
        log(
          `${adv.name}이 '${quest.name}'에 실패하여 ${damage} 피해를 입었습니다.`,
        );
      }
    }

    if (adv.status !== "dead") {
      adv.status = "waiting";
    }

    state.activeQuests = state.activeQuests.filter((x) => x !== active);
  }
}

/* =====================================================
   BATTLE
===================================================== */

function calculateDamage(enemy, defenders, slotIds) {
  if (defenders.length === 0) return enemy;

  const synergy = lineSynergy(slotIds);

  const defense = defenders.reduce((total, adv) => {
    return total + effectiveDefense(adv, synergy);
  }, 0);

  return Math.max(1, enemy - defense);
}

function resolveLine(slotIds, incoming, label) {
  const defenders = slotIds.map(getAdv).filter(Boolean);

  if (defenders.length === 0) return incoming;

  const synergy = lineSynergy(slotIds);

  const defensePower = linePower(slotIds);

  let damagePower = linePower(slotIds);

  const stopped = Math.min(incoming, defensePower);

  const remaining = Math.max(0, incoming - defensePower);

  const retaliation = calculateDamage(incoming, defenders, slotIds);

  /*
    이 시점의 defenders 배열을 사용한다.
    전투 도중 슬롯에서 제거되더라도
    현재 전투 처리는 정상적으로 완료된다.
    */

  for (const adv of defenders) {
    const actualDefense = effectiveDefense(adv, synergy);

    let damage = retaliation / defenders.length;

    damage = Math.max(3, damage - actualDefense * 0.3);

    damage = Math.round(damage * randomRange(0.8, 1.2));

    const beforeHp = adv.hp;

    adv.hp = Math.max(0, adv.hp - damage);

    const actualDamage = beforeHp - adv.hp;

    const result = waveAdvResult(adv);

    if (result) {
      result.damage += actualDamage;

      result.events.push({
        type: "damage",
        amount: actualDamage,
      });
    }

    if (adv.hp <= 0) {
      handleKnockout(adv);
    } else {
      adv.career.waves++;

      /*
            방어전은 퀘스트보다
            성장 경험치를 많이 준다.
            */

      gainExp(adv, 30 + Math.floor(state.wave * 1.2));
    }
  }

  log(`${label}에서 ${Math.round(stopped)} 전투력을 저지했습니다.`);

  return remaining;
}

function resolveDefense() {
  let remaining = enemyPower();

  remaining = resolveLine(getLineAdvIds("line2"), remaining, "외곽 방어선");

  if (remaining > 0) {
    remaining = resolveLine(getLineAdvIds("line1"), remaining, "최종 방어선");
  }

  if (remaining > 0) {
    const damage = Math.max(3, Math.round(remaining * 0.55));

    state.townHp -= damage;

    log(`마왕군이 도시를 공격했습니다. 도시 HP -${damage}`);
  }

  if (state.townHp <= 0) {
    state.townHp = 0;

    state.gameOver = true;

    log("도시가 함락되었습니다.");
  }
}


/* =====================================================
   DEATH
===================================================== */

function removeFromDefense(id) {
  for (const lineId of Object.keys(LINES) as LineId[]) {
    const line = getLineState(lineId);
    line.front = line.front.map((slotId) => (slotId === id ? null : slotId));
    line.rear = line.rear.map((slotId) => (slotId === id ? null : slotId));
  }
}

function handleKnockout(adv) {
  /*
  우선 방어선에서 제거
  */
  removeFromDefense(adv.id);

  const hasWaitingSpace = waitingAdventurers().length < waitingCapacity();
  const retreatSuccess = Math.random() < CONFIG.retreatChance;

  const result = waveAdvResult(adv);

  if (retreatSuccess && hasWaitingSpace) {
    removeFromDefense(adv.id);

    adv.hp = 1;
    adv.status = "waiting";

    log(`${adv.name}이 전투불능 상태로 후퇴했습니다.`);

    if (result) {
      result.retreated = true;

      result.events.push({
        type: "retreat",
      });
    }

    return;
  }

  if (retreatSuccess && !hasWaitingSpace) {
    log(`대기소에 자리가 없어 ${adv.name}가 사망했습니다.`);
  } else {
    log(`${adv.name}이 후퇴에 실패하여 사망했습니다.`);
  }

  if (result) {
    result.died = true;

    result.events.push({
      type: "death",
    })
  }

  killAdventurer(adv);
}

function killAdventurer(adv) {
  removeFromDefense(adv.id);

  state.activeQuests = state.activeQuests.filter(
    (a) => a.adventurerId !== adv.id,
  );

  adv.hp = 0;

  adv.status = "dead";

  if (state.graveyard.length < graveCapacity()) {
    state.graveyard.push(adv.id);

    log(`${adv.name}이 전사했습니다.`);
  } else {
    state.adventurers = state.adventurers.filter((a) => a.id !== adv.id);

    log(`${adv.name}이 전사했지만 묘지 공간이 부족해 기록에서 사라졌습니다.`);
  }
}

/* =====================================================
   REVIVE
===================================================== */

function reviveGold(id) {
  const adv = getAdv(id);

  if (!adv) return;

  const goldCost = reviveGoldCost(adv);
  const waveCost = reviveWaveCost(adv);

  if (
    state.gold <
    // CONFIG.reviveGold
    goldCost
  ) {
    alert("골드가 부족합니다.");

    return;
  }

  state.gold -= goldCost;
  // CONFIG.reviveGold;

  adv.status = "reviving";

  adv.reviveRemaining = waveCost;

  state.graveyard = state.graveyard.filter((x) => x !== id);

  log(
    `${adv.name}의 부활 의식을 시작했습니다. ${waveCost} 웨이브 후 부활합니다.`,
  );

  save();
  render();
}

function reviveGoldCost(adv) {
  return Math.round(100 + adv.level * adv.level * 60);
}

function reviveWaveCost(adv) {
  return Math.max(1, Math.ceil(adv.level / 3));
}

function reviceGemCost(adv) {
  return Math.max(1, Math.ceil(adv.level / 3));
}

function reviveGem(id) {
  const adv = getAdv(id);

  if (!adv) return;

  const reviveCost = reviceGemCost(adv);

  if (
    state.meta.gem <
    // CONFIG.reviveGem
    reviveCost
  ) {
    alert("Gem이 부족합니다.");

    return;
  }

  if (waitingAdventurers().length >= waitingCapacity()) {
    alert("대기소가 가득 찼습니다.");

    return;
  }

  state.meta.gem -= reviveCost;
  // CONFIG.reviveGem;

  adv.hp = adv.maxHp;

  adv.status = "waiting";

  state.graveyard = state.graveyard.filter((x) => x !== id);

  log(`${adv.name}이 즉시 부활했습니다.`);

  save();
  render();
}

function progressRevives() {
  for (const adv of state.adventurers) {
    if (adv.status !== "reviving") continue;

    adv.reviveRemaining--;

    if (adv.reviveRemaining <= 0) {
      if (waitingAdventurers().length < waitingCapacity()) {
        adv.hp = adv.maxHp;

        adv.status = "waiting";

        log(`${adv.name}이 부활했습니다.`);
      } else {
        adv.reviveRemaining = 1;
      }
    }
  }
}

function recoverAdventurers() {

  for (const adv of state.adventurers) {
    // 모험가의 hp, maxhp에 따라서 회복 루프를 넘어갈지 말지 체크
    if (!Number.isFinite(adv.hp)) continue;

    if (!Number.isFinite(adv.maxHp)) continue;

    if (adv.hp <= 0) continue;

    if (adv.hp >= adv.maxHp) continue;

    // end
    // 여기서부터 모험가의 상태에 따라서 회복량이 달라진다.

    let healRate = 0.0;
    let recoveryType: "frontline" | "waiting" | null = null;

    if (isDefending(adv.id)) {
      healRate = CONFIG.frontlineHealRate * getPositionBonus(adv, "heal") + getLinePriestHealRate(adv.id);
      recoveryType = "frontline";
    } else if (adv.status === "waiting") {
      healRate = CONFIG.waitingHealRate;
      recoveryType = "waiting";
    }
    else continue;

    const beforeHp = adv.hp;

    const healAmount = Math.ceil(adv.maxHp * healRate);

    adv.hp = Math.min(adv.maxHp, adv.hp + healAmount);

    const actualHeal = adv.hp - beforeHp;
    const result = waveAdvResult(adv);

    if (result) {
      result.healed += actualHeal;

      result.events.push({
        type: "heal",
        amount: actualHeal,
        source: recoveryType,
      })
    }

    // result.push({
    //   adventureId: adv.id,
    //   name: adv.name,
    //   type: recoveryType,
    //   beforeHp,
    //   afterHp: adv.hp,
    //   healed: adv.hp - beforeHp,
    // });
  }
}

function recoverWaitingAdventurers() {
  for (const adv of state.adventurers) {
    if (adv.status !== "waiting") continue;

    if (adv.hp >= adv.maxHp) continue;

    const heal = Math.ceil(adv.maxHp * CONFIG.waitingHealRate);

    const before = adv.hp;

    adv.hp = Math.min(adv.maxHp, adv.hp + heal);

    if (adv.hp > before) {
      log(`${adv.name}이 대기하며 HP를 ${adv.hp - before} 회복했습니다.`);
    }
  }
}

function recoverDefenseAdventurers() {
  for (const adv of state.adventurers) {
    if (adv.status !== "defense") continue;
  }
}

function getLinePriestHealRate(advId) {
  const placement = getAdvPos(advId);
  if (!placement) return 0;

  for (const id of getLineAdvIds(placement.lineId)) {
    const adv = getAdv(id);

    if (!adv) continue;

    if (adv.job !== "priest") continue;

    return JOBS.priest.healRate ?? 0;
  }

  return 0;
}

function isDefending(advIds) {
  return getAdvPos(advIds) !== null;
}

/* =====================================================
   TOWN
===================================================== */

function townUpgradeCost() {
  const next = state.townLevel + 1;

  return CONFIG.townUpgradeCosts[next] ?? null;
}

function upgradeTown() {
  if (state.townLevel >= 5) return;

  const cost = townUpgradeCost();

  if (state.gold < cost) {
    alert("골드가 부족합니다.");

    return;
  }

  state.gold -= cost;

  state.townLevel++;

  refreshQuestBoard();

  log(`도시가 Lv.${state.townLevel}로 성장했습니다.`);

  save();
  render();
}

/* =====================================================
   EXPANSIONS
===================================================== */

function expandWaitingGold() {
  if (state.gold < CONFIG.waitingExpandGold) return;

  state.gold -= CONFIG.waitingExpandGold;

  state.tempWaiting++;

  log("현재 런의 모험가 대기소가 확장되었습니다.");

  save();
  render();
}

function expandWaitingGem() {
  if (state.meta.gem < 5) return;

  state.meta.gem -= 5;

  state.meta.permanentWaiting++;

  save();
  render();
}

function expandGraveGold() {
  if (state.gold < CONFIG.graveExpandGold) return;

  state.gold -= CONFIG.graveExpandGold;

  state.tempGrave++;

  save();
  render();
}

function expandGraveGem() {
  if (state.meta.gem < 5) return;

  state.meta.gem -= 5;

  state.meta.permanentGrave++;

  save();
  render();
}

/* =====================================================
   WAVE
===================================================== */


function beginWaveResult() {
  currentWaveResult = {
    wave: state.wave,

    enemyPower: enemyPower(),

    townHpBefore: state.townHp,
    townHpAfter: state.townHp,

    goldBefore: state.gold,
    goldAfter: state.gold,

    gemBefore: state.meta.gem,
    gemAfter: state.meta.gem,

    lines: {
      outer: {
        stopped: 0,
      },

      final: {
        stopped: 0,
      },
    },

    adventurers: {},
  };

  for (const adv of state.adventurers) {
    currentWaveResult.adventurers[adv.id] = {
      id: adv.id,
      name: adv.name,
      job: adv.job,

      levelBefore: adv.level,
      levelAfter: adv.level,

      hpBefore: adv.hp,
      hpAfter: adv.hp,

      expBefore: adv.exp,
      expAfter: adv.exp,

      healed: 0,
      damage: 0,
      expGain: 0,

      retreated: false,
      died: false,
      levelUp: false,

      events: [],
    };
  }
}


function nextWave() {
  if (state.gameOver) return;

  beginWaveResult();

  recoverAdventurers();

  progressActiveQuests();

  progressQuestExpiry();

  resolveDefense();

  progressRevives();

  // recoverWaitingAdventurers();

  finishWaveResult();

  if (!state.gameOver) {
    state.wave++;

    refreshQuestBoard();
  }

  save();
  render();

  showWaveResult(currentWaveResult);
}

function waveAdvResult(adv) {
  if (!currentWaveResult) return null;

  if (!currentWaveResult.adventurers[adv.id]) {
    currentWaveResult.adventurers[adv.id] = {
      id: adv.id,
      name: adv.name,
      job: adv.job,

      levelBefore: adv.level,
      levelAfter: adv.level,

      hpBefore: adv.hp,
      hpAfter: adv.hp,

      expBefore: adv.exp,
      expAfter: adv.exp,

      healed: 0,
      damage: 0,
      expGain: 0,

      retreated: false,
      died: false,
      levelUp: false,

      events: [],
    };
  }

  return currentWaveResult.adventurers[adv.id];
}

function finishWaveResult() {

  if (!currentWaveResult) return;

  currentWaveResult.townHpAfter = state.townHp;
  currentWaveResult.goldAfter = state.gold;
  currentWaveResult.gemAfter = state.meta.gem;

  for (const result of Object.values(currentWaveResult.adventurers)) {

    const adv = getAdv(result.id);

    if (adv) {
      result.hpAfter = adv.hp;
      result.levelAfter = adv.level;
      result.expAfter = adv.exp;
    } else if (result.died) {
      result.hpAfter = 0;
    }
  }
}



/* =====================================================
   INHERITANCE
===================================================== */

function survivorsForInheritance() {
  const graveIds = new Set(state.graveyard);

  return state.adventurers.filter(
    (adv) => !graveIds.has(adv.id) && adv.status !== "dead",
  );
}

function toggleInheritance(id) {
  const list = state.inheritanceSelection;

  const index = list.indexOf(id);

  if (index >= 0) {
    list.splice(index, 1);
  } else {
    if (list.length >= inheritanceCapacity()) {
      alert("승계 슬롯이 부족합니다.");

      return;
    }

    list.push(id);
  }

  render();
}

function expandInheritance() {
  if (state.meta.gem < 10) return;

  state.meta.gem -= 10;

  state.meta.permanentInheritance++;

  save();
  render();
}

function startNewRun() {
  if (!state.gameOver) return;

  const inherited = state.inheritanceSelection
    .map(getAdv)
    .filter(Boolean)
    .map((adv) => {
      const copy = JSON.parse(JSON.stringify(adv));

      copy.level = Math.max(1, Math.ceil(copy.level * 0.6));

      copy.status = "waiting";

      copy.exp = 0;

      copy.career.inherited++;

      return copy;
    });

  const meta = state.meta;

  state = createRun(meta);

  for (const adv of inherited) {
    /*
    현재 레벨에 맞게 다시 계산
    */

    const base = JOBS[adv.job];

    adv.maxHp = Math.round((base.hp + (adv.level - 1) * 9) * adv.talents.hp);

    adv.hp = adv.maxHp;

    adv.attack = Math.round(
      (base.attack + (adv.level - 1) * 4) * adv.talents.attack,
    );

    adv.defense = Math.round(
      (base.defense + (adv.level - 1) * 2) * adv.talents.defense,
    );

    state.adventurers.push(adv);
  }

  while (state.adventurers.length < 3) {
    state.adventurers.push(createAdventurer());
  }

  refreshQuestBoard();

  log(`${inherited.length}명의 모험가가 새로운 길드로 승계되었습니다.`);

  selectedId = null;

  save();
  render();
}
