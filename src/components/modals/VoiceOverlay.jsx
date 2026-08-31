import { useEffect, useRef } from 'react';

export default function VoiceOverlay({ onClose, onRecognized }) {
  const timerRef = useRef(null);

  useEffect(() => {
    // Auto-recognize after 4 seconds
    timerRef.current = setTimeout(() => onRecognized('tomato', 50), 4000);
    return () => clearTimeout(timerRef.current);
  }, [onRecognized]);

  const handleStop = () => {
    clearTimeout(timerRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:'rgba(10,20,15,0.75)', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleStop(); }}>

      <div className="panel-in relative flex flex-col items-center gap-5 px-10 py-12 rounded-3xl text-white w-96 text-center"
        style={{ background:'linear-gradient(175deg,#064e35,#0D7A51)' }}>

        {/* Close */}
        <button onClick={handleStop}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors text-sm">
          ✕
        </button>

        {/* Animated mic */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <span className="voice-ring-w voice-ring-w-1" />
          <span className="voice-ring-w voice-ring-w-2" />
          <span className="voice-ring-w voice-ring-w-3" />
          <div className="relative z-10 w-16 h-16 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h3 className="text-[1.4rem] font-extrabold">Listening…</h3>
        <p className="text-white/75 text-[0.9rem]">
          Say something like <span className="text-green-300 font-semibold not-italic">"50 kg Tomato at ₹25"</span>
        </p>

        {/* Waveform */}
        <div className="wave-bars">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </div>

        <button onClick={handleStop}
          className="px-9 py-3 rounded-full bg-white/15 border-2 border-white/35 text-white font-bold text-[0.9rem] hover:bg-white/25 transition-colors">
          ■ Stop Recording
        </button>
      </div>
    </div>
  );
}
