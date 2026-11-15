import { chooseTable } from "./deck";
import { cryptoRandom, pick, randomInt } from "./rng";
import { createCylinder, pullTrigger, reshuffleCylinder } from "./revolver";
import type {
  ChaosEvent,
  GameConfig,
  GameEvent,
  GameState,
  Player,
  PlayerSetup,
  RandomSource,
} from "./types";

const CHAOS_EVENTS: ChaosEvent[] = [
  "double-trigger",
  "shuffle-cylinder",
  "reverse",
  "double-truth",
  "joker-ban",
];

const logEntry = (state: GameState, text: string): string[] => [text, ...state.log].slice(0, 50);
const nextAliveIndex = (players: Player[], from: number, direction: 1 | -1): number => {
  for (let step = 1; step <= players.length; step += 1) {
    const index = (from + direction * step + players.length * 2) % players.length;
    if (players[index]?.alive) return index;
  }
  return from;
};

export function createGame(
  setup: PlayerSetup[],
  config: GameConfig,
  source: RandomSource = cryptoRandom,
): GameState {
  const players = setup.map<Player>((player) => ({
    ...player,
    alive: true,
    handCount: config.handSize,
    pulls: 0,
    survivalCount: 0,
    caughtLiars: 0,
    falseChallenges: 0,
    revolver: createCylinder(config.revolver.chambers, config.revolver.bullets, source),
  }));
  const chaos = config.chaosEnabled && randomInt(4, source) === 0 ? pick(CHAOS_EVENTS, source) : null;
  const tableDeck = chaos === "double-truth"
    ? { ...config.deck, namedRanksPerRound: Math.min(2, config.deck.ranks.length) }
    : config.deck;
  const table = chooseTable(tableDeck, [], null, false, source);
  const game: GameState = {
    config,
    players,
    activeIndex: 0,
    round: 1,
    turnsThisRound: 0,
    tableRanks: table.ranks,
    tableColor: table.color,
    previousTableRanks: [],
    previousTableColor: null,
    direction: 1,
    phase: "playing",
    lastPlay: null,
    challengerId: null,
    shooterId: null,
    lastShotSurvived: null,
    shotSequence: [],
    pendingCylinder: null,
    resultTruthful: null,
    chaos,
    sharedRevolver: createCylinder(config.revolver.chambers, config.revolver.bullets, source),
    log: ["Партия началась. Карты раздайте физически."],
    stats: { turns: 0, challenges: 0, shots: 0, highestPull: 0, rounds: 1 },
  };
  return {
    ...game,
    log: chaos ? logEntry(game, "Хаос-раунд: " + chaos) : game.log,
  };
}

function validateGame(state: GameState): string | null {
  if (state.players.filter((player) => player.alive).length < 2) return "Для игры нужны минимум два живых игрока";
  return null;
}

function determineShot(state: GameState, shooterId: string, source: RandomSource): GameState {
  const shooterIndex = state.players.findIndex((player) => player.id === shooterId);
  const shooter = state.players[shooterIndex];
  if (!shooter) return state;
  const shared = state.config.revolver.mode === "shared";
  const spin = state.config.revolver.mode === "spin" || state.chaos === "shuffle-cylinder";
  let cylinder = shared ? state.sharedRevolver : shooter.revolver;
  const shotSequence: boolean[] = [];
  let result = pullTrigger(cylinder, spin, source);
  shotSequence.push(result.survived);
  cylinder = result.cylinder;
  if (state.chaos === "double-trigger" && result.survived) {
    result = pullTrigger(cylinder, spin, source);
    shotSequence.push(result.survived);
    cylinder = result.cylinder;
  }
  const latest = shotSequence[shotSequence.length - 1] ?? result.survived;
  if (state.chaos === "shuffle-cylinder" && latest) {
    cylinder = reshuffleCylinder(cylinder, state.config.revolver.bullets, source);
  }
  const log = state.log;
  return {
    ...state,
    phase: "shooting",
    shooterId,
    lastShotSurvived: latest,
    shotSequence,
    pendingCylinder: cylinder,
    ...(shared ? { sharedRevolver: cylinder } : {}),
    stats: {
      ...state.stats,
      shots: state.stats.shots + shotSequence.length,
      highestPull: Math.max(state.stats.highestPull, cylinder.spent),
    },
    log,
  };
}

function completeShot(state: GameState): GameState {
  if (state.phase !== "shooting" || !state.shooterId || state.lastShotSurvived === null || !state.pendingCylinder) {
    return state;
  }
  const shooterIndex = state.players.findIndex((player) => player.id === state.shooterId);
  const shooter = state.players[shooterIndex];
  if (!shooter) return state;
  const survived = state.lastShotSurvived;
  const shared = state.config.revolver.mode === "shared";
  const updatedPlayers = state.players.map((player, index) => {
    if (index !== shooterIndex) return player;
    return {
      ...player,
      alive: survived,
      pulls: player.pulls + state.shotSequence.length,
      survivalCount: player.survivalCount + (survived ? 1 : 0),
      caughtLiars:
        state.resultTruthful === false && player.id === state.lastPlay?.playerId
          ? player.caughtLiars + 1
          : player.caughtLiars,
      falseChallenges:
        state.resultTruthful === true && player.id === state.challengerId
          ? player.falseChallenges + 1
          : player.falseChallenges,
      revolver: shared ? player.revolver : state.pendingCylinder!,
    };
  });
  const aliveCount = updatedPlayers.filter((player) => player.alive).length;
  const phase = aliveCount <= 1 ? "finished" : "round-over";
  const name = shooter.name;
  const text = survived ? name + " выжил после спуска" : name + " выбыл";
  const nextLog = logEntry(state, text);
  return {
    ...state,
    players: updatedPlayers,
    phase,
    sharedRevolver: shared ? state.pendingCylinder : state.sharedRevolver,
    pendingCylinder: null,
    log: nextLog,
  };
}

export function reduceGame(
  state: GameState,
  event: GameEvent,
  source: RandomSource = cryptoRandom,
): GameState {
  if (event.type === "UNDO") {
    if (state.phase !== "playing" || !state.lastPlay || state.lastPlay.turn !== state.stats.turns) return state;
    const players = state.players.map((player) =>
      player.id === state.lastPlay?.playerId ? { ...player, handCount: player.handCount + state.lastPlay.quantity } : player,
    );
    const playerIndex = players.findIndex((player) => player.id === state.lastPlay?.playerId);
    return {
      ...state,
      players,
      activeIndex: playerIndex,
      lastPlay: null,
      stats: { ...state.stats, turns: Math.max(0, state.stats.turns - 1) },
      turnsThisRound: Math.max(0, state.turnsThisRound - 1),
      log: logEntry(state, "Последний ход отменён"),
    };
  }
  if (event.type === "PLAY") {
    if (state.phase !== "playing" || event.quantity < 1 || event.quantity > 3) return state;
    const player = state.players[state.activeIndex];
    if (!player?.alive || player.handCount < event.quantity || player.handCount === 0) return state;
    const players = state.players.map((item, index) =>
      index === state.activeIndex ? { ...item, handCount: item.handCount - event.quantity } : item,
    );
    const lastPlay = { playerId: player.id, quantity: event.quantity, turn: state.stats.turns + 1 };
    const next = nextAliveIndex(players, state.activeIndex, state.direction);
    const result: GameState = {
      ...state,
      players,
      activeIndex: next,
      lastPlay,
      challengerId: null,
      resultTruthful: null,
      stats: { ...state.stats, turns: state.stats.turns + 1 },
      turnsThisRound: state.turnsThisRound + 1,
      log: logEntry(state, player.name + " положил " + event.quantity + " карт рубашкой вверх"),
    };
    return validateGame(result) ? state : result;
  }
  if (event.type === "CHALLENGE") {
    if (state.phase !== "playing" || !state.lastPlay) return state;
    if (state.turnsThisRound <= 1) return state;
    const challenger = state.players[state.activeIndex];
    if (!challenger?.alive || challenger.id === state.lastPlay.playerId) return state;
    const name = challenger.handCount === 0 ? challenger.name + " обязан вызвать" : challenger.name + " вызвал";
    return {
      ...state,
      phase: "reveal",
      challengerId: challenger.id,
      stats: { ...state.stats, challenges: state.stats.challenges + 1 },
      log: logEntry(state, name + " «Лжец!»"),
    };
  }
  if (event.type === "RESOLVE_CHALLENGE") {
    if (state.phase !== "reveal" || !state.lastPlay || !state.challengerId) return state;
    const shooterId = event.truthful ? state.challengerId : state.lastPlay.playerId;
    const truthText = event.truthful ? "Говорил правду" : "Врал";
    const prepared = {
      ...state,
      resultTruthful: event.truthful,
      shooterId,
      log: logEntry(state, "Вскрытие: " + truthText),
    };
    return determineShot(prepared, shooterId, source);
  }
  if (event.type === "COMPLETE_SCENE") {
    return completeShot(state);
  }
  if (event.type === "TIMER_EXPIRED") {
    if (state.phase !== "playing" || !state.config.timerSeconds) return state;
    const player = state.players[state.activeIndex];
    if (!player?.alive) return state;
    const prepared = { ...state, log: logEntry(state, player.name + " не успел — штрафной спуск") };
    return determineShot(prepared, player.id, source);
  }
  if (event.type === "NEXT_ROUND") {
    if (state.phase !== "round-over") return state;
    const shooterIndex = state.players.findIndex((player) => player.id === state.shooterId);
    const chaosEnabled = state.config.chaosEnabled && randomInt(4, source) === 0;
    const chaos = chaosEnabled ? pick(CHAOS_EVENTS, source) : null;
    const tableDeck = chaos === "double-truth"
      ? { ...state.config.deck, namedRanksPerRound: Math.min(2, state.config.deck.ranks.length) }
      : state.config.deck;
    const table = chooseTable(
      tableDeck,
      state.tableRanks,
      state.tableColor,
      state.config.noRepeatTable,
      source,
    );
    const direction: 1 | -1 = chaos === "reverse" ? (state.direction === 1 ? -1 : 1) : state.direction;
    const configuredStart = state.config.shooterStarts
      ? state.players.findIndex((player) => player.id === state.shooterId && player.alive)
      : -1;
    const nextIndex = configuredStart >= 0
      ? configuredStart
      : nextAliveIndex(state.players, shooterIndex, direction);
    const players = state.players.map((player) => ({
      ...player,
      handCount: player.alive ? state.config.handSize : 0,
    }));
    const next: GameState = {
      ...state,
      players,
      activeIndex: nextIndex,
      round: state.round + 1,
      turnsThisRound: 0,
      tableRanks: table.ranks,
      tableColor: table.color,
      previousTableRanks: state.tableRanks,
      previousTableColor: state.tableColor,
      phase: "playing",
      lastPlay: null,
      challengerId: null,
      shooterId: null,
      lastShotSurvived: null,
      shotSequence: [],
      pendingCylinder: null,
      resultTruthful: null,
      chaos,
      sharedRevolver: state.sharedRevolver,
      log: logEntry(state, "Раунд " + (state.round + 1) + ". Раздайте по " + state.config.handSize + " карт."),
      stats: { ...state.stats, rounds: state.stats.rounds + 1 },
      direction,
    };
    return chaos ? { ...next, log: logEntry(next, "Хаос-раунд: " + chaos) } : next;
  }
  return state;
}

export function cloneForStorage(state: GameState): GameState {
  return structuredClone(state);
}
