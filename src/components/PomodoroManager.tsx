import { useState, useEffect } from "preact/hooks";
import TimerSetup from "./TimerSetup";
import TimerRun from "./TimerRun"; 

interface Props {
  lang?: 'es' | 'en';
}

const STORAGE_KEY = 'pomodoro_active_session';

export default function PomodoroManager({ lang = 'es' }: Props) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);

  // 🔥 Check for saved session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // Auto-restore the session
        setSelectedMinutes(state.initialMinutes);
      }
    } catch (e) {
      console.error('Error loading saved session:', e);
    }
  }, []);

  return (
    <div className="w-full"> 
      
      {selectedMinutes === null ? (
        <TimerSetup 
            lang={lang}
            onStart={(minutes) => setSelectedMinutes(minutes)}
          />
      ) : (
        <TimerRun
            lang={lang}
            initialMinutes={selectedMinutes}
            onReset={() => setSelectedMinutes(null)}
          />
      )}
      
    </div>
  );
}