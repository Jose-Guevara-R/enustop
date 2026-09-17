// ============================================================
// useGameSync — v3 con BroadcastChannel y mejoras de auditoría
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameRoomState, PlayerId, RpsChoice, ServerMessage,
  ClientAction, BotDifficulty,
} from '../types.js';
import { soundManager } from '../utils/audio.js';
import { createInitialCloud } from '../utils/cloudGenerator.js';
import { recordFastStop } from '../utils/stats.js';

// Tiempos de búsqueda del bot por dificultad
const BOT_SEARCH_DELAY: Record<BotDifficulty, [number, number]> = {
  easy:   [6000, 3000],  // 6–9s
  normal: [2600, 2600],  // 2.6–5.2s
  hard:   [800,  1200],  // 0.8–2s
};
const BOT_MARK_DELAY: Record<BotDifficulty, [number, number]> = {
  easy:   [500, 200],
  normal: [240, 120],
  hard:   [120, 60],
};

function makeInitialState(roomId: string, initialSlot: PlayerId = 'player1'): GameRoomState {
  return {
    roomId,
    state: 'lobby',
    round: 1,
    player1: {
      id: 'player1',
      name: 'Jugador 1',
      connected: initialSlot === 'player1',
      role: null,
      rpsChoice: null,
      score: 0,
      cells: Array(48).fill(false),
      penalties: 0,
    },
    player2: {
      id: 'player2',
      name: 'Jugador 2',
      connected: initialSlot === 'player2',
      role: null,
      rpsChoice: null,
      score: 0,
      cells: Array(48).fill(false),
      penalties: 0,
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
    botDifficulty: 'normal',
    wrongClicksThisRound: 0,
  };
}

export function useGameSync(initialRoomId: string = 'ALFA', initialSlot: PlayerId = 'player1') {
  const [roomId, setRoomId]           = useState(initialRoomId);
  const [mySlot, setMySlot]           = useState<PlayerId | 'spectator'>(initialSlot);
  const [roomState, setRoomState]     = useState<GameRoomState>(() => makeInitialState(initialRoomId, initialSlot));
  const [connected, setConnected]     = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [rivalDisconnected, setRivalDisconnected] = useState(false);

  const wsRef                   = useRef<WebSocket | null>(null);
  const pingTimerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcRef                   = useRef<BroadcastChannel | null>(null);
  const MAX_RECONNECT = 4;

  const showNotification = useCallback((msg: string, durationMs = 3000) => {
    setNotification(msg);
    setTimeout(() => setNotification(prev => prev === msg ? null : prev), durationMs);
  }, []);

  // Emisión por BroadcastChannel para soporte multi-pestaña local
  const broadcastState = useCallback((state: GameRoomState, sound?: string) => {
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'BC_STATE',
        state,
        originSlot: mySlot,
        sound,
      });
    }
  }, [mySlot]);

  const sendAction = useCallback((action: ClientAction): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
      return true;
    }
    return false;
  }, []);

  // ── BROADCAST CHANNEL (MULTI-PESTAÑA LOCAL) ──────────────
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channelName = `numstop_room_${roomId}`;
    const bc = new BroadcastChannel(channelName);
    bcRef.current = bc;

    bc.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'BC_HELLO') {
        const incomingSlot = data.slot as PlayerId;
        setRivalDisconnected(false);

        // If the incoming tab has the same slot as me, assign it the opposite slot!
        const assignedSlotForOther: PlayerId = (incomingSlot === mySlot)
          ? (mySlot === 'player1' ? 'player2' : 'player1')
          : incomingSlot;

        setRoomState(prev => {
          const myKey = mySlot === 'spectator' ? 'player1' : mySlot;
          const next = {
            ...prev,
            [myKey]: { ...prev[myKey], connected: true },
            [assignedSlotForOther]: { ...prev[assignedSlotForOther], connected: true },
          };
          bc.postMessage({
            type: 'BC_WELCOME',
            slot: mySlot,
            assignSlot: assignedSlotForOther,
            state: next,
          });
          return next;
        });
      } else if (data.type === 'BC_WELCOME') {
        setRivalDisconnected(false);
        if (data.assignSlot && data.assignSlot !== mySlot) {
          setMySlot(data.assignSlot);
          showNotification(`Asignado automáticamente como ${data.assignSlot === 'player1' ? 'Jugador 1' : 'Jugador 2'}`, 2500);
        }
        setRoomState(prev => {
          const actualSlot = data.assignSlot || (mySlot === 'spectator' ? 'player1' : mySlot);
          const otherSlot = data.slot as PlayerId;
          return {
            ...data.state,
            [actualSlot]: { ...data.state[actualSlot], connected: true },
            [otherSlot]: { ...data.state[otherSlot], connected: true },
          };
        });
      } else if (data.type === 'BC_SWAP_SLOTS') {
        // Rival picked data.senderSlot, so this tab automatically switches to data.receiverSlot!
        setRivalDisconnected(false);
        setMySlot(data.receiverSlot);
        setRoomState(prev => ({
          ...prev,
          [data.senderSlot]: { ...prev[data.senderSlot], connected: true },
          [data.receiverSlot]: { ...prev[data.receiverSlot], connected: true },
        }));
        showNotification(`El rival eligió ${data.senderSlot === 'player1' ? 'Jugador 1' : 'Jugador 2'}. Pasaste automáticamente a ${data.receiverSlot === 'player1' ? 'Jugador 1' : 'Jugador 2'}.`, 3000);
      } else if (data.type === 'BC_STATE') {
        if (data.originSlot !== mySlot) {
          if (data.sound === 'stop') soundManager.playDeskBell();
          else if (data.sound === 'stamp') soundManager.playStampClick();
          else if (data.sound === 'rps_pick') soundManager.playRpsPick();
          else if (data.sound === 'rps_win') soundManager.playWinDuel();
          else if (data.sound === 'rps_tie') soundManager.playTie();
          else if (data.sound === 'penalty') soundManager.playPenalty();
          else if (data.sound === 'game_over') soundManager.playGameOver();

          setRoomState(data.state);
        }
      } else if (data.type === 'BC_BYE') {
        const otherSlot = data.slot as PlayerId;
        setRivalDisconnected(true);
        setRoomState(prev => ({
          ...prev,
          [otherSlot]: { ...prev[otherSlot], connected: false },
        }));
        showNotification(`Rival (${otherSlot === 'player1' ? 'J1' : 'J2'}) cerró su pestaña`, 3000);
      }
    };

    // Anunciar presencia a la otra pestaña
    bc.postMessage({ type: 'BC_HELLO', slot: mySlot });

    const handleBeforeUnload = () => {
      bc.postMessage({ type: 'BC_BYE', slot: mySlot });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      bc.close();
      bcRef.current = null;
    };
  }, [roomId, mySlot, showNotification]);

  // ── CONEXIÓN WEBSOCKET OPCIONAL (CON RETIRO A MODO LOCAL) ───
  useEffect(() => {
    let unmounted = false;
    let attempts = 0;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    function connect() {
      if (unmounted || attempts >= MAX_RECONNECT) {
        setIsLocalMode(true);
        return;
      }
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          attempts = 0;
          setConnected(true);
          setIsLocalMode(false);
          setReconnectAttempts(0);
          setRivalDisconnected(false);
          soundManager.playReconnect();
          ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId, preferredSlot: mySlot }));
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          pingTimerRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING' }));
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data) as ServerMessage;
            switch (data.type) {
              case 'ROOM_STATE':
                setRoomState(data.state);
                if (data.yourSlot && data.yourSlot !== 'spectator') {
                  setMySlot(data.yourSlot);
                }
                break;
              case 'SLOT_SWAPPED':
                showNotification(data.message, 2500);
                break;
              case 'RPS_TIE':
                soundManager.playTie();
                showNotification(data.message, 1500);
                break;
              case 'RPS_WIN':        soundManager.playWinDuel();   break;
              case 'TARGET_CHOSEN':  soundManager.playStampClick(); break;
              case 'CELL_MARKED':    soundManager.playStampClick(); break;
              case 'STOP_TRIGGERED': soundManager.playDeskBell();   break;
              case 'GAME_OVER':      soundManager.playGameOver();   break;
              case 'WRONG_CLICK_PENALTY':
                soundManager.playPenalty();
                showNotification(`⚠️ ¡Clic erróneo! -${data.penaltyCells} casilla(s)`, 2000);
                break;
              case 'PLAYER_DISCONNECTED':
                setRivalDisconnected(true);
                showNotification('⚠️ Tu rival se desconectó. Esperando reconexión…', 5000);
                break;
            }
          } catch { /* ignore non-json */ }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setConnected(false);
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          attempts += 1;
          setReconnectAttempts(attempts);
          if (attempts < MAX_RECONNECT) {
            const delay = Math.min(1000 * 2 ** attempts, 15000);
            reconnectTimerRef.current = setTimeout(connect, delay);
          } else {
            setIsLocalMode(true);
          }
        };

        ws.onerror = () => {
          if (!unmounted) {
            setConnected(false);
            setIsLocalMode(true);
          }
        };
      } catch {
        setConnected(false);
        setIsLocalMode(true);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [roomId, showNotification]);

  // ── MOTOR LOCAL DE IA / BOT ──────────────────────────────
  const runLocalBot = useCallback((state: GameRoomState) => {
    if (!state.isBotGame) return;
    const diff = state.botDifficulty ?? 'normal';

    if (state.state === 'rps' && !state.player2.rpsChoice) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = setTimeout(() => {
        const choices = ['rock', 'paper', 'scissors'] as RpsChoice[];
        handleRpsPick(choices[Math.floor(Math.random() * 3)] as any, 'player2');
      }, 500 + Math.random() * 400);

    } else if (state.state === 'choose_number' && state.player2.role === 'marker') {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = setTimeout(() => {
        const available = state.cloud.filter(c => c.status === 'available');
        if (available.length > 0) {
          handleChooseTarget(available[Math.floor(Math.random() * available.length)].id);
        }
      }, 1000);

    } else if (state.state === 'race') {
      const [baseDelay, randDelay] = BOT_MARK_DELAY[diff];
      const [searchBase, searchRand] = BOT_SEARCH_DELAY[diff];

      if (state.player2.role === 'marker') {
        const step = () => {
          setRoomState(prev => {
            if (prev.state !== 'race' || prev.player2.role !== 'marker') return prev;
            const cur = prev.player2.score;
            if (cur >= 48) return prev;
            const nextCells = [...prev.player2.cells];
            nextCells[cur] = true;
            soundManager.playStampClick();
            const nextScore = cur + 1;
            if (nextScore >= 48) {
              soundManager.playGameOver();
              const finalState: GameRoomState = {
                ...prev,
                player2: { ...prev.player2, score: 48, cells: nextCells },
                state: 'game_over',
                winner: 'player2',
                winReason: 'cells_completed',
              };
              broadcastState(finalState, 'game_over');
              return finalState;
            }
            const nextState: GameRoomState = {
              ...prev,
              player2: { ...prev.player2, score: nextScore, cells: nextCells },
            };
            broadcastState(nextState, 'stamp');
            return nextState;
          });
          botTimerRef.current = setTimeout(step, baseDelay + Math.random() * randDelay);
        };
        botTimerRef.current = setTimeout(step, baseDelay + 100);

      } else if (state.player2.role === 'searcher' && state.targetNumber) {
        const target = state.targetNumber;
        botTimerRef.current = setTimeout(() => {
          handleHitStop(target, 'player2');
        }, searchBase + Math.random() * searchRand);
      }
    }
  }, [broadcastState]);

  // ── ACTION HANDLERS ──────────────────────────────────────

  const handleStartGame = useCallback((isBot = false, difficulty: BotDifficulty = 'normal') => {
    if (connected) {
      sendAction({ type: 'START_GAME', isBotGame: isBot, botDifficulty: difficulty });
    } else {
      setIsLocalMode(true);
      setRoomState(prev => {
        const next: GameRoomState = {
          ...prev,
          state: 'rps',
          isBotGame: isBot,
          botDifficulty: difficulty,
          player1: { ...prev.player1, connected: true },
          player2: { ...prev.player2, name: isBot ? 'IA Rival' : 'Jugador 2', connected: true },
        };
        broadcastState(next, 'rps_pick');
        runLocalBot(next);
        return next;
      });
    }
  }, [connected, sendAction, runLocalBot, broadcastState]);

  const handleRpsPick = useCallback((choice: 'rock' | 'paper' | 'scissors', overrideSlot?: PlayerId) => {
    const slot = overrideSlot ?? (mySlot === 'spectator' ? 'player1' : mySlot);
    soundManager.playRpsPick();

    if (connected && !overrideSlot) {
      sendAction({ type: 'RPS_PICK', choice });
    } else {
      setRoomState(prev => {
        if (prev.state !== 'rps') return prev;
        const nextP1 = slot === 'player1' ? choice : prev.player1.rpsChoice;
        const nextP2 = slot === 'player2' ? choice : prev.player2.rpsChoice;
        let next: GameRoomState = {
          ...prev,
          player1: { ...prev.player1, rpsChoice: nextP1 },
          player2: { ...prev.player2, rpsChoice: nextP2 },
        };

        if (nextP1 && nextP2) {
          if (nextP1 === nextP2) {
            soundManager.playTie();
            showNotification('¡Empate en Yan Ken Po! Vuelvan a elegir…', 1200);
            setTimeout(() => {
              setRoomState(cur => {
                if (cur.state !== 'rps') return cur;
                const cleared: GameRoomState = {
                  ...cur,
                  player1: { ...cur.player1, rpsChoice: null },
                  player2: { ...cur.player2, rpsChoice: null },
                  rpsTieCount: cur.rpsTieCount + 1,
                };
                broadcastState(cleared, 'rps_tie');
                if (cleared.isBotGame) runLocalBot(cleared);
                return cleared;
              });
            }, 1000);
          } else {
            const p1Wins = (nextP1 === 'rock' && nextP2 === 'scissors') || (nextP1 === 'paper' && nextP2 === 'rock') || (nextP1 === 'scissors' && nextP2 === 'paper');
            const winner: PlayerId = p1Wins ? 'player1' : 'player2';
            const loser: PlayerId  = p1Wins ? 'player2' : 'player1';
            soundManager.playWinDuel();
            next = {
              ...next,
              [winner]: { ...next[winner as PlayerId], role: 'marker'   },
              [loser]:  { ...next[loser  as PlayerId], role: 'searcher' },
              lastRpsResult: { p1Choice: nextP1, p2Choice: nextP2, winner },
            };
            setTimeout(() => {
              setRoomState(cur => {
                if (cur.state !== 'rps') return cur;
                const into: GameRoomState = {
                  ...cur,
                  state: 'choose_number',
                  targetNumber: null,
                  player1: { ...cur.player1, rpsChoice: null },
                  player2: { ...cur.player2, rpsChoice: null },
                };
                broadcastState(into, 'rps_win');
                if (into.isBotGame) runLocalBot(into);
                return into;
              });
            }, 1400);
          }
        }
        broadcastState(next);
        return next;
      });
    }
  }, [connected, mySlot, sendAction, showNotification, runLocalBot, broadcastState]);

  const handleChooseTarget = useCallback((targetNumber: number) => {
    soundManager.playStampClick();
    if (connected) {
      sendAction({ type: 'CHOOSE_TARGET', number: targetNumber });
    } else {
      setRoomState(prev => {
        if (prev.state !== 'choose_number') return prev;
        const next: GameRoomState = {
          ...prev,
          targetNumber,
          state: 'race',
          raceStartTime: Date.now(),
          timeStop: null,
          wrongClicksThisRound: 0,
        };
        broadcastState(next, 'stamp');
        if (next.isBotGame) runLocalBot(next);
        return next;
      });
    }
  }, [connected, sendAction, runLocalBot, broadcastState]);

  const handleMarkCell = useCallback((cellIndex: number) => {
    const slot = mySlot === 'spectator' ? 'player1' : mySlot;
    if (roomState.state !== 'race') return;
    if (roomState[slot].role !== 'marker') return;
    if (cellIndex !== roomState[slot].score) return;
    const timestamp = Date.now();
    soundManager.playStampClick();
    if (connected) {
      sendAction({ type: 'MARK_CELL', cellIndex, clientTimestamp: timestamp });
    } else {
      setRoomState(prev => {
        if (prev.state !== 'race' || prev.timeStop !== null) return prev;
        const curScore = prev[slot].score;
        if (cellIndex !== curScore) return prev;
        const nextCells = [...prev[slot].cells];
        nextCells[cellIndex] = true;
        const nextScore = curScore + 1;
        if (nextScore >= 48) {
          soundManager.playGameOver();
          const winState: GameRoomState = {
            ...prev,
            [slot]: { ...prev[slot], score: 48, cells: nextCells },
            state: 'game_over',
            winner: slot,
            winReason: 'cells_completed',
          };
          broadcastState(winState, 'game_over');
          return winState;
        }
        const nextState: GameRoomState = {
          ...prev,
          [slot]: { ...prev[slot], score: nextScore, cells: nextCells },
        };
        broadcastState(nextState, 'stamp');
        return nextState;
      });
    }
  }, [connected, mySlot, roomState, sendAction, broadcastState]);

  // Penalización por clic erróneo del Buscador: bonifica +1 casilla al Marcador
  const handleWrongClick = useCallback(() => {
    const slot = mySlot === 'spectator' ? 'player1' : mySlot;
    if (roomState.state !== 'race') return;
    if (roomState[slot].role !== 'searcher') return;

    soundManager.playPenalty();
    showNotification('⚠️ ¡Número incorrecto! El Marcador avanza +1 casilla.', 2000);

    if (connected) {
      sendAction({ type: 'WRONG_CLICK', clientTimestamp: Date.now() });
    } else {
      setRoomState(prev => {
        if (prev.state !== 'race') return prev;
        const markerSlot: PlayerId = prev.player1.role === 'marker' ? 'player1' : 'player2';
        const searcherSlot: PlayerId = slot as PlayerId;

        const curMarkerScore = prev[markerSlot].score;
        let nextMarkerScore = curMarkerScore;
        const nextMarkerCells = [...prev[markerSlot].cells];
        if (curMarkerScore < 48) {
          nextMarkerScore = curMarkerScore + 1;
          nextMarkerCells[curMarkerScore] = true;
        }

        const nextState: GameRoomState = {
          ...prev,
          wrongClicksThisRound: prev.wrongClicksThisRound + 1,
          [searcherSlot]: {
            ...prev[searcherSlot],
            penalties: prev[searcherSlot].penalties + 1,
          },
          [markerSlot]: {
            ...prev[markerSlot],
            score: nextMarkerScore,
            cells: nextMarkerCells,
          },
        };

        if (nextMarkerScore >= 48) {
          soundManager.playGameOver();
          const overState: GameRoomState = {
            ...nextState,
            state: 'game_over',
            winner: markerSlot,
            winReason: 'cells_completed',
          };
          broadcastState(overState, 'game_over');
          return overState;
        }

        broadcastState(nextState, 'penalty');
        return nextState;
      });
    }
  }, [connected, mySlot, roomState, sendAction, showNotification, broadcastState]);

  const handleHitStop = useCallback((number: number, overrideSlot?: PlayerId) => {
    const slot = overrideSlot ?? (mySlot === 'spectator' ? 'player1' : (mySlot as PlayerId));
    if (roomState.state !== 'race') return;
    if (roomState[slot as PlayerId].role !== 'searcher') return;

    if (roomState.targetNumber === null) return;
    if (Number(number) !== Number(roomState.targetNumber)) {
      if (!overrideSlot) handleWrongClick();
      return;
    }

    const stopTime = Date.now();
    soundManager.playDeskBell();

    if (connected && !overrideSlot) {
      sendAction({ type: 'HIT_STOP', number, clientTimestamp: stopTime });
    } else {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      setRoomState(prev => {
        if (prev.state !== 'race') return prev;
        const markerSlot: PlayerId = prev.player1.role === 'marker' ? 'player1' : 'player2';
        const marker = prev[markerSlot];
        const nextCloud = prev.cloud.map(c => c.id === number ? { ...c, status: 'used' as const } : c);
        const duration = prev.raceStartTime ? stopTime - prev.raceStartTime : 0;

        // Registrar récord de STOP si el jugador actual fue quien acertó
        if (slot === mySlot && duration > 0) {
          recordFastStop(duration);
        }

        const histItem = {
          round: prev.round,
          rpsWinner: markerSlot,
          marker: markerSlot,
          searcher: slot as PlayerId,
          targetNumber: number,
          marksGained: marker.score,
          durationMs: duration,
          timeStop: stopTime,
          wrongClicks: prev.wrongClicksThisRound,
        };
        const availableLeft = nextCloud.filter(c => c.status === 'available').length;
        let finalWinner: PlayerId | 'tie' | null = null;
        let winReason: 'cells_completed' | 'cloud_depleted' | null = null;

        if (marker.score >= 48) {
          finalWinner = markerSlot;
          winReason = 'cells_completed';
        } else if (availableLeft === 0) {
          winReason = 'cloud_depleted';
          finalWinner = prev.player1.score > prev.player2.score ? 'player1' : prev.player2.score > prev.player1.score ? 'player2' : 'tie';
        }

        if (finalWinner) {
          soundManager.playGameOver();
          const overState: GameRoomState = {
            ...prev,
            cloud: nextCloud,
            state: 'game_over',
            winner: finalWinner,
            winReason,
            history: [...prev.history, histItem],
          };
          broadcastState(overState, 'game_over');
          return overState;
        }

        if (localTransitionTimerRef.current) clearTimeout(localTransitionTimerRef.current);
        localTransitionTimerRef.current = setTimeout(() => {
          setRoomState(curr => {
            if (curr.state !== 'stop') return curr;
            const next: GameRoomState = {
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
              wrongClicksThisRound: 0,
            };
            broadcastState(next);
            if (next.isBotGame) runLocalBot(next);
            return next;
          });
        }, 2200);

        const stopState: GameRoomState = {
          ...prev,
          cloud: nextCloud,
          state: 'stop',
          timeStop: stopTime,
          stopDetails: {
            stoppedBy: slot as PlayerId,
            targetNumber: number,
            marksThisRound: marker.score,
            elapsedMs: duration,
          },
          history: [...prev.history, histItem],
        };
        broadcastState(stopState, 'stop');
        return stopState;
      });
    }
  }, [connected, mySlot, roomState, sendAction, handleWrongClick, runLocalBot, broadcastState]);

  const handleRestartGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (localTransitionTimerRef.current) clearTimeout(localTransitionTimerRef.current);
    if (connected) {
      sendAction({ type: 'RESTART_GAME' });
    } else {
      setRoomState(prev => {
        const fresh: GameRoomState = {
          ...prev,
          state: 'rps',
          round: 1,
          cloud: createInitialCloud(),
          targetNumber: null,
          raceStartTime: null,
          timeStop: null,
          winner: null,
          winReason: null,
          history: [],
          player1: { ...prev.player1, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null, penalties: 0 },
          player2: { ...prev.player2, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null, penalties: 0 },
          stopDetails: null,
          lastRpsResult: null,
          wrongClicksThisRound: 0,
        };
        broadcastState(fresh);
        if (fresh.isBotGame) runLocalBot(fresh);
        return fresh;
      });
    }
  }, [connected, sendAction, runLocalBot, broadcastState]);

  const handleEndGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (localTransitionTimerRef.current) clearTimeout(localTransitionTimerRef.current);
    if (connected) {
      sendAction({ type: 'END_GAME' });
    } else {
      setRoomState(prev => {
        const reset: GameRoomState = {
          ...makeInitialState(prev.roomId, mySlot === 'spectator' ? 'player1' : mySlot),
          player1: { ...prev.player1, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null, penalties: 0 },
          player2: { ...prev.player2, score: 0, cells: Array(48).fill(false), role: null, rpsChoice: null, penalties: 0 },
          isBotGame: prev.isBotGame,
          botDifficulty: prev.botDifficulty,
        };
        broadcastState(reset);
        return reset;
      });
    }
  }, [connected, mySlot, sendAction, broadcastState]);

  const switchRoleSlot = useCallback((slot: PlayerId) => {
    setMySlot(slot);
    const oppositeSlot: PlayerId = slot === 'player1' ? 'player2' : 'player1';
    if (connected) {
      sendAction({ type: 'SWITCH_SLOT', slot });
    } else if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'BC_SWAP_SLOTS',
        senderSlot: slot,
        receiverSlot: oppositeSlot,
      });
      setRoomState(prev => ({
        ...prev,
        [slot]: { ...prev[slot], connected: true },
        [oppositeSlot]: { ...prev[oppositeSlot], connected: true },
      }));
    }
  }, [connected, sendAction]);

  return {
    roomId, setRoomId,
    mySlot, setMySlot,
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
    handleWrongClick,
    handleRestartGame,
    handleEndGame,
    switchRoleSlot,
  };
}
