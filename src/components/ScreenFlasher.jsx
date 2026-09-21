import { useEffect, useState } from 'react';

/**
 * ScreenFlasher component: Flashes the entire screen brightly for 3 seconds
 * when approaching or arriving at a station to immediately grab the user's attention.
 */
export default function ScreenFlasher({ mode = 'arrival', onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 3000); // Exactly 3 seconds flash duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const animationClass = mode === 'arrival' ? 'animate-screen-flash-arrival' : 'animate-screen-flash-approaching';

  return (
    <div
      className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300 ${animationClass}`}
      style={{
        animation: 'screenFlash 0.3s ease-in-out infinite alternate'
      }}
    >
      <style>{`
        @keyframes screenFlash {
          0% {
            background-color: ${mode === 'arrival' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(245, 158, 11, 0.85)'};
            backdrop-filter: blur(2px);
          }
          100% {
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(0px);
          }
        }
      `}</style>
      <div className="h-full w-full flex items-center justify-center">
        <div className="bg-black/80 text-white font-extrabold text-2xl px-6 py-4 rounded-3xl shadow-2xl tracking-wider uppercase animate-bounce">
          {mode === 'arrival' ? '🚨 ARRIVED! 🚨' : '⚠️ APPROACHING! ⚠️'}
        </div>
      </div>
    </div>
  );
}
