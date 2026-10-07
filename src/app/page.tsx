'use client';

import dynamic from 'next/dynamic';
import { Flower2, Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled to guarantee smooth WebGL rendering on client & Vercel
const DaisyScene = dynamic(() => import('@/components/DaisyScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-sky-200 text-white">
      <div className="relative flex items-center justify-center mb-4">
        <Flower2 className="w-16 h-16 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
        <Loader2 className="w-8 h-8 text-white absolute animate-spin" />
      </div>
      <h2 className="text-xl font-bold tracking-tight drop-shadow-md">
        Cultivando margaritas en 3D...
      </h2>
      <p className="text-sm text-white/80 mt-1 font-medium">
        Generando texturas y pétalos botánicos
      </p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <DaisyScene />
    </main>
  );
}
