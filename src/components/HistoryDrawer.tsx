import React from 'react';
import { X, Clock, Target, AlertTriangle } from 'lucide-react';
import { GameRoomState } from '../types.js';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomState: GameRoomState;
  darkMode: boolean;
  connected?: boolean;
  isLocalMode?: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  roomState,
  darkMode,
  connected = false,
  isLocalMode = true,
}) => {
  if (!isOpen) return null;

  const { history } = roomState;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className={`relative w-full max-w-sm h-full flex flex-col shadow-2xl border-l animate-slide-up ${
        darkMode ? 'bg-[#0D1018] border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          darkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-500 flex items-center justify-center border border-violet-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-zinc-900 dark:text-zinc-100">Historial</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500">{history.length} ronda{history.length !== 1 ? 's' : ''} completadas</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">📋</div>
              <p className="font-display font-black text-zinc-600 dark:text-zinc-400">Sin rondas aún</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-[200px] leading-relaxed">
                El historial se registra cuando alguien grita ¡STOP!
              </p>
            </div>
          ) : (
            [...history].reverse().map((h, i) => (
              <div key={i} className={`p-3.5 rounded-2xl border text-xs ${
                darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-black text-sm text-zinc-900 dark:text-zinc-100">
                    Ronda #{h.round}
                  </span>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    {(h.durationMs / 1000).toFixed(1)}s
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">✍️ Marcador:</span>
                    <span className="font-bold text-violet-700 dark:text-violet-300">
                      {roomState[h.marker].name} <span className="text-zinc-400">(+{h.marksGained})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">🔍 Buscador:</span>
                    <span className="font-bold text-teal-700 dark:text-teal-300">{roomState[h.searcher].name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Número objetivo:
                    </span>
                    <span className="font-mono font-black text-base text-zinc-900 dark:text-white">#{h.targetNumber}</span>
                  </div>
                  {/* MEJORA: mostrar errores de la ronda */}
                  {h.wrongClicks > 0 && (
                    <div className="flex items-center justify-between text-red-500 dark:text-red-400">
                      <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Clics erróneos:</span>
                      <span className="font-bold">{h.wrongClicks}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t text-center text-[10px] text-zinc-500 dark:text-zinc-600 font-semibold ${
          darkMode ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          Sala {roomState.roomId} • {connected ? '🟢 Online' : isLocalMode ? '🟡 Local' : '🔴 Reconectando'}
        </div>
      </div>
    </div>
  );
};
