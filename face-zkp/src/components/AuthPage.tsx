import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Fingerprint, ArrowLeft, Camera, Upload, QrCode, Scan, CheckCircle, AlertCircle, RotateCcw, X, Crop } from 'lucide-react';
import axios from 'axios';
import WalletConnect from './WalletConnect';

interface FormData {
  nidPhoto?: File;
  facePhoto?: File;
  qrCode?: File;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeCamera, setActiveCamera] = useState<'nid' | 'face' | 'qr' | null>(null);
  const [capturedImages, setCapturedImages] = useState<{[key: string]: string}>({});
  const [cameraError, setCameraError] = useState<string>('');
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [cropImage, setCropImage] = useState<string>('');
  const [cropType, setCropType] = useState<'nid' | 'face' | 'qr' | null>(null);
  const [cropData, setCropData] = useState<CropData>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const startCamera = useCallback(async (type: 'nid' | 'face' | 'qr') => {
    setCameraError('');
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Stop any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Set active camera first to show the modal
      setActiveCamera(type);

      // Wait a bit for the modal to render and video element to be mounted
      await new Promise(resolve => setTimeout(resolve, 200));

      // Simple, reliable constraints
      const constraints = {
        video: {
          facingMode: type === 'face' ? 'user' : 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      console.log('Requesting camera with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('Camera stream obtained:', stream.getTracks().map(track => track.kind));
      
      // Wait for video element to be available
      let attempts = 0;
      while (!videoRef.current && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set the stream as the video source
        video.srcObject = stream;
        
        // Wait for video to load metadata
        await new Promise<void>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            clearTimeout(timeoutId);
            resolve();
          };
          
          const handleError = (error: Event) => {
            console.error('Video error:', error);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            clearTimeout(timeoutId);
            reject(new Error('Video failed to load'));
          };
          
          const timeoutId = setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(new Error('Video load timeout'));
          }, 10000);
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
        });
        
        // Play the video
        try {
          await video.play();
          console.log('Video started playing successfully');
          setIsVideoReady(true);
        } catch (playError) {
          console.error('Error playing video:', playError);
          throw new Error('Failed to start video playback');
        }
      } else {
        throw new Error('Video element not found');
      }
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.';
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Camera access blocked. Please ensure you are using HTTPS.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints not supported. Trying basic camera access...';
        } else {
          errorMessage = error.message;
        }
      }
      
      setCameraError(errorMessage);
      
      // If constraints failed, try with minimal constraints
      if (error instanceof Error && error.name === 'OverconstrainedError') {
        try {
          console.log('Trying with minimal constraints...');
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          
          streamRef.current = basicStream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await videoRef.current.play();
            setIsVideoReady(true);
            setCameraError('');
          }
        } catch (basicError) {
          console.error('Basic camera access also failed:', basicError);
          setCameraError('Camera access failed with all available constraints.');
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setActiveCamera(null);
    setCameraError('');
    setIsVideoReady(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && activeCamera) {
      const video = videoRef.current;
      
      // Check if video is actually playing
      if (video.readyState < 2) {
        setCameraError('Video not ready for capture. Please wait for the camera to initialize.');
        return;
      }
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      console.log('Capturing photo with dimensions:', canvas.width, 'x', canvas.height);
      
      if (context && canvas.width > 0 && canvas.height > 0) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Show cropping modal instead of directly saving
        setCropImage(imageData);
        setCropType(activeCamera);
        setIsCropping(true);
        stopCamera();
      } else {
        setCameraError('Failed to capture photo. Please try again.');
      }
    }
  }, [activeCamera, stopCamera]);

  // Cropping functions
  const getDefaultCropSize = (type: 'nid' | 'face' | 'qr') => {
    switch (type) {
      case 'nid':
        return { width: 300, height: 200 }; // NID card aspect ratio
      case 'face':
        return { width: 200, height: 280 }; // Face portrait aspect ratio
      case 'qr':
        return { width: 200, height: 200 }; // Square for QR code
      default:
        return { width: 200, height: 200 };
    }
  };

  const initializeCrop = useCallback(() => {
    if (cropType && cropImage) {
      const img = new Image();
      img.onload = () => {
        const container = cropContainerRef.current;
        if (container) {
          // Wait for the image to be rendered in the container
          setTimeout(() => {
            const imgElement = container.querySelector('img') as HTMLImageElement;
            if (imgElement) {
              const containerRect = container.getBoundingClientRect();
              const imgRect = imgElement.getBoundingClientRect();
              const defaultSize = getDefaultCropSize(cropType);
              
              // Calculate the actual image position within the container
              const imgLeft = imgRect.left - containerRect.left;
              const imgTop = imgRect.top - containerRect.top;
              
              // Center the crop area over the image
              const x = imgLeft + (imgRect.width - defaultSize.width) / 2;
              const y = imgTop + (imgRect.height - defaultSize.height) / 2;
              
              setCropData({
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: Math.min(defaultSize.width, imgRect.width),
                height: Math.min(defaultSize.height, imgRect.height)
              });
            }
          }, 100);
        }
      };
      img.src = cropImage;
    }
  }, [cropType, cropImage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = cropContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is inside crop area
      if (x >= cropData.x && x <= cropData.x + cropData.width &&
          y >= cropData.y && y <= cropData.y + cropData.height) {
        setIsDragging(true);
        setDragStart({ x: x - cropData.x, y: y - cropData.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && cropContainerRef.current) {
      const rect = cropContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragStart.x;
      const y = e.clientY - rect.top - dragStart.y;
      
      // Constrain to container bounds
      const maxX = rect.width - cropData.width;
      const maxY = rect.height - cropData.height;
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY))
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyCrop = () => {
    if (cropCanvasRef.current && cropImage && cropType) {
      const canvas = cropCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          const container = cropContainerRef.current;
          if (!container) return;
          
          const containerRect = container.getBoundingClientRect();
          const imgElement = container.querySelector('img') as HTMLImageElement;
          
          if (!imgElement) return;
          
          // Calculate the actual image dimensions and position within the container
          const imgRect = imgElement.getBoundingClientRect();
          const scaleX = img.naturalWidth / imgRect.width;
          const scaleY = img.naturalHeight / imgRect.height;
          
          // Convert crop coordinates from container space to image space
          const cropX = (cropData.x - (imgRect.left - containerRect.left)) * scaleX;
          const cropY = (cropData.y - (imgRect.top - containerRect.top)) * scaleY;
          const cropWidth = cropData.width * scaleX;
          const cropHeight = cropData.height * scaleY;
          
          // Ensure crop coordinates are within image bounds
          const finalCropX = Math.max(0, Math.min(cropX, img.naturalWidth - cropWidth));
          const finalCropY = Math.max(0, Math.min(cropY, img.naturalHeight - cropHeight));
          const finalCropWidth = Math.min(cropWidth, img.naturalWidth - finalCropX);
          const finalCropHeight = Math.min(cropHeight, img.naturalHeight - finalCropY);
          
          // Set canvas size to crop dimensions
          canvas.width = finalCropWidth;
          canvas.height = finalCropHeight;
          
          // Draw the cropped portion
          ctx.drawImage(
            img,
            finalCropX, finalCropY, finalCropWidth, finalCropHeight,
            0, 0, finalCropWidth, finalCropHeight
          );
          
          // Convert to blob and save
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `${cropType}-capture.jpg`, { type: 'image/jpeg' });
              const imageData = canvas.toDataURL('image/jpeg', 0.8);
              
              setCapturedImages(prev => ({
                ...prev,
                [cropType]: imageData
              }));
              
              setFormData(prev => ({
                ...prev,
                [`${cropType}Photo`]: file
              }));
              
              // Close cropping modal
              setIsCropping(false);
              setCropImage('');
              setCropType(null);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = cropImage;
      }
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCropImage('');
    setCropType(null);
  };

  // Initialize crop when modal opens
  useEffect(() => {
    if (isCropping) {
      initializeCrop();
    }
  }, [isCropping, initializeCrop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Debug video element state
  useEffect(() => {
    if (videoRef.current && activeCamera) {
      const video = videoRef.current;
      
      const logVideoState = () => {
        console.log('Video state:', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          ended: video.ended,
          srcObject: !!video.srcObject
        });
      };
      
      logVideoState();
      
      const interval = setInterval(logVideoState, 2000);
      
      return () => clearInterval(interval);
    }
  }, [activeCamera, isVideoReady]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'nid' | 'qr') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Show cropping modal for uploaded files too
          setCropImage(e.target!.result as string);
          setCropType(type);
          setIsCropping(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = (type: 'nid' | 'face' | 'qr') => {
    setCapturedImages(prev => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });
    
    setFormData(prev => {
      const updated = { ...prev };
      if (type === 'qr') {
        delete updated.qrCode;
      } else {
        delete updated[`${type}Photo`];
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      if (isLogin) {
        // Login: Send QR code and face images to login endpoint
        const formDataToSend = new FormData();
        
        if (formData.qrCode) {
          formDataToSend.append('qrCode', formData.qrCode);
        }
        if (formData.facePhoto) {
          formDataToSend.append('facePhoto', formData.facePhoto);
        }
        
        const response = await axios.post('http://localhost:3000/v1/login', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('Login response:', response.data);
        setSuccessMessage('Login successful! Welcome back.');
        // Handle successful login here (e.g., redirect, show success message)
        
      } else {
        // Registration: Send NID and face images to register endpoint
        const formDataToSend = new FormData();
        
        if (formData.nidPhoto) {
          formDataToSend.append('nidPhoto', formData.nidPhoto);
        }
        if (formData.facePhoto) {
          formDataToSend.append('facePhoto', formData.facePhoto);
        }
        
        const response = await axios.post('http://localhost:3000/api/v1/register', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('Registration response:', response.data);
        setSuccessMessage('Registration successful! You can now login with your QR code.');
        // Handle successful registration here (e.g., show success message, switch to login)
      }
      
    } catch (error) {
      console.error('API Error:', error);
      // Handle error here (e.g., show error message to user)
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Status:', error.response?.status);
        
        if (error.response?.status === 400) {
          setErrorMessage('Invalid data provided. Please check your images and try again.');
        } else if (error.response?.status === 401) {
          setErrorMessage('Authentication failed. Please check your credentials.');
        } else if (error.response?.status === 500) {
          setErrorMessage('Server error. Please try again later.');
        } else {
          setErrorMessage('An error occurred. Please try again.');
        }
      } else {
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    stopCamera();
    // For demo purposes, we'll just close the camera instead of redirecting
    console.log('Back to home clicked');
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-x-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-32 h-32 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 z-20 flex items-center space-x-3">
        <button
          onClick={handleBackToHome}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors group bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-2 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm sm:text-base">Back</span>
        </button>
      </div>

      {/* Camera Modal */}
      {activeCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {activeCamera === 'nid' && 'Capture NID Photo'}
                {activeCamera === 'face' && 'Face Scan'}
                {activeCamera === 'qr' && 'Scan QR Code'}
              </h3>
              <button
                onClick={stopCamera}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {cameraError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{cameraError}</p>
                </div>
              </div>
            )}
            
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                autoPlay
                playsInline
                muted
                controls={false}
                style={{ 
                  backgroundColor: 'black',
                  transform: activeCamera === 'face' ? 'scaleX(-1)' : 'none'
                }}
              />
              
              {/* Loading indicator */}
              {!cameraError && activeCamera && !isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Initializing camera...</p>
                  </div>
                </div>
              )}
              
              {/* Overlay for QR code scanning */}
              {activeCamera === 'qr' && !cameraError && isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-white border-dashed rounded-lg"></div>
                </div>
              )}
              
              {/* Overlay for face scanning */}
              {activeCamera === 'face' && !cameraError && isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-56 border-2 border-white border-dashed rounded-full"></div>
                </div>
              )}
              
              {/* Overlay for NID card scanning */}
              {activeCamera === 'nid' && !cameraError && isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-white border-dashed rounded-lg"></div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={!!cameraError || !isVideoReady}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
                <span>Capture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropping Modal */}
      {isCropping && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {cropType === 'nid' && 'Crop NID Photo'}
                {cropType === 'face' && 'Crop Face Photo'}
                {cropType === 'qr' && 'Crop QR Code'}
              </h3>
              <button
                onClick={cancelCrop}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {cropType === 'nid' && 'Drag the crop area to frame your National ID card. Ensure all text is clearly visible.'}
                {cropType === 'face' && 'Drag the crop area to frame your face. Position your face within the oval guide.'}
                {cropType === 'qr' && 'Drag the crop area to frame the QR code. Ensure the entire code is within the square.'}
              </p>
            </div>
            
            <div 
              ref={cropContainerRef}
              className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 mx-auto border-2 border-gray-300"
              style={{ width: '100%', maxWidth: '500px', height: '400px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {cropImage && (
                <img 
                  src={cropImage} 
                  alt="Crop preview" 
                  className="w-full h-full object-contain"
                  style={{ 
                    transform: cropType === 'face' ? 'scaleX(-1)' : 'none'
                  }}
                />
              )}
              
              {/* Crop overlay */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 cursor-move shadow-lg"
                style={{
                  left: cropData.x,
                  top: cropData.y,
                  width: cropData.width,
                  height: cropData.height,
                  borderRadius: cropType === 'face' ? '50%' : '8px'
                }}
              >
                {/* Grid lines */}
                <div className="absolute inset-0">
                  {/* Vertical lines */}
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white border-opacity-60"></div>
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white border-opacity-60"></div>
                  {/* Horizontal lines */}
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white border-opacity-60"></div>
                  <div className="absolute top-2/3 left-0 right-0 border-t border-white border-opacity-60"></div>
                </div>
                
                {/* Corner handles for rectangular crops */}
                {cropType !== 'face' && (
                  <>
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
                  </>
                )}
                
                {/* Center indicator for face crop */}
                {cropType === 'face' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                  </div>
                )}
              </div>
              
              {/* Instructions overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                Drag to move • Grid shows crop area
              </div>
            </div>
            
            {/* Hidden canvas for cropping */}
            <canvas ref={cropCanvasRef} className="hidden" />
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelCrop}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyCrop}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Crop className="w-4 h-4" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            VerifyID
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 sm:mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-medium text-sm sm:text-base transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-medium text-sm sm:text-base transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Secure Login' : 'Identity Registration'}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base px-2">
              {isLogin 
                ? 'Scan your QR code and verify your face to login'
                : 'Upload your NID and complete face verification'
              }
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {isLogin ? (
              // Login Fields
              <>
                {/* QR Code Field */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">QR Code</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    {capturedImages.qr ? (
                      <div className="relative">
                        <img src={capturedImages.qr} alt="QR Code" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          onClick={() => retakePhoto('qr')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <div className="mt-2 flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          QR Code captured
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <div className="space-y-2">
                          <button
                            onClick={() => startCamera('qr')}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Scan className="w-4 h-4" />
                            <span>Scan QR Code</span>
                          </button>
                          <div className="text-sm text-gray-500">or</div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload QR Code</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'qr')}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Face Scan Field */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Face Verification</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    {capturedImages.face ? (
                      <div className="relative">
                        <img src={capturedImages.face} alt="Face" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          onClick={() => retakePhoto('face')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <div className="mt-2 flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Face captured
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <button
                          onClick={() => startCamera('face')}
                          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Start Face Scan</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Position your face in the frame</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Registration Fields
              <>
                
                {/* NID Photo Field */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">National ID Photo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    {capturedImages.nid ? (
                      <div className="relative">
                        <img src={capturedImages.nid} alt="NID" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          onClick={() => retakePhoto('nid')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <div className="mt-2 flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          NID photo captured
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <div className="space-y-2">
                          <button
                            onClick={() => startCamera('nid')}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture NID</span>
                          </button>
                          <div className="text-sm text-gray-500">or</div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload NID Photo</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'nid')}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Make sure your ID is clearly visible</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Face Scan Field */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Face Verification</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    {capturedImages.face ? (
                      <div className="relative">
                        <img src={capturedImages.face} alt="Face" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          onClick={() => retakePhoto('face')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <div className="mt-2 flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Face captured
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <button
                          onClick={() => startCamera('face')}
                          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Start Face Scan</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Position your face in the frame</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Wallet Connection Field */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Connect Wallet</label>
                  <WalletConnect />
                </div>

              </>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 mt-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? 'Verifying...' : 'Registering...'}</span>
                </div>
              ) : (
                isLogin ? 'Verify & Login' : 'Complete Registration'
              )}
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isLogin ? 'Register here' : 'Login here'}
              </button>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 sm:mt-6 text-center px-4">
          <p className="text-xs text-gray-500">
            🔒 Biometric data is processed securely and never stored permanently
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;