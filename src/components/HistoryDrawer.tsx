import React from 'react';
import { X, History, Trophy, Clock, Search, Edit3 } from 'lucide-react';
import { GameRoomState } from '../types.js';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomState: GameRoomState;
  darkMode: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  roomState,
  darkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div
        id="history-drawer-panel"
        className={`w-full max-w-md h-full shadow-2xl flex flex-col border-l transition-colors ${
          darkMode ? 'bg-[#121626]/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-800'
        } backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-display font-extrabold text-base">Historial de Rondas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {roomState.history.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">
              <History className="w-12 h-12 mx-auto mb-3 opacity-25 text-amber-500" />
              <p className="font-bold text-zinc-700 dark:text-zinc-300">No hay rondas completadas aún</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                El historial detallado se registrará automáticamente cada vez que alguien grite STOP.
              </p>
            </div>
          ) : (
            roomState.history.map((h, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border transition-all ${
                  darkMode ? 'bg-zinc-800/50 border-zinc-700/60' : 'bg-zinc-50/80 border-zinc-200'
                } shadow-xs`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="font-display font-black text-amber-600 dark:text-amber-400 text-sm">
                    Ronda #{h.round}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-700/60">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {(h.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Edit3 className="w-3.5 h-3.5 text-violet-500" /> Marcador:
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                      {roomState[h.marker].name} (+{h.marksGained} casillas)
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Search className="w-3.5 h-3.5 text-teal-500" /> Buscador:
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                      {roomState[h.searcher].name}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                    <span className="text-zinc-500 font-medium">Número Objetivo:</span>
                    <span className="font-display font-black bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg text-amber-800 dark:text-amber-300">
                      #{h.targetNumber}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 text-center font-medium">
          Sincronización en tiempo real • Sala <strong className="font-mono text-amber-600 dark:text-amber-400">{roomState.roomId}</strong>
        </div>
      </div>
    </div>
  );
};
