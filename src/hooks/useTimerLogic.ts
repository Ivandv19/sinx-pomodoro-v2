import { useState, useEffect, useMemo } from 'react';
import type { SessionType } from './usePomodoroStats';

const ALARM_SOUND = "https://pomodoro-assets.mgdc.site/alarm.mp3";

export interface Session {
    type: SessionType;
    duration: number; // segundos
    label: string;
}

interface UseTimerLogicProps {
    initialMinutes: number;
    onSessionComplete: (type: SessionType, minutes: number, startTime: Date) => void;
}

export function useTimerLogic({ initialMinutes, onSessionComplete }: UseTimerLogicProps) {
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

    // Notification Permission
    useEffect(() => {
        if (Notification.permission !== "granted") Notification.requestPermission();
    }, []);

    // Helper for formatting time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Timer Interval & Side Effects
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        // Title Updates
        if (isActive && timeLeft > 0) {
            document.title = `(${formatTime(timeLeft)}) ${currentSession.label}`;
        } else if (!isActive && !isSessionFinished) {
            document.title = "⏸ Pausa";
        }

        // Tick
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        }
        else if (timeLeft === 0 && !isSessionFinished) {
            // FINISHED SESSION Logic
            onSessionComplete(
                currentSession.type,
                Math.floor(currentSession.duration / 60),
                blockStartTime
            );

            // Audio
            const audio = new Audio(ALARM_SOUND);
            audio.volume = 0.7;
            audio.play().catch(e => console.error(e));

            // Notification
            if (Notification.permission === "granted") {
                new Notification(`¡${currentSession.label} terminado!`, {
                    body: "Registrado en tu historial.",
                    icon: "https://pomodoro-assets.mgdc.site/favicon.png"
                });
            }

            // Next Session?
            if (currentSessionIndex < schedule.length - 1) {
                const timeout = setTimeout(() => {
                    const nextIndex = currentSessionIndex + 1;
                    setCurrentSessionIndex(nextIndex);
                    setTimeLeft(schedule[nextIndex].duration);
                    setIsActive(true);
                    setBlockStartTime(new Date());
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
            document.title = "Sinx Pomodoro";
        };
    }, [isActive, timeLeft, isSessionFinished, currentSession, currentSessionIndex, schedule, blockStartTime, onSessionComplete]);

    // Helpers exposed to UI
    const toggleTimer = () => setIsActive(!isActive);

    const formatHour = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const estimatedFinishTime = useMemo(() => {
        let secondsRemainingTotal = timeLeft;
        for (let i = currentSessionIndex + 1; i < schedule.length; i++) {
            secondsRemainingTotal += schedule[i].duration;
        }
        const now = new Date();
        const finishDate = new Date(now.getTime() + secondsRemainingTotal * 1000);
        return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [timeLeft, currentSessionIndex, schedule]);

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
                bgButton: 'bg-emerald-600 hover:bg-emerald-600/90 text-white', // Adjusted hover
                border: 'border-b-emerald-500'
            };
            case 'long': return {
                color: 'text-indigo-600 dark:text-indigo-400',
                stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
                bgButton: 'bg-indigo-600 hover:bg-indigo-600/90 text-white',
                border: 'border-b-indigo-500'
            };
        }
    };

    return {
        timeLeft,
        isActive,
        isSessionFinished,
        currentSession,
        currentSessionIndex,
        schedule,
        planStartTime,
        estimatedFinishTime,
        formatTime,
        formatHour,
        toggleTimer,
        getTheme
    };
}
