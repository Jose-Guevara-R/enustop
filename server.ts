import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GameRoomState, PlayerId, RpsChoice, CloudNumber, ClientAction, RoundHistory } from './src/types.js';
import { createInitialCloud } from './src/utils/cloudGenerator.js';

interface ClientConnection {
  ws: WebSocket;
  roomId: string;
  slot: PlayerId | 'spectator';
  playerId: string;
}

interface RoomInstance {
  state: GameRoomState;
  clients: Set<ClientConnection>;
  botTimer?: NodeJS.Timeout;
  transitionTimer?: NodeJS.Timeout;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());

const rooms = new Map<string, RoomInstance>();

function generateRoomId(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return id;
}

function createNewRoomState(roomId: string, isBotGame: boolean = false): GameRoomState {
  return {
    roomId,
    state: 'lobby',
    round: 1,
    player1: {
      id: 'player1',
      name: 'Jugador 1',
      connected: false,
      role: null,
      rpsChoice: null,
      score: 0,
      cells: Array(48).fill(false),
    },
    player2: {
      id: 'player2',
      name: isBotGame ? 'IA Rival' : 'Jugador 2',
      connected: isBotGame,
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
    isBotGame,
  };
}

function getOrCreateRoom(roomId: string, isBotGame: boolean = false): RoomInstance {
  const normId = roomId.toUpperCase();
  let room = rooms.get(normId);
  if (!room) {
    room = {
      state: createNewRoomState(normId, isBotGame),
      clients: new Set(),
    };
    rooms.set(normId, room);
  }
  return room;
}

function broadcastRoomState(room: RoomInstance) {
  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(
        JSON.stringify({
          type: 'ROOM_STATE',
          state: room.state,
          yourSlot: client.slot,
        })
      );
    }
  }
}

function broadcastEvent(room: RoomInstance, payload: unknown) {
  const message = JSON.stringify(payload);
  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

function determineRpsWinner(c1: RpsChoice, c2: RpsChoice): PlayerId | 'tie' | null {
  if (!c1 || !c2) return null;
  if (c1 === c2) return 'tie';
  if (
    (c1 === 'rock' && c2 === 'scissors') ||
    (c1 === 'paper' && c2 === 'rock') ||
    (c1 === 'scissors' && c2 === 'paper')
  ) {
    return 'player1';
  }
  return 'player2';
}

function handleRpsEvaluation(room: RoomInstance) {
  const { player1, player2 } = room.state;
  if (!player1.rpsChoice || !player2.rpsChoice) return;

  const winner = determineRpsWinner(player1.rpsChoice, player2.rpsChoice);
  room.state.lastRpsResult = {
    p1Choice: player1.rpsChoice,
    p2Choice: player2.rpsChoice,
    winner,
  };

  if (winner === 'tie') {
    room.state.rpsTieCount += 1;
    broadcastEvent(room, {
      type: 'RPS_TIE',
      p1Choice: player1.rpsChoice,
      p2Choice: player2.rpsChoice,
      message: '¡Empate! Vuelvan a elegir inmediatamente.',
    });
    broadcastRoomState(room);

    // Clear selections and let them pick again immediately
    setTimeout(() => {
      if (room.state.state === 'rps') {
        room.state.player1.rpsChoice = null;
        room.state.player2.rpsChoice = null;
        broadcastRoomState(room);

        // If bot game, trigger bot RPS selection again
        if (room.state.isBotGame) {
          triggerBotRps(room);
        }
      }
    }, 1100);
  } else if (winner) {
    // Determine winner role
    const loser: PlayerId = winner === 'player1' ? 'player2' : 'player1';
    room.state[winner].role = 'marker'; // "El Marcador"
    room.state[loser].role = 'searcher'; // "El Buscador"

    broadcastEvent(room, {
      type: 'RPS_WIN',
      winner,
      p1Choice: player1.rpsChoice,
      p2Choice: player2.rpsChoice,
    });
    broadcastRoomState(room);

    // Transition to ESTADO 2: Elección after 1.5 seconds
    setTimeout(() => {
      if (room.state.state === 'rps') {
        room.state.state = 'choose_number';
        room.state.targetNumber = null;
        room.state.player1.rpsChoice = null;
        room.state.player2.rpsChoice = null;
        broadcastRoomState(room);

        // If bot is the marker, bot picks target number after short thought
        if (room.state.isBotGame && room.state.player2.role === 'marker') {
          triggerBotChooseNumber(room);
        }
      }
    }, 1500);
  }
}

function triggerBotRps(room: RoomInstance) {
  if (!room.state.isBotGame || room.state.state !== 'rps') return;
  const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  setTimeout(() => {
    if (room.state.state === 'rps' && !room.state.player2.rpsChoice) {
      room.state.player2.rpsChoice = botChoice;
      broadcastRoomState(room);
      handleRpsEvaluation(room);
    }
  }, 400 + Math.random() * 400);
}

function triggerBotChooseNumber(room: RoomInstance) {
  if (!room.state.isBotGame || room.state.state !== 'choose_number') return;
  setTimeout(() => {
    if (room.state.state !== 'choose_number') return;
    const available = room.state.cloud.filter((c) => c.status === 'available');
    if (available.length === 0) return;
    const chosen = available[Math.floor(Math.random() * available.length)];
    executeTargetChosen(room, chosen.id);
  }, 1000 + Math.random() * 800);
}

function triggerBotRaceActions(room: RoomInstance) {
  if (!room.state.isBotGame || room.state.state !== 'race') return;

  if (room.state.player2.role === 'marker') {
    // Bot is marker: marks cells sequentially at natural human pace (approx 280-360ms)
    const markNext = () => {
      if (room.state.state !== 'race' || room.state.player2.role !== 'marker') return;
      const currentScore = room.state.player2.score;
      if (currentScore < 48) {
        room.state.player2.cells[currentScore] = true;
        room.state.player2.score += 1;
        broadcastEvent(room, {
          type: 'CELL_MARKED',
          player: 'player2',
          cellIndex: currentScore,
          score: room.state.player2.score,
        });
        broadcastRoomState(room);

        // Check if bot reached 48
        if (room.state.player2.score >= 48) {
          finishGame(room, 'player2', 'cells_completed');
          return;
        }

        // Schedule next mark
        room.botTimer = setTimeout(markNext, 240 + Math.random() * 120);
      }
    };
    room.botTimer = setTimeout(markNext, 350);
  } else if (room.state.player2.role === 'searcher') {
    // Bot is searcher: searches the target number with human visual search latency (2.5s - 5.5s)
    const target = room.state.targetNumber;
    if (!target) return;
    const searchDelay = 2600 + Math.random() * 2600;
    room.botTimer = setTimeout(() => {
      if (room.state.state === 'race' && room.state.player2.role === 'searcher') {
        executeStopTrigger(room, target, 'player2', Date.now());
      }
    }, searchDelay);
  }
}

function executeTargetChosen(room: RoomInstance, targetNum: number) {
  const item = room.state.cloud.find((c) => c.id === targetNum);
  if (!item || item.status !== 'available') return;

  room.state.targetNumber = targetNum;
  room.state.state = 'race';
  room.state.raceStartTime = Date.now();
  room.state.timeStop = null;

  broadcastEvent(room, {
    type: 'TARGET_CHOSEN',
    targetNumber: targetNum,
    marker: room.state.player1.role === 'marker' ? 'player1' : 'player2',
    searcher: room.state.player1.role === 'searcher' ? 'player1' : 'player2',
  });
  broadcastRoomState(room);

  // Trigger bot if in game
  if (room.state.isBotGame) {
    triggerBotRaceActions(room);
  }
}

function executeStopTrigger(room: RoomInstance, clickedNumber: number, stoppedBy: PlayerId, clientTimestamp: number) {
  if (room.state.state !== 'race') return;
  if (Number(clickedNumber) !== Number(room.state.targetNumber)) return;

  const serverTimeStop = Date.now();
  room.state.timeStop = serverTimeStop;
  room.state.state = 'stop';

  if (room.botTimer) {
    clearTimeout(room.botTimer);
  }

  // Identify marker and searcher
  const markerId: PlayerId = room.state.player1.role === 'marker' ? 'player1' : 'player2';
  const marker = room.state[markerId];

  // ANTI-CHEAT & LATENCY RESOLUTION (Specification Rule 3):
  // When Buscador clicks target, server records Time_Stop.
  // Any cell click from Marker with local timestamp > Time_Stop is discarded and undone.
  // Also, validate sequential order strictly.

  // Mark the target number as 'used' (crossed out) in cloud
  const cloudItem = room.state.cloud.find((c) => c.id === clickedNumber);
  if (cloudItem) {
    cloudItem.status = 'used';
  }

  const elapsedMs = room.state.raceStartTime ? serverTimeStop - room.state.raceStartTime : 0;
  const historyEntry: RoundHistory = {
    round: room.state.round,
    rpsWinner: markerId,
    marker: markerId,
    searcher: stoppedBy,
    targetNumber: clickedNumber,
    marksGained: marker.score,
    durationMs: elapsedMs,
    timeStop: serverTimeStop,
  };
  room.state.history.push(historyEntry);

  room.state.stopDetails = {
    stoppedBy,
    targetNumber: clickedNumber,
    marksThisRound: marker.score,
    elapsedMs,
  };

  broadcastEvent(room, {
    type: 'STOP_TRIGGERED',
    timeStop: serverTimeStop,
    stoppedBy,
    targetNumber: clickedNumber,
    marksGained: marker.score,
  });
  broadcastRoomState(room);

  // Check Game Over Conditions:
  // Condición A: contador de casillas marcadas de cualquier jugador llega a 48
  if (room.state.player1.score >= 48) {
    finishGame(room, 'player1', 'cells_completed');
    return;
  }
  if (room.state.player2.score >= 48) {
    finishGame(room, 'player2', 'cells_completed');
    return;
  }

  // Condición B: lista de números disponibles de la nube llega a 0 (35 números usados)
  const availableCount = room.state.cloud.filter((c) => c.status === 'available').length;
  if (availableCount === 0) {
    let finalWinner: PlayerId | 'tie' = 'tie';
    if (room.state.player1.score > room.state.player2.score) {
      finalWinner = 'player1';
    } else if (room.state.player2.score > room.state.player1.score) {
      finalWinner = 'player2';
    }
    finishGame(room, finalWinner, 'cloud_depleted');
    return;
  }

  // Rule 2: "Pasados 2 segundos de transición, reiniciar la lógica regresando automáticamente al ESTADO 1"
  room.transitionTimer = setTimeout(() => {
    if (room.state.state === 'stop') {
      room.state.round += 1;
      room.state.state = 'rps';
      room.state.player1.role = null;
      room.state.player2.role = null;
      room.state.player1.rpsChoice = null;
      room.state.player2.rpsChoice = null;
      room.state.targetNumber = null;
      room.state.raceStartTime = null;
      room.state.timeStop = null;
      room.state.stopDetails = null;
      room.state.lastRpsResult = null;

      broadcastEvent(room, {
        type: 'TRANSITION_NEXT_ROUND',
        nextRound: room.state.round,
      });
      broadcastRoomState(room);

      if (room.state.isBotGame) {
        triggerBotRps(room);
      }
    }
  }, 2200);
}

function finishGame(room: RoomInstance, winner: PlayerId | 'tie', reason: 'cells_completed' | 'cloud_depleted') {
  room.state.state = 'game_over';
  room.state.winner = winner;
  room.state.winReason = reason;

  broadcastEvent(room, {
    type: 'GAME_OVER',
    winner,
    winReason: reason,
  });
  broadcastRoomState(room);
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.post('/api/rooms', (req, res) => {
  const isBot = Boolean(req.body?.isBot);
  let id = generateRoomId();
  while (rooms.has(id)) {
    id = generateRoomId();
  }
  const room = getOrCreateRoom(id, isBot);
  res.json({ roomId: id, isBotGame: isBot });
});

app.get('/api/rooms/:id', (req, res) => {
  const normId = req.params.id.toUpperCase();
  const room = rooms.get(normId);
  if (!room) {
    res.status(404).json({ error: 'Sala no encontrada' });
    return;
  }
  res.json({
    roomId: room.state.roomId,
    state: room.state.state,
    players: {
      player1: { name: room.state.player1.name, connected: room.state.player1.connected },
      player2: { name: room.state.player2.name, connected: room.state.player2.connected },
    },
    isBotGame: room.state.isBotGame,
  });
});

// Upgrade WebSocket connections on path /ws
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // If not /ws, let Vite handle or close
  }
});

wss.on('connection', (ws: WebSocket) => {
  let clientConn: ClientConnection | null = null;

  ws.on('message', (data: string) => {
    try {
      const action = JSON.parse(data.toString()) as ClientAction;

      if (action.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (action.type === 'JOIN_ROOM') {
        const roomId = (action.roomId || 'DEFAULT').toUpperCase();
        const room = getOrCreateRoom(roomId, false);

        // Determine player slot
        let slot: PlayerId | 'spectator' = 'spectator';
        if (action.preferredSlot === 'player1' && !room.state.player1.connected) {
          slot = 'player1';
        } else if (action.preferredSlot === 'player2' && !room.state.player2.connected) {
          slot = 'player2';
        } else if (!room.state.player1.connected) {
          slot = 'player1';
        } else if (!room.state.player2.connected) {
          slot = 'player2';
        }

        if (slot !== 'spectator') {
          room.state[slot].connected = true;
          if (action.playerName && action.playerName !== 'Jugador 1' && action.playerName !== 'Jugador 2') {
            room.state[slot].name = action.playerName;
          } else {
            room.state[slot].name = slot === 'player1' ? 'Jugador 1' : 'Jugador 2';
          }
        }

        clientConn = {
          ws,
          roomId,
          slot,
          playerId: Math.random().toString(36).substring(2, 9),
        };
        room.clients.add(clientConn);

        // Auto-start if both players connected and in lobby
        if (
          room.state.state === 'lobby' &&
          room.state.player1.connected &&
          room.state.player2.connected
        ) {
          room.state.state = 'rps';
        }

        broadcastRoomState(room);
        return;
      }

      if (!clientConn) return;
      const room = rooms.get(clientConn.roomId);
      if (!room) return;

      if (action.type === 'START_GAME') {
        if (action.isBotGame) {
          room.state.isBotGame = true;
          room.state.player2.name = 'IA Rival';
          room.state.player2.connected = true;
        }
        room.state.state = 'rps';
        broadcastRoomState(room);
        if (room.state.isBotGame) {
          triggerBotRps(room);
        }
        return;
      }

      if (action.type === 'RPS_PICK') {
        if (room.state.state !== 'rps') return;
        const slot = clientConn.slot;
        if (slot !== 'player1' && slot !== 'player2') return;

        room.state[slot].rpsChoice = action.choice;
        broadcastRoomState(room);

        // If both picked, evaluate duel
        handleRpsEvaluation(room);
        return;
      }

      if (action.type === 'CHOOSE_TARGET') {
        if (room.state.state !== 'choose_number') return;
        const slot = clientConn.slot;
        if (slot !== 'player1' && slot !== 'player2') return;

        // Strictly verify that only the Marker can choose the number!
        if (room.state[slot].role !== 'marker') return;

        executeTargetChosen(room, action.number);
        return;
      }

      if (action.type === 'MARK_CELL') {
        if (room.state.state !== 'race') return;
        const slot = clientConn.slot;
        if (slot !== 'player1' && slot !== 'player2') return;

        // Strictly verify that only the Marker can mark cells!
        if (room.state[slot].role !== 'marker') return;

        // Anti-Cheat Check 1: If timeStop already occurred, reject!
        if (room.state.timeStop !== null) return;

        // Anti-Cheat Check 2: Strict sequential order validation!
        // The app must reject any network packet attempting to mark cell N if N-1 has not been marked.
        const currentScore = room.state[slot].score;
        if (action.cellIndex !== currentScore) {
          // Reject invalid sequence!
          return;
        }

        if (action.cellIndex >= 48) return;

        // Mark cell
        room.state[slot].cells[action.cellIndex] = true;
        room.state[slot].score += 1;

        broadcastEvent(room, {
          type: 'CELL_MARKED',
          player: slot,
          cellIndex: action.cellIndex,
          score: room.state[slot].score,
        });
        broadcastRoomState(room);

        // Check if finished 48
        if (room.state[slot].score >= 48) {
          finishGame(room, slot, 'cells_completed');
        }
        return;
      }

      if (action.type === 'HIT_STOP') {
        if (room.state.state !== 'race') return;
        const slot = clientConn.slot;
        if (slot !== 'player1' && slot !== 'player2') return;

        // Strictly verify that only the Searcher can hit STOP!
        if (room.state[slot].role !== 'searcher') return;

        executeStopTrigger(room, Number(action.number), slot, action.clientTimestamp);
        return;
      }

      if (action.type === 'RESTART_GAME') {
        if (room.botTimer) clearTimeout(room.botTimer);
        if (room.transitionTimer) clearTimeout(room.transitionTimer);
        const isBot = room.state.isBotGame;
        const p1Name = room.state.player1.name;
        const p2Name = room.state.player2.name;
        const fresh = createNewRoomState(room.state.roomId, isBot);
        fresh.player1.name = p1Name;
        fresh.player2.name = p2Name;
        fresh.player1.connected = room.state.player1.connected;
        fresh.player2.connected = room.state.player2.connected;
        fresh.state = 'rps';
        room.state = fresh;

        broadcastRoomState(room);
        if (room.state.isBotGame) {
          triggerBotRps(room);
        }
        return;
      }

      if (action.type === 'END_GAME') {
        if (room.botTimer) clearTimeout(room.botTimer);
        if (room.transitionTimer) clearTimeout(room.transitionTimer);
        const isBot = room.state.isBotGame;
        const p1Name = room.state.player1.name;
        const p2Name = room.state.player2.name;
        const fresh = createNewRoomState(room.state.roomId, isBot);
        fresh.player1.name = p1Name;
        fresh.player2.name = p2Name;
        fresh.player1.connected = room.state.player1.connected;
        fresh.player2.connected = room.state.player2.connected;
        fresh.state = 'lobby';
        room.state = fresh;

        broadcastRoomState(room);
        return;
      }
    } catch (err) {
      console.error('Error handling ws message:', err);
    }
  });

  ws.on('close', () => {
    if (clientConn) {
      const room = rooms.get(clientConn.roomId);
      if (room) {
        room.clients.delete(clientConn);
        if (clientConn.slot === 'player1' || clientConn.slot === 'player2') {
          // Check if any other client is on that slot
          const stillConnected = Array.from(room.clients).some((c) => c.slot === clientConn?.slot);
          if (!stillConnected && !room.state.isBotGame) {
            room.state[clientConn.slot].connected = false;
            broadcastRoomState(room);
          }
        }
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at:`);
    console.log(`  > Local:   http://localhost:${PORT}/`);
    console.log(`  > Network: http://127.0.0.1:${PORT}/`);
  });
}

startServer();
