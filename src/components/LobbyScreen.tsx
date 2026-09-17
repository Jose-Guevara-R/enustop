import React, { useState, useEffect } from 'react';
import { Users, Bot, Copy, Check, Sparkles, Smartphone, Share2, TrendingUp, Trash2 } from 'lucide-react';
import { GameRoomState, PlayerId, BotDifficulty } from '../types.js';
import { loadStats, saveStats } from '../utils/stats.js';

interface LobbyScreenProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onStartGame: (isBot: boolean, difficulty?: BotDifficulty) => void;
  onSwitchSlot: (slot: PlayerId) => void;
  roomId: string;
  onRoomChange: (newRoom: string) => void;
  darkMode?: boolean;
  connected: boolean;
  reconnectAttempts: number;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomState, mySlot, onStartGame, onSwitchSlot, roomId,
  onRoomChange, connected, reconnectAttempts,
}) => {
  const [copied, setCopied]         = useState(false);
  const [inputRoom, setInputRoom]   = useState(roomId);
  const [botDiff, setBotDiff]       = useState<BotDifficulty>('normal');
  const [showStats, setShowStats]   = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const stats = loadStats();

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const inviteSlot: PlayerId = mySlot === 'player1' ? 'player2' : 'player1';
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&slot=${inviteSlot}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMsg = encodeURIComponent(
    `¡Hola! Te invito a jugar *NumSTOP!* 🔢⚡\nEntra con el código de sala *${roomId}* (puesto asignado: ${inviteSlot === 'player1' ? 'Jugador 1' : 'Jugador 2'}):\n${inviteUrl}`
  );

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoom.trim()) onRoomChange(inputRoom.trim().toUpperCase());
  };

  const DIFF_OPTIONS: { key: BotDifficulty; label: string; color: string; desc: string }[] = [
    { key: 'easy',   label: '😊 Fácil',   color: 'emerald', desc: 'Busca en 6–9s' },
    { key: 'normal', label: '😤 Normal',  color: 'amber',   desc: 'Busca en 2.6–5s' },
    { key: 'hard',   label: '🔥 Difícil', color: 'red',     desc: 'Busca en 0.8–2s' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 flex flex-col items-center">

      {/* MEJORA: Banner de reconexión */}
      {!connected && reconnectAttempts > 0 && (
        <div className="w-full max-w-2xl mb-4 px-4 py-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm font-bold flex items-center gap-2">
          <span className="animate-spin text-lg">⟳</span>
          Intentando conectar al servidor ({reconnectAttempts}/{8})… Modo local disponible si falla.
        </div>
      )}
      {!connected && reconnectAttempts === 0 && (
        <div className="w-full max-w-2xl mb-4 px-4 py-2 rounded-2xl bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 text-xs font-bold text-center">
          ✅ Modo local activo — puedes jugar contra la IA sin servidor
        </div>
      )}

      {/* Hero */}
      <div className="text-center max-w-2xl mb-8 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="NumSTOP logo"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl ring-4 ring-amber-400/30 mb-4 select-none"
        />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>¡Duelo de Agilidad Mental y Reflejos!</span>
        </div>
        <h2 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white mb-2">
          NumSTOP!
        </h2>
        <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mb-2 max-w-md">
          "¡Rápido como un rayo, certero como un lince!"
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          Un jugador marca casillas a toda velocidad mientras el rival busca el número secreto en la nube.
          ¡Quien encuentre el número grita <strong className="text-amber-600 dark:text-amber-400">STOP</strong> y congela el tablero!
        </p>

        {/* Quick action badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          <a href={`https://api.whatsapp.com/send?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all hover:scale-102 active:scale-95 cursor-pointer">
            <Share2 className="w-4 h-4" />
            <span>Compartir con amigos</span>
          </a>
          {deferredPrompt && (
            <button onClick={handleInstallPWA}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all hover:scale-102 active:scale-95 cursor-pointer">
              <Smartphone className="w-4 h-4" />
              <span>Instalar en Celular</span>
            </button>
          )}
          <button onClick={() => setShowStats(s => !s)}
            className="px-4 py-2 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer">
            <TrendingUp className="w-4 h-4" />
            <span>Mis Estadísticas</span>
          </button>
        </div>

        {/* MEJORA: Panel de estadísticas históricas */}
        {showStats && (
          <div className="mt-4 w-full max-w-sm p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-left animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-black text-sm text-slate-900 dark:text-white">📊 Mis Estadísticas</h3>
              <button onClick={() => { saveStats({ wins: 0, losses: 0, ties: 0, totalRoundsPlayed: 0, totalMarksEver: 0, fastestStop: null, lastPlayed: Date.now() }); window.location.reload(); }}
                className="text-[10px] text-red-500 flex items-center gap-1 hover:underline cursor-pointer">
                <Trash2 className="w-3 h-3" /> Resetear
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="font-black text-xl text-emerald-600 dark:text-emerald-400">{stats.wins}</div>
                <div className="text-[10px] text-zinc-500">Victorias</div>
              </div>
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                <div className="font-black text-xl text-red-500 dark:text-red-400">{stats.losses}</div>
                <div className="text-[10px] text-zinc-500">Derrotas</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="font-black text-xl text-amber-600 dark:text-amber-400">{stats.ties}</div>
                <div className="text-[10px] text-zinc-500">Empates</div>
              </div>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <div>Partidas totales: <strong>{stats.totalRoundsPlayed}</strong></div>
              <div>Casillas marcadas: <strong>{stats.totalMarksEver}</strong></div>
              {stats.fastestStop && <div>🏆 Mejor STOP: <strong className="text-violet-600 dark:text-violet-400">{(stats.fastestStop / 1000).toFixed(1)}s</strong></div>}
            </div>
          </div>
        )}
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">

        {/* Option A: Multiplayer */}
        <div className="p-6 sm:p-7 rounded-3xl border flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:border-violet-400 dark:hover:border-violet-500/60 transition-all">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-4 border border-violet-200 dark:border-violet-800">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl font-black mb-1 text-slate-950 dark:text-white">Multijugador (2P)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Invita a un compañero o abre otra pestaña para jugar en tiempo real.
            </p>

            {/* Room code */}
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-800 dark:text-amber-400">Código de Sala</div>
                <div className="text-2xl font-mono font-black tracking-wider text-slate-900 dark:text-white">{roomId}</div>
              </div>
              <button onClick={copyLink}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100/50 transition-all cursor-pointer">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-500" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Slot selector — auto-asigna el contrario */}
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              <span>Tu puesto en este dispositivo:</span>
              <span className="text-[10px] text-violet-600 dark:text-violet-400 lowercase font-normal">intercambio automático</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              {(['player1', 'player2'] as PlayerId[]).map(slot => {
                const isSelected = mySlot === slot;
                const isRivalConnected = roomState[slot].connected && !isSelected;
                const handleClick = () => {
                  if (mySlot === slot) return;
                  onSwitchSlot(slot);
                };
                return (
                  <button key={slot} onClick={handleClick}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600 text-white shadow-lg ring-2 ring-violet-400/40 scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:border-violet-300 dark:hover:border-violet-600'
                    }`}>
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-display font-black text-sm">{slot === 'player1' ? 'Jugador 1' : 'Jugador 2'}</span>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-white">
                          Tú
                        </span>
                      ) : isRivalConnected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Rival
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Libre</span>
                      )}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {isSelected
                        ? '✓ Este dispositivo'
                        : isRivalConnected
                        ? 'Clic para intercambiar'
                        : 'Clic para elegir'}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 leading-snug">
              ⚡ <strong>Diferenciación automática:</strong> Si este dispositivo elige <em>Jugador 1</em>, el otro dispositivo pasará automáticamente a ser <em>Jugador 2</em> (y viceversa).
            </div>

            {/* Join different room */}
            <form onSubmit={handleJoinRoom} className="flex gap-2 mb-5">
              <input
                value={inputRoom} onChange={e => setInputRoom(e.target.value.toUpperCase())}
                placeholder="Código de sala…"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-violet-500"
                maxLength={8}
              />
              <button type="submit"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black cursor-pointer transition-colors">
                Unirse
              </button>
            </form>
          </div>

          <button
            onClick={() => onStartGame(false)}
            disabled={!roomState.player1.connected || !roomState.player2.connected}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white font-display font-black text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            {roomState.player1.connected && roomState.player2.connected ? '¡Comenzar Duelo!' : 'Esperando rival…'}
          </button>
        </div>

        {/* Option B: vs Bot */}
        <div className="p-6 sm:p-7 rounded-3xl border flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:border-amber-400 dark:hover:border-amber-500/60 transition-all">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl font-black mb-1 text-slate-950 dark:text-white">Modo IA</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Juega solo contra la Inteligencia Artificial. Funciona sin internet.
            </p>

            {/* MEJORA: selector de dificultad del bot */}
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Dificultad de la IA:</div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {DIFF_OPTIONS.map(d => (
                <button key={d.key} onClick={() => setBotDiff(d.key)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    botDiff === d.key
                      ? d.color === 'emerald' ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                        : d.color === 'amber'  ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                        :                        'border-red-500 bg-red-600 text-white shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                  <div className="text-xs font-black">{d.label}</div>
                  <div className="text-[9px] opacity-75 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => onStartGame(true, botDiff)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-display font-black text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
            <Bot className="w-4 h-4" />
            ¡Jugar contra la IA!
          </button>
        </div>
      </div>

      {/* MEJORA: Sección de reglas rápidas */}
      <div className="w-full max-w-2xl p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <h3 className="font-display font-black text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          📋 ¿Cómo se juega?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          {[
            { num: '1', icon: '✊', title: 'Yan Ken Po', desc: 'El ganador elige rol' },
            { num: '2', icon: '🎯', title: 'Elige número', desc: 'El Marcador elige uno de la nube' },
            { num: '3', icon: '⚡', title: '¡Carrera!', desc: 'Marcador tapa casillas, Buscador busca' },
            { num: '4', icon: '🔔', title: '¡STOP!', desc: 'Buscador encuentra el número y gana la ronda' },
          ].map(s => (
            <div key={s.num} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display font-black text-slate-900 dark:text-white">{s.title}</div>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
          Gana quien complete <strong>48 casillas</strong> o tenga más casillas cuando se agoten los <strong>35 números</strong>.
          ⚠️ Clic erróneo del Buscador = penalización de 2 casillas.
        </p>
      </div>
    </div>
  );
};
