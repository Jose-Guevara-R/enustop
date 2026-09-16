import React from 'react';
import { Volume2, VolumeX, Moon, Sun, Keyboard, History, Copy, Check, Users, ExternalLink, Bot, LogOut } from 'lucide-react';
import { GameState, PlayerId } from '../types.js';
import { soundManager } from '../utils/audio.js';

interface HeaderProps {
  roomId: string;
  gameState: GameState;
  round: number;
  mySlot: PlayerId | 'spectator';
  onSwitchSlot: (slot: PlayerId) => void;
  connected: boolean;
  isBotGame?: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenShortcuts: () => void;
  onOpenHistory: () => void;
  onStartBotGame?: () => void;
  onEndGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  gameState,
  round,
  mySlot,
  onSwitchSlot,
  connected,
  isBotGame,
  darkMode,
  onToggleDarkMode,
  soundMuted,
  onToggleSound,
  onOpenShortcuts,
  onOpenHistory,
  onStartBotGame,
  onEndGame,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyInviteLink = () => {
    const url = window.location.origin + window.location.pathname + '?room=' + roomId;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSecondPlayerTab = () => {
    const targetSlot = mySlot === 'player1' ? 'player2' : 'player1';
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}&slot=${targetSlot}`;
    window.open(url, '_blank');
  };

  const stateSteps: Array<{ key: GameState; label: string; num: string }> = [
    { key: 'rps', label: 'Yan Ken Po', num: '1' },
    { key: 'choose_number', label: 'Elección', num: '2' },
    { key: 'race', label: 'La Carrera', num: '3' },
    { key: 'stop', label: 'STOP / Timbre', num: '4' },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      darkMode
        ? 'bg-[#0E1322]/85 border-zinc-800/80 text-zinc-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]'
        : 'bg-white/90 border-zinc-200/80 text-zinc-800 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Title & Room Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="NumSTOP Logo"
              className="w-10 h-10 rounded-xl shadow-md ring-2 ring-amber-400/40 object-cover select-none"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-black text-lg md:text-xl tracking-tight leading-none text-slate-950 dark:text-white">
                  NumSTOP!
                </h1>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700">
                  DUELO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Agilidad Mental y Reflejos
              </p>
            </div>
          </div>

          {/* Room ID pill */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">Sala:</span>
            <span className="font-mono font-black text-slate-900 dark:text-slate-100">{roomId}</span>
            <button
              id="copy-invite-btn"
              onClick={copyInviteLink}
              title="Copiar enlace de invitación"
              className="p-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 4-Step Cycle Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium">
          {stateSteps.map((step) => {
            const isActive = gameState === step.key;
            return (
              <div
                key={step.key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-amber-600 shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {step.num}
                </span>
                <span className="hidden sm:inline font-bold">{step.label}</span>
              </div>
            );
          })}
          <div className="ml-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
            Ronda {round}
          </div>
        </div>

        {/* Player Switcher & Utility Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          {/* WhatsApp share invite button */}
          <a
            id="whatsapp-share-btn"
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `¡Hola! Te invito a un duelo en NumSTOP! 🔢⚡ ¿Quién tiene mejores reflejos? Entra a jugar aquí: ${window.location.origin}${window.location.pathname}?room=${roomId}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Compartir por WhatsApp para estudiantes"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <span className="text-sm leading-none">📱</span>
            <span className="hidden lg:inline text-[11px]">WhatsApp</span>
          </a>

          {/* Slot switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
            <button
              id="slot-p1-btn"
              onClick={() => onSwitchSlot('player1')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mySlot === 'player1'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-purple-500/40 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Jugador 1
            </button>
            <button
              id="slot-p2-btn"
              onClick={() => onSwitchSlot('player2')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mySlot === 'player2'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-emerald-500/40 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isBotGame ? 'IA Rival' : 'Jugador 2'}
            </button>
          </div>

          {/* Test 2nd player in new tab button */}
          <button
            id="open-rival-tab-btn"
            onClick={openSecondPlayerTab}
            title="Abrir Jugador 2 en otra pestaña para probar en tiempo real"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all flex items-center gap-1.5 text-xs font-semibold hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline text-[11px]">2do Jugador</span>
          </button>

          {/* Toggle sound */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleSound}
            title={soundMuted ? 'Activar Sonido (M)' : 'Silenciar Sonido (M)'}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>

          {/* Toggle dark mode */}
          <button
            id="dark-mode-btn"
            onClick={onToggleDarkMode}
            title="Alternar Modo Oscuro (D)"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* History drawer button */}
          <button
            id="history-btn"
            onClick={onOpenHistory}
            title="Historial de Rondas"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Shortcuts button */}
          <button
            id="shortcuts-btn"
            onClick={onOpenShortcuts}
            title="Atajos de teclado (?)"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Terminar Juego button (visible when game is active) */}
          {gameState !== 'lobby' && onEndGame && (
            <button
              id="end-game-header-btn"
              onClick={onEndGame}
              title="Terminar la partida y volver al lobby"
              className="ml-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 font-display font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminar Juego</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
