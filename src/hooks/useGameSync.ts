import { useState, useEffect, useRef, useCallback } from 'react';
import { GameRoomState, PlayerId, RpsChoice, ServerMessage, ClientAction } from '../types.js';
import { soundManager } from '../utils/audio.js';
import { createInitialCloud } from '../utils/cloudGenerator.js';

export function useGameSync(initialRoomId: string = 'ALFA') {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [mySlot, setMySlot] = useState<PlayerId | 'spectator'>('player1');
  const [roomState, setRoomState] = useState<GameRoomState>(() => ({
    roomId: initialRoomId,
    state: 'lobby',
    round: 1,
    player1: {
      id: 'player1',
      name: 'Jugador 1',
      connected: true,
      role: null,
      rpsChoice: null,
      score: 0,
      cells: Array(48).fill(false),
    },
    player2: {
      id: 'player2',
      name: 'Jugador 2',
      connected: false,
      role: null,
      rpsChoice: null,
      score: 0,
      cells: Array(48).fill(false),
    },
    cloud: createInitialCloud(),
    targetNumber: null,
    raceStartTime: null,
    timeStop: null,
    rpsTieCount: 0,
    lastRpsResult: null,
    stopDetails: null,
    winner: null,
    winReason: null,
    history: [],
    createdAt: Date.now(),
    isBotGame: false,
  }));

  const [connected, setConnected] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((msg: string, durationMs: number = 3000) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, durationMs);
  }, []);

  // Send message over WebSocket
  const sendAction = useCallback((action: ClientAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
      return true;
    }
    return false;
  }, []);

  // Connect to WebSocket server
  useEffect(() => {
    let unmounted = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    function connect() {
      if (unmounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setConnected(true);
          setIsLocalMode(false);
          // Join room
          ws.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              roomId: roomId,
              preferredSlot: mySlot,
            })
          );

          // Heartbeat
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          pingTimerRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data) as ServerMessage;

            if (data.type === 'ROOM_STATE') {
              setRoomState(data.state);
              if (data.yourSlot) {
                setMySlot(data.yourSlot);
              }
            } else if (data.type === 'RPS_TIE') {
              soundManager.playTie();
              showNotification(data.message, 1500);
            } else if (data.type === 'RPS_WIN') {
              soundManager.playWinDuel();
            } else if (data.type === 'TARGET_CHOSEN') {
              soundManager.playStampClick();
            } else if (data.type === 'CELL_MARKED') {
              soundManager.playStampClick();
            } else if (data.type === 'STOP_TRIGGERED') {
              soundManager.playDeskBell();
            } else if (data.type === 'GAME_OVER') {
              soundManager.playGameOver();
            }
          } catch {
            // Ignore non-json
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setConnected(false);
          // Retry connection after 2 seconds
          setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          if (unmounted) return;
          // If WS fails, enable local mode option
          setConnected(false);
        };
      } catch {
        setConnected(false);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, showNotification]);

  // LOCAL / OFFLINE ENGINE (Fallback & Bot Mode)
  // Guarantees zero friction if user tests without 2nd device or when offline
  const runLocalBot = useCallback((state: GameRoomState) => {
    if (!state.isBotGame) return;

    if (state.state === 'rps' && !state.player2.rpsChoice) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = setTimeout(() => {
        const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
        const pick = choices[Math.floor(Math.random() * choices.length)];
        handleRpsPick(pick, 'player2');
      }, 500 + Math.random() * 400);
    } else if (state.state === 'choose_number' && state.player2.role === 'marker') {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = setTimeout(() => {
        const available = state.cloud.filter((c) => c.status === 'available');
        if (available.length > 0) {
          const chosen = available[Math.floor(Math.random() * available.length)];
          handleChooseTarget(chosen.id);
        }
      }, 1000);
    } else if (state.state === 'race') {
      if (state.player2.role === 'marker') {
        const step = () => {
          setRoomState((prev) => {
            if (prev.state !== 'race' || prev.player2.role !== 'marker') return prev;
            const current = prev.player2.score;
            if (current >= 48) return prev;
            const nextCells = [...prev.player2.cells];
            nextCells[current] = true;
            soundManager.playStampClick();
            const nextScore = current + 1;
            if (nextScore >= 48) {
              return {
                ...prev,
                player2: { ...prev.player2, score: 48, cells: nextCells },
                state: 'game_over',
                winner: 'player2',
                winReason: 'cells_completed',
              };
            }
            return {
              ...prev,
              player2: { ...prev.player2, score: nextScore, cells: nextCells },
            };
          });
          botTimerRef.current = setTimeout(step, 280 + Math.random() * 100);
        };
        botTimerRef.current = setTimeout(step, 400);
      } else if (state.player2.role === 'searcher' && state.targetNumber) {
        const target = state.targetNumber;
        const delay = 2500 + Math.random() * 2500;
        botTimerRef.current = setTimeout(() => {
          handleHitStop(target, 'player2');
        }, delay);
      }
    }
  }, []);

  // CLIENT ACTION DISPATCHERS (Send via WebSocket or run in local state)
  const handleStartGame = useCallback((isBot: boolean = false) => {
    if (connected) {
      sendAction({ type: 'START_GAME', isBotGame: isBot });
    } else {
      setIsLocalMode(true);
      setRoomState((prev) => {
        const next: GameRoomState = {
          ...prev,
          state: 'rps',
          isBotGame: isBot,
          player2: {
            ...prev.player2,
            name: isBot ? 'IA Rival' : 'Jugador 2',
            connected: true,
          },
        };
        runLocalBot(next);
        return next;
      });
    }
  }, [connected, sendAction, runLocalBot]);

  const handleRpsPick = useCallback((choice: 'rock' | 'paper' | 'scissors', overrideSlot?: PlayerId) => {
    const slot = overrideSlot || (mySlot === 'spectator' ? 'player1' : mySlot);
    soundManager.playRpsPick();

    if (connected && !overrideSlot) {
      sendAction({ type: 'RPS_PICK', choice });
    } else {
      // Local execution
      setRoomState((prev) => {
        if (prev.state !== 'rps') return prev;
        const nextP1 = slot === 'player1' ? choice : prev.player1.rpsChoice;
        const nextP2 = slot === 'player2' ? choice : prev.player2.rpsChoice;

        let nextState: GameRoomState = {
          ...prev,
          player1: { ...prev.player1, rpsChoice: nextP1 },
          player2: { ...prev.player2, rpsChoice: nextP2 },
        };

        if (nextP1 && nextP2) {
          if (nextP1 === nextP2) {
            // Tie
            soundManager.playTie();
            showNotification('¡Empate en Yan Ken Po! Vuelvan a elegir...', 1200);
            setTimeout(() => {
              setRoomState((cur) => {
                if (cur.state !== 'rps') return cur;
                const cleared: GameRoomState = {
                  ...cur,
                  player1: { ...cur.player1, rpsChoice: null },
                  player2: { ...cur.player2, rpsChoice: null },
                  rpsTieCount: cur.rpsTieCount + 1,
                };
                if (cleared.isBotGame) runLocalBot(cleared);
                return cleared;
              });
            }, 1000);
          } else {
            // Winner determined
            const p1Wins =
              (nextP1 === 'rock' && nextP2 === 'scissors') ||
              (nextP1 === 'paper' && nextP2 === 'rock') ||
              (nextP1 === 'scissors' && nextP2 === 'paper');

            const winner: PlayerId = p1Wins ? 'player1' : 'player2';
            const loser: PlayerId = p1Wins ? 'player2' : 'player1';
            soundManager.playWinDuel();

            nextState = {
              ...nextState,
              [winner]: { ...nextState[winner], role: 'marker' },
              [loser]: { ...nextState[loser], role: 'searcher' },
              lastRpsResult: { p1Choice: nextP1, p2Choice: nextP2, winner },
            };

            setTimeout(() => {
              setRoomState((cur) => {
                if (cur.state !== 'rps') return cur;
                const intoChoose: GameRoomState = {
                  ...cur,
                  state: 'choose_number',
                  targetNumber: null,
                  player1: { ...cur.player1, rpsChoice: null },
                  player2: { ...cur.player2, rpsChoice: null },
                };
                if (intoChoose.isBotGame) runLocalBot(intoChoose);
                return intoChoose;
              });
            }, 1400);
          }
        }
        return nextState;
      });
    }
  }, [connected, mySlot, sendAction, showNotification, runLocalBot]);

  const handleChooseTarget = useCallback((targetNumber: number) => {
    soundManager.playStampClick();
    if (connected) {
      sendAction({ type: 'CHOOSE_TARGET', number: targetNumber });
    } else {
      setRoomState((prev) => {
        if (prev.state !== 'choose_number') return prev;
        const next: GameRoomState = {
          ...prev,
          targetNumber,
          state: 'race',
          raceStartTime: Date.now(),
          timeStop: null,
        };
        if (next.isBotGame) runLocalBot(next);
        return next;
      });
    }
  }, [connected, sendAction, runLocalBot]);

  const handleMarkCell = useCallback((cellIndex: number) => {
    const slot = mySlot === 'spectator' ? 'player1' : mySlot;
    if (roomState.state !== 'race') return;
    if (roomState[slot].role !== 'marker') return;

    // Strict sequential rule: cellIndex must match current score
    if (cellIndex !== roomState[slot].score) return;

    const timestamp = Date.now();
    soundManager.playStampClick();

    if (connected) {
      sendAction({
        type: 'MARK_CELL',
        cellIndex,
        clientTimestamp: timestamp,
      });
    } else {
      setRoomState((prev) => {
        if (prev.state !== 'race') return prev;
        if (prev.timeStop !== null) return prev;
        const curScore = prev[slot].score;
        if (cellIndex !== curScore) return prev;

        const nextCells = [...prev[slot].cells];
        nextCells[cellIndex] = true;
        const nextScore = curScore + 1;

        if (nextScore >= 48) {
          soundManager.playGameOver();
          return {
            ...prev,
            [slot]: { ...prev[slot], score: 48, cells: nextCells },
            state: 'game_over',
            winner: slot,
            winReason: 'cells_completed',
          };
        }

        return {
          ...prev,
          [slot]: { ...prev[slot], score: nextScore, cells: nextCells },
        };
      });
    }
  }, [connected, mySlot, roomState, sendAction]);

  const handleHitStop = useCallback((number: number, overrideSlot?: PlayerId) => {
    const slot = overrideSlot || (mySlot === 'spectator' ? 'player1' : mySlot);
    if (roomState.state !== 'race') return;
    if (roomState[slot].role !== 'searcher') return;
    if (number !== roomState.targetNumber) return;

    const stopTime = Date.now();
    soundManager.playDeskBell();

    if (connected && !overrideSlot) {
      sendAction({
        type: 'HIT_STOP',
        number,
        clientTimestamp: stopTime,
      });
    } else {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      setRoomState((prev) => {
        if (prev.state !== 'race') return prev;
        const markerSlot: PlayerId = prev.player1.role === 'marker' ? 'player1' : 'player2';
        const marker = prev[markerSlot];

        // Update cloud
        const nextCloud = prev.cloud.map((c) =>
          c.id === number ? { ...c, status: 'used' as const } : c
        );

        const duration = prev.raceStartTime ? stopTime - prev.raceStartTime : 0;
        const historyItem = {
          round: prev.round,
          rpsWinner: markerSlot,
          marker: markerSlot,
          searcher: slot,
          targetNumber: number,
          marksGained: marker.score,
          durationMs: duration,
          timeStop: stopTime,
        };

        const availableLeft = nextCloud.filter((c) => c.status === 'available').length;

        // Check game over
        let finalWinner: PlayerId | 'tie' | null = null;
        let winReason: 'cells_completed' | 'cloud_depleted' | null = null;

        if (marker.score >= 48) {
          finalWinner = markerSlot;
          winReason = 'cells_completed';
        } else if (availableLeft === 0) {
          winReason = 'cloud_depleted';
          if (prev.player1.score > prev.player2.score) finalWinner = 'player1';
          else if (prev.player2.score > prev.player1.score) finalWinner = 'player2';
          else finalWinner = 'tie';
        }

        if (finalWinner) {
          soundManager.playGameOver();
          return {
            ...prev,
            cloud: nextCloud,
            state: 'game_over',
            winner: finalWinner,
            winReason,
            history: [...prev.history, historyItem],
          };
        }

        // Return to RPS after 2.2s
        if (localTransitionTimerRef.current) clearTimeout(localTransitionTimerRef.current);
        localTransitionTimerRef.current = setTimeout(() => {
          setRoomState((curr) => {
            if (curr.state !== 'stop') return curr;
            const nextRoundState: GameRoomState = {
              ...curr,
              round: curr.round + 1,
              state: 'rps',
              player1: { ...curr.player1, role: null, rpsChoice: null },
              player2: { ...curr.player2, role: null, rpsChoice: null },
              targetNumber: null,
              raceStartTime: null,
              timeStop: null,
              stopDetails: null,
              lastRpsResult: null,
            };
            if (nextRoundState.isBotGame) runLocalBot(nextRoundState);
            return nextRoundState;
          });
        }, 2200);

        return {
          ...prev,
          cloud: nextCloud,
          state: 'stop',
          timeStop: stopTime,
          stopDetails: {
            stoppedBy: slot,
            targetNumber: number,
            marksThisRound: marker.score,
            elapsedMs: duration,
          },
          history: [...prev.history, historyItem],
        };
      });
    }
  }, [connected, mySlot, roomState, sendAction, runLocalBot]);

  const handleRestartGame = useCallback(() => {
    if (connected) {
      sendAction({ type: 'RESTART_GAME' });
    } else {
      const fresh = {
        ...roomState,
        state: 'rps' as const,
        round: 1,
        cloud: createInitialCloud(),
        targetNumber: null,
        raceStartTime: null,
        timeStop: null,
        winner: null,
        winReason: null,
        history: [],
        player1: { ...roomState.player1, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null },
        player2: { ...roomState.player2, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null },
        stopDetails: null,
        lastRpsResult: null,
      };
      setRoomState(fresh);
      if (fresh.isBotGame) runLocalBot(fresh);
    }
  }, [connected, roomState, sendAction, runLocalBot]);

  const handleEndGame = useCallback(() => {
    if (connected) {
      sendAction({ type: 'END_GAME' });
    } else {
      if (localTransitionTimerRef.current) clearTimeout(localTransitionTimerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      const fresh = {
        ...roomState,
        state: 'lobby' as const,
        round: 1,
        cloud: createInitialCloud(),
        targetNumber: null,
        raceStartTime: null,
        timeStop: null,
        winner: null,
        winReason: null,
        history: [],
        player1: { ...roomState.player1, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null },
        player2: { ...roomState.player2, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null },
        stopDetails: null,
        lastRpsResult: null,
      };
      setRoomState(fresh);
    }
  }, [connected, roomState, sendAction]);

  const switchRoleSlot = useCallback((slot: PlayerId) => {
    setMySlot(slot);
    if (connected) {
      sendAction({
        type: 'JOIN_ROOM',
        roomId,
        preferredSlot: slot,
      });
    }
  }, [connected, roomId, sendAction]);

  return {
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
  };
}
