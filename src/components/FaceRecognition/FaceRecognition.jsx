import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import useFaceRecognition from '../../hooks/useFaceRecognition';

const FaceRecognition = ({ onEmotionDetected }) => {
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const { isProcessing, processImage } = useFaceRecognition();

  const handleImageCapture = async (imageData) => {
    console.log('handleImageCapture called with image data:', imageData.slice(0, 100) + '...');
    try {
      const result = await processImage(imageData);
      console.log('Processing result:', result);
      onEmotionDetected && onEmotionDetected(result);
    } catch (error) {
      console.error('Error in handleImageCapture:', error);
    }
  };

  const handleFileChange = (event) => {
    console.log('File selected:', event.target.files);
    const file = event.target.files[0];
    if (file) {
      console.log('Processing file:', file.name, 'type:', file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader loaded file data');
        handleImageCapture(e.target.result);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <button
        onClick={() => {
          console.log('Camera button clicked');
          fileInputRef.current?.click();
        }}
        disabled={isProcessing}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title="Upload photo for emotion detection"
      >
        <Camera className="w-6 h-6 text-gray-600" />
      </button>
      
      {isProcessing && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-75 rounded-full">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;