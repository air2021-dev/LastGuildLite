type Position = "front" | "rear";
type PositionStat = "attack" | "defense" | "heal";
type JobId = "warrior" | "archer" | "mage" | "priest";
type LineId = "line1" | "line2";
type AdventurerStatus = "waiting" | "defense" | "quest" | "dead" | "reviving";
type AdventurerId = string;
type Slot = AdventurerId | null;

interface PositionBonus {
  attack: number;
  defense: number;
  heal: number;
}

interface JobData {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  colorClass: string;
  healRate?: number;
  positionBonus: Record<Position, PositionBonus>;
}

interface LineState {
  front: Slot[];
  rear: Slot[];
}

interface TownLevelData {
  defenseSlots: Record<LineId, Record<Position, number>>;
  maxDeploy: number;
  questSlots: number;
  maxQuestRank: number;
}

interface QuestTemplate {
  rank: number;
  name: string;
  duration: number;
  expiry: number;
  power: number;
  reward: number;
}

interface Quest extends QuestTemplate {
  id: string;
  remainingExpiry: number;
}

interface ActiveQuest {
  quest: Quest;
  adventurerId: AdventurerId;
  remaining: number;
}

interface Adventurer {
  id: AdventurerId;
  name: string;
  job: JobId;
  level: number;
  exp: number;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  talents: { hp: number; attack: number; defense: number };
  status: AdventurerStatus;
  career: { waves: number; quests: number; failedQuests: number; inherited: number };
  reviveRemaining: number;
}

interface MetaState {
  gem: number;
  permanentWaiting: number;
  permanentGrave: number;
  permanentInheritance: number;
}

interface GameState {
  meta: MetaState;
  wave: number;
  gold: number;
  townHp: number;
  townLevel: number;
  tempWaiting: number;
  tempGrave: number;
  adventurers: Adventurer[];
  line1: LineState;
  line2: LineState;
  questBoard: Quest[];
  activeQuests: ActiveQuest[];
  graveyard: AdventurerId[];
  logs: string[];
  gameOver: boolean;
  inheritanceSelection: AdventurerId[];
}

interface LinePlacement {
  lineId: LineId;
  position: Position;
}

interface SynergyResult {
  allAttack: number;
  allDefense: number;
  warriorAttack: number;
  warriorDefense: number;
  archerAttack: number;
  archerDefense: number;
  mageAttack: number;
  mageDefense: number;
  effects: string[];
}

interface WaveAdventurerResult {
  id: AdventurerId;
  name: string;
  job: JobId;
  levelBefore: number;
  levelAfter: number;
  hpBefore: number;
  hpAfter: number;
  expBefore: number;
  expAfter: number;
  healed: number;
  damage: number;
  expGain: number;
  retreated: boolean;
  died: boolean;
  levelUp: boolean;
  events: WaveEvent[];
}

type WaveEvent =
  | { type: "levelUp"; from: number; to: number }
  | { type: "damage" | "heal"; amount: number; source?: "frontline" | "waiting" }
  | { type: "retreat" | "death" };

interface WaveResult {
  wave: number;
  enemyPower: number;
  townHpBefore: number;
  townHpAfter: number;
  goldBefore: number;
  goldAfter: number;
  gemBefore: number;
  gemAfter: number;
  lines: { outer: { stopped: number }; final: { stopped: number } };
  adventurers: Record<AdventurerId, WaveAdventurerResult>;
}

interface GameConfig {
  startGold: number;
  startGem: number;
  townHp: number;
  baseWaiting: number;
  baseGrave: number;
  baseInheritance: number;
  hireBaseCost: number;
  reviveGold: number;
  reviveGem: number;
  reviveWaves: number;
  waitingExpandGold: number;
  graveExpandGold: number;
  waitingHealRate: number;
  frontlineHealRate: number;
  questMinHpRate: number;
  retreatChance: number;
  townUpgradeCosts: number[];
  enemyBase: number;
  enemyGrowth: number;
}

interface LineDefinition {
  id: LineId;
  label: string;
  positions: readonly Position[];
}

declare function render(): void;
