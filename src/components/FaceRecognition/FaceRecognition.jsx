import React, { useRef, useState, useEffect } from 'react';
import useFaceRecognition from '../../hooks/useFaceRecognition';

const FaceRecognition = ({ onEmotionDetected }) => {
  // Refs for managing video elements and processing
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const processingIntervalRef = useRef(null);
  
  // State to track if we're actively processing
  const [isActive, setIsActive] = useState(false);
  const { isProcessing, processImage } = useFaceRecognition();

  // Function to start the camera
  const startCamera = async () => {
    console.log('Starting camera...');
    try {
      // Request access to the webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Store the stream and set it as the video source
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Camera started successfully');
        setIsActive(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  // Function to process the current video frame
  const processCurrentFrame = async () => {
    if (!videoRef.current || !isActive || isProcessing) return;

    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Draw the current frame to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert the frame to a data URL
      const frameData = canvas.toDataURL('image/jpeg');
      
      // Process the frame
      console.log('Processing video frame...');
      const result = await processImage(frameData);
      console.log('Frame processing result:', result);
      
      // Update Happy's state with the results
      if (onEmotionDetected) {
        onEmotionDetected(result);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  };

  // Set up continuous monitoring when component mounts
  useEffect(() => {
    console.log('Setting up face recognition monitoring...');
    startCamera();

    // Clean up function to stop everything when component unmounts
    return () => {
      console.log('Cleaning up face recognition...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      setIsActive(false);
    };
  }, []);

  // Start processing frames once camera is active
  useEffect(() => {
    if (isActive) {
      console.log('Starting continuous frame processing...');
      processingIntervalRef.current = setInterval(processCurrentFrame, 3000);
    }
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isActive]);


  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '100px',
        height: '75px',
        zIndex: 50,
        pointerEvents: 'none', // The container won't capture clicks meant for elements behind it
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirror effect for natural self-view
          opacity: 0.7, // Slight transparency
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          pointerEvents: 'auto', // The video itself can still receive interactions
        }}
      />
    </div>
  );
};

export default FaceRecognition;