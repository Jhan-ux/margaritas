'use client';

import dynamic from 'next/dynamic';
import { Flower2, Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled to guarantee smooth WebGL rendering on client & Vercel
const DaisyScene = dynamic(() => import('@/components/DaisyScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-black text-white">
      <div className="relative flex items-center justify-center mb-4">
        <Flower2 className="w-14 h-14 text-yellow-400 animate-spin" style={{ animationDuration: '8s' }} />
        <Loader2 className="w-6 h-6 text-white absolute animate-spin" />
      </div>
      <h2 className="text-base sm:text-lg font-bold tracking-tight drop-shadow">
        Cargando margaritas 3D...
      </h2>
      <p className="text-xs text-yellow-200/70 mt-1 font-medium">
        Generando texturas y modelos botánicos
      </p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-[100dvh] overflow-hidden bg-black touch-none">
      <DaisyScene />
    </main>
  );
}
