import React, { useState, useEffect, useCallback } from 'react';
import { useGameSync } from './hooks/useGameSync.js';
import { Header } from './components/Header.js';
import { CentralCloud } from './components/CentralCloud.js';
import { PlayerBoard } from './components/PlayerBoard.js';
import { State1YanKenPoModal } from './components/State1YanKenPoModal.js';
import { GameOverModal } from './components/GameOverModal.js';
import { HistoryDrawer } from './components/HistoryDrawer.js';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal.js';
import { LobbyScreen } from './components/LobbyScreen.js';
import { soundManager } from './utils/audio.js';
import { PlayerId } from './types.js';

export default function App() {
  // Read room and slot from URL parameters
  const getInitialParams = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const slotParam = params.get('slot');
      return {
        room: roomParam ? roomParam.toUpperCase() : 'ALFA',
        slot: (slotParam === 'player2' ? 'player2' : 'player1') as PlayerId,
      };
    }
    return { room: 'ALFA', slot: 'player1' as PlayerId };
  };

  const initial = getInitialParams();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [soundMuted, setSoundMuted] = useState<boolean>(() => soundManager.getMuted());
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    roomId,
    setRoomId,
    mySlot,
    setMySlot,
    roomState,
    connected,
    isLocalMode,
    notification,
    handleStartGame,
    handleRpsPick,
    handleChooseTarget,
    handleMarkCell,
    handleHitStop,
    handleRestartGame,
    handleEndGame,
    switchRoleSlot,
  } = useGameSync(initial.room);

  // Apply initial slot if provided in query
  useEffect(() => {
    if (initial.slot && initial.slot !== mySlot) {
      switchRoleSlot(initial.slot);
    }
  }, []);

  // Sync dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    const next = soundManager.toggleMute();
    setSoundMuted(next);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting inside text inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // RPS choices (1, 2, 3)
      if (roomState.state === 'rps') {
        if (e.key === '1') {
          handleRpsPick('rock');
        } else if (e.key === '2') {
          handleRpsPick('paper');
        } else if (e.key === '3') {
          handleRpsPick('scissors');
        }
      }

      // Keyboard actions in Race (Space for Marker, Space/Enter/S for Searcher STOP)
      if (roomState.state === 'race') {
        const effectiveSlot: PlayerId = mySlot === 'spectator' ? 'player1' : mySlot;
        if (roomState[effectiveSlot].role === 'marker' && e.code === 'Space') {
          e.preventDefault();
          const currentScore = roomState[effectiveSlot].score;
          if (currentScore < 48) {
            handleMarkCell(currentScore);
          }
        } else if (
          roomState[effectiveSlot].role === 'searcher' &&
          (e.code === 'Space' || e.key === 'Enter' || e.key === 's' || e.key === 'S') &&
          roomState.targetNumber
        ) {
          e.preventDefault();
          handleHitStop(Number(roomState.targetNumber));
        }
      }

      // Dark mode (D)
      if (e.key === 'd' || e.key === 'D') {
        toggleDarkMode();
      }

      // Mute (M)
      if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      }

      // History (H)
      if (e.key === 'h' || e.key === 'H') {
        setIsHistoryOpen((prev) => !prev);
      }

      // Help (?)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomState, mySlot, handleRpsPick, handleMarkCell, toggleDarkMode, toggleSound]);

  return (
    <div
      id="game-root"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden ${
        darkMode
          ? 'bg-[#0B0F19] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200'
          : 'bg-[#F6F7FB] text-zinc-800 selection:bg-amber-400/40 selection:text-amber-900'
      }`}
    >
      {/* Decorative ambient lighting blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30 transition-all duration-700 ${
            darkMode ? 'bg-violet-600/20' : 'bg-violet-400/25'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 transition-all duration-700 ${
            darkMode ? 'bg-amber-500/15' : 'bg-amber-300/25'
          }`}
        />
        <div
          className={`absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-700 ${
            darkMode ? 'bg-emerald-600/15' : 'bg-emerald-300/20'
          }`}
        />
      </div>

      {/* Header bar with status indicators and controls */}
      <Header
        roomId={roomId}
        gameState={roomState.state}
        round={roomState.round}
        mySlot={mySlot}
        onSwitchSlot={switchRoleSlot}
        connected={connected}
        isBotGame={roomState.isBotGame}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        soundMuted={soundMuted}
        onToggleSound={toggleSound}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onStartBotGame={() => handleStartGame(true)}
        onEndGame={handleEndGame}
      />

      {/* Ephemeral Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-zinc-900/95 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full text-xs font-bold shadow-2xl border border-zinc-700/50 backdrop-blur-md animate-bounce flex items-center gap-2">
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full">
        {roomState.state === 'lobby' ? (
          <LobbyScreen
            roomState={roomState}
            mySlot={mySlot}
            onStartGame={handleStartGame}
            onSwitchSlot={switchRoleSlot}
            roomId={roomId}
            onRoomChange={(newRoom) => {
              setRoomId(newRoom);
              const url = new URL(window.location.href);
              url.searchParams.set('room', newRoom);
              window.history.replaceState({}, '', url.toString());
            }}
            darkMode={darkMode}
          />
        ) : (
          /* Active Board Game Arena */
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 md:gap-6 items-start">
            
            {/* Player 1 Board (Left Column - Purple) */}
            <div className="w-full lg:col-span-3 order-2 lg:order-1">
              <PlayerBoard
                player={roomState.player1}
                isCurrentViewer={mySlot === 'player1'}
                gameState={roomState.state}
                onMarkCell={handleMarkCell}
                colorTheme="purple"
                darkMode={darkMode}
              />
            </div>

            {/* Central Cloud (Center Column - 35 Numbers) */}
            <div className="w-full lg:col-span-6 order-1 lg:order-2 flex flex-col items-center">
              <CentralCloud
                roomState={roomState}
                mySlot={mySlot}
                onChooseTarget={handleChooseTarget}
                onHitStop={handleHitStop}
                darkMode={darkMode}
              />
            </div>

            {/* Player 2 Board (Right Column - Emerald / Teal) */}
            <div className="w-full lg:col-span-3 order-3">
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

      {/* Modals and Overlays */}
      {/* Estado 1: Yan Ken Po Duelo Modal */}
      {roomState.state === 'rps' && (
        <State1YanKenPoModal
          roomState={roomState}
          mySlot={mySlot}
          onPick={(choice) => handleRpsPick(choice)}
          onPickRival={
            // In local/testing mode, allow picking for rival too
            !connected && !roomState.isBotGame
              ? (choice) => handleRpsPick(choice, mySlot === 'player1' ? 'player2' : 'player1')
              : undefined
          }
          isBotGame={roomState.isBotGame}
          onCancel={handleEndGame}
        />
      )}

      {/* Game Over Modal */}
      {roomState.state === 'game_over' && (
        <GameOverModal
          roomState={roomState}
          onRestart={handleRestartGame}
          onEndGame={handleEndGame}
          darkMode={darkMode}
        />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        roomState={roomState}
        darkMode={darkMode}
      />

      {/* Shortcuts & Rules Help Modal */}
      <ShortcutsHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
