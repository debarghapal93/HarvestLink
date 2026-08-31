import { useState, useEffect } from 'react';

const STEPS = [
  'Initializing genetic algorithm…',
  'Loading 247 supply node coordinates…',
  'Calculating pairwise distances…',
  'Running Clarke-Wright savings heuristic…',
  'Applying 2-opt improvement passes…',
  'Validating capacity constraints…',
  'Generating optimal route plan…',
  '✅ Optimal solution found!',
];

export default function SolverOverlay({ onComplete }) {
  const [step, setStep]         = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const total = STEPS.length;

    const id = setInterval(() => {
      current++;
      setStep(current);
      setProgress(Math.round((current / total) * 100));

      if (current >= total) {
        clearInterval(id);
        setTimeout(onComplete, 700);
      }
    }, 620);

    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="panel-in bg-white rounded-3xl p-10 w-96 flex flex-col items-center gap-5 text-center"
        style={{ boxShadow:'0 32px 80px rgba(0,0,0,0.2)' }}>

        {/* Spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center rounded-full"
          style={{ background:'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow:'0 8px 24px rgba(124,58,237,0.35)' }}>
          <div className="solver-ring absolute inset-[-6px] rounded-full border-[3px] border-t-purple-600 border-r-purple-300/30 border-b-transparent border-l-transparent" />
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h3 className="text-[1.25rem] font-extrabold text-gray-900">Running VRP Solver…</h3>
        <p className="text-[0.85rem] text-gray-500">
          Calculating routes for <strong className="text-gray-700">247</strong> supply nodes
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width:`${progress}%`, background:'linear-gradient(90deg,#7C3AED,#818cf8)' }} />
        </div>

        {/* Step text */}
        <p className="text-[0.75rem] text-gray-400 font-mono min-h-[1.2em]">
          {STEPS[Math.min(step, STEPS.length - 1)]}
        </p>
      </div>
    </div>
  );
}
