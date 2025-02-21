import { useState, useEffect, useRef } from 'react';

const useAudioVisualization = (audioSrc) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioElementRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastIntensityRef = useRef(0);

  // Initialize audio system
  useEffect(() => {
    // Create audio element
    audioElementRef.current = new Audio(audioSrc);

    // Initialize Web Audio API
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        
        // Configure analyser
        analyserRef.current.fftSize = 512;
        analyserRef.current.minDecibels = -65;
        analyserRef.current.maxDecibels = -20;
        analyserRef.current.smoothingTimeConstant = 0.3;

        // Connect audio nodes
        const source = audioContextRef.current.createMediaElementSource(audioElementRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error('Failed to initialize audio system:', error);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioSrc]);

  // Detect speech in audio frequencies
  const detectSpeech = (frequencies) => {
    if (!audioContextRef.current || !analyserRef.current) return 0;

    const sampleRate = audioContextRef.current.sampleRate;
    const binCount = frequencies.length;
    
    // Calculate frequency ranges
    const voiceStart = Math.floor(80 * binCount / sampleRate);
    const voiceEnd = Math.floor(260 * binCount / sampleRate);
    const musicLow = Math.floor(50 * binCount / sampleRate);
    const musicHigh = Math.floor(1500 * binCount / sampleRate);
    
    // Calculate voice and music averages
    let voiceSum = 0;
    let musicSum = 0;
    let musicCount = 0;
    
    for (let i = voiceStart; i < voiceEnd; i++) {
      voiceSum += frequencies[i];
    }
    
    for (let i = musicLow; i < musicHigh; i++) {
      if (i < voiceStart || i > voiceEnd) {
        musicSum += frequencies[i];
        musicCount++;
      }
    }
    
    const voiceAvg = voiceSum / (voiceEnd - voiceStart);
    const musicAvg = musicSum / musicCount;
    const voiceStrength = voiceAvg / musicAvg;
    
    // Return intensity if voice detected
    if (voiceAvg > 30 && voiceStrength > 1.2) {
      return Math.min(100, voiceAvg * 1.5);
    }
    return 0;
  };

  // Update visualization
  const updateVisualization = () => {
    if (!analyserRef.current || !isPlaying) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const speechIntensity = detectSpeech(dataArray);
    const scaledIntensity = Math.min(100, speechIntensity * 1.8);
    
    // Smooth transitions
    const newIntensity = lastIntensityRef.current * 0.4 + scaledIntensity * 0.6;
    lastIntensityRef.current = newIntensity;
    setIntensity(newIntensity);

    animationFrameRef.current = requestAnimationFrame(updateVisualization);
  };

  // Play control
  const togglePlay = async () => {
    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIntensity(0);
      lastIntensityRef.current = 0;
    } else {
      try {
        await audioElementRef.current.play();
        updateVisualization();
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  return {
    isPlaying,
    intensity,
    togglePlay
  };
};

export default useAudioVisualization;