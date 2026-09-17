import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Clock, CheckCircle2, Award, LogOut, TrendingUp, AlertTriangle } from 'lucide-react';
import { GameRoomState, PlayerId } from '../types.js';
import { loadStats, recordWin, recordLoss, recordTie } from '../utils/stats.js';

interface GameOverModalProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onRestart: () => void;
  onEndGame?: () => void;
  darkMode: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState, mySlot, onRestart, onEndGame, darkMode,
}) => {
  const { winner, winReason, player1, player2, history, createdAt } = roomState;
  const effectiveSlot: PlayerId = mySlot === 'spectator' ? 'player1' : mySlot;
  const iWon = winner === effectiveSlot;

  useEffect(() => {
    // MEJORA: confetti solo si el jugador ganó
    if (iWon || winner === 'tie') {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const t = setTimeout(() => {
        confetti({ particleCount: 50, angle: 60,  spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [iWon, winner]);

  // MEJORA: registrar estadísticas (protegido contra montaje doble en StrictMode)
  const hasRecordedRef = React.useRef(false);
  useEffect(() => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;
    const myScore = roomState[effectiveSlot].score;
    if (winner === effectiveSlot) recordWin(myScore);
    else if (winner === 'tie') recordTie(myScore);
    else if (winner && (winner as string) !== 'tie') recordLoss(myScore);
  }, [effectiveSlot, roomState, winner]);

  const stats = loadStats();

  const totalMs = Date.now() - (createdAt || Date.now());
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const p1Pct   = Math.round((player1.score / 48) * 100);
  const p2Pct   = Math.round((player2.score / 48) * 100);
  const winnerData = winner && winner !== 'tie' ? roomState[winner] : null;

  // MEJORA: calcular ronda más rápida
  const fastestRound = history.length > 0
    ? history.reduce((min, h) => h.durationMs < min.durationMs ? h : min, history[0])
    : null;

  return (
    <div id="game-over-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border text-center my-4 ${
        darkMode ? 'bg-[#121626]/95 border-zinc-800/90 text-zinc-100' : 'bg-white/95 border-zinc-200/90 text-zinc-800'
      }`}>
        {/* Trophy */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xl ring-4 ring-amber-300/30 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-2">
          FIN DE LA PARTIDA
        </div>

        <h2 className="font-display text-2xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
          {winner === 'tie' ? '¡Empate Absoluto!' : `¡Ganador: ${winnerData?.name}!`}
        </h2>

        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-5 font-medium">
          {winReason === 'cells_completed'
            ? '🏆 Se completaron las 48 casillas'
            : '✨ Se agotaron los 35 números de la nube'}
        </p>

        {/* Players comparison */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([['player1', player1, p1Pct, 'violet'], ['player2', player2, p2Pct, 'teal']] as const).map(([pid, p, pct, color]) => (
            <div key={pid} className={`p-4 rounded-2xl border text-left transition-all ${
              winner === pid
                ? color === 'violet'
                  ? 'border-violet-500 bg-gradient-to-br from-violet-500/15 to-purple-500/15 shadow-md'
                  : 'border-teal-500 bg-gradient-to-br from-teal-500/15 to-emerald-500/15 shadow-md'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-display font-extrabold text-sm ${color === 'violet' ? 'text-violet-700 dark:text-violet-300' : 'text-teal-700 dark:text-teal-300'}`}>
                  {p.name}
                </span>
                {winner === pid && <Award className="w-5 h-5 text-amber-500" />}
              </div>
              <div className="font-display text-3xl font-black text-zinc-900 dark:text-zinc-100">{pct}%</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{p.score} / 48 casillas</div>
              {/* MEJORA: mostrar penalizaciones */}
              {p.penalties > 0 && (
                <div className="text-xs text-red-500 dark:text-red-400 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  {p.penalties} error{p.penalties > 1 ? 'es' : ''} (-{p.penalties * 2} casillas)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Match Details */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-around gap-2 text-xs border border-zinc-200 dark:border-zinc-700/80">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Tiempo: <strong>{minutes}m {seconds}s</strong></span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Rondas: <strong>{history.length || roomState.round}</strong></span>
          </div>
          {fastestRound && (
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span>STOP más rápido: <strong>{(fastestRound.durationMs / 1000).toFixed(1)}s</strong> (R{fastestRound.round})</span>
            </div>
          )}
        </div>

        {/* MEJORA: Estadísticas históricas del jugador */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl p-3 mb-5 border border-amber-200 dark:border-amber-800/50 text-xs text-left">
          <div className="font-display font-black text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Tus estadísticas históricas
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-black text-lg text-emerald-600 dark:text-emerald-400">{stats.wins}</div>
              <div className="text-zinc-500 dark:text-zinc-400">Victorias</div>
            </div>
            <div>
              <div className="font-black text-lg text-red-500 dark:text-red-400">{stats.losses}</div>
              <div className="text-zinc-500 dark:text-zinc-400">Derrotas</div>
            </div>
            <div>
              <div className="font-black text-lg text-amber-600 dark:text-amber-400">{stats.ties}</div>
              <div className="text-zinc-500 dark:text-zinc-400">Empates</div>
            </div>
          </div>
          {stats.fastestStop && (
            <div className="text-center mt-1.5 text-zinc-500 dark:text-zinc-400">
              🏆 Mejor STOP: <strong className="text-violet-600 dark:text-violet-400">{(stats.fastestStop / 1000).toFixed(1)}s</strong>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button id="rematch-btn" onClick={onRestart}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-white font-display font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            <span>¡Revancha!</span>
          </button>
          {onEndGame && (
            <button id="end-game-modal-btn" onClick={onEndGame}
              className="py-3.5 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 active:scale-98 text-zinc-700 dark:text-zinc-200 font-display font-black text-sm border border-zinc-300 dark:border-zinc-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Terminar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
