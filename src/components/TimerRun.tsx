// src/components/TimerRun.tsx
import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { usePomodoroStats, type SessionType } from '../hooks/usePomodoroStats';
import DailySummary from './DailySummary';
import { useTranslations } from '../i18n/utils';

interface Props {
    initialMinutes: number;
    onReset: () => void;
    lang: 'es' | 'en';
}

interface Session {
    type: SessionType;
    duration: number; // segundos
    label: string;
}

const ALARM_SOUND = "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=tibetan-bowl-singing-72688.mp3";

export default function TimerRun({ initialMinutes, onReset, lang }: Props) {
  
  const { addSession, history, hours, minutes, sessionCount } = usePomodoroStats();
  const t = useTranslations(lang);

  const schedule = useMemo(() => {
    const queue: Session[] = [];
    let remainingMins = initialMinutes;
    let cycleCount = 1;

    while (remainingMins >= 25) {
        queue.push({ type: 'focus', duration: 25 * 60, label: t('timer.focus') });
        remainingMins -= 25;

        if (remainingMins >= 5) {
            const isLongBreak = cycleCount % 4 === 0;
            const breakDuration = isLongBreak ? 15 : 5;
            if (remainingMins >= breakDuration) {
                queue.push({ 
                    type: isLongBreak ? 'long' : 'short', 
                    duration: breakDuration * 60, 
                    label: isLongBreak ? t('timer.long') : t('timer.short') 
                });
                remainingMins -= breakDuration;
            }
        }
        cycleCount++;
    }
    return queue;
  }, [initialMinutes, lang, t]);

  // Clave para localStorage
  const TIMER_STATE_KEY = 'pomodoro_timer_state';

  // Función para leer estado guardado de forma sincrónica en la inicialización
  const getSavedState = () => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(TIMER_STATE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
  };

  const savedState = getSavedState();
  


  const [currentSessionIndex, setCurrentSessionIndex] = useState(() => {
      if (savedState && savedState.initialMinutes === initialMinutes) {
          return savedState.currentSessionIndex;
      }
      return 0;
  });

  const [isActive, setIsActive] = useState(() => {
    if (savedState && savedState.initialMinutes === initialMinutes) {
        return false; // 🔥 Siempre iniciar pausado al restaurar
    }
    return true;
  });

  const [isSessionFinished, setIsSessionFinished] = useState(false);
  
  const [blockStartTime, setBlockStartTime] = useState(() => {
      if (savedState && savedState.initialMinutes === initialMinutes && savedState.blockStartTime) {
          return new Date(savedState.blockStartTime);
      }
      return new Date();
  });
  
  const [planStartTime] = useState(() => {
      if (savedState && savedState.initialMinutes === initialMinutes && savedState.planStartTime) {
          return new Date(savedState.planStartTime);
      }
      return new Date();
  });

  // timeLeft initialization WITHOUT "Catch Up" logic (User Request)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState && savedState.initialMinutes === initialMinutes) {
        return savedState.timeLeft || schedule[0]?.duration || 0;
    }
    return schedule[0]?.duration || 0;
  });

  // 5. Hooks / Logic
  const currentSession = schedule[currentSessionIndex];

  // Guardrail for missing session
  if (isActive && !currentSession) {
      setIsActive(false);
  }

  // useRef para persistir el tiempo objetivo
  const endTimeRef = useRef<number>(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHour = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 🔥 PERSISTENCIA: Guardar estado
  useEffect(() => {
      if (isSessionFinished) {
          localStorage.removeItem(TIMER_STATE_KEY);
          return;
      }

      // Only save if timer has actually been started (not just on initial mount)
      // Check if timeLeft is different from initial duration (meaning timer has run)
      const initialDuration = schedule[0]?.duration || 0;
      const hasStarted = timeLeft < initialDuration || currentSessionIndex > 0;
      
      if (!hasStarted) {
          // Don't save state if user hasn't started the timer yet
          return;
      }

      const stateToSave = {
          initialMinutes,
          currentSessionIndex,
          isActive,
          timeLeft,
          endTime: endTimeRef.current,
          blockStartTime: blockStartTime.toISOString(),
          planStartTime: planStartTime.toISOString()
      };
      
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(stateToSave));
  }, [currentSessionIndex, isActive, timeLeft, blockStartTime, planStartTime, isSessionFinished, initialMinutes, schedule]);

  // Main Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    // Update title
    if (isActive && timeLeft > 0 && currentSession) {
        document.title = `(${formatTime(timeLeft)}) ${currentSession.label}`;
    } else if (!isActive && !isSessionFinished) {
        document.title = `⏸ ${t('timer.run.pause').replace('⏸ ', '')}`;
    }

    if (isActive && timeLeft > 0) {
      if (endTimeRef.current === 0) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        const now = Date.now();
        const diff = endTimeRef.current - now;
        const secondsRemaining = Math.ceil(diff / 1000);

        if (secondsRemaining <= 0) {
          setTimeLeft(0);
        } else {
           setTimeLeft(secondsRemaining);
        }
      }, 200);
    } 
    else if (timeLeft === 0 && !isSessionFinished && currentSession) {
      addSession(
          currentSession.type, 
          Math.floor(currentSession.duration / 60), 
          blockStartTime
      );

      const audio = new Audio(ALARM_SOUND);
      audio.volume = 0.7;
      audio.play().catch(e => console.error(e));

      if (Notification.permission === "granted") {
         new Notification(`¡${currentSession.label} ${t('timer.run.finished')}!`, {
            body: lang === 'en' ? "Logged in your history." : "Registrado en tu historial.",
            icon: "/favicon.svg"
         });
      }

      if (currentSessionIndex < schedule.length - 1) {
          const timeout = setTimeout(() => {
              const nextIndex = currentSessionIndex + 1;
              setCurrentSessionIndex(nextIndex);
              setTimeLeft(schedule[nextIndex].duration);
              setIsActive(true);
              setBlockStartTime(new Date()); 
              endTimeRef.current = 0; 
          }, 1500);
          return () => clearTimeout(timeout);
      } else {
          setIsActive(false);
          setIsSessionFinished(true);
          document.title = lang === 'en' ? "✅ Done!" : "✅ ¡Listo!";
      }
    }

    if (!isActive) {
        endTimeRef.current = 0;
    }

    return () => { 
        if (interval) clearInterval(interval);
        document.title = "Pomodoro Flux"; 
    };
  }, [isActive, timeLeft, isSessionFinished, currentSessionIndex, schedule, blockStartTime]); // Removed currentSession from deps to avoid circularity issues if any

  const getTheme = (type: SessionType) => {
      switch (type) {
          case 'focus': return { 
            color: 'text-orange-600 dark:text-orange-500', 
            stroke: 'stroke-orange-600 dark:stroke-orange-500',
            bgButton: 'bg-orange-600 hover:bg-orange-700 text-white',
            border: 'border-b-orange-500'
          };
          case 'short': return { 
            color: 'text-emerald-600 dark:text-emerald-400', 
            stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
            bgButton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            border: 'border-b-emerald-500'
          };
          case 'long': return { 
            color: 'text-indigo-600 dark:text-indigo-400', 
            stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
            bgButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            border: 'border-b-indigo-500'
          };
      }
  };
  
  // Guard for rendering
  if (!currentSession) {
    return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <h2 className="text-2xl font-bold">{lang === 'en' ? 'Session Error' : 'Error en la sesión'}</h2>
            <p>{lang === 'en' ? 'Could not recover current session.' : 'No se pudo recuperar la sesión actual.'}</p>
            <button 
                className="btn btn-primary"
                onClick={() => {
                    localStorage.removeItem(TIMER_STATE_KEY);
                    localStorage.removeItem('pomodoro_active_session');
                    onReset();
                }}
            >
                {lang === 'en' ? 'Restart Plan' : 'Reiniciar Plan'}
            </button>
        </div>
    );
  }

  const theme = getTheme(currentSession.type);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / currentSession.duration;
  const dashOffset = circumference - (progress * circumference);

  // Hora final estimada
  const estimatedFinishTime = useMemo(() => {
      let secondsRemainingTotal = timeLeft; 
      for (let i = currentSessionIndex + 1; i < schedule.length; i++) {
          secondsRemainingTotal += schedule[i].duration;
      }
      const now = new Date();
      const finishDate = new Date(now.getTime() + secondsRemainingTotal * 1000);
      return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [timeLeft, currentSessionIndex, schedule]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in py-6">
      
      <div className="flex flex-col items-center space-y-12">
        
        {/* 1. RELOJ (Visual igual) */}
        <div className="flex flex-col items-center justify-center space-y-8">
             <div className="text-center">
                <span className="text-sm font-bold opacity-50 tracking-widest uppercase">
                    {t('timer.run.current')}
                </span>
                <h2 className={`text-4xl font-black mt-2 ${theme.color} drop-shadow-sm`}>
                    {currentSession.label}
                </h2>
            </div>

            <div className="relative w-80 h-80 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280" role="img" aria-label="Temporizador Pomodoro">
                    <title>Temporizador Pomodoro</title>
                    <circle cx="140" cy="140" r={radius} stroke="currentColor" stroke-width="12" fill="none" className="text-base-300 dark:text-base-content/10" />
                    <circle cx="140" cy="140" r={radius} stroke="currentColor" stroke-width="12" fill="none" stroke-linecap="round"
                        className={`transition-all duration-1000 ease-linear ${theme.stroke}`}
                        style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
                    />
                    <circle cx="140" cy="20"  r="4" className="fill-base-content/30" />
                    <circle cx="260" cy="140" r="4" className="fill-base-content/30" />
                    <circle cx="140" cy="260" r="4" className="fill-base-content/30" />
                    <circle cx="20"  cy="140" r="4" className="fill-base-content/30" />
                </svg>

                <div className="absolute flex flex-col items-center z-10">
                    <span className={`text-7xl font-mono font-bold tracking-tighter ${theme.color}`}>
                        {formatTime(timeLeft)}
                    </span>
                    {isSessionFinished && (
                        <span className="text-sm mt-2 uppercase font-bold animate-pulse text-base-content">
                            {t('timer.run.finished')}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-6 items-center">
                {!isSessionFinished ? (
                    <button 
                        type="button"
                        className={`btn btn-lg h-16 px-10 rounded-full border-none shadow-xl hover:scale-105 transition-transform ${
                            isActive ? 'bg-base-200 text-base-content' : theme.bgButton
                        }`}
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? (
                            <span className="text-lg font-bold flex items-center gap-2">{t('timer.run.pause')}</span>
                        ) : (
                            <span className="text-lg font-bold flex items-center gap-2">{t('timer.run.resume')}</span>
                        )}
                    </button>
                ) : (
                    <button type="button" className={`btn btn-lg h-16 px-10 rounded-full border-none shadow-xl animate-bounce text-white ${theme.bgButton}`} onClick={() => { localStorage.removeItem('pomodoro_timer_state'); onReset(); }}>
                        {t('timer.run.new')}
                    </button>
                )}
                <button type="button" onClick={() => { localStorage.removeItem('pomodoro_timer_state'); onReset(); }} className="btn btn-circle btn-ghost opacity-60 hover:opacity-100 tooltip" data-tip={t('timer.run.cancel')} aria-label={t('timer.run.cancel')}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* 2. AGENDA HORIZONTAL (Visual igual) */}
        <div className="w-full bg-base-100/50 backdrop-blur-sm rounded-2xl p-6 border border-base-200 shadow-sm">
            <div className="mb-6 pb-4 border-b border-base-200 flex justify-between items-center">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold opacity-70">{t('timer.run.agenda')}</h3>
                    <span className="text-xs font-mono opacity-60">{t('timer.run.start')} {formatHour(planStartTime)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase opacity-50">{t('timer.run.end')}</span>
                        <span className="text-2xl font-black">{estimatedFinishTime}</span>
                    </div>
                </div>
            </div>
            <div className="relative flex items-center overflow-x-auto pb-4 hide-scrollbar scroll-smooth snap-x">
                <div className="absolute left-0 right-0 top-[1.2rem] h-0.5 bg-base-300 z-0"></div>
                {schedule.map((session, index) => {
                    const isPast = index < currentSessionIndex;
                    const isCurrent = index === currentSessionIndex;
                    const sTheme = getTheme(session.type);
                    return (
                        <div key={index} className={`relative flex-shrink-0 flex flex-col items-center px-6 snap-center transition-all ${isCurrent ? 'opacity-100 scale-105' : 'opacity-50'}`}>
                            <div className={`w-4 h-4 rounded-full border-2 transition-colors z-10 mb-4 ${
                                isPast ? 'bg-success border-success' : 
                                isCurrent ? `${sTheme.bgButton} border-white shadow-lg` : 
                                'bg-base-100 border-base-300'
                            }`}>
                                {isPast && <svg className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <div className={`p-3 rounded-lg border-b-4 w-40 text-center ${isCurrent ? 'bg-base-200 shadow-md ' + sTheme.border : 'border-transparent'}`}>
                                <div className="flex flex-col items-center">
                                    <span className={`font-bold text-sm truncate w-full`}>{session.label}</span>
                                    <span className="font-mono text-xs opacity-60">{Math.floor(session.duration / 60)}m</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 3. 🔥 STATS / TRACKER (COMPONENTIZADO) */}
        <DailySummary 
            lang={lang}
            history={history} 
            hours={hours} 
            minutes={minutes} 
            count={sessionCount} 
        />

      </div>
    </div>
  );
}