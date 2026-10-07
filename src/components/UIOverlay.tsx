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
  Pencil,
  Sliders,
  X,
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
  // Mobile active tab for bottom panel: 'scene' | 'light' | 'wind'
  const [activeTab, setActiveTab] = useState<'scene' | 'light' | 'wind'>('scene');
  const [isControlsOpen, setIsControlsOpen] = useState(false); // Collapsed by default on mobile for full view
  const [showInfo, setShowInfo] = useState(false);
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [copied, setCopied] = useState(false);

  const [tempTo, setTempTo] = useState(dedicationTo);
  const [tempMsg, setTempMsg] = useState(dedicationMsg);
  const [tempFrom, setTempFrom] = useState(dedicationFrom);

  const handleCopyLetter = () => {
    const text = `${dedicationTo}\n\n${dedicationMsg}\n\n— ${dedicationFrom}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLetter = () => {
    onUpdateDedication(tempTo, tempMsg, tempFrom);
    setIsEditingLetter(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-5 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pointer-events-auto gap-1.5 w-full">
        {/* Brand Badge personalized for Pastelito */}
        <div className="flex items-center gap-2 backdrop-blur-xl bg-black/60 border border-white/20 px-3 py-2 rounded-2xl shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.5)]">
            <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
              Para Pastelito
              {isGlowingMode && <Sparkles className="w-3.5 h-3.5 text-yellow-400 inline" />}
            </h1>
            <span className="text-[10px] text-yellow-200/80 font-medium">
              Con todo mi cariño
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Dedication Letter */}
          <button
            onClick={onToggleLetter}
            aria-label="Tu Carta"
            className="h-9 px-2.5 sm:px-3 rounded-xl backdrop-blur-xl bg-gradient-to-r from-rose-600/80 to-amber-600/80 border border-white/30 text-white hover:brightness-110 active:scale-95 transition shadow-lg flex items-center gap-1.5 text-xs font-bold"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden md:inline">Tu Carta</span>
          </button>

          {/* Glow Mode */}
          <button
            onClick={onToggleGlowingMode}
            aria-label="Modo resplandor"
            className={`h-9 px-2.5 sm:px-3 rounded-xl backdrop-blur-xl border transition shadow-lg flex items-center gap-1.5 text-xs font-bold ${
              isGlowingMode
                ? 'bg-amber-400/30 border-amber-300 text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                : 'bg-black/50 border-white/20 text-white/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="hidden md:inline">Resplandor</span>
          </button>

          {/* Music */}
          <button
            onClick={onToggleMusic}
            aria-label="Música"
            className={`h-9 px-2.5 sm:px-3 rounded-xl backdrop-blur-xl border transition shadow-lg flex items-center gap-1.5 text-xs font-bold ${
              isMusicPlaying
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                : 'bg-black/50 border-white/20 text-white/80'
            }`}
          >
            <Music className="w-4 h-4 text-emerald-300" />
            <span className="hidden md:inline">Música</span>
          </button>

          {/* Sound Mute */}
          <button
            onClick={onToggleSound}
            aria-label="Sonido"
            className="w-9 h-9 rounded-xl backdrop-blur-xl bg-black/50 border border-white/20 text-white hover:bg-black/70 active:scale-95 transition shadow-lg flex items-center justify-center text-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
          </button>

          {/* Screenshot */}
          <button
            onClick={onTakeScreenshot}
            aria-label="Captura"
            className="w-9 h-9 rounded-xl backdrop-blur-xl bg-black/50 border border-white/20 text-white hover:bg-black/70 active:scale-95 transition shadow-lg flex items-center justify-center text-xs"
          >
            <Camera className="w-4 h-4 text-amber-300" />
          </button>

          {/* Info */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            aria-label="Ayuda"
            className="w-9 h-9 rounded-xl backdrop-blur-xl bg-black/50 border border-white/20 text-white hover:bg-black/70 active:scale-95 transition shadow-lg flex items-center justify-center text-xs"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Dedication Letter Modal */}
      {isLetterOpen && (
        <div className="pointer-events-auto self-center w-[92vw] sm:max-w-lg max-h-[80vh] overflow-y-auto backdrop-blur-2xl bg-black/90 border border-yellow-400/40 text-white p-4 sm:p-6 rounded-3xl shadow-[0_0_40px_rgba(250,204,21,0.25)] z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-yellow-400/20">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-yellow-400" />
              <h3 className="font-extrabold text-base text-yellow-300 tracking-tight">
                Carta para Pastelito
              </h3>
            </div>
            <button
              onClick={onToggleLetter}
              className="text-white/60 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isEditingLetter ? (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-yellow-400/20">
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-2">Para: {dedicationTo}</p>
                <p className="text-sm text-yellow-50/95 leading-relaxed font-serif italic whitespace-pre-line">
                  &ldquo;{dedicationMsg}&rdquo;
                </p>
                <p className="text-xs font-semibold text-right text-yellow-400/90 mt-3">— {dedicationFrom}</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsEditingLetter(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-yellow-200 flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={handleCopyLetter}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 text-xs font-extrabold shadow-md flex items-center gap-1.5 transition active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-yellow-300">Destinatario:</label>
                <input
                  type="text"
                  value={tempTo}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-yellow-400/30 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Nombre de la persona..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-yellow-300">Mensaje:</label>
                <textarea
                  rows={3}
                  value={tempMsg}
                  onChange={(e) => setTempMsg(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-yellow-400/30 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400 resize-none font-serif"
                  placeholder="Escribe tu dedicatoria..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-yellow-300">Remitente:</label>
                <input
                  type="text"
                  value={tempFrom}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-yellow-400/30 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Tu nombre..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
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
        <div className="pointer-events-auto self-center w-[92vw] sm:max-w-md backdrop-blur-2xl bg-black/90 border border-white/20 text-white p-4 sm:p-5 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Controles
            </h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ul className="text-xs sm:text-sm space-y-2 text-white/90">
            <li className="flex items-start gap-2">
              <Flower2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong>Deshojar:</strong> Toca cualquier pétalo en 3D para arrancarlo.</span>
            </li>
            <li className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong>Cámara 360:</strong> Desliza un dedo para rotar y pellizca para zoom.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong>Resplandor:</strong> Activa el botón de resplandor para ver las flores iluminadas en la noche.</span>
            </li>
            <li className="flex items-start gap-2">
              <Music className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong>Música:</strong> Activa la melodía relajante de fondo.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Center "Me quiere / No me quiere" Game Card */}
      <div className="pointer-events-auto self-center max-w-sm w-full flex flex-col items-center gap-2 transition-all duration-300">
        {lastPluckedStatus && !finalVerdict && (
          <div className="backdrop-blur-xl bg-black/65 border border-yellow-400/40 px-4 py-2 rounded-full shadow-2xl text-center animate-bounce">
            <span className="text-sm sm:text-base font-extrabold text-white drop-shadow">
              {lastPluckedStatus}
            </span>
          </div>
        )}

        {finalVerdict && (
          <div className="backdrop-blur-2xl bg-gradient-to-r from-rose-700/90 via-amber-600/90 to-rose-700/90 border-2 border-white/60 p-3 sm:p-4 rounded-3xl shadow-2xl text-center animate-in zoom-in-90 duration-300 w-full">
            <p className="text-xs sm:text-sm font-black text-white drop-shadow tracking-wide">
              {finalVerdict}
            </p>
            <button
              onClick={onRegrow}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-gray-950 font-bold text-xs shadow-lg hover:bg-yellow-100 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Volver a florecer
            </button>
          </div>
        )}

        {/* Quick Pluck & Regrow Action Controls */}
        <div className="backdrop-blur-lg bg-black/55 border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-2.5 text-white text-xs font-medium shadow-xl">
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Pétalos: <strong className="text-yellow-300">{remainingPetals}</strong>/{totalPetals}</span>
          </div>

          <button
            onClick={onPluckPetal}
            disabled={remainingPetals === 0}
            className="px-2.5 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 active:scale-95 transition disabled:opacity-40 font-semibold flex items-center gap-1 text-yellow-200 border border-yellow-400/30"
          >
            <Flower2 className="w-3.5 h-3.5 text-yellow-300" /> Deshojar
          </button>

          <button
            onClick={onRegrow}
            title="Regenerar pétalos"
            className="p-1 rounded-lg bg-white/10 hover:bg-white/25 active:scale-95 transition text-white/90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Main Controls Panel (Mobile-optimized with tabs & collapsible bar) */}
      <footer className="pointer-events-auto self-center max-w-2xl w-full">
        <div className="backdrop-blur-2xl bg-black/70 border border-white/20 rounded-3xl p-2.5 sm:p-4 shadow-2xl text-white transition-all duration-300">
          {/* Header toggler & tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-white/15 gap-2">
            {/* Quick Segmented Tabs on Mobile */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('scene');
                  setIsControlsOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isControlsOpen && activeTab === 'scene'
                    ? 'bg-yellow-400 text-yellow-950 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[11px]">Escena</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('light');
                  setIsControlsOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isControlsOpen && activeTab === 'light'
                    ? 'bg-yellow-400 text-yellow-950 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="text-[11px]">Luz</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('wind');
                  setIsControlsOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isControlsOpen && activeTab === 'wind'
                    ? 'bg-yellow-400 text-yellow-950 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[11px]">Ajustes</span>
              </button>
            </div>

            {/* Panel Expand / Collapse Toggler */}
            <button
              onClick={() => setIsControlsOpen(!isControlsOpen)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-white/80"
              aria-label="Alternar panel"
            >
              {isControlsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Active Tab Panel Content */}
          {isControlsOpen && (
            <div className="pt-2.5">
              {/* Tab 1: Escena */}
              {activeTab === 'scene' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => onModeChange('solo')}
                      className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold transition ${
                        mode === 'solo'
                          ? 'bg-yellow-400 text-yellow-950 font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Solitaria
                    </button>
                    <button
                      onClick={() => onModeChange('bouquet')}
                      className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold transition ${
                        mode === 'bouquet'
                          ? 'bg-yellow-400 text-yellow-950 font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Ramo
                    </button>
                    <button
                      onClick={() => onModeChange('meadow')}
                      className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold transition ${
                        mode === 'meadow'
                          ? 'bg-yellow-400 text-yellow-950 font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Prado
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Luz / Atmósfera */}
              {activeTab === 'light' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => onTimeOfDayChange('day')}
                      className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        timeOfDay === 'day'
                          ? 'bg-amber-400 text-amber-950 font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Día
                    </button>
                    <button
                      onClick={() => onTimeOfDayChange('sunset')}
                      className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        timeOfDay === 'sunset'
                          ? 'bg-orange-500 text-white font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Sunset className="w-3.5 h-3.5" /> Ocaso
                    </button>
                    <button
                      onClick={() => onTimeOfDayChange('night')}
                      className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        timeOfDay === 'night'
                          ? 'bg-indigo-600 text-white font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> Noche
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Viento & Floración */}
              {activeTab === 'wind' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  {/* Wind Slider */}
                  <div className="flex flex-col gap-1">
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
                      className="w-full accent-yellow-400 cursor-pointer h-2 bg-white/20 rounded-lg"
                    />
                  </div>

                  {/* Bloom Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-white/80">
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
                      className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/20 rounded-lg disabled:opacity-40"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
