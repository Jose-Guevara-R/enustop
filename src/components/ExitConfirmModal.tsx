import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

// MEJORA: Confirmación antes de salir de una partida activa
export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({ isOpen, onConfirm, onCancel, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center ${
          darkMode ? 'bg-[#121626]/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-800'
        }`}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>

        <h3 className="font-display font-black text-xl mb-2 text-zinc-900 dark:text-zinc-100">¿Salir de la partida?</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Se perderá el progreso de la ronda actual. ¿Estás seguro de que quieres terminar el juego?
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-display font-black text-sm border border-zinc-300 dark:border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-display font-black text-sm shadow-lg transition-all cursor-pointer">
            Sí, salir
          </button>
        </div>
      </motion.div>
    </div>
  );
};
