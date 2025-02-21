import { useState, useEffect, useCallback } from 'react';

// Breathing patterns in milliseconds
const BREATHING_PATTERNS = {
  '4-7-8': {
    inhale: 4000,    // 4 seconds to reach maximum size
    hold: 7000,      // 7 seconds at maximum size
    exhale: 8000,    // 8 seconds to return to minimum size
  },
  '4-4-4': {
    inhale: 4000,    // 4 seconds to reach maximum size
    hold: 4000,      // 4 seconds at maximum size
    exhale: 4000,    // 4 seconds to return to minimum size
  }
};

const useBreathing = () => {
  const [isExercising, setIsExercising] = useState(false);
  const [phase, setPhase] = useState('rest');  // rest, inhale, hold, exhale
  const [progress, setProgress] = useState(0);  // 0 to 1 for animation progress
  const [pattern, setPattern] = useState('4-7-8');
  const [startTime, setStartTime] = useState(0);

  // Calculate current breathing phase and progress
  const updateBreathing = useCallback(() => {
    if (!isExercising) return;

    const timing = BREATHING_PATTERNS[pattern];
    const now = Date.now();
    const elapsed = now - startTime;
    const cycleTime = timing.inhale + timing.hold + timing.exhale;
    const cycleElapsed = elapsed % cycleTime;

    if (cycleElapsed < timing.inhale) {
      // Inhale phase - progress from 0 to 1
      setPhase('inhale');
      setProgress(cycleElapsed / timing.inhale);
    } 
    else if (cycleElapsed < timing.inhale + timing.hold) {
      // Hold phase - stay at 1
      setPhase('hold');
      setProgress(1);
    } 
    else {
      // Exhale phase - progress from 1 back to 0
      setPhase('exhale');
      const exhaleElapsed = cycleElapsed - timing.inhale - timing.hold;
      setProgress(1 - (exhaleElapsed / timing.exhale));
    }
  }, [isExercising, pattern, startTime]);

  // Start breathing exercise
  const startExercise = useCallback((breathingPattern = '4-7-8') => {
    setIsExercising(true);
    setPattern(breathingPattern);
    setStartTime(Date.now());
    setPhase('inhale');
    setProgress(0);
  }, []);

  // Stop breathing exercise
  const stopExercise = useCallback(() => {
    setIsExercising(false);
    setPhase('rest');
    setProgress(0);
  }, []);

  // Update animation
  useEffect(() => {
    if (!isExercising) return;

    const intervalId = setInterval(updateBreathing, 16); // 60fps update
    return () => clearInterval(intervalId);
  }, [isExercising, updateBreathing]);

  return {
    isExercising,
    phase,
    progress,  // 0 to 1 value for scaling
    startExercise,
    stopExercise,
  };
};

export default useBreathing;