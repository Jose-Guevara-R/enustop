import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useGameSync } from './hooks/useGameSync.js';
import { soundManager } from './utils/audio.js';
import { LobbyScreen }         from './components/LobbyScreen.js';
import { Header }               from './components/Header.js';
import { PlayerBoard }          from './components/PlayerBoard.js';
import { CentralCloud }         from './components/CentralCloud.js';
import { State1YanKenPoModal }  from './components/State1YanKenPoModal.js';
import { GameOverModal }        from './components/GameOverModal.js';
import { HistoryDrawer }        from './components/HistoryDrawer.js';
import { ShortcutsHelpModal }   from './components/ShortcutsHelpModal.js';
import { RoundTransition }      from './components/RoundTransition.js';
import { ExitConfirmModal }     from './components/ExitConfirmModal.js';
import { BotDifficulty } from './types.js';

// MEJORA: leer dark-mode persistido
function getInitialDark() {
  try {
    const saved = localStorage.getItem('numstop_dark_mode');
    if (saved !== null) return JSON.parse(saved);
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

// MEJORA: leer sala y puesto de la URL
function getRoomFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') ?? 'ALFA';
  } catch {
    return 'ALFA';
  }
}

function getSlotFromUrl(): 'player1' | 'player2' {
  try {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('slot');
    if (s === 'player2') return 'player2';
  } catch {}
  return 'player1';
}

export default function App() {
  const [darkMode, setDarkMode]         = useState(getInitialDark);
  const [isMuted, setIsMuted]           = useState(soundManager.getMuted());
  const [showHistory, setShowHistory]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const {
    roomId, setRoomId,
    mySlot,
    roomState,
    connected, isLocalMode,
    reconnectAttempts,
    rivalDisconnected,
    notification,
    handleStartGame,
    handleRpsPick,
    handleChooseTarget,
    handleMarkCell,
    handleHitStop,
    handleRestartGame,
    handleEndGame,
    switchRoleSlot,
  } = useGameSync(getRoomFromUrl(), getSlotFromUrl());

  // MEJORA: persistir darkMode en localStorage
  useEffect(() => {
    try { localStorage.setItem('numstop_dark_mode', JSON.stringify(darkMode)); } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // MEJORA: advertir antes de cerrar si hay partida activa
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (roomState.state !== 'lobby' && roomState.state !== 'game_over') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [roomState.state]);

  // ── KEYBOARD SHORTCUTS ──────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1': if (roomState.state === 'rps') handleRpsPick('rock');     break;
        case '2': if (roomState.state === 'rps') handleRpsPick('paper');    break;
        case '3': if (roomState.state === 'rps') handleRpsPick('scissors'); break;
        case ' ':
        case 'Space':
          e.preventDefault();
          if (roomState.state === 'race') {
            const slot = mySlot === 'spectator' ? 'player1' : mySlot;
            if (roomState[slot].role === 'marker') {
              handleMarkCell(roomState[slot].score);
            }
          }
          break;
        case 'd':
        case 'D':
          setDarkMode((dm: boolean) => !dm);
          break;
        case 'm':
        case 'M': {
          const muted = soundManager.toggleMute();
          setIsMuted(muted);
          break;
        }
        case 'h':
        case 'H':
          setShowHistory(s => !s);
          break;
        case '?':
        case '/':
          setShowShortcuts(s => !s);
          break;
        case 'Escape':
          setShowHistory(false);
          setShowShortcuts(false);
          setShowExitConfirm(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roomState, mySlot, handleRpsPick, handleMarkCell]);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleRoomChange = (newRoom: string) => {
    setRoomId(newRoom);
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoom);
    window.history.replaceState({}, '', url.toString());
  };

  // MEJORA: confirmación antes de terminar partida activa
  const handleEndGameRequest = () => {
    if (roomState.state !== 'lobby' && roomState.state !== 'game_over') {
      setShowExitConfirm(true);
    } else {
      handleEndGame();
    }
  };

  const handleExitConfirmed = () => {
    setShowExitConfirm(false);
    handleEndGame();
  };

  const isInGame = roomState.state !== 'lobby' && roomState.state !== 'game_over';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      darkMode
        ? 'bg-gradient-to-br from-[#090C14] via-[#0D1120] to-[#070A12] text-zinc-100'
        : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-zinc-900'
    }`}>
      {/* ── HEADER ── */}
      <Header
        roomId={roomId}
        gameState={roomState.state}
        round={roomState.round}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((dm: boolean) => !dm)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenHistory={() => setShowHistory(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onEndGame={isInGame ? handleEndGameRequest : undefined}
        mySlot={mySlot}
        onSwitchSlot={switchRoleSlot}
        connected={connected}
        isLocalMode={isLocalMode}
        reconnectAttempts={reconnectAttempts}
        rivalDisconnected={rivalDisconnected}
      />

      {/* ── NOTIFICATION TOAST ── */}
      <AnimatePresence>
        {notification && (
          <div key="toast" className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-sm font-bold shadow-xl border border-white/10 dark:border-zinc-300/30 backdrop-blur-md pointer-events-none animate-slide-up">
            {notification}
          </div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col">
        {roomState.state === 'lobby' ? (
          <LobbyScreen
            roomState={roomState}
            mySlot={mySlot}
            onStartGame={(isBot: boolean, difficulty?: BotDifficulty) => handleStartGame(isBot, difficulty)}
            onSwitchSlot={switchRoleSlot}
            roomId={roomId}
            onRoomChange={handleRoomChange}
            darkMode={darkMode}
            connected={connected}
            reconnectAttempts={reconnectAttempts}
          />
        ) : (
          /* ── GAME ARENA ── */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 p-3 md:p-4 max-w-[1400px] mx-auto w-full">

            {/* Player 1 Board */}
            <div className="order-2 lg:order-1">
              <PlayerBoard
                player={roomState.player1}
                isCurrentViewer={mySlot === 'player1'}
                gameState={roomState.state}
                onMarkCell={handleMarkCell}
                colorTheme="purple"
                darkMode={darkMode}
              />
            </div>

            {/* Central Cloud */}
            <div className="order-1 lg:order-2 w-full lg:w-[340px] xl:w-[420px] flex flex-col items-center">
              <CentralCloud
                roomState={roomState}
                mySlot={mySlot}
                onChooseTarget={handleChooseTarget}
                onHitStop={handleHitStop}
                darkMode={darkMode}
              />
            </div>

            {/* Player 2 Board */}
            <div className="order-3">
              <PlayerBoard
                player={roomState.player2}
                isCurrentViewer={mySlot === 'player2'}
                gameState={roomState.state}
                onMarkCell={handleMarkCell}
                colorTheme="olive"
                darkMode={darkMode}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── OVERLAYS ── */}

      {/* Yan Ken Po Modal */}
      <AnimatePresence>
        {roomState.state === 'rps' && (
          <State1YanKenPoModal
            key="rps-modal"
            roomState={roomState}
            mySlot={mySlot}
            onPick={handleRpsPick}
            onPickRival={isLocalMode && !roomState.isBotGame ? (c) => handleRpsPick(c, mySlot === 'player1' ? 'player2' : 'player1') : undefined}
            isBotGame={roomState.isBotGame}
            onCancel={handleEndGameRequest}
          />
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {roomState.state === 'game_over' && (
          <GameOverModal
            key="game-over"
            roomState={roomState}
            mySlot={mySlot}
            onRestart={handleRestartGame}
            onEndGame={handleEndGame}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* MEJORA: Round Transition overlay */}
      <RoundTransition roomState={roomState} show={roomState.state === 'stop'} />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        roomState={roomState}
        darkMode={darkMode}
        connected={connected}
        isLocalMode={isLocalMode}
      />

      {/* Shortcuts Modal */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        darkMode={darkMode}
      />

      {/* MEJORA: Exit Confirm Modal */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onConfirm={handleExitConfirmed}
        onCancel={() => setShowExitConfirm(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
