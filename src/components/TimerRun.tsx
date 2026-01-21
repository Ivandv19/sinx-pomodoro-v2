// src/components/TimerRun.tsx
import { useState, useEffect, useMemo } from 'preact/hooks';
import { usePomodoroStats, type SessionType } from '../hooks/usePomodoroStats';
import DailySummary from './DailySummary';

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

  const schedule = useMemo(() => {
    const queue: Session[] = [];
    let remainingMins = initialMinutes;
    let cycleCount = 1;

    while (remainingMins >= 25) {
        queue.push({ type: 'focus', duration: 25 * 60, label: 'Modo Enfoque' });
        remainingMins -= 25;

        if (remainingMins >= 5) {
            const isLongBreak = cycleCount % 4 === 0;
            const breakDuration = isLongBreak ? 15 : 5;
            if (remainingMins >= breakDuration) {
                queue.push({ 
                    type: isLongBreak ? 'long' : 'short', 
                    duration: breakDuration * 60, 
                    label: isLongBreak ? 'Descanso Largo' : 'Relax Breve' 
                });
                remainingMins -= breakDuration;
            }
        }
        cycleCount++;
    }
    return queue;
  }, [initialMinutes]);

  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(schedule[0]?.duration || 0);
  const [isActive, setIsActive] = useState(true); 
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  
  const [blockStartTime, setBlockStartTime] = useState(new Date());
  const [planStartTime] = useState(new Date());

  const currentSession = schedule[currentSessionIndex];
  
  useEffect(() => {
    if (Notification.permission !== "granted") Notification.requestPermission();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHour = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isActive && timeLeft > 0) {
        document.title = `(${formatTime(timeLeft)}) ${currentSession.label}`;
    } else if (!isActive && !isSessionFinished) {
        document.title = "⏸ Pausa";
    }

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } 
    else if (timeLeft === 0 && !isSessionFinished) {
      
      addSession(
          currentSession.type, 
          Math.floor(currentSession.duration / 60), 
          blockStartTime
      );

      const audio = new Audio(ALARM_SOUND);
      audio.volume = 0.7;
      audio.play().catch(e => console.error(e));

      if (Notification.permission === "granted") {
         new Notification(`¡${currentSession.label} terminado!`, {
            body: "Registrado en tu historial.",
            icon: "/favicon.svg"
         });
      }

      if (currentSessionIndex < schedule.length - 1) {
          const timeout = setTimeout(() => {
              const nextIndex = currentSessionIndex + 1;
              setCurrentSessionIndex(nextIndex);
              setTimeLeft(schedule[nextIndex].duration);
              setIsActive(true);
              setBlockStartTime(new Date()); // 🔥 RESETEAMOS HORA DE INICIO
          }, 1500);
          return () => clearTimeout(timeout);
      } else {
          setIsActive(false);
          setIsSessionFinished(true);
          document.title = "✅ ¡Listo!";
      }
    }
    return () => { 
        if (interval) clearInterval(interval);
        document.title = "Pomodoro Flux"; 
    };
  }, [isActive, timeLeft, isSessionFinished, currentSession, currentSessionIndex, schedule, blockStartTime]); // Agregamos blockStartTime a deps

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
                    Bloque Actual
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
                            Terminado
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
                            <span className="text-lg font-bold flex items-center gap-2">⏸ Pausar</span>
                        ) : (
                            <span className="text-lg font-bold flex items-center gap-2">▶ Continuar</span>
                        )}
                    </button>
                ) : (
                    <button type="button" className={`btn btn-lg h-16 px-10 rounded-full border-none shadow-xl animate-bounce text-white ${theme.bgButton}`} onClick={onReset}>
                        Nuevo Plan ↺
                    </button>
                )}
                <button type="button" onClick={onReset} className="btn btn-circle btn-ghost opacity-40 hover:opacity-100 tooltip" data-tip="Cancelar Plan">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* 2. AGENDA HORIZONTAL (Visual igual) */}
        <div className="w-full bg-base-100/50 backdrop-blur-sm rounded-2xl p-6 border border-base-200 shadow-sm">
            <div className="mb-6 pb-4 border-b border-base-200 flex justify-between items-center">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold opacity-70">Agenda de Hoy</h3>
                    <span className="text-xs font-mono opacity-40">Inicio: {formatHour(planStartTime)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase opacity-50">Fin Aprox:</span>
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