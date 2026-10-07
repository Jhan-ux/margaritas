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
  Camera,
  RotateCcw,
  Heart,
  Flower2,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { SceneMode, TimeOfDay } from './DaisyScene';

interface UIOverlayProps {
  mode: SceneMode;
  timeOfDay: TimeOfDay;
  windSpeed: number;
  bloomProgress: number;
  isAutoBloom: boolean;
  isMuted: boolean;
  remainingPetals: number;
  totalPetals: number;
  lastPluckedStatus: string | null;
  finalVerdict: string | null;
  onModeChange: (m: SceneMode) => void;
  onTimeOfDayChange: (t: TimeOfDay) => void;
  onWindSpeedChange: (val: number) => void;
  onBloomChange: (val: number) => void;
  onToggleAutoBloom: () => void;
  onToggleSound: () => void;
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
  remainingPetals,
  totalPetals,
  lastPluckedStatus,
  finalVerdict,
  onModeChange,
  onTimeOfDayChange,
  onWindSpeedChange,
  onBloomChange,
  onToggleAutoBloom,
  onToggleSound,
  onPluckPetal,
  onRegrow,
  onTakeScreenshot,
}: UIOverlayProps) {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const isNight = timeOfDay === 'night';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 backdrop-blur-md bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-inner">
            <Flower2 className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white drop-shadow-md">
              Margaritas 3D
            </h1>
            <p className="text-xs text-white/80 font-medium hidden sm:block">
              Simulación botánica & floración interactiva
            </p>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Alternar sonido ambiental"
            className="p-2.5 rounded-xl backdrop-blur-md bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/10 text-white hover:bg-white/30 transition shadow-lg flex items-center gap-1.5 text-xs font-semibold"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
            <span className="hidden sm:inline">{isMuted ? 'Silenciado' : 'Sonido'}</span>
          </button>

          {/* Screenshot Capture */}
          <button
            onClick={onTakeScreenshot}
            aria-label="Descargar captura"
            className="p-2.5 rounded-xl backdrop-blur-md bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/10 text-white hover:bg-white/30 transition shadow-lg flex items-center gap-1.5 text-xs font-semibold"
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Foto HD</span>
          </button>

          {/* Info Modal Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            aria-label="Información de controles"
            className="p-2.5 rounded-xl backdrop-blur-md bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/10 text-white hover:bg-white/30 transition shadow-lg"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info Popover */}
      {showInfo && (
        <div className="pointer-events-auto self-center max-w-md w-full backdrop-blur-xl bg-black/75 border border-white/20 text-white p-5 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Cómo interactuar
            </h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-white/60 hover:text-white text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>
          <ul className="text-sm space-y-2 text-white/90">
            <li className="flex items-start gap-2">
              <span className="text-amber-300 font-bold">•</span>
              <span><strong>Deshojar la margarita:</strong> Haz clic o toca directamente cualquiera de los pétalos 3D para arrancarlo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-300 font-bold">•</span>
              <span><strong>Cámara 3D:</strong> Arrastra con el cursor o el dedo para girar 360°, y haz zoom con la rueda del ratón o pellizcando la pantalla.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-300 font-bold">•</span>
              <span><strong>Modos escénicos:</strong> Explora la margarita solitaria en detalle, el ramo elegante o el prado silvestre.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-300 font-bold">•</span>
              <span><strong>Ambiente & Luciérnagas:</strong> Cambia a modo Noche para disfrutar de luciérnagas bioluminiscentes flotantes.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Center "Me quiere / No me quiere" Game Card */}
      <div className="pointer-events-auto self-center max-w-md w-full flex flex-col items-center gap-2 transition-all duration-300">
        {/* Status banner */}
        {lastPluckedStatus && !finalVerdict && (
          <div className="backdrop-blur-xl bg-white/30 dark:bg-black/60 border border-white/40 dark:border-white/20 px-5 py-2.5 rounded-full shadow-2xl text-center animate-bounce">
            <span className="text-lg md:text-xl font-extrabold text-white drop-shadow">
              {lastPluckedStatus}
            </span>
          </div>
        )}

        {/* Final verdict banner */}
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
        <div className="backdrop-blur-lg bg-black/40 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 text-white text-xs font-medium shadow-xl">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Pétalos: <strong className="text-yellow-300">{remainingPetals}</strong>/{totalPetals}</span>
          </div>

          <button
            onClick={onPluckPetal}
            disabled={remainingPetals === 0}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition disabled:opacity-40 font-semibold flex items-center gap-1 text-white"
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
        <div className="backdrop-blur-xl bg-white/20 dark:bg-black/55 border border-white/30 dark:border-white/15 rounded-3xl p-3 md:p-5 shadow-2xl text-white transition-all duration-300">
          {/* Header toggler */}
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-white/70">
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
                <div className="grid grid-cols-3 gap-1 bg-black/25 p-1 rounded-xl border border-white/10">
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
                <div className="grid grid-cols-3 gap-1 bg-black/25 p-1 rounded-xl border border-white/10">
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
                {/* Wind Slider */}
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

                {/* Bloom Slider & Auto-toggle */}
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
