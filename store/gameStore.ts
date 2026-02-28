import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Player,
  ActionLogEntry,
  ActionCategory,
  UndoSnapshot,
  DEFAULT_PLAYER_COLORS,
  DEFAULT_PLAYER_NAMES,
  COMMANDER_STARTING_LIFE,
} from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makePlayer(index: number, startingLife: number): Player {
  return {
    id: `player-${index + 1}`,
    name: DEFAULT_PLAYER_NAMES[index],
    color: DEFAULT_PLAYER_COLORS[index],
    life: startingLife,
    poison: 0,
    experience: 0,
    energy: 0,
    commanderDamage: {},
    landPlayedThisTurn: false,
    cardsDrawnThisTurn: 0,
    isEliminated: false,
  };
}

function makePlayers(startingLife: number): Player[] {
  return [0, 1, 2, 3].map((i) => makePlayer(i, startingLife));
}

function logEntry(
  action: string,
  category: ActionCategory,
  playerName?: string,
  delta?: number,
): ActionLogEntry {
  return { id: uid(), timestamp: Date.now(), playerName, action, category, delta };
}

function cloneSnapshot(state: GameStore): UndoSnapshot {
  return {
    players: JSON.parse(JSON.stringify(state.players)),
    spellStackCount: state.spellStackCount,
    activePlayerIndex: state.activePlayerIndex,
    turnNumber: state.turnNumber,
    isDay: state.isDay,
    monarchPlayerId: state.monarchPlayerId,
    initiativePlayerId: state.initiativePlayerId,
  };
}

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface GameStore {
  // ── State ──
  players: Player[];
  activePlayerIndex: number;
  turnNumber: number;
  spellStackCount: number;
  actionLog: ActionLogEntry[];
  undoHistory: UndoSnapshot[];
  isDay: boolean;
  monarchPlayerId: string | null;
  initiativePlayerId: string | null;
  startingLife: number;
  gameStartTime: number;

  // ── Life / Counters ──
  adjustLife: (playerId: string, delta: number) => void;
  setLife: (playerId: string, value: number) => void;
  adjustPoison: (playerId: string, delta: number) => void;
  adjustExperience: (playerId: string, delta: number) => void;
  adjustEnergy: (playerId: string, delta: number) => void;

  // ── Commander Damage ──
  adjustCommanderDamage: (targetId: string, sourceId: string, delta: number) => void;

  // ── Turn Tracking ──
  toggleLandPlayed: (playerId: string) => void;
  adjustCardsDrawn: (playerId: string, delta: number) => void;

  // ── Spell Stack ──
  adjustSpellStack: (delta: number) => void;
  clearSpellStack: () => void;

  // ── Game Flow ──
  nextTurn: () => void;
  setActivePlayer: (index: number) => void;
  toggleDayNight: () => void;
  setMonarch: (playerId: string | null) => void;
  setInitiative: (playerId: string | null) => void;
  toggleEliminated: (playerId: string) => void;

  // ── History ──
  undoLastAction: () => void;

  // ── Session ──
  resetGame: () => void;

  // ── Settings ──
  updatePlayerName: (playerId: string, name: string) => void;
  updatePlayerColor: (playerId: string, color: string) => void;
  updateStartingLife: (life: number) => void;

  // ── Dice ──
  addDiceRollLog: (sides: number, result: number) => void;
}

const MAX_LOG = 500;
const MAX_UNDO = 50;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      players: makePlayers(COMMANDER_STARTING_LIFE),
      activePlayerIndex: 0,
      turnNumber: 1,
      spellStackCount: 0,
      actionLog: [],
      undoHistory: [],
      isDay: true,
      monarchPlayerId: null,
      initiativePlayerId: null,
      startingLife: COMMANDER_STARTING_LIFE,
      gameStartTime: Date.now(),

      // ── Life ──────────────────────────────────────────────────────────────

      adjustLife: (playerId, delta) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const oldLife = player.life;
        const newLife = oldLife + delta;
        const entry = logEntry(
          `${delta > 0 ? '+' : ''}${delta} life  (${oldLife} → ${newLife})`,
          'life',
          player.name,
          delta,
        );
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, life: newLife } : p)),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      setLife: (playerId, value) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const oldLife = player.life;
        const entry = logEntry(
          `Life set: ${oldLife} → ${value}`,
          'life',
          player.name,
          value - oldLife,
        );
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, life: value } : p)),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      // ── Counters ──────────────────────────────────────────────────────────

      adjustPoison: (playerId, delta) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const oldVal = player.poison;
        const newVal = Math.max(0, oldVal + delta);
        const entry = logEntry(
          `${delta > 0 ? '+' : ''}${delta} poison  (${oldVal} → ${newVal})`,
          'poison',
          player.name,
          delta,
        );
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, poison: newVal } : p)),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      adjustExperience: (playerId, delta) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const oldVal = player.experience;
        const newVal = Math.max(0, oldVal + delta);
        const entry = logEntry(
          `${delta > 0 ? '+' : ''}${delta} experience  (${oldVal} → ${newVal})`,
          'experience',
          player.name,
          delta,
        );
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, experience: newVal } : p)),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      adjustEnergy: (playerId, delta) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const oldVal = player.energy;
        const newVal = Math.max(0, oldVal + delta);
        const entry = logEntry(
          `${delta > 0 ? '+' : ''}${delta} energy  (${oldVal} → ${newVal})`,
          'energy',
          player.name,
          delta,
        );
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, energy: newVal } : p)),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      // ── Commander Damage ──────────────────────────────────────────────────

      adjustCommanderDamage: (targetId, sourceId, delta) => {
        const s = get();
        const target = s.players.find((p) => p.id === targetId);
        const source = s.players.find((p) => p.id === sourceId);
        if (!target || !source) return;
        const snapshot = cloneSnapshot(s);
        const oldDmg = target.commanderDamage[sourceId] || 0;
        const newDmg = Math.max(0, oldDmg + delta);
        const lifeDelta = -(newDmg - oldDmg); // life goes down as damage goes up
        const entry = logEntry(
          `Cmdr dmg from ${source.name}: ${oldDmg} → ${newDmg}  (life ${target.life} → ${target.life + lifeDelta})`,
          'commander',
          target.name,
          delta,
        );
        set((st) => ({
          players: st.players.map((p) => {
            if (p.id !== targetId) return p;
            return {
              ...p,
              life: p.life + lifeDelta,
              commanderDamage: { ...p.commanderDamage, [sourceId]: newDmg },
            };
          }),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      // ── Turn Tracking ─────────────────────────────────────────────────────

      toggleLandPlayed: (playerId) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const newVal = !player.landPlayedThisTurn;
        const entry = logEntry(
          newVal ? 'Land drop used' : 'Land drop freed',
          'land',
          player.name,
        );
        set((st) => ({
          players: st.players.map((p) =>
            p.id === playerId ? { ...p, landPlayedThisTurn: newVal } : p,
          ),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      adjustCardsDrawn: (playerId, delta) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const oldVal = player.cardsDrawnThisTurn;
        const newVal = Math.max(0, oldVal + delta);
        const entry = logEntry(
          delta > 0
            ? `Drew ${delta} card${delta > 1 ? 's' : ''}  (${newVal} this turn)`
            : `Draw count −${Math.abs(delta)}  (${newVal} this turn)`,
          'draw',
          player.name,
          delta,
        );
        set((st) => ({
          players: st.players.map((p) =>
            p.id === playerId ? { ...p, cardsDrawnThisTurn: newVal } : p,
          ),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      // ── Spell Stack ───────────────────────────────────────────────────────

      adjustSpellStack: (delta) => {
        const s = get();
        const snapshot = cloneSnapshot(s);
        const oldCount = s.spellStackCount;
        const newCount = Math.max(0, oldCount + delta);
        const entry = logEntry(`Stack: ${oldCount} → ${newCount}`, 'stack');
        set((st) => ({
          spellStackCount: newCount,
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      clearSpellStack: () => {
        const s = get();
        if (s.spellStackCount === 0) return;
        const snapshot = cloneSnapshot(s);
        const entry = logEntry('Stack resolved (cleared)', 'stack');
        set((st) => ({
          spellStackCount: 0,
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      // ── Game Flow ─────────────────────────────────────────────────────────

      nextTurn: () => {
        const s = get();
        const snapshot = cloneSnapshot(s);
        const nextIndex = (s.activePlayerIndex + 1) % s.players.length;
        const isNewRound = nextIndex === 0;
        const newTurnNumber = isNewRound ? s.turnNumber + 1 : s.turnNumber;
        const nextPlayer = s.players[nextIndex];
        const entry = logEntry(
          `Turn ${newTurnNumber}${isNewRound ? ' (new round)' : ''} — ${nextPlayer.name}`,
          'turn',
        );
        set((st) => ({
          activePlayerIndex: nextIndex,
          turnNumber: newTurnNumber,
          spellStackCount: 0,
          players: st.players.map((p, i) =>
            i === nextIndex ? { ...p, landPlayedThisTurn: false, cardsDrawnThisTurn: 0 } : p,
          ),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      setActivePlayer: (index) => {
        const s = get();
        const player = s.players[index];
        const entry = logEntry(`Active player → ${player.name}`, 'turn');
        set((st) => ({
          activePlayerIndex: index,
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
        }));
      },

      toggleDayNight: () => {
        const s = get();
        const newIsDay = !s.isDay;
        const entry = logEntry(newIsDay ? 'Day ☀' : 'Night 🌙', 'system');
        set((st) => ({
          isDay: newIsDay,
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
        }));
      },

      setMonarch: (playerId) => {
        const s = get();
        const player = playerId ? s.players.find((p) => p.id === playerId) : null;
        const entry = logEntry(
          player ? `${player.name} is the Monarch` : 'Monarch removed',
          'system',
        );
        set((st) => ({
          monarchPlayerId: playerId,
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
        }));
      },

      setInitiative: (playerId) => {
        const s = get();
        const player = playerId ? s.players.find((p) => p.id === playerId) : null;
        const entry = logEntry(
          player ? `${player.name} has the Initiative` : 'Initiative removed',
          'system',
        );
        set((st) => ({
          initiativePlayerId: playerId,
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
        }));
      },

      toggleEliminated: (playerId) => {
        const s = get();
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return;
        const snapshot = cloneSnapshot(s);
        const newVal = !player.isEliminated;
        const entry = logEntry(
          newVal ? `${player.name} eliminated` : `${player.name} returned`,
          'system',
          player.name,
        );
        set((st) => ({
          players: st.players.map((p) =>
            p.id === playerId ? { ...p, isEliminated: newVal } : p,
          ),
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
          undoHistory: [snapshot, ...st.undoHistory].slice(0, MAX_UNDO),
        }));
      },

      // ── History ───────────────────────────────────────────────────────────

      undoLastAction: () => {
        const s = get();
        if (s.undoHistory.length === 0) return;
        const [snap, ...rest] = s.undoHistory;
        const entry = logEntry('↩ Undo', 'system');
        set(() => ({
          players: snap.players,
          spellStackCount: snap.spellStackCount,
          activePlayerIndex: snap.activePlayerIndex,
          turnNumber: snap.turnNumber,
          isDay: snap.isDay,
          monarchPlayerId: snap.monarchPlayerId,
          initiativePlayerId: snap.initiativePlayerId,
          undoHistory: rest,
          actionLog: [entry, ...s.actionLog].slice(0, MAX_LOG),
        }));
      },

      // ── Session ───────────────────────────────────────────────────────────

      resetGame: () => {
        const s = get();
        const startingLife = s.startingLife;
        // Keep player names and colors from previous game
        const freshPlayers = makePlayers(startingLife).map((p, i) => ({
          ...p,
          name: s.players[i]?.name ?? p.name,
          color: s.players[i]?.color ?? p.color,
        }));
        const entry = logEntry('⚔ New game started', 'system');
        set({
          players: freshPlayers,
          activePlayerIndex: 0,
          turnNumber: 1,
          spellStackCount: 0,
          actionLog: [entry],
          undoHistory: [],
          isDay: true,
          monarchPlayerId: null,
          initiativePlayerId: null,
          gameStartTime: Date.now(),
        });
      },

      // ── Settings ──────────────────────────────────────────────────────────

      updatePlayerName: (playerId, name) => {
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
        }));
      },

      updatePlayerColor: (playerId, color) => {
        set((st) => ({
          players: st.players.map((p) => (p.id === playerId ? { ...p, color } : p)),
        }));
      },

      updateStartingLife: (life) => {
        set({ startingLife: life });
      },

      // ── Dice ──────────────────────────────────────────────────────────────

      addDiceRollLog: (sides, result) => {
        const entry = logEntry(`d${sides} → ${result}`, 'dice');
        set((st) => ({
          actionLog: [entry, ...st.actionLog].slice(0, MAX_LOG),
        }));
      },
    }),
    {
      name: 'mtg-tracker-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist player customization, not game state (start fresh each session)
      partialize: (state) => ({
        players: state.players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
        startingLife: state.startingLife,
      }),
    },
  ),
);
