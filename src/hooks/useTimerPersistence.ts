// src/hooks/useTimerPersistence.ts
import { useEffect } from 'react';
import type { SessionType } from './usePomodoroStats';

interface Session {
    type: SessionType;
    duration: number;
    label: string;
}

export interface SavedTimerState {
    sessionEndTime: number;
    currentSessionIndex: number;
    schedule: Session[];
    isActive: boolean;
    blockStartTime: string;
    planStartTime: string;
    initialMinutes: number;
    timeLeft: number;
}

const STORAGE_KEY = 'pomodoro_active_session';

export function loadSavedState(): SavedTimerState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const state: SavedTimerState = JSON.parse(saved);
    
    // Check if session expired (more than 24 hours old)
    const now = Date.now();
    if (now > state.sessionEndTime + (24 * 60 * 60 * 1000)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return state;
  } catch (e) {
    console.error('Error loading saved timer state:', e);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSavedState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

interface UseTimerPersistenceParams {
  sessionEndTime: number;
  currentSessionIndex: number;
  schedule: Session[];
  isActive: boolean;
  blockStartTime: Date;
  planStartTime: Date;
  initialMinutes: number;
  timeLeft: number;
  isSessionFinished: boolean;
}

export function useTimerPersistence(params: UseTimerPersistenceParams) {
  const {
    sessionEndTime,
    currentSessionIndex,
    schedule,
    isActive,
    blockStartTime,
    planStartTime,
    initialMinutes,
    timeLeft,
    isSessionFinished
  } = params;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!isSessionFinished && timeLeft > 0) {
      const state: SavedTimerState = {
        sessionEndTime,
        currentSessionIndex,
        schedule,
        isActive,
        blockStartTime: blockStartTime.toISOString(),
        planStartTime: planStartTime.toISOString(),
        initialMinutes,
        timeLeft
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else if (isSessionFinished) {
      clearSavedState();
    }
  }, [sessionEndTime, currentSessionIndex, isActive, timeLeft, isSessionFinished]);
}
