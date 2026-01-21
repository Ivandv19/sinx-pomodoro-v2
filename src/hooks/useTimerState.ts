// src/hooks/useTimerState.ts
import { useState, useEffect } from 'preact/hooks';
import type { SavedTimerState } from './useTimerPersistence';

interface Session {
    type: string;
    duration: number;
    label: string;
}

interface UseTimerStateParams {
  schedule: Session[];
  savedState: SavedTimerState | null;
}

export function useTimerState({ schedule, savedState }: UseTimerStateParams) {
  const [currentSessionIndex, setCurrentSessionIndex] = useState(() => savedState?.currentSessionIndex || 0);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState) {
      // Calculate actual time left from saved sessionEndTime
      const now = Date.now();
      return Math.max(0, Math.floor((savedState.sessionEndTime - now) / 1000));
    }
    return schedule[0]?.duration || 0;
  });
  const [isActive, setIsActive] = useState(() => savedState ? false : true); // Start paused if restored
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  
  const [sessionEndTime, setSessionEndTime] = useState<number>(() => {
    if (savedState) return savedState.sessionEndTime;
    return Date.now() + (schedule[0]?.duration || 0) * 1000;
  });
  
  const [blockStartTime, setBlockStartTime] = useState(() => {
    if (savedState) return new Date(savedState.blockStartTime);
    return new Date();
  });
  const [planStartTime] = useState(() => {
    if (savedState) return new Date(savedState.planStartTime);
    return new Date();
  });

  // Handle pause/resume by recalculating end time
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      // When resuming, recalculate the end time based on current timeLeft
      setSessionEndTime(Date.now() + timeLeft * 1000);
    }
  }, [isActive]);

  // Page Visibility API - sync time when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive && timeLeft > 0) {
        // User returned to tab - recalculate time immediately
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((sessionEndTime - now) / 1000));
        setTimeLeft(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, timeLeft, sessionEndTime]);

  return {
    currentSessionIndex,
    setCurrentSessionIndex,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    isSessionFinished,
    setIsSessionFinished,
    sessionEndTime,
    setSessionEndTime,
    blockStartTime,
    setBlockStartTime,
    planStartTime
  };
}
