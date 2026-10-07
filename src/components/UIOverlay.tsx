'use client';

import React, { useState } from 'react';
import {
  Sun,
  Sunset,
  Moon,
  Wind,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  Camera,
  RotateCcw,
  Heart,
  Flower2,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Mail,
  Check,
  Copy,
} from 'lucide-react';
import { SceneMode, TimeOfDay } from './DaisyScene';

interface UIOverlayProps {
  mode: SceneMode;
  timeOfDay: TimeOfDay;
  windSpeed: number;
  bloomProgress: number;
  isAutoBloom: boolean;
  isMuted: boolean;
  isGlowingMode: boolean;
  isMusicPlaying: boolean;
  remainingPetals: number;
  totalPetals: number;
  lastPluckedStatus: string | null;
  finalVerdict: string | null;
  isLetterOpen: boolean;
  dedicationTo: string;
  dedicationMsg: string;
  dedicationFrom: string;
  onModeChange: (m: SceneMode) => void;
  onTimeOfDayChange: (t: TimeOfDay) => void;
  onWindSpeedChange: (val: number) => void;
  onBloomChange: (val: number) => void;
  onToggleAutoBloom: () => void;
  onToggleSound: () => void;
  onToggleGlowingMode: () => void;
  onToggleMusic: () => void;
  onToggleLetter: () => void;
  onUpdateDedication: (to: string, msg: string, from: string) => void;
  onPluckPetal: () => void;
  onRegrow: () => void;
  onTakeScreenshot: () => void;
}

export function UIOverlay({
  mode,
  timeOfDay,
  windSpeed,
  bloomProgress,
  isAutoBloom,
  isMuted,
  isGlowingMode,
  isMusicPlaying,
  remainingPetals,
  totalPetals,
  lastPluckedStatus,
  finalVerdict,
  isLetterOpen,
  dedicationTo,
  dedicationMsg,
  dedicationFrom,
  onModeChange,
  onTimeOfDayChange,
  onWindSpeedChange,
  onBloomChange,
  onToggleAutoBloom,
  onToggleSound,
  onToggleGlowingMode,
  onToggleMusic,
  onToggleLetter,
  onUpdateDedication,
  onPluckPetal,
  onRegrow,
  onTakeScreenshot,
}: UIOverlayProps) {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [copied, setCopied] = useState(false);

  // Local state for letter inputs while editing
  const [tempTo, setTempTo] = useState(dedicationTo);
  const [tempMsg, setTempMsg] = useState(dedicationMsg);
  const [tempFrom, setTempFrom] = useState(dedicationFrom);

  const handleCopyLetter = () => {
    const text = `🌼 ${dedicationTo}\n\n${dedicationMsg}\n\n— ${dedicationFrom}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLetter = () => {
    onUpdateDedication(tempTo, tempMsg, tempFrom);
    setIsEditingLetter(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pointer-events-auto gap-2">
        <div className="flex items-center gap-2.5 backdrop-blur-xl bg-black/45 border border-white/20 px-3 md:px-4 py-2 rounded-2xl shadow-2xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            <Flower2 className="w-4 h-4 text-amber-950" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-white drop-shadow flex items-center gap-1.5">
              Margaritas 3D {isGlowingMode && <span className="text-yellow-400 text-xs">✨ Brillo</span>}
            </h1>
            <p className="text-[11px] text-yellow-200/80 font-medium hidden sm:block">
              Flores dinámicas & música relajante
            </p>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Dedication Letter Button */}
          <button
            onClick={onToggleLetter}
            aria-label="Abrir carta de dedicatoria"
            className="p-2 md:px-3 py-2 rounded-xl backdrop-blur-xl bg-gradient-to-r from-rose-500/80 to-amber-500/80 border border-white/30 text-white hover:brightness-110 active:scale-95 transition shadow-lg flex items-center gap-1.5 text-xs font-bold"
          >
            <Mail className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Dedicatoria</span>
          </button>

          {/* Glow Mode Toggle (YouTube Video Aesthetic) */}
          <button
            onClick={onToggleGlowingMode}
            aria-label="Alternar modo brillante"
            className={`p-2 md:px-3 py-2 rounded-xl backdrop-blur-xl border transition shadow-lg flex items-center gap-1.5 text-xs font-bold ${
              isGlowingMode
                ? 'bg-amber-400/30 border-amber-300 text-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                : 'bg-black/40 border-white/20 text-white/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">Brillo</span>
          </button>

          {/* Music Toggle */}
          <button
            onClick={onToggleMusic}
            aria-label="Alternar música relajante"
            className={`p-2 md:px-3 py-2 rounded-xl backdrop-blur-xl border transition shadow-lg flex items-center gap-1.5 text-xs font-bold ${
              isMusicPlaying
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                : 'bg-black/40 border-white/20 text-white/80'
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Música</span>
          </button>

          {/* Sound Effect Mute Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Alternar sonido ambiental"
            className="p-2 md:px-2.5 py-2 rounded-xl backdrop-blur-xl bg-black/40 border border-white/20 text-white hover:bg-black/60 transition shadow-lg text-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
          </button>

          {/* Screenshot Capture */}
          <button
            onClick={onTakeScreenshot}
            aria-label="Descargar captura"
            className="p-2 md:px-2.5 py-2 rounded-xl backdrop-blur-xl bg-black/40 border border-white/20 text-white hover:bg-black/60 transition shadow-lg text-xs"
          >
            <Camera className="w-4 h-4 text-amber-300" />
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            aria-label="Información"
            className="p-2 md:px-2.5 py-2 rounded-xl backdrop-blur-xl bg-black/40 border border-white/20 text-white hover:bg-black/60 transition shadow-lg text-xs"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Dedication Letter Modal (As in viral TikTok / YouTube gifts) */}
      {isLetterOpen && (
        <div className="pointer-events-auto self-center max-w-lg w-full backdrop-blur-2xl bg-gradient-to-b from-stone-900/90 via-black/90 to-amber-950/80 border-2 border-yellow-400/40 text-white p-5 md:p-7 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.25)] z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-yellow-400/20">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💌</span>
              <h3 className="font-extrabold text-lg text-yellow-300 tracking-tight">
                Carta de Dedicatoria
              </h3>
            </div>
            <button
              onClick={onToggleLetter}
              className="text-white/60 hover:text-white text-lg px-2 py-1"
            >
              ✕
            </button>
          </div>

          {!isEditingLetter ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/50 border border-yellow-400/20 shadow-inner">
                <p className="text-sm font-semibold text-yellow-400 mb-2">Para: {dedicationTo}</p>
                <p className="text-sm text-yellow-50/95 leading-relaxed italic whitespace-pre-line font-serif">
                  &ldquo;{dedicationMsg}&rdquo;
                </p>
                <p className="text-xs font-semibold text-right text-yellow-400/90 mt-3">— {dedicationFrom}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setIsEditingLetter(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-yellow-200"
                >
                  ✏️ Editar Mensaje
                </button>
                <button
                  onClick={handleCopyLetter}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 text-xs font-extrabold shadow-md flex items-center gap-1.5 transition active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Texto'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-yellow-300">Para quién es:</label>
                <input
                  type="text"
                  value={tempTo}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-black/60 border border-yellow-400/30 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Nombre o apodo..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-yellow-300">Mensaje especial:</label>
                <textarea
                  rows={3}
                  value={tempMsg}
                  onChange={(e) => setTempMsg(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-black/60 border border-yellow-400/30 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400 resize-none font-serif"
                  placeholder="Escribe tu dedicatoria..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-yellow-300">De parte de:</label>
                <input
                  type="text"
                  value={tempFrom}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-black/60 border border-yellow-400/30 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Tu nombre o firma..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditingLetter(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-medium text-white/80"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLetter}
                  className="px-4 py-1.5 rounded-xl bg-yellow-400 text-yellow-950 text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Popover */}
      {showInfo && (
        <div className="pointer-events-auto self-center max-w-md w-full backdrop-blur-2xl bg-black/85 border border-white/20 text-white p-5 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Controles & Funciones
            </h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-white/60 hover:text-white text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>
          <ul className="text-sm space-y-2.5 text-white/90">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">•</span>
              <span><strong>Deshojar la margarita:</strong> Haz clic o toca directamente cualquier pétalo en 3D para arrancarlo con física de caída.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">•</span>
              <span><strong>Cámara 360°:</strong> Arrastra para orbitar y rueda/pellizca para zoom.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">•</span>
              <span><strong>Flores Brillantes:</strong> Activa el botón <em>Brillo</em> para ver la flor iluminada con partículas de polen ascendentes doradas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">•</span>
              <span><strong>Música de fondo:</strong> Activa la melodía relajante de caja de música en el botón <em>Música</em>.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Center "Me quiere / No me quiere" Game Card */}
      <div className="pointer-events-auto self-center max-w-md w-full flex flex-col items-center gap-2 transition-all duration-300">
        {lastPluckedStatus && !finalVerdict && (
          <div className="backdrop-blur-xl bg-black/60 border border-yellow-400/40 px-5 py-2.5 rounded-full shadow-2xl text-center animate-bounce">
            <span className="text-lg md:text-xl font-extrabold text-white drop-shadow">
              {lastPluckedStatus}
            </span>
          </div>
        )}

        {finalVerdict && (
          <div className="backdrop-blur-2xl bg-gradient-to-r from-rose-600/90 via-amber-500/90 to-rose-600/90 border-2 border-white/60 p-4 rounded-3xl shadow-2xl text-center animate-in zoom-in-90 duration-300">
            <p className="text-sm md:text-base font-black text-white drop-shadow-lg tracking-wide">
              {finalVerdict}
            </p>
            <button
              onClick={onRegrow}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-900 font-bold text-xs shadow-lg hover:bg-yellow-100 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Hacer florecer otra vez
            </button>
          </div>
        )}

        {/* Quick Pluck & Regrow Action Controls */}
        <div className="backdrop-blur-lg bg-black/45 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 text-white text-xs font-medium shadow-xl">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Pétalos: <strong className="text-yellow-300">{remainingPetals}</strong>/{totalPetals}</span>
          </div>

          <button
            onClick={onPluckPetal}
            disabled={remainingPetals === 0}
            className="px-3 py-1.5 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 active:scale-95 transition disabled:opacity-40 font-semibold flex items-center gap-1 text-yellow-200 border border-yellow-400/30"
          >
            🌸 Deshojar
          </button>

          <button
            onClick={onRegrow}
            title="Regenerar pétalos"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 active:scale-95 transition text-white/90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Main Controls Panel */}
      <footer className="pointer-events-auto self-center max-w-3xl w-full">
        <div className="backdrop-blur-2xl bg-black/60 border border-white/20 rounded-3xl p-3 md:p-5 shadow-2xl text-white transition-all duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-yellow-300/80">
                Panel de Control 3D
              </span>
            </div>
            <button
              onClick={() => setIsControlsOpen(!isControlsOpen)}
              className="p-1 rounded-lg hover:bg-white/15 transition text-white/80"
            >
              {isControlsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {isControlsOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 pt-3">
              {/* 1. Mode Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-yellow-300" /> Escena
                </label>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => onModeChange('solo')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                      mode === 'solo'
                        ? 'bg-yellow-400 text-yellow-950 font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    Solitaria
                  </button>
                  <button
                    onClick={() => onModeChange('bouquet')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                      mode === 'bouquet'
                        ? 'bg-yellow-400 text-yellow-950 font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    Ramo
                  </button>
                  <button
                    onClick={() => onModeChange('meadow')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                      mode === 'meadow'
                        ? 'bg-yellow-400 text-yellow-950 font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    Prado
                  </button>
                </div>
              </div>

              {/* 2. Atmosphere / Lighting Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-300" /> Atmósfera
                </label>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => onTimeOfDayChange('day')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition ${
                      timeOfDay === 'day'
                        ? 'bg-amber-400 text-amber-950 font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Día
                  </button>
                  <button
                    onClick={() => onTimeOfDayChange('sunset')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition ${
                      timeOfDay === 'sunset'
                        ? 'bg-orange-500 text-white font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Sunset className="w-3.5 h-3.5" /> Ocaso
                  </button>
                  <button
                    onClick={() => onTimeOfDayChange('night')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition ${
                      timeOfDay === 'night'
                        ? 'bg-indigo-600 text-white font-bold shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Noche
                  </button>
                </div>
              </div>

              {/* 3. Wind & Bloom sliders */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-sky-300" /> Viento
                  </span>
                  <span className="text-[11px] text-white/60">
                    {windSpeed === 0 ? 'Calma' : windSpeed > 0.6 ? 'Fuerte' : 'Brisa'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={windSpeed}
                  onChange={(e) => onWindSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />

                <div className="flex items-center justify-between text-xs font-semibold text-white/80 pt-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Floración
                  </span>
                  <button
                    onClick={onToggleAutoBloom}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase transition ${
                      isAutoBloom ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white/70 hover:bg-white/25'
                    }`}
                  >
                    {isAutoBloom ? 'Auto ON' : 'Manual'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.02"
                  value={bloomProgress}
                  disabled={isAutoBloom}
                  onChange={(e) => onBloomChange(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-white/20 rounded-lg disabled:opacity-40"
                />
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
