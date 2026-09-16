import React from 'react';
import { motion } from 'motion/react';
import { PlayerData, GameState, PlayerId } from '../types.js';
import { Check, Lock } from 'lucide-react';

interface PlayerBoardProps {
  player: PlayerData;
  isCurrentViewer: boolean;
  gameState: GameState;
  onMarkCell: (cellIndex: number) => void;
  colorTheme: 'purple' | 'olive';
  darkMode: boolean;
}

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  player,
  isCurrentViewer,
  gameState,
  onMarkCell,
  colorTheme,
  darkMode,
}) => {
  const isMarkerInRace = gameState === 'race' && player.role === 'marker';
  const isInteractiveForMe = isCurrentViewer && isMarkerInRace;
  const currentScore = player.score;
  const percentage = Math.round((currentScore / 48) * 100);

  const themeClasses = colorTheme === 'purple'
    ? {
        border: 'border-violet-200/80 dark:border-violet-900/60',
        cardGlow: isInteractiveForMe ? 'ring-2 ring-amber-400 shadow-lg shadow-violet-500/10' : 'shadow-md shadow-violet-500/5',
        headerBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white',
        avatarBg: 'bg-white/20 text-white',
        roleBadge: 'bg-white/20 text-white backdrop-blur-xs font-bold border border-white/20',
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
        avatarBg: 'bg-white/20 text-white',
        roleBadge: 'bg-white/20 text-white backdrop-blur-xs font-bold border border-white/20',
        markColor: 'text-emerald-600 dark:text-emerald-400',
        markBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 shadow-xs',
        activeNextCell: 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 ring-2 ring-amber-400 shadow-md shadow-amber-400/30',
        progressBar: 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500',
        percentColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800',
      };

  return (
    <div
      id={`player-board-${player.id}`}
      className={`relative flex flex-col rounded-3xl border transition-all duration-200 overflow-hidden ${
        darkMode ? 'bg-[#121624]/90 border-zinc-800/90' : 'bg-white/95 border-zinc-200/90'
      } ${themeClasses.cardGlow}`}
    >
      {/* Header bar */}
      <div className={`px-4 py-3 flex items-center justify-between ${themeClasses.headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs shadow-xs border border-white/20">
            {player.id === 'player1' ? '1' : '2'}
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm md:text-base tracking-tight flex items-center gap-2">
              <span>{player.name}</span>
              {isCurrentViewer && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full shadow-xs">TÚ</span>
              )}
            </h3>
          </div>
        </div>

        {/* Role tag */}
        <div className="flex items-center gap-1">
          {player.role ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs ${themeClasses.roleBadge}`}>
              {player.role === 'marker' ? '✍️ Marcador' : '🔍 Buscador'}
            </span>
          ) : (
            <span className="text-[11px] opacity-80 font-medium px-2 py-0.5 rounded-full bg-white/10">En espera</span>
          )}
        </div>
      </div>

      {/* Progress summary bar with high-contrast, premium typography */}
      <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Progreso:</span>
          <span className="font-display font-black text-base text-zinc-900 dark:text-white leading-none">
            {currentScore}
          </span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">/ 48</span>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${themeClasses.percentColor}`}>
          {percentage}%
        </div>
      </div>

      {/* Progress linear gauge with shimmer */}
      <div className="w-full h-2 bg-zinc-200/80 dark:bg-zinc-800/80 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-200 rounded-r-full relative overflow-hidden ${themeClasses.progressBar}`}
          style={{ width: `${(currentScore / 48) * 100}%` }}
        >
          <div className="absolute inset-0 bg-white/25 w-full h-full animate-shimmer" />
        </div>
      </div>

      {/* 6 rows × 8 columns = 48 Cells Grid */}
      <div className="p-3 relative">
        <div className="grid grid-cols-8 gap-1 md:gap-1.5">
          {player.cells.map((isMarked, index) => {
            const isNextToMark = isInteractiveForMe && index === currentScore;

            return (
              <button
                key={index}
                id={`cell-${player.id}-${index}`}
                onClick={() => {
                  if (isInteractiveForMe && index === currentScore) {
                    onMarkCell(index);
                  }
                }}
                disabled={!isInteractiveForMe || index !== currentScore}
                title={
                  isMarked
                    ? `Casilla #${index + 1} marcada con X`
                    : isNextToMark
                    ? `Haz clic para marcar la casilla #${index + 1} (o pulsa ESPACIO)`
                    : `Casilla #${index + 1}`
                }
                className={`relative aspect-square rounded-lg border flex items-center justify-center transition-all select-none ${
                  isMarked
                    ? `${themeClasses.markBg} cursor-default`
                    : isNextToMark
                    ? `${themeClasses.activeNextCell} cursor-pointer scale-105 z-10`
                    : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-400/40 cursor-not-allowed'
                }`}
              >
                {/* Cell coordinate number */}
                <span className={`absolute top-0.5 left-1 text-[8px] font-bold select-none pointer-events-none ${
                  isMarked
                    ? 'text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-400/70 dark:text-zinc-600'
                }`}>
                  {index + 1}
                </span>

                {/* Hand-drawn energetic marker "X" effect */}
                {isMarked && (
                  <motion.svg
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.12 }}
                    viewBox="0 0 24 24"
                    className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[3.5] stroke-current ${themeClasses.markColor} drop-shadow-xs`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </motion.svg>
                )}

                {/* Next target pointer prompt */}
                {isNextToMark && !isMarked && (
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 animate-bounce">
                    ▼
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Overlay when locked / inactive during race for Buscador */}
        {gameState === 'race' && player.role === 'searcher' && (
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs rounded-b-3xl flex flex-col items-center justify-center pointer-events-auto p-4 text-center text-white">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-2 border border-white/20 shadow-md">
              <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="text-sm font-display font-extrabold text-white mb-0.5">
              Tablero Bloqueado
            </div>
            <div className="text-xs text-zinc-300 max-w-[210px] leading-snug">
              ¡Eres el Buscador! Rastrea el número en la nube y <strong className="text-amber-300 font-bold">haz clic sobre él</strong> (o en el botón rojo superior) para gritar <strong className="text-rose-400 font-bold">¡STOP!</strong>
            </div>
          </div>
        )}
      </div>

      {/* Footer shortcut helper for marker */}
      {isInteractiveForMe && (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 border-t border-amber-300 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 text-center font-bold flex items-center justify-center gap-1.5">
          <span>⚡</span>
          <span>Pulsa la barra <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700 shadow-xs font-mono text-[10px]">ESPACIO</kbd> para marcar ultra rápido</span>
        </div>
      )}
    </div>
  );
};
