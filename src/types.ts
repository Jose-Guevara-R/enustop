// ============================================================
// NumSTOP! — Type definitions (v2 — with all improvements)
// ============================================================

export type PlayerId = 'player1' | 'player2';

export type Role = 'marker' | 'searcher' | null;

export type GameState =
  | 'lobby'
  | 'rps'            // Estado 1: Yan Ken Po (Duelo)
  | 'choose_number'  // Estado 2: Elección del Número Objetivo
  | 'race'           // Estado 3: La Carrera Asimétrica
  | 'stop'           // Estado 4: El STOP o Timbre
  | 'game_over';     // Fin de Partida

export type RpsChoice = 'rock' | 'paper' | 'scissors' | null;

// MEJORA: Nivel de dificultad del bot
export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface CloudNumber {
  id: number;
  x: number;       // 0-100 percentage in cloud container
  y: number;       // 0-100 percentage
  rotation: number; // -15 to 15 degrees
  status: 'available' | 'used';
}

export interface PlayerData {
  id: PlayerId;
  name: string;
  connected: boolean;
  role: Role;
  rpsChoice: RpsChoice;
  score: number;      // total marked cells (0 to 48)
  cells: boolean[];   // length 48
  // MEJORA: penalizaciones acumuladas
  penalties: number;
}

export interface RoundHistory {
  round: number;
  rpsWinner: PlayerId;
  marker: PlayerId;
  searcher: PlayerId;
  targetNumber: number;
  marksGained: number;
  durationMs: number;
  timeStop: number;
  // MEJORA: registro de errores del buscador en esa ronda
  wrongClicks: number;
}

export interface GameRoomState {
  roomId: string;
  state: GameState;
  round: number;
  player1: PlayerData;
  player2: PlayerData;
  cloud: CloudNumber[];
  targetNumber: number | null;
  raceStartTime: number | null;
  timeStop: number | null;
  rpsTieCount: number;
  lastRpsResult: {
    p1Choice: RpsChoice;
    p2Choice: RpsChoice;
    winner: PlayerId | 'tie' | null;
  } | null;
  stopDetails: {
    stoppedBy: PlayerId;
    targetNumber: number;
    marksThisRound: number;
    elapsedMs: number;
  } | null;
  winner: PlayerId | 'tie' | null;
  winReason: 'cells_completed' | 'cloud_depleted' | null;
  history: RoundHistory[];
  createdAt: number;
  isBotGame?: boolean;
  // MEJORA: dificultad del bot
  botDifficulty?: BotDifficulty;
  // MEJORA: contador de clics erróneos en la ronda actual
  wrongClicksThisRound: number;
}

export type ClientAction =
  | { type: 'JOIN_ROOM'; roomId: string; playerName?: string; preferredSlot?: PlayerId }
  | { type: 'SWITCH_SLOT'; slot: PlayerId }
  | { type: 'START_GAME'; isBotGame?: boolean; botDifficulty?: BotDifficulty }
  | { type: 'RPS_PICK'; choice: 'rock' | 'paper' | 'scissors' }
  | { type: 'CHOOSE_TARGET'; number: number }
  | { type: 'MARK_CELL'; cellIndex: number; clientTimestamp: number }
  | { type: 'HIT_STOP'; number: number; clientTimestamp: number }
  | { type: 'WRONG_CLICK'; clientTimestamp: number }
  | { type: 'RESTART_GAME' }
  | { type: 'END_GAME' }
  | { type: 'PING' };

export type ServerMessage =
  | { type: 'ROOM_STATE'; state: GameRoomState; yourSlot: PlayerId | 'spectator' }
  | { type: 'SLOT_SWAPPED'; newSlot: PlayerId; message: string }
  | { type: 'RPS_TIE'; p1Choice: RpsChoice; p2Choice: RpsChoice; message: string }
  | { type: 'RPS_WIN'; winner: PlayerId; p1Choice: RpsChoice; p2Choice: RpsChoice }
  | { type: 'TARGET_CHOSEN'; targetNumber: number; marker: PlayerId; searcher: PlayerId }
  | { type: 'CELL_MARKED'; player: PlayerId; cellIndex: number; score: number }
  | { type: 'STOP_TRIGGERED'; timeStop: number; stoppedBy: PlayerId; targetNumber: number; marksGained: number }
  | { type: 'WRONG_CLICK_PENALTY'; player: PlayerId; penaltyCells: number }
  | { type: 'TRANSITION_NEXT_ROUND'; nextRound: number }
  | { type: 'GAME_OVER'; winner: PlayerId | 'tie'; winReason: 'cells_completed' | 'cloud_depleted' }
  | { type: 'PLAYER_DISCONNECTED'; slot: PlayerId }
  | { type: 'ERROR'; message: string };

// MEJORA: Estadísticas persistidas en localStorage
export interface PlayerStats {
  wins: number;
  losses: number;
  ties: number;
  totalRoundsPlayed: number;
  totalMarksEver: number;
  fastestStop: number | null; // ms
  lastPlayed: number; // timestamp
}
