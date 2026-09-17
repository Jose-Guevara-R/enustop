// MEJORA: Persistencia de estadísticas del jugador en localStorage
import { PlayerStats } from '../types.js';

const STATS_KEY = 'numstop_player_stats';

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as PlayerStats;
  } catch {}
  return {
    wins: 0,
    losses: 0,
    ties: 0,
    totalRoundsPlayed: 0,
    totalMarksEver: 0,
    fastestStop: null,
    lastPlayed: Date.now(),
  };
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordWin(marksThisGame: number): PlayerStats {
  const s = loadStats();
  s.wins += 1;
  s.totalRoundsPlayed += 1;
  s.totalMarksEver += marksThisGame;
  s.lastPlayed = Date.now();
  saveStats(s);
  return s;
}

export function recordLoss(marksThisGame: number): PlayerStats {
  const s = loadStats();
  s.losses += 1;
  s.totalRoundsPlayed += 1;
  s.totalMarksEver += marksThisGame;
  s.lastPlayed = Date.now();
  saveStats(s);
  return s;
}

export function recordTie(marksThisGame: number): PlayerStats {
  const s = loadStats();
  s.ties += 1;
  s.totalRoundsPlayed += 1;
  s.totalMarksEver += marksThisGame;
  s.lastPlayed = Date.now();
  saveStats(s);
  return s;
}

export function recordFastStop(durationMs: number): PlayerStats {
  const s = loadStats();
  if (s.fastestStop === null || durationMs < s.fastestStop) {
    s.fastestStop = durationMs;
  }
  saveStats(s);
  return s;
}
