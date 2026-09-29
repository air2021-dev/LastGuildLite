"use strict";
/* =====================================================
   SELECT
===================================================== */
function selectAdventurer(id) {
    const adv = getAdv(id);
    if (!adv || adv.status !== "waiting")
        return;
    selectedId = selectedId === id ? null : id;
    render();
}
function dismissSelected() {
    if (!selectedId)
        return;
    const adv = getAdv(selectedId);
    if (!adv || adv.status !== "waiting")
        return;
    if (!confirm(`${adv.name}을 길드에서 내보낼까요?`))
        return;
    state.adventurers = state.adventurers.filter((a) => a.id !== selectedId);
    log(`${adv.name}이 길드를 떠났습니다.`);
    selectedId = null;
    save();
    render();
}
/* =====================================================
   TABS
===================================================== */
function openTab(tab) {
    activeTab = tab;
    ["adventurer", "quest", "grave"].forEach((name) => {
        document
            .getElementById("tab" + name.charAt(0).toUpperCase() + name.slice(1))
            ?.classList.toggle("active", name === tab);
        document
            .getElementById("content" + name.charAt(0).toUpperCase() + name.slice(1))
            ?.classList.toggle("active", name === tab);
    });
}
function openPeopleTab(tab) {
    activePeopleTab = tab;
    const tabs = ["adventurer", "grave"];
    for (const name of tabs) {
        const tabEl = document.getElementById("tab" + name.charAt(0).toUpperCase() + name.slice(1));
        const contentEl = document.getElementById("content" + name.charAt(0).toUpperCase() + name.slice(1));
        tabEl?.classList.toggle("active", name === tab);
        contentEl?.classList.toggle("active", name === tab);
    }
}
function openWorldTab(tab) {
    activeWorldTab = tab;
    const tabs = ["town", "quest"];
    for (const name of tabs) {
        const tabEl = document.getElementById("tab" + name.charAt(0).toUpperCase() + name.slice(1));
        const contentEl = document.getElementById("content" + name.charAt(0).toUpperCase() + name.slice(1));
        tabEl?.classList.toggle("active", name === tab);
        contentEl?.classList.toggle("active", name === tab);
    }
}
/* =====================================================
   RENDER
===================================================== */
function render() {
    document.getElementById("wave").textContent = state.wave;
    document.getElementById("gold").textContent = state.gold;
    document.getElementById("gem").textContent = state.meta.gem;
    document.getElementById("townHp").textContent = `${state.townHp}/${CONFIG.townHp}`;
    document.getElementById("townLevel").textContent = `Lv.${state.townLevel}`;
    document.getElementById("headerDefensePower").textContent = totalDefensePower();
    document.getElementById("headerEnemyPower").textContent = enemyPower();
    document.getElementById("ourPower").textContent = totalDefensePower();
    document.getElementById("enemyPower").textContent = enemyPower();
    const predict = battlePrediction();
    const risk = document.getElementById("headerRisk");
    const predictionEl = document.getElementById("battlePrediction");
    risk.textContent = predict.text;
    risk.className = `battle-risk ${predict.className}`;
    predictionEl.textContent = predict.text;
    predictionEl.className = predict.className;
    renderTown();
    for (const line of Object.values(LINES)) {
        renderDefensePosition(line);
        // renderDefense(line);
        // for(const position of Object.values(LINES[key].positions)){
        //   renderDefense(LINES[key].id + "-" + position);
        // }
    }
    // renderDefense("line1");
    // renderDefense("line2");
    renderWaiting();
    renderQuests();
    renderGraveyard();
    renderLogs();
    renderGameOver();
    // openTab(
    //     activeTab
    // );
    openPeopleTab(activePeopleTab);
    openWorldTab(activeWorldTab);
}
/* =====================================================
   HEADER UI
===================================================== */
function initHeaderBattleObserver() {
    const header = document.getElementById("gameHeader");
    const assaultPanel = document.getElementById("nextAssaultPanel");
    if (!header || !assaultPanel) {
        console.error("Header Battle Observer initialize failed.", { header, assaultPanel, });
        return;
    }
    function updateHeaderBattleInfo() {
        const headerRect = header.getBoundingClientRect();
        const panelRect = assaultPanel.getBoundingClientRect();
        /*
         * 공세 카드의 하단이
         * sticky header의 하단 위로 올라갔다면
         * 화면에서 사실상 보이지 않는 상태
         */
        const panelHidden = panelRect.bottom <= (headerRect.bottom + 70);
        header.classList.toggle("show-battle-info", panelHidden);
    }
    window.addEventListener("scroll", updateHeaderBattleInfo);
    window.addEventListener("resize", updateHeaderBattleInfo);
    updateHeaderBattleInfo();
    // const observer = new IntersectionObserver(
    //   entries => {
    //     const entry = entries[0];
    //     /*
    //      * 다음 마왕군 공세가 보이면
    //      * Header의 전투 정보 숨김
    //      * 
    //      * 화면에서 사라지면
    //      * Header에 표시
    //      */
    //     header.classList.toggle("show-battle-info", !entry.isIntersecting);
    //   },
    //   {
    //     threshold: 0
    //   }
    // );
    // observer.observe(assaultPanel);
}
/* =====================================================
   TOWN UI
===================================================== */
function renderTown() {
    const town = townData();
    document.getElementById("defenseSlotInfo").textContent =
        `${town.line1 + town.line2}칸`;
    document.getElementById("questSlotInfo").textContent = `${town.questSlots}개`;
    document.getElementById("townLevelCard").textContent =
        `Lv.${state.townLevel}`;
    document.getElementById("questRankInfo").textContent =
        `Rank ${town.maxQuestRank}`;
    const btn = document.getElementById("townUpgradeButton");
    const info = document.getElementById("townNextInfo");
    if (state.townLevel >= 5) {
        btn.textContent = "도시 최고 레벨";
        btn.disabled = true;
        info.textContent = "현재 프로토타입의 최대 도시 단계입니다.";
    }
    else {
        const next = TOWN_LEVELS[state.townLevel + 1];
        const cost = townUpgradeCost();
        btn.disabled = false;
        btn.textContent = `도시 Lv.${state.townLevel + 1} 업그레이드 💰${cost}`;
        info.textContent = `다음 단계: 방어 ${next.line1 + next.line2}칸 · 퀘스트 ${next.questSlots}개 · 퀘스트 Rank ${next.maxQuestRank}`;
    }
}
/* =====================================================
   DEFENSE UI
===================================================== */
function renderDefensePosition(line) {
    for (const pos of LINE_POSITIONS) {
        const positionName = pos.charAt(0).toUpperCase() + pos.slice(1);
        const linePos = line.id + positionName;
        const root = document.getElementById(linePos);
        // console.log(linePos, root);
        if (!root)
            continue;
        root.innerHTML = "";
        const slots = getLineState(line.id)[pos];
        const active = activeSlots(linePos);
        // console.log(linePos, active);
        for (let i = 0; i < 2; i++) {
            const div = document.createElement("div");
            div.className = "slot";
            if (!active) {
                div.classList.add("locked");
                div.textContent = "🔒";
            }
            else if (slots[i]) {
                const adv = getAdv(slots[i]);
                if (!adv)
                    continue;
                const hpPercent = Math.max(0, Math.min(100, Math.round((adv.hp / adv.maxHp) * 100)));
                const expNeed = requiredExp(adv.level);
                const expPercent = Math.max(0, Math.min(100, Math.round((adv.exp / expNeed) * 100)));
                if (adv) {
                    div.classList.add("occupied");
                    div.innerHTML = `
                <div>
                <strong>${adv.name}</strong>
                <br>
                ${JOBS[adv.job].name}
                Lv.${adv.level}
                <br>
                HP ${Math.max(0, adv.hp)} / ${adv.maxHp} (${hpPercent}%)
                <br>
                    EXP ${expPercent}% 
                    <div class="exp-bar">
                        <div class="exp-fill" style="width:${expPercent}%"></div>
                    </div>
                </div>
                `;
                }
                if (hpPercent <= 30) {
                    div.classList.add("low-hp");
                }
            }
            else {
                if (selectedId) {
                    div.classList.add("possible");
                    div.textContent = "배치";
                }
                else {
                    div.textContent = "빈 슬롯";
                }
            }
            if (active) {
                div.onclick = () => assignSlot(linePos, i);
            }
            root.appendChild(div);
        }
    }
    const slots = getLineAdvIds(line.id);
    const synergy = lineSynergy(slots);
    const synergyEl = document.getElementById(line.id + "Synergy");
    if (!synergyEl)
        return;
    synergyEl.classList.toggle("hidden", synergy.effects.length === 0);
    synergyEl.innerHTML = synergy.effects.map((effect) => `✨ ${effect}`).join("<br>");
}
function renderDefense(line) {
    const root = document.getElementById(line);
    if (!root)
        return;
    root.innerHTML = "";
    console.log(state);
    const slots = state[line] ?? [];
    console.log(slots);
    const active = activeSlots(line);
    for (let i = 0; i < 2; i++) {
        const div = document.createElement("div");
        div.className = "slot";
        if (i >= active) {
            div.classList.add("locked");
            div.textContent = "🔒";
        }
        else if (slots[i]) {
            const adv = getAdv(slots[i]);
            const hpPercent = Math.max(0, Math.min(100, Math.round((adv.hp / adv.maxHp) * 100)));
            const expNeed = requiredExp(adv.level);
            const expPercent = Math.max(0, Math.min(100, Math.round((adv.exp / expNeed) * 100)));
            if (adv) {
                div.classList.add("occupied");
                div.innerHTML = `
                <div>
                <strong>${adv.name}</strong>
                <br>
                ${JOBS[adv.job].name}
                Lv.${adv.level}
                <br>
                HP ${Math.max(0, adv.hp)} / ${adv.maxHp} (${hpPercent}%)
                <br>
                    EXP ${expPercent}% 
                    <div class="exp-bar">
                        <div class="exp-fill" style="width:${expPercent}%"></div>
                    </div>
                </div>
                `;
            }
            if (hpPercent <= 30) {
                div.classList.add("low-hp");
            }
        }
        else {
            if (selectedId) {
                div.classList.add("possible");
                div.textContent = "배치";
            }
            else {
                div.textContent = "빈 슬롯";
            }
        }
        if (i < active) {
            div.onclick = () => assignSlot(line, i);
        }
        root.appendChild(div);
    }
    const synergy = lineSynergy(slots);
    const synergyEl = document.getElementById(line + "Synergy");
    if (synergy.effects.length > 0) {
        synergyEl.classList.remove("hidden");
        synergyEl.innerHTML = synergy.effects
            .map((effect) => `✨ ${effect}`)
            .join("<br>");
    }
    else {
        synergyEl.classList.add("hidden");
    }
    // if(
    //     synergy.name
    // ){
    //     synergyEl.classList.remove(
    //         "hidden"
    //     );
    //     synergyEl.textContent=
    //         ` ${synergy.name}`;
    // }
    // else {
    //     synergyEl.classList.add(
    //         "hidden"
    //     );
    // }
}
/* =====================================================
   ADVENTURER UI
===================================================== */
function renderWaiting() {
    const root = document.getElementById("waiting");
    root.innerHTML = "";
    const waiting = waitingAdventurers();
    document.getElementById("waitingCount").textContent =
        `대기 ${waiting.length}/${waitingCapacity()} · 방어/원정 중인 모험가는 별도 공간을 차지하지 않습니다.`;
    document.getElementById("hireCost").textContent = hireCost();
    for (const adv of waiting) {
        const job = JOBS[adv.job];
        const card = document.createElement("div");
        card.className = "card";
        if (selectedId === adv.id) {
            card.classList.add("selected");
        }
        const hpPercent = Math.max(0, (adv.hp / adv.maxHp) * 100);
        const expNeed = requiredExp(adv.level);
        card.innerHTML = `
        <div>
            <span class="name">
                ${adv.name}
            </span>

            <span class="job ${job.colorClass}">
                ${job.name}
            </span>
        </div>

        <div class="small">
            Lv.${adv.level}
            · EXP ${adv.exp}/${expNeed}
        </div>

        <div class="hp">
            <div style="width:${hpPercent}%"></div>
        </div>

        <div class="small">
            HP ${adv.hp}/${adv.maxHp}
        </div>

        <div class="stats">
            <div>
            ⚔️ ${adv.attack}
            </div>

            <div>
            🛡️ ${adv.defense}
            </div>

            <div>
            💪 ${Math.round(advCombatPower(adv))}
            </div>
        </div>

        <div class="small">
            방어 ${adv.career.waves}
            · 퀘스트 ${adv.career.quests}
            · 승계 ${adv.career.inherited}
        </div>
        `;
        card.onclick = () => selectAdventurer(adv.id);
        root.appendChild(card);
    }
    const actions = document.getElementById("selectedActions");
    actions.innerHTML = "";
    if (selectedId) {
        const adv = getAdv(selectedId);
        if (adv) {
            const selectedInfo = document.createElement("div");
            selectedInfo.className = "small";
            selectedInfo.style.flex = "100%";
            selectedInfo.textContent = `선택: ${adv.name} / 전투력 ${Math.round(advCombatPower(adv))}`;
            actions.appendChild(selectedInfo);
        }
        const btn = document.createElement("button");
        btn.textContent = "길드에서 내보내기";
        btn.onclick = dismissSelected;
        actions.appendChild(btn);
    }
}
/* =====================================================
   QUEST UI
===================================================== */
function renderQuests() {
    const root = document.getElementById("quests");
    root.innerHTML = "";
    document.getElementById("questBoardInfo").textContent =
        `현재 퀘스트 슬롯 ${state.questBoard.length}/${townData().questSlots} · 도시 Lv.${state.townLevel}에서는 Rank ${townData().maxQuestRank}까지 등장`;
    /* ACTIVE */
    for (const active of state.activeQuests) {
        const adv = getAdv(active.adventurerId);
        const div = document.createElement("div");
        div.className = "quest";
        div.innerHTML = `
        <div class="quest-rank">
        진행 중
        </div>

        <strong>
        ${active.quest.name}
        </strong>

        <div class="small">
        ${adv?.name ?? ""}
        · 남은 ${active.remaining} Wave
        </div>
        `;
        root.appendChild(div);
    }
    /* BOARD */
    for (const q of state.questBoard) {
        const div = document.createElement("div");
        div.className = "quest";
        let selectedInfo = "모험가를 선택하세요";
        if (selectedId) {
            const adv = getAdv(selectedId);
            if (adv) {
                selectedInfo = `${adv.name}: ${riskText(adv, q)} (${Math.round(questChance(adv, q) * 100)}%)`;
            }
        }
        div.innerHTML = `
        <div class="quest-rank">
        Rank ${q.rank}
        </div>

        <strong>
        ${q.name}
        </strong>

        <div class="small">
        유효기간 ${q.remainingExpiry} Wave
        </div>

        <div class="small">
        수행 ${q.duration} Wave
        · 권장 ${q.power}
        </div>

        <div class="small">
        보상 💰${q.reward}
        </div>

        <div class="small">
        ${selectedInfo}
        </div>

        <button>
        퀘스트 파견
        </button>
        `;
        div.querySelector("button").onclick = () => sendQuest(q.id);
        root.appendChild(div);
    }
}
/* =====================================================
   GRAVE UI
===================================================== */
function renderGraveyard() {
    document.getElementById("graveCount").textContent =
        `묘지 ${state.graveyard.length}/${graveCapacity()}`;
    const root = document.getElementById("graveyard");
    root.innerHTML = "";
    for (const id of state.graveyard) {
        const adv = getAdv(id);
        if (!adv)
            continue;
        const goldCost = reviveGoldCost(adv);
        const waveCost = reviveWaveCost(adv);
        const gemCost = reviceGemCost(adv);
        const div = document.createElement("div");
        div.className = "grave";
        div.innerHTML = `
        <strong>
        ⚰️ ${adv.name}
        </strong>

        <div class="small">
        ${JOBS[adv.job].name}
        Lv.${adv.level}
        </div>

        <div class="small">
        방어전 ${adv.career.waves}
        · 퀘스트 ${adv.career.quests}
        · 승계 ${adv.career.inherited}
        </div>

        <div class="toolbar">

        <button>
        💰${goldCost}
        / ${waveCost}W
        </button>

        <button>
        💎${gemCost} 즉시 부활
        </button>

        </div>
        `;
        const buttons = div.querySelectorAll("button");
        buttons[0].onclick = () => reviveGold(adv.id);
        buttons[1].onclick = () => reviveGem(adv.id);
        root.appendChild(div);
    }
    /* REVIVING */
    for (const adv of state.adventurers) {
        if (adv.status !== "reviving")
            continue;
        const div = document.createElement("div");
        div.className = "grave";
        div.innerHTML = `
        ✨ ${adv.name} 부활 중

        <div class="small">
        남은 ${adv.reviveRemaining} Wave
        </div>
        `;
        root.appendChild(div);
    }
}
/* =====================================================
   LOG UI
===================================================== */
function renderLogs() {
    document.getElementById("log").innerHTML = state.logs
        .slice()
        .reverse()
        .join("<br>");
    document.getElementById("waveButton").disabled = state.gameOver;
}
/* =====================================================
   WAVE RESULT UI
===================================================== */
function showWaveResult(result) {
    const modal = document.getElementById("wave-result-modal");
    const content = document.getElementById("wave-result-content");
    const adventurers = Object.values(result.adventurers);
    let html = `
    <h2>WAVE ${result.wave} 결과</h2>

    <div> 적 전투력
      <strong> ${Math.round(result.enemyPower)}</strong>
    </div>

    <div> 도시 HP ${result.townHpBefore} → ${result.townHpAfter} </div>

    <hr>

    <h3>모험가 결과</h3>
  `;
    for (const adv of adventurers) {
        /*
         * 아무 일도 없었던 대기 모험가는
         * 결과에서 생략해도 됨.
         */
        if (adv.healed === 0 &&
            adv.damage === 0 &&
            adv.expGain === 0 &&
            !adv.retreated &&
            !adv.died &&
            !adv.levelUp)
            continue;
        let status = "";
        if (adv.died) {
            status = `
        <div class="result-danger">🪦 사망</div>
      `;
        }
        else if (adv.retreated) {
            status = `
        <div class="result-danger">🤕 후퇴 성공</div>
      `;
        }
        let levelUp = "";
        if (adv.levelUp) {
            levelUp = `
        <div class="result-level-up">
          ⭐️ LEVEL UP ${adv.levelBefore} → ${adv.levelAfter}
        </div>
      `;
        }
        html += `
      <div class="wave-result-adventurer">
        <strong>${adv.name}</strong>
        <span>${JOBS[adv.job].name} Lv.${adv.levelAfter}</span>
        <div>HP ${Math.round(adv.hpBefore)} → ${Math.round(adv.hpAfter)}</div>
        ${adv.healed > 0 ? `<div>회복 +${adv.healed}</div>` : ""}
        ${adv.damage > 0 ? `<div>피해 -${adv.damage}</div>` : ""}
        ${adv.expGain > 0 ? `<div>EXP +${adv.expGain}</div>` : ""}
        ${levelUp}
        ${status}
      </div>
    `;
    }
    html += `
    <hr>

    <div>Gold +${result.goldAfter - result.goldBefore}</div>
    <div>Gem +${result.gemAfter - result.gemBefore}</div>
  `;
    content.innerHTML = html;
    modal.classList.remove("hidden");
}
function closeWaveResult() {
    document.getElementById("wave-result-modal").classList.add("hidden");
}
/* =====================================================
   GAME OVER UI
===================================================== */
function renderGameOver() {
    const panel = document.getElementById("gameOverPanel");
    if (!state.gameOver) {
        panel.classList.add("hidden");
        return;
    }
    panel.classList.remove("hidden");
    const root = document.getElementById("inheritList");
    root.innerHTML = `
    <div class="small">
    승계 ${state.inheritanceSelection.length}/${inheritanceCapacity()}
    </div>
    `;
    const survivors = survivorsForInheritance();
    for (const adv of survivors) {
        const div = document.createElement("div");
        div.className = "inherit-card";
        if (state.inheritanceSelection.includes(adv.id)) {
            div.classList.add("selected");
        }
        div.innerHTML = `
        <strong>
        ${adv.name}
        </strong>

        · ${JOBS[adv.job].name}
        Lv.${adv.level}

        <div class="small">
        전투력 ${Math.round(advCombatPower(adv))}
        · 방어 ${adv.career.waves}
        · 퀘스트 ${adv.career.quests}
        · 기존 승계 ${adv.career.inherited}
        </div>
        `;
        div.onclick = () => toggleInheritance(adv.id);
        root.appendChild(div);
    }
}
