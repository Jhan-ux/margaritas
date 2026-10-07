'use client';

import dynamic from 'next/dynamic';
import { Flower2, Loader2 } from 'lucide-react';

const DaisyScene = dynamic(() => import('@/components/DaisyScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-black text-white p-6 text-center">
      <div className="relative flex items-center justify-center mb-4">
        <Flower2 className="w-14 h-14 text-yellow-400 animate-spin" style={{ animationDuration: '8s' }} />
        <Loader2 className="w-6 h-6 text-white absolute animate-spin" />
      </div>
      <h2 className="text-base sm:text-lg font-bold tracking-tight drop-shadow text-yellow-200">
        Preparando algo especial para ti, Pastelito...
      </h2>
      <p className="text-xs text-white/60 mt-1 font-medium">
        Un momento, por favor
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
