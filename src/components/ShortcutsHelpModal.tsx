import React from 'react';
import { X, Keyboard, HelpCircle, CheckCircle, ShieldCheck } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
  darkMode,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', desc: 'Elegir ✊ Piedra en Yan Ken Po' },
    { key: '2', desc: 'Elegir ✋ Papel en Yan Ken Po' },
    { key: '3', desc: 'Elegir ✌️ Tijera en Yan Ken Po' },
    { key: 'Espacio', desc: 'Marcar siguiente casilla [X] (Marcador)' },
    { key: 'D', desc: 'Alternar Modo Oscuro / Claro' },
    { key: 'M', desc: 'Activar / Silenciar Sonido' },
    { key: 'H', desc: 'Abrir / Cerrar Historial de Rondas' },
    { key: '?', desc: 'Abrir esta guía de atajos' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className={`relative w-full max-w-md rounded-3xl p-6 md:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border ${
        darkMode ? 'bg-[#121626]/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-800'
      }`}>
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-display font-extrabold text-base">Atajos de Teclado y Reglas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Table */}
        <div className="space-y-2 mb-5">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60"
            >
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{s.desc}</span>
              <kbd className="font-mono bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs text-zinc-800 dark:text-zinc-200">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Rules summary */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-2 shadow-xs">
          <div className="font-display font-black flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Reglas del Juego & Anti-Trampas</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            • <strong>Orden Secuencial:</strong> Las casillas del Marcador deben llenarse estrictamente de izquierda a derecha, fila por fila (1 a 48).
          </p>
          <p className="text-[11px] leading-relaxed">
            • <strong>Resolución de Latencia:</strong> Cuando el Buscador oprime STOP, el servidor sella el tiempo milimétrico (Time_Stop). Cualquier clic posterior queda anulado.
          </p>
          <p className="text-[11px] leading-relaxed">
            • <strong>Fin de Partida:</strong> Quien llene sus 48 casillas gana de inmediato, o bien quien tenga más casillas cuando se agoten los 35 números de la nube.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 font-display font-black text-xs hover:opacity-95 transition-opacity cursor-pointer shadow-md"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
};
