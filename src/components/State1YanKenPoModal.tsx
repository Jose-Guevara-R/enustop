import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { PlayerId, RpsChoice, GameRoomState } from '../types.js';

interface YanKenPoModalProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onPick: (choice: 'rock' | 'paper' | 'scissors') => void;
  onPickRival?: (choice: 'rock' | 'paper' | 'scissors') => void;
  isBotGame?: boolean;
  onCancel?: () => void;
}

const RPS_OPTIONS = [
  { key: 'rock'     as const, emoji: '✊', label: 'Piedra', keyHint: '1' },
  { key: 'paper'    as const, emoji: '✋', label: 'Papel',  keyHint: '2' },
  { key: 'scissors' as const, emoji: '✌️', label: 'Tijera', keyHint: '3' },
];

export const State1YanKenPoModal: React.FC<YanKenPoModalProps> = ({
  roomState, mySlot, onPick, onPickRival, isBotGame, onCancel,
}) => {
  const effectiveSlot: PlayerId = mySlot === 'spectator' ? 'player1' : mySlot;
  const rivalSlot: PlayerId     = effectiveSlot === 'player1' ? 'player2' : 'player1';

  const myChoice    = roomState[effectiveSlot].rpsChoice;
  const rivalChoice = roomState[rivalSlot].rpsChoice;
  const lastResult  = roomState.lastRpsResult;

  const isRevealingWinner = lastResult && lastResult.winner && lastResult.winner !== 'tie';
  const isTie             = lastResult && lastResult.winner === 'tie';

  const emojiOf = (c: RpsChoice) =>
    !c ? '?' : c === 'rock' ? '✊' : c === 'paper' ? '✋' : '✌️';

  return (
    <div id="yan-ken-po-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white/95 dark:bg-[#121626]/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden text-center p-6 md:p-8"
      >
        {onCancel && (
          <button onClick={onCancel} title="Volver al menú"
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wide uppercase mb-3">
          <span>⚡</span>
          <span>Estado 1 • El Duelo — Ronda {roomState.round}</span>
        </div>

        <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5">
          Yan Ken Po
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          El ganador será <strong className="text-violet-600 dark:text-violet-400">El Marcador ✍️</strong> y el perdedor <strong className="text-teal-600 dark:text-teal-400">El Buscador 🔍</strong>.
        </p>

        {/* Duel Status Banner */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {isTie ? (
              <motion.div key="tie" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl text-amber-900 dark:text-amber-200 font-bold text-sm">
                ¡Empate! {roomState.player1.name}: {emojiOf(lastResult?.p1Choice ?? null)} vs {roomState.player2.name}: {emojiOf(lastResult?.p2Choice ?? null)}
                <div className="text-xs font-normal text-amber-700 dark:text-amber-400 mt-0.5">Repitiendo duelo…</div>
              </motion.div>
            ) : isRevealingWinner ? (
              <motion.div key="winner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border font-semibold shadow-md ${
                  lastResult.winner === effectiveSlot
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/15 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                    : 'bg-gradient-to-r from-indigo-500/15 to-indigo-500/15 border-indigo-400 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100'
                }`}>
                <div className="text-xl font-display font-black">
                  {lastResult.winner === effectiveSlot ? '🎉 ¡Ganaste el duelo!' : `👑 ¡Ganó ${roomState[lastResult.winner as PlayerId].name}!`}
                </div>
                <div className="text-sm mt-1 font-medium">
                  Tu rol: <span className="font-extrabold uppercase text-amber-600 dark:text-amber-400">
                    {lastResult.winner === effectiveSlot ? '✍️ EL MARCADOR' : '🔍 EL BUSCADOR'}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Iniciando Estado 2…</div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center gap-6 py-2">
                {/* My choice */}
                <div className="text-center">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Tú ({effectiveSlot === 'player1' ? 'J1' : 'J2'})</div>
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl transition-all duration-200 shadow-sm ${
                    myChoice ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900 border-amber-400 dark:border-amber-600 scale-105 shadow-md ring-2 ring-amber-400/40'
                             : 'bg-zinc-100 dark:bg-zinc-800 border-dashed border-zinc-300 dark:border-zinc-700'
                  }`}>{emojiOf(myChoice)}</div>
                  <div className="text-xs mt-1.5 text-zinc-600 dark:text-zinc-400 font-bold">{myChoice ? '¡Listo!' : 'Elige abajo'}</div>
                </div>

                <div className="font-display font-black text-xl text-zinc-400 dark:text-zinc-600">VS</div>

                {/* Rival's choice */}
                <div className="text-center">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Rival ({rivalSlot === 'player1' ? 'J1' : 'J2'})</div>
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl transition-all shadow-sm ${
                    rivalChoice ? 'bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 border-zinc-400 dark:border-zinc-600'
                                : 'bg-zinc-100 dark:bg-zinc-800 border-dashed border-zinc-300 dark:border-zinc-700'
                  }`}>{rivalChoice ? '🔒' : '?'}</div>
                  <div className="text-xs mt-1.5 text-zinc-600 dark:text-zinc-400 font-bold">{rivalChoice ? '¡Eligió!' : 'Esperando…'}</div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Choice buttons */}
        {!myChoice && !isRevealingWinner && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {RPS_OPTIONS.map(opt => (
              <motion.button
                key={opt.key}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                onClick={() => onPick(opt.key)}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer shadow-sm"
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="font-display font-black text-xs text-zinc-800 dark:text-zinc-200">{opt.label}</span>
                <kbd className="text-[9px] font-mono bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">{opt.keyHint}</kbd>
              </motion.button>
            ))}
          </div>
        )}

        {/* 2-player local mode: rival buttons */}
        {!isBotGame && onPickRival && !rivalChoice && !isRevealingWinner && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-2">
              Rival ({rivalSlot === 'player1' ? 'Jugador 1' : 'Jugador 2'}) elige:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RPS_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => onPickRival(opt.key)}
                  className="py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                  {opt.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MEJORA: historial de empates */}
        {roomState.rpsTieCount > 0 && (
          <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-600 font-semibold">
            Empates consecutivos: {roomState.rpsTieCount}
          </div>
        )}
      </motion.div>
    </div>
  );
};
