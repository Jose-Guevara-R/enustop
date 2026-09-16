import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Clock, CheckCircle2, Award, LogOut } from 'lucide-react';
import { GameRoomState, PlayerId } from '../types.js';

interface GameOverModalProps {
  roomState: GameRoomState;
  onRestart: () => void;
  onEndGame?: () => void;
  darkMode: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState,
  onRestart,
  onEndGame,
  darkMode,
}) => {
  const { winner, winReason, player1, player2, history, createdAt } = roomState;

  useEffect(() => {
    // Fire festive confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const totalMatchMs = Date.now() - (createdAt || Date.now());
  const minutes = Math.floor(totalMatchMs / 60000);
  const seconds = Math.floor((totalMatchMs % 60000) / 1000);
  const timeFormatted = `${minutes}m ${seconds}s`;

  const p1Percent = Math.round((player1.score / 48) * 100);
  const p2Percent = Math.round((player2.score / 48) * 100);

  const winnerData = winner && winner !== 'tie' ? roomState[winner] : null;

  return (
    <div
      id="game-over-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
    >
      <div className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border text-center ${
        darkMode ? 'bg-[#121626]/95 border-zinc-800/90 text-zinc-100' : 'bg-white/95 border-zinc-200/90 text-zinc-800'
      }`}>
        {/* Trophy icon */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 ring-4 ring-amber-300/30 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-2 shadow-xs">
          FIN DE LA PARTIDA
        </div>

        <h2 className="font-display text-2xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
          {winner === 'tie' ? '¡Empate Absoluto!' : `¡Ganador: ${winnerData?.name}!`}
        </h2>

        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
          {winReason === 'cells_completed'
            ? '🏆 ¡Condición Cumplida: Se completaron las 48 casillas de la cuadrícula!'
            : '✨ ¡Condición Cumplida: Se agotaron los 35 números de la nube!'}
        </p>

        {/* Players comparison stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Player 1 Card */}
          <div className={`p-4 rounded-2xl border text-left transition-all ${
            winner === 'player1'
              ? 'border-violet-500 bg-gradient-to-br from-violet-500/15 to-purple-500/15 shadow-md shadow-violet-500/20'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-extrabold text-sm text-violet-700 dark:text-violet-300">
                {player1.name}
              </span>
              {winner === 'player1' && <Award className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="font-display text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {p1Percent}%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              {player1.score} / 48 casillas
            </div>
          </div>

          {/* Player 2 Card */}
          <div className={`p-4 rounded-2xl border text-left transition-all ${
            winner === 'player2'
              ? 'border-teal-500 bg-gradient-to-br from-teal-500/15 to-emerald-500/15 shadow-md shadow-teal-500/20'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-extrabold text-sm text-teal-700 dark:text-teal-300">
                {player2.name}
              </span>
              {winner === 'player2' && <Award className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="font-display text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {p2Percent}%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              {player2.score} / 48 casillas
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 mb-6 flex items-center justify-around text-xs border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Tiempo: <strong className="font-bold text-zinc-900 dark:text-white">{timeFormatted}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Rondas jugadas: <strong className="font-bold text-zinc-900 dark:text-white">{history.length || roomState.round}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="rematch-btn"
            onClick={onRestart}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-white font-display font-black text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Jugar la Revancha</span>
          </button>

          {onEndGame && (
            <button
              id="end-game-modal-btn"
              onClick={onEndGame}
              className="py-3.5 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 active:scale-98 text-zinc-700 dark:text-zinc-200 font-display font-black text-sm border border-zinc-300 dark:border-zinc-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Terminar Juego</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
