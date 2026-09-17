import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameRoomState } from '../types.js';

interface RoundTransitionProps {
  roomState: GameRoomState;
  show: boolean;
}

// MEJORA: Animación de transición dramática entre rondas
export const RoundTransition: React.FC<RoundTransitionProps> = ({ roomState, show }) => {
  if (!show || roomState.state !== 'stop' || !roomState.stopDetails) return null;

  const { stoppedBy, targetNumber, marksThisRound, elapsedMs } = roomState.stopDetails;
  const stopperName = roomState[stoppedBy].name;

  return (
    <AnimatePresence>
      <motion.div
        key="round-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      >
        {/* Background flash */}
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-rose-600/20 to-purple-600/20"
        />

        {/* Central card */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white/95 dark:bg-zinc-900/95 rounded-3xl p-8 text-center shadow-2xl border border-white/40 dark:border-zinc-700/60 max-w-sm mx-4"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl mb-3"
          >
            🔔
          </motion.div>
          <div className="font-display font-black text-3xl text-zinc-900 dark:text-white mb-1">
            ¡STOP!
          </div>
          <div className="text-base font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            <span className="text-amber-600 dark:text-amber-400 font-black">{stopperName}</span> encontró el{' '}
            <span className="text-rose-600 dark:text-rose-400 font-black">#{targetNumber}</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <div className="font-black text-2xl text-violet-600 dark:text-violet-400">+{marksThisRound}</div>
              <div className="text-xs text-zinc-500">casillas</div>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <div className="font-black text-2xl text-emerald-600 dark:text-emerald-400">{(elapsedMs / 1000).toFixed(1)}s</div>
              <div className="text-xs text-zinc-500">duración</div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-4 text-xs text-zinc-400 dark:text-zinc-600 font-semibold"
          >
            Siguiente ronda en instantes…
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
