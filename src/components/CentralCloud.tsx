import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Loader2, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { GameRoomState, PlayerId } from '../types.js';

interface CentralCloudProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onChooseTarget: (number: number) => void;
  onHitStop: (number: number) => void;
  darkMode: boolean;
}

export const CentralCloud: React.FC<CentralCloudProps> = ({
  roomState, mySlot, onChooseTarget, onHitStop, darkMode,
}) => {
  const effectiveSlot: PlayerId = mySlot === 'spectator' ? 'player1' : mySlot;
  const myRole      = roomState[effectiveSlot].role;
  const gameState   = roomState.state;
  const targetNumber = roomState.targetNumber;

  const isMarkerInChoose  = gameState === 'choose_number' && myRole === 'marker';
  const isSearcherInChoose = gameState === 'choose_number' && myRole === 'searcher';
  const isSearcherInRace  = gameState === 'race' && myRole === 'searcher';
  const isMarkerInRace    = gameState === 'race' && myRole === 'marker';
  const isStopped         = gameState === 'stop';

  const availableCount = roomState.cloud.filter(c => c.status === 'available').length;

  // MEJORA: zoom en móvil
  const [zoomed, setZoomed] = useState(false);

  const handleChipClick = (id: number, status: 'available' | 'used') => {
    if (status === 'used') return;
    if (isMarkerInChoose) {
      onChooseTarget(id);
    } else if (isSearcherInRace) {
      // Siempre llamar onHitStop — el hook decidirá si es correcto o penalizar
      onHitStop(id);
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Dynamic Status Banners */}
      <div className="w-full mb-3.5 min-h-[64px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isMarkerInChoose && (
            <motion.div key="marker-choose"
              initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white font-bold py-3 px-5 rounded-2xl shadow-lg text-center text-sm flex items-center justify-center gap-2.5"
            >
              <span className="text-xl animate-bounce">👉</span>
              <span className="font-display font-extrabold">Elige un número de la nube para que tu rival lo busque</span>
            </motion.div>
          )}

          {isSearcherInChoose && (
            <motion.div key="searcher-waiting"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold py-3 px-5 rounded-2xl text-center text-sm flex items-center justify-center gap-3 shadow-sm"
            >
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span>Tu rival está eligiendo el número secreto…</span>
            </motion.div>
          )}

          {isSearcherInRace && (
            <motion.div key="searcher-banner"
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: [1, 1.015, 1], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl text-center text-lg flex items-center justify-center gap-3 border-2 border-red-400/80"
            >
              <Search className="w-6 h-6 animate-bounce" />
              <span className="font-display font-extrabold uppercase">¡Busca el número:</span>
              <span className="bg-white text-red-600 font-display font-black text-2xl px-3.5 py-0.5 rounded-xl shadow-md tracking-wider">
                {targetNumber}
              </span>
              <span className="font-display font-extrabold uppercase">!</span>
              <Bell className="w-6 h-6 animate-pulse" />
            </motion.div>
          )}

          {isMarkerInRace && (
            <motion.div key="marker-locked"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white font-bold py-3 px-5 rounded-2xl shadow-lg text-center text-sm flex items-center justify-center gap-2.5"
            >
              <span className="text-xl">⚡</span>
              <span>¡RÁPIDO! Marca casillas antes de que encuentren el <strong>{targetNumber}</strong></span>
            </motion.div>
          )}

          {/* MEJORA: Animación dramática de STOP */}
          {isStopped && roomState.stopDetails && (
            <motion.div key="stop-triggered"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white font-black py-3.5 px-6 rounded-2xl shadow-2xl text-center text-base flex items-center justify-center gap-2.5 border border-white/20 animate-stop-flash"
            >
              <Bell className="w-6 h-6 animate-bounce" />
              <span className="font-display font-black">
                ¡STOP! {roomState[roomState.stopDetails.stoppedBy].name} encontró el {roomState.stopDetails.targetNumber} en{' '}
                {((roomState.stopDetails.elapsedMs || 0) / 1000).toFixed(1)}s
                {roomState.wrongClicksThisRound > 0 && (
                  <span className="ml-2 text-sm font-semibold opacity-90">
                    ({roomState.wrongClicksThisRound} error{roomState.wrongClicksThisRound > 1 ? 'es' : ''})
                  </span>
                )}
              </span>
            </motion.div>
          )}

          {gameState === 'lobby' && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold text-center bg-zinc-100/80 dark:bg-zinc-800/80 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700/80">
              Nube Central: {availableCount}/35 números disponibles
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* MEJORA: botón de zoom para móvil */}
      <div className="flex items-center justify-between w-full max-w-[580px] mb-1 px-1">
        <span className="text-[10px] text-zinc-400 font-semibold">{availableCount}/35 disponibles</span>
        <button
          onClick={() => setZoomed(z => !z)}
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          title={zoomed ? 'Reducir nube' : 'Ampliar nube (móvil)'}
        >
          {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
        </button>
      </div>

      {/* Cloud Board Canvas */}
      <div
        id="central-cloud-canvas"
        className={`relative w-full ${zoomed ? 'aspect-square' : 'aspect-4/3'} max-w-[580px] rounded-3xl border-4 transition-all duration-300 overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-b from-[#11162B] via-[#0E1322] to-[#0A0D18] border-zinc-800/90 shadow-[inset_0_2px_20px_rgba(0,0,0,0.7)]'
            : 'bg-gradient-to-b from-[#FCFBF8] via-[#F6F2EB] to-[#ECE5D8] border-amber-900/20 shadow-[inset_0_2px_15px_rgba(0,0,0,0.06)]'
        } ${isMarkerInRace ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {/* Grid texture */}
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

        {/* Number chips */}
        {roomState.cloud.map(chip => {
          const isUsed      = chip.status === 'used';
          const isTarget    = chip.id === targetNumber && !isUsed;
          const isClickable = !isUsed && (isMarkerInChoose || isSearcherInRace);

          return (
            <motion.button
              key={chip.id}
              onClick={() => handleChipClick(chip.id, chip.status)}
              disabled={!isClickable}
              style={{
                position: 'absolute',
                left: `${chip.x}%`,
                top: `${chip.y}%`,
                transform: `translate(-50%, -50%) rotate(${chip.rotation}deg)`,
              }}
              initial={{ scale: 1 }}
              whileHover={isClickable ? { scale: 1.15, zIndex: 20 } : {}}
              whileTap={isClickable ? { scale: 0.92 } : {}}
              className={`
                relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center
                font-display font-black text-sm sm:text-base select-none transition-all duration-150
                ${isUsed
                  ? 'opacity-25 bg-zinc-400 dark:bg-zinc-700 border-zinc-500 dark:border-zinc-600 text-zinc-600 dark:text-zinc-500 line-through cursor-not-allowed'
                  : isClickable
                  ? darkMode
                    ? 'bg-zinc-800 border-amber-600/70 text-amber-200 cursor-pointer hover:border-amber-400 shadow-md shadow-amber-500/10 halo-interactive'
                    : 'bg-white border-amber-500/60 text-zinc-900 cursor-pointer hover:border-amber-500 shadow-md shadow-amber-300/20 halo-interactive'
                  : darkMode
                    ? 'bg-zinc-800/70 border-zinc-700 text-zinc-300 cursor-default'
                    : 'bg-white/90 border-zinc-300 text-zinc-700 cursor-default shadow-xs'
                }
              `}
            >
              {chip.id}
              {/* Tachado para usados */}
              {isUsed && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
                  <line x1="4" y1="4" x2="36" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="36" y1="4" x2="4" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Leyenda y aviso para el Buscador */}
      {isSearcherInRace && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Busca el #{targetNumber} y tócalo
          </span>
          <span className="text-zinc-400">•</span>
          <span className="text-rose-500 dark:text-rose-400 font-bold">
            ⚠️ Si fallas, el rival avanza casillas
          </span>
        </motion.div>
      )}
    </div>
  );
};
