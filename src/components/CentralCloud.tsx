import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Loader2, Search, X } from 'lucide-react';
import { GameRoomState, PlayerId } from '../types.js';

interface CentralCloudProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onChooseTarget: (number: number) => void;
  onHitStop: (number: number) => void;
  darkMode: boolean;
}

export const CentralCloud: React.FC<CentralCloudProps> = ({
  roomState,
  mySlot,
  onChooseTarget,
  onHitStop,
  darkMode,
}) => {
  const effectiveSlot: PlayerId = mySlot === 'spectator' ? 'player1' : mySlot;
  const myRole = roomState[effectiveSlot].role;
  const gameState = roomState.state;
  const targetNumber = roomState.targetNumber;

  const isMarkerInChoose = gameState === 'choose_number' && myRole === 'marker';
  const isSearcherInChoose = gameState === 'choose_number' && myRole === 'searcher';
  const isSearcherInRace = gameState === 'race' && myRole === 'searcher';
  const isMarkerInRace = gameState === 'race' && myRole === 'marker';
  const isStopped = gameState === 'stop';

  const availableCount = roomState.cloud.filter((c) => c.status === 'available').length;

  const handleChipClick = (id: number, status: 'available' | 'used') => {
    if (status === 'used') return;

    if (isMarkerInChoose) {
      onChooseTarget(id);
    } else if (isSearcherInRace) {
      // In race, clicking any chip could be checked or clicking the right target triggers STOP!
      if (id === targetNumber) {
        onHitStop(id);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Dynamic Status Banners */}
      <div className="w-full mb-3.5 min-h-[64px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* STATE 2: Marker Instruction */}
          {isMarkerInChoose && (
            <motion.div
              key="marker-choose"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-amber-500/25 border border-amber-400/40 text-center text-sm md:text-base flex items-center justify-center gap-2.5"
            >
              <span className="text-xl animate-bounce">👉</span>
              <span className="font-display tracking-tight font-extrabold">Elige un número de la nube para que tu rival lo busque</span>
            </motion.div>
          )}

          {/* STATE 2: Searcher Waiting */}
          {isSearcherInChoose && (
            <motion.div
              key="searcher-waiting"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="w-full bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold py-3 px-5 rounded-2xl text-center text-sm flex items-center justify-center gap-3 shadow-sm backdrop-blur-md"
            >
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span>Tu rival está eligiendo el número secreto en la nube...</span>
            </motion.div>
          )}

          {/* STATE 3: Searcher GIANT RED BANNER */}
          {isSearcherInRace && (
            <motion.div
              key="searcher-banner"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: [1, 1.015, 1], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-red-500/30 text-center text-lg md:text-xl tracking-wide flex items-center justify-center gap-3 border-2 border-red-400/80"
            >
              <Search className="w-6 h-6 animate-bounce" />
              <span className="font-display font-extrabold uppercase">¡Busca el número:</span>
              <span className="bg-white text-red-600 font-display font-black text-2xl md:text-3xl px-3.5 py-0.5 rounded-xl shadow-md tracking-wider">
                {targetNumber}
              </span>
              <span className="font-display font-extrabold uppercase">!</span>
              <Bell className="w-6 h-6 animate-pulse" />
            </motion.div>
          )}

          {/* STATE 3: Marker Locked Notice */}
          {isMarkerInRace && (
            <motion.div
              key="marker-locked"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-purple-500/25 border border-purple-400/40 text-center text-sm md:text-base flex items-center justify-center gap-2.5"
            >
              <span className="text-xl">⚡</span>
              <span>¡RÁPIDO! Marca tantas casillas [X] en tu cuadrícula antes de que encuentren el <strong>{targetNumber}</strong></span>
            </motion.div>
          )}

          {/* STATE 4: STOP Bell Triggered */}
          {isStopped && roomState.stopDetails && (
            <motion.div
              key="stop-triggered"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white font-black py-3.5 px-6 rounded-2xl shadow-2xl text-center text-base md:text-lg flex items-center justify-center gap-2.5 border border-white/20"
            >
              <Bell className="w-6 h-6 animate-bounce" />
              <span className="font-display font-black">
                ¡STOP! {roomState[roomState.stopDetails.stoppedBy].name} encontró el número {roomState.stopDetails.targetNumber} en {((roomState.stopDetails.elapsedMs || 0) / 1000).toFixed(1)}s
              </span>
            </motion.div>
          )}

          {/* Default / Lobby Banner */}
          {gameState === 'lobby' && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold text-center bg-zinc-100/80 dark:bg-zinc-800/80 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
              La Nube Central: 35 números únicos desordenados (Disponibles: {availableCount}/35)
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Cloud Board Canvas Container */}
      <div
        id="central-cloud-canvas"
        className={`relative w-full aspect-4/3 max-w-[580px] rounded-3xl border-4 transition-all duration-300 overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-b from-[#11162B] via-[#0E1322] to-[#0A0D18] border-zinc-800/90 shadow-[inset_0_2px_20px_rgba(0,0,0,0.7),0_12px_36px_-8px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-b from-[#FCFBF8] via-[#F6F2EB] to-[#ECE5D8] border-amber-900/20 shadow-[inset_0_2px_15px_rgba(0,0,0,0.06),0_12px_36px_-8px_rgba(180,140,80,0.15)]'
        } ${isMarkerInRace ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {/* Tabletop texture lines */}
        <div className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="table-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#table-grid)" />
          </svg>
        </div>

        {/* Center Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] dark:opacity-10 text-7xl font-display font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest select-none">
          LA NUBE
        </div>

        {/* 35 Number Chips */}
        {roomState.cloud.map((chip) => {
          const isUsed = chip.status === 'used';
          const isTargetInRace = gameState === 'race' && chip.id === targetNumber;
          const isInteractiveForMe =
            (isMarkerInChoose && !isUsed) ||
            (isSearcherInRace && !isUsed);

          return (
            <motion.button
              key={chip.id}
              id={`cloud-chip-${chip.id}`}
              onClick={() => handleChipClick(chip.id, chip.status)}
              disabled={!isInteractiveForMe || isUsed}
              style={{
                left: `${chip.x}%`,
                top: `${chip.y}%`,
                transform: `translate(-50%, -50%) rotate(${chip.rotation}deg)`,
              }}
              whileHover={isInteractiveForMe && !isUsed ? { scale: 1.18, zIndex: 30 } : {}}
              whileTap={isInteractiveForMe && !isUsed ? { scale: 0.95 } : {}}
              className={`absolute w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center font-display font-black text-sm sm:text-base md:text-lg select-none transition-all duration-200 ${
                isUsed
                  ? 'bg-zinc-200/80 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed scale-90 border border-zinc-300/40 dark:border-zinc-700/40'
                  : isInteractiveForMe
                  ? 'bg-gradient-to-b from-white via-amber-50/50 to-amber-100/60 dark:from-zinc-800 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 border-2 border-amber-500 shadow-md shadow-amber-500/25 cursor-pointer ring-3 ring-amber-400/40'
                  : 'bg-white/95 dark:bg-zinc-800/95 text-zinc-850 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700/80 shadow-xs cursor-default'
              } ${isTargetInRace && isSearcherInRace ? 'animate-pulse-ring !border-red-500 !ring-4 !ring-red-400/60' : ''}`}
            >
              <span className="relative z-10 leading-none">{chip.id}</span>

              {/* Bold Red "X" cross-out if used */}
              {isUsed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-rose-500 dark:text-rose-400">
                  <X className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5] drop-shadow-xs" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Cloud Footer Info */}
      <div className="mt-3 flex items-center justify-between w-full max-w-[580px] px-2 text-xs font-semibold">
        <span className="px-3 py-1 rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
          🎲 35 Números en mesa
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shadow-xs flex items-center gap-1.5">
          <span>Disponibles:</span>
          <strong className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{availableCount}</strong> / 35
        </span>
      </div>
    </div>
  );
};
