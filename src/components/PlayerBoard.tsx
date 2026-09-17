import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerData, GameState } from '../types.js';
import { AlertTriangle } from 'lucide-react';

interface PlayerBoardProps {
  player: PlayerData;
  isCurrentViewer: boolean;
  gameState: GameState;
  onMarkCell: (cellIndex: number) => void;
  colorTheme: 'purple' | 'olive';
  darkMode: boolean;
}

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  player, isCurrentViewer, gameState, onMarkCell, colorTheme, darkMode,
}) => {
  const isMarkerInRace    = gameState === 'race' && player.role === 'marker';
  const isInteractiveForMe = isCurrentViewer && isMarkerInRace;
  const currentScore      = player.score;
  const percentage        = Math.round((currentScore / 48) * 100);
  // MEJORA: estado local de shake al marcar rápido
  const [shaking, setShaking] = useState(false);

  const theme = colorTheme === 'purple'
    ? {
        border: 'border-violet-200/80 dark:border-violet-900/60',
        cardGlow: isInteractiveForMe ? 'ring-2 ring-amber-400 shadow-lg shadow-violet-500/10' : 'shadow-md shadow-violet-500/5',
        headerBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white',
        markColor: 'text-violet-600 dark:text-violet-400',
        markBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700/80 shadow-xs',
        activeNextCell: 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 ring-2 ring-amber-400 shadow-md shadow-amber-400/30',
        progressBar: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600',
        percentColor: 'text-violet-700 dark:text-violet-300 bg-violet-100/90 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-800',
      }
    : {
        border: 'border-teal-200/80 dark:border-teal-900/60',
        cardGlow: isInteractiveForMe ? 'ring-2 ring-amber-400 shadow-lg shadow-teal-500/10' : 'shadow-md shadow-teal-500/5',
        headerBg: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white',
        markColor: 'text-emerald-600 dark:text-emerald-400',
        markBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 shadow-xs',
        activeNextCell: 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 ring-2 ring-amber-400 shadow-md shadow-amber-400/30',
        progressBar: 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500',
        percentColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800',
      };

  const handleCellClick = (index: number) => {
    if (isInteractiveForMe && index === currentScore) {
      onMarkCell(index);
      setShaking(true);
      setTimeout(() => setShaking(false), 350);
    }
  };

  return (
    <div className={`relative flex flex-col rounded-3xl border transition-all duration-200 overflow-hidden ${
      darkMode ? 'bg-[#121624]/90 border-zinc-800/90' : 'bg-white/95 border-zinc-200/90'
    } ${theme.cardGlow} ${shaking ? 'animate-shake' : ''}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${theme.headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs shadow-xs border border-white/20">
            {player.id === 'player1' ? '1' : '2'}
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm md:text-base tracking-tight flex items-center gap-2">
              <span>{player.name}</span>
              {isCurrentViewer && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">TÚ</span>
              )}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* MEJORA: indicador de penalizaciones */}
          {player.penalties > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/30 text-red-100 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              -{player.penalties * 2}
            </span>
          )}
          {player.role ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
              {player.role === 'marker' ? '✍️ Marcador' : '🔍 Buscador'}
            </span>
          ) : (
            <span className="text-[11px] opacity-80 font-medium px-2 py-0.5 rounded-full bg-white/10">En espera</span>
          )}
        </div>
      </div>

      {/* Progress summary */}
      <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Progreso:</span>
          <span className="font-display font-black text-base text-zinc-900 dark:text-white leading-none">{currentScore}</span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">/ 48</span>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${theme.percentColor}`}>
          {percentage}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-zinc-200/80 dark:bg-zinc-800/80 overflow-hidden relative">
        <motion.div
          className={`h-full rounded-r-full ${theme.progressBar}`}
          animate={{ width: `${(currentScore / 48) * 100}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </div>

      {/* 6×8 = 48 cells grid */}
      <div className="p-3 relative">
        <div className="grid grid-cols-8 gap-1 md:gap-1.5">
          {player.cells.map((isMarked, index) => {
            const isNextToMark = isInteractiveForMe && index === currentScore;
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!isInteractiveForMe || index !== currentScore}
                title={isMarked ? `Casilla #${index + 1} marcada` : isNextToMark ? `Marcar casilla #${index + 1} (ESPACIO)` : `Casilla #${index + 1}`}
                className={`relative aspect-square rounded-lg border flex items-center justify-center transition-all select-none ${
                  isMarked
                    ? `${theme.markBg} cursor-default`
                    : isNextToMark
                    ? `${theme.activeNextCell} cursor-pointer scale-105 z-10`
                    : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-400/40 cursor-not-allowed'
                }`}
              >
                <span className={`absolute top-0.5 left-1 text-[8px] font-bold select-none pointer-events-none ${
                  isMarked ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400/70 dark:text-zinc-600'
                }`}>{index + 1}</span>

                <AnimatePresence>
                  {isMarked && (
                    <motion.svg
                      key="x"
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.12 }}
                      viewBox="0 0 24 24"
                      className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[3.5] stroke-current ${theme.markColor} drop-shadow-xs`}
                      fill="none"
                    >
                      <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      {/* MEJORA: indicador visual cuando es turno activo */}
      {isInteractiveForMe && (
        <div className="px-3 pb-3">
          <div className="text-center text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse">
            ⚡ ¡MARCA RÁPIDO! Presiona ESPACIO o toca la casilla dorada
          </div>
        </div>
      )}
    </div>
  );
};
