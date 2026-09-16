import React, { useState, useEffect } from 'react';
import { Users, Bot, Play, Copy, Check, Sparkles, Shield, Smartphone, Share2, X } from 'lucide-react';
import { GameRoomState, PlayerId } from '../types.js';

interface LobbyScreenProps {
  roomState: GameRoomState;
  mySlot: PlayerId | 'spectator';
  onStartGame: (isBot: boolean) => void;
  onSwitchSlot: (slot: PlayerId) => void;
  roomId: string;
  onRoomChange: (newRoom: string) => void;
  darkMode: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomState,
  mySlot,
  onStartGame,
  onSwitchSlot,
  roomId,
  onRoomChange,
  darkMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputRoom, setInputRoom] = useState(roomId);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `¡Hola! Te invito a jugar una partida de *NumSTOP!* 🔢⚡\n¿Quién tiene mejores reflejos? Entra a este enlace con el código de sala *${roomId}*:\n${inviteUrl}`
  );

  const handleJoinDifferentRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoom.trim()) {
      onRoomChange(inputRoom.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 flex flex-col items-center">
      {/* App Logo & Hero Presentation */}
      <div className="text-center max-w-2xl mb-8 flex flex-col items-center">
        <div className="relative group mb-3">
          <img
            src="/logo.png"
            alt="NumSTOP! Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-xl ring-4 ring-amber-400/50 object-cover select-none transition-transform group-hover:scale-105 duration-200"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>¡Duelo de Agilidad Mental y Reflejos!</span>
        </div>

        <h2 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white mb-2">
          NumSTOP!
        </h2>

        <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mb-2 max-w-md">
          "¡Rápido como un rayo, certero como un lince: encuentra el número antes de que congelen tu tablero!"
        </p>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          Un jugador marca casillas a toda velocidad mientras el rival busca el número secreto en la nube. ¡Quien encuentre el número grita <strong className="text-amber-600 dark:text-amber-400 font-bold">STOP</strong> y congela el tablero!
        </p>

        {/* Quick action badges (Install on Mobile + WhatsApp Share) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          <a
            id="lobby-whatsapp-share-btn"
            href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            <span className="text-base leading-none">💬</span>
            <span>Compartir por WhatsApp con Estudiantes</span>
          </a>

          <button
            id="lobby-install-pwa-btn"
            onClick={handleInstallPWA}
            className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar en el Celular</span>
          </button>
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
        
        {/* Option A: Play with rival (Multiplayer online) */}
        <div className="p-6 sm:p-7 rounded-3xl border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:border-violet-400 dark:hover:border-violet-500/60">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-4 border border-violet-200 dark:border-violet-800 shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            
            <h3 className="font-display text-xl font-black mb-1 text-slate-950 dark:text-white">
              Multijugador en Línea (2P)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Invita a una compañera o abre otra pestaña en tu navegador para jugar en tiempo real con sincronización por servidor.
            </p>

            {/* Room code box */}
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between mb-4 shadow-xs">
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-800 dark:text-amber-400">Código de Sala</div>
                <div className="text-2xl font-mono font-black tracking-wider text-slate-900 dark:text-white">{roomId}</div>
              </div>
              <button
                onClick={copyLink}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 hover:bg-amber-100/50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-500" />}
                <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
              </button>
            </div>

            {/* Slot selector */}
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Tu puesto asignado:</div>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                onClick={() => onSwitchSlot('player1')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mySlot === 'player1'
                    ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/25 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Jugador 1
              </button>
              <button
                onClick={() => onSwitchSlot('player2')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mySlot === 'player2'
                    ? 'border-teal-500 bg-teal-600 text-white shadow-md shadow-teal-500/25 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Jugador 2
              </button>
            </div>
          </div>

          <button
            id="start-multiplayer-btn"
            onClick={() => onStartGame(false)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display font-black text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Partida 2P</span>
          </button>
        </div>

        {/* Option B: Train with Bot / Solo Practice */}
        <div className="p-6 sm:p-7 rounded-3xl border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:border-amber-400 dark:hover:border-amber-500/60">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800 shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            
            <h3 className="font-display text-xl font-black mb-1 text-slate-950 dark:text-white">
              Práctica Rápida con IA
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Juega al instante sin esperar a otra jugadora. La IA rival simula la velocidad de búsqueda visual y marcado humano.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 mb-5 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Simulación en tiempo real:</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                • Duelos de Yan Ken Po automatizados
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                • Búsqueda visual asimétrica con latencia humana
              </p>
            </div>
          </div>

          <button
            id="start-bot-btn"
            onClick={() => onStartGame(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-display font-black text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Bot className="w-4 h-4" />
            <span>Jugar Contra la IA Ahora</span>
          </button>
        </div>
      </div>

      {/* Change Room Code Form */}
      <div className="flex flex-col items-center gap-2">
        <form onSubmit={handleJoinDifferentRoom} className="w-full max-w-xs flex items-center gap-2">
          <input
            type="text"
            value={inputRoom}
            onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
            placeholder="Código de sala"
            maxLength={6}
            className="w-full px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-black whitespace-nowrap cursor-pointer shadow-md transition-all active:scale-95"
          >
            Unirse
          </button>
        </form>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Puedes crear o unirte a cualquier sala con tus estudiantes
        </span>
      </div>

      {/* PWA Mobile Installation Modal Guide */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/30">
              <Smartphone className="w-7 h-7" />
            </div>

            <h3 className="font-display text-xl font-black mb-2">
              Cómo Instalar NumSTOP! en el Celular
            </h3>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block mb-1">📱 En Android (Google Chrome):</strong>
                Pulsa los <strong>tres puntos ⋮</strong> en la esquina superior derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block mb-1">🍏 En iPhone / iPad (Safari):</strong>
                Pulsa el botón de <strong>Compartir (icono del cuadrado con flecha ↑)</strong> y elige <strong>"Añadir a pantalla de inicio"</strong>.
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                ¡Se abrirá a pantalla completa como una app nativa sin barras de navegador!
              </p>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-black text-xs cursor-pointer shadow-md"
            >
              ¡Entendido, gracias!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
