export interface Player {
  id: string;
  name: string;
  color: string;
  life: number;
  poison: number;
  experience: number;
  energy: number;
  commanderDamage: Record<string, number>; // sourcePlayerId -> damage dealt to this player
  landPlayedThisTurn: boolean;
  cardsDrawnThisTurn: number;
  isEliminated: boolean;
}

export type ActionCategory =
  | 'life'
  | 'poison'
  | 'experience'
  | 'energy'
  | 'commander'
  | 'land'
  | 'draw'
  | 'turn'
  | 'stack'
  | 'system'
  | 'dice';

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  playerName?: string;
  action: string;
  category: ActionCategory;
  delta?: number;
}

export interface UndoSnapshot {
  players: Player[];
  spellStackCount: number;
  activePlayerIndex: number;
  turnNumber: number;
  isDay: boolean;
  monarchPlayerId: string | null;
  initiativePlayerId: string | null;
}

export const DEFAULT_PLAYER_COLORS = ['#1A4A8A', '#8A1A1A', '#1A6A2A', '#5A1A8A'];
export const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
export const COMMANDER_STARTING_LIFE = 40;
export const COMMANDER_DAMAGE_THRESHOLD = 21;
export const POISON_THRESHOLD = 10;
