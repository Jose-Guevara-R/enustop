import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut } from 'lucide-react';
import { PlayerId, RpsChoice, GameRoomState } from '../types.js';

interface YanKenPoModalProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onPick: (choice: 'rock' | 'paper' | 'scissors') => void;
  onPickRival?: (choice: 'rock' | 'paper' | 'scissors') => void;
  isBotGame?: boolean;
  onCancel?: () => void;
}

const RPS_OPTIONS: Array<{ key: 'rock' | 'paper' | 'scissors'; emoji: string; label: string; keyHint: string }> = [
  { key: 'rock', emoji: '✊', label: 'Piedra', keyHint: '1' },
  { key: 'paper', emoji: '✋', label: 'Papel', keyHint: '2' },
  { key: 'scissors', emoji: '✌️', label: 'Tijera', keyHint: '3' },
];

export const State1YanKenPoModal: React.FC<YanKenPoModalProps> = ({
  roomState,
  mySlot,
  onPick,
  onPickRival,
  isBotGame,
  onCancel,
}) => {
  const effectiveSlot: PlayerId = mySlot === 'spectator' ? 'player1' : mySlot;
  const rivalSlot: PlayerId = effectiveSlot === 'player1' ? 'player2' : 'player1';

  const myChoice = roomState[effectiveSlot].rpsChoice;
  const rivalChoice = roomState[rivalSlot].rpsChoice;
  const lastResult = roomState.lastRpsResult;

  const isRevealingWinner = lastResult && lastResult.winner && lastResult.winner !== 'tie';
  const isTie = lastResult && lastResult.winner === 'tie';

  return (
    <div
      id="yan-ken-po-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white/95 dark:bg-[#121626]/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden text-center p-6 md:p-8"
      >
        {/* Top-right Cancel / Close button */}
        {onCancel && (
          <button
            id="cancel-rps-x-btn"
            onClick={onCancel}
            title="Cancelar juego y volver al menú principal"
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wide uppercase mb-3 shadow-xs">
          <span>⚡</span>
          <span>Estado 1 • El Duelo Asimétrico</span>
        </div>

        <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5">
          Yan Ken Po
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          El ganador será <strong className="text-violet-600 dark:text-violet-400">El Marcador ✍️</strong> y el perdedor será <strong className="text-teal-600 dark:text-teal-400">El Buscador 🔍</strong>.
        </p>

        {/* Duel Status Banner */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {isTie ? (
              <motion.div
                key="tie"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl text-amber-900 dark:text-amber-200 font-bold text-sm shadow-sm"
              >
                ¡Empate! {roomState.player1.name}: {lastResult?.p1Choice} vs {roomState.player2.name}: {lastResult?.p2Choice}.
                <div className="text-xs font-normal text-amber-700 dark:text-amber-400 mt-0.5">
                  Repitiendo duelo inmediatamente...
                </div>
              </motion.div>
            ) : isRevealingWinner ? (
              <motion.div
                key="winner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border font-semibold shadow-md ${
                  lastResult.winner === effectiveSlot
                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                    : 'bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/15 border-indigo-400 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100'
                }`}
              >
                <div className="text-xl font-display font-black">
                  {lastResult.winner === effectiveSlot
                    ? '🎉 ¡Ganaste el duelo!'
                    : `👑 ¡Ganó ${roomState[lastResult.winner].name}!`}
                </div>
                <div className="text-sm mt-1 font-medium">
                  Tu rol esta ronda:{' '}
                  <span className="font-extrabold uppercase text-amber-600 dark:text-amber-400">
                    {lastResult.winner === effectiveSlot ? '✍️ EL MARCADOR' : '🔍 EL BUSCADOR'}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Iniciando Estado 2: Elección de número...
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="text-center">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Tú ({roomState[effectiveSlot].name})</div>
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl transition-all duration-200 shadow-sm ${
                    myChoice
                      ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900 border-amber-400 dark:border-amber-600 scale-105 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-dashed border-zinc-300 dark:border-zinc-700'
                  }`}>
                    {myChoice ? (myChoice === 'rock' ? '✊' : myChoice === 'paper' ? '✋' : '✌️') : '?'}
                  </div>
                  <div className="text-xs mt-1.5 text-zinc-600 dark:text-zinc-400 font-bold">
                    {myChoice ? '¡Listo!' : 'Elige abajo'}
                  </div>
                </div>

                <div className="font-display font-black text-xl text-zinc-400 dark:text-zinc-600">VS</div>

                <div className="text-center">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Rival ({roomState[rivalSlot].name})</div>
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl transition-all duration-200 shadow-sm ${
                    rivalChoice
                      ? 'bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 border-zinc-400 dark:border-zinc-600'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-dashed border-zinc-300 dark:border-zinc-700'
                  }`}>
                    {rivalChoice ? (isRevealingWinner ? (rivalChoice === 'rock' ? '✊' : rivalChoice === 'paper' ? '✋' : '✌️') : '🔒') : '?'}
                  </div>
                  <div className="text-xs mt-1.5 text-zinc-600 dark:text-zinc-400 font-bold">
                    {rivalChoice ? '¡Listo!' : 'Pensando...'}
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 3 Interactive Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {RPS_OPTIONS.map((opt) => {
            const isSelected = myChoice === opt.key;
            return (
              <button
                key={opt.key}
                id={`rps-btn-${opt.key}`}
                onClick={() => onPick(opt.key)}
                disabled={Boolean(myChoice) || Boolean(isRevealingWinner)}
                className={`relative flex flex-col items-center justify-center py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-amber-500 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 scale-105 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
                    : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-amber-400 hover:bg-white dark:hover:bg-zinc-800 hover:scale-102'
                } ${myChoice && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="text-4xl mb-1.5 select-none transform transition-transform active:scale-90">
                  {opt.emoji}
                </span>
                <span className="font-display text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {opt.label}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-700/60">
                  Tecla [{opt.keyHint}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Local mode helper to choose rival option if testing hotseat */}
        {!isBotGame && onPickRival && (
          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-center gap-2">
            <span>Control de prueba ({roomState[rivalSlot].name}):</span>
            <div className="flex gap-1.5">
              {RPS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  id={`rival-rps-${opt.key}`}
                  onClick={() => onPickRival(opt.key)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-colors cursor-pointer"
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Game Button */}
        {onCancel && (
          <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-center">
            <button
              id="cancel-duel-btn"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800/70 dark:hover:bg-rose-950/40 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-300 border border-zinc-200 dark:border-zinc-700/80 hover:border-rose-300 dark:hover:border-rose-800 font-display font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Cancelar Juego</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
