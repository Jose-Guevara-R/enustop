import React from 'react';
import { Moon, Sun, Volume2, VolumeX, History, HelpCircle, LogOut, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { GameState, PlayerId } from '../types.js';

const STATE_STEPS = [
  { key: 'rps',           num: '1', label: 'Duelo' },
  { key: 'choose_number', num: '2', label: 'Elección' },
  { key: 'race',          num: '3', label: 'Carrera' },
  { key: 'stop',          num: '4', label: 'STOP' },
] as const;

interface HeaderProps {
  roomId: string;
  gameState: GameState;
  round: number;
  darkMode: boolean;
  onToggleDark: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHistory: () => void;
  onOpenShortcuts: () => void;
  onEndGame?: () => void;
  mySlot: PlayerId | 'spectator';
  onSwitchSlot: (slot: PlayerId) => void;
  connected: boolean;
  isLocalMode: boolean;
  reconnectAttempts: number;
  rivalDisconnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roomId, gameState, round, darkMode, onToggleDark,
  isMuted, onToggleMute, onOpenHistory, onOpenShortcuts,
  onEndGame, mySlot, onSwitchSlot, connected, isLocalMode,
  reconnectAttempts, rivalDisconnected,
}) => {
  const isInGame = gameState !== 'lobby' && gameState !== 'game_over';

  const openSecondTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    url.searchParams.set('slot', 'player2');
    window.open(url.toString(), '_blank');
  };

  return (
    <header className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 border-b sticky top-0 z-40 ${
      darkMode ? 'bg-[#0D1018]/95 border-zinc-800/80 backdrop-blur-xl' : 'bg-white/95 border-zinc-200/80 backdrop-blur-xl'
    }`}>
      {/* Left: Logo + Room */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-shrink-0 flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-base text-zinc-900 dark:text-white tracking-tight">NumSTOP!</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">DUELO</span>
          </div>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-500 font-semibold hidden sm:block">Agilidad Mental y Reflejos</span>
        </div>

        {/* Room pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-[10px] font-mono font-black text-zinc-700 dark:text-zinc-300">
          <span className="text-zinc-400 dark:text-zinc-600 font-sans">Sala:</span>
          <span>{roomId}</span>
        </div>

        {/* MEJORA: indicador de conexión */}
        <div className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          connected ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
          : isLocalMode ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
          : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
        }`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'Online' : isLocalMode ? 'Local' : `Recon. ${reconnectAttempts}/8`}
        </div>

        {/* MEJORA: aviso rival desconectado */}
        {rivalDisconnected && (
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 animate-pulse">
            ⚠️ Rival desconectado
          </div>
        )}
      </div>

      {/* Center: state steps (only in-game) */}
      {isInGame && (
        <div className="hidden lg:flex items-center gap-1.5">
          {STATE_STEPS.map(step => {
            const isActive = gameState === step.key;
            return (
              <div key={step.key} className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 dark:text-zinc-600'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                  isActive ? 'bg-white/30' : 'bg-zinc-200 dark:bg-zinc-700'
                }`}>{step.num}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
          <div className="ml-1 text-[10px] font-black text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            R{round}
          </div>
        </div>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Slot switcher */}
        {isInGame && (
          <div className="hidden sm:flex items-center gap-1 mr-1">
            {(['player1', 'player2'] as PlayerId[]).map(slot => (
              <button key={slot} onClick={() => onSwitchSlot(slot)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  mySlot === slot
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}>
                {slot === 'player1' ? 'J1' : 'J2'}
              </button>
            ))}
          </div>
        )}

        {/* Open 2nd tab */}
        {isInGame && (
          <button onClick={openSecondTab} title="Abrir como Jugador 2 en nueva pestaña"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* Mute */}
        <button onClick={onToggleMute} title={isMuted ? 'Activar sonido' : 'Silenciar'}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Dark mode */}
        <button onClick={onToggleDark} title="Modo oscuro/claro"
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* History */}
        {isInGame && (
          <button onClick={onOpenHistory} title="Historial de rondas (H)"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <History className="w-4 h-4" />
          </button>
        )}

        {/* Shortcuts */}
        <button onClick={onOpenShortcuts} title="Atajos y reglas (?)"
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* End game */}
        {isInGame && onEndGame && (
          <button onClick={onEndGame} title="Terminar partida"
            className="p-1.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
