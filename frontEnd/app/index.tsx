import axios from 'axios';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Define proper types for images
interface CapturedImage {
  uri: string;
  base64?: string;
}

export default function LoginScreen() {
  const [nidImage, setNidImage] = useState<CapturedImage | null>(null);
  const [faceImage, setFaceImage] = useState<CapturedImage | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [currentCapture, setCurrentCapture] = useState<'nid' | 'face' | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  
  // Use the new Expo Camera hook for permissions
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  const cameraRef = useRef<CameraView>(null);

  const requestCameraPermission = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        return result.granted;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const cropImage = async (imageUri: string, captureType: 'nid' | 'face') => {
      try {
        // Get original image dimensions
        const imageInfo = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { format: ImageManipulator.SaveFormat.JPEG }
        );
  
        const originalWidth = imageInfo.width;
        const originalHeight = imageInfo.height;
  
        // Calculate crop parameters based on frame size and screen dimensions
        let cropParams;
        
        if (captureType === 'nid') {
          // NID frame dimensions: width * 0.9, height * 0.6
          const frameWidth = width * 0.9;
          const frameHeight = width * 0.6;
          
          // Calculate crop area (center the crop)
          const cropWidth = (frameWidth / width) * originalWidth;
          const cropHeight = (frameHeight / height) * originalHeight;
          const cropX = (originalWidth - cropWidth) / 2;
          const cropY = (originalHeight - cropHeight) / 2;
          
          cropParams = {
            originX: Math.max(0, cropX),
            originY: Math.max(0, cropY),
            width: Math.min(cropWidth, originalWidth),
            height: Math.min(cropHeight, originalHeight),
          };
        } else {
          // Face frame dimensions: width * 0.9, height * 1.4 (oval shape)
          const frameWidth = width * 0.9;
          const frameHeight = width * 1.4;
          
          // Calculate crop area (center the crop)
          const cropWidth = (frameWidth / width) * originalWidth;
          const cropHeight = (frameHeight / height) * originalHeight;
          const cropX = (originalWidth - cropWidth) / 2;
          const cropY = (originalHeight - cropHeight) / 2;
          
          cropParams = {
            originX: Math.max(0, cropX),
            originY: Math.max(0, cropY),
            width: Math.min(cropWidth, originalWidth),
            height: Math.min(cropHeight, originalHeight),
          };
        }
  
        // Perform the crop
        const croppedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              crop: cropParams,
            },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
  
        return {
          uri: croppedImage.uri,
          base64: croppedImage.base64,
        };
      } catch (error) {
        console.error('Crop error:', error);
        // If cropping fails, return original image
        return {
          uri: imageUri,
        };
      }
    };

  const openCamera = async (type: 'nid' | 'face') => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert('Permission Required', 'Please grant camera permission to continue');
      return;
    }
    setCurrentCapture(type);
    setCameraType(type === 'nid' ? 'back' : 'front');
    setShowCamera(true);
  };

  const takePicture = async () => {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: false, // We'll get base64 from cropping
            skipProcessing: true,
          });
  
          if (photo) {
            // Crop the image based on the frame
            const croppedImage = await cropImage(photo.uri, currentCapture as 'nid' | 'face');
  
            if (currentCapture === 'nid') {
              setNidImage(croppedImage);
            } else {
              setFaceImage(croppedImage);
            }
  
            setShowCamera(false);
            Alert.alert('Success', 'Photo captured and cropped successfully!');
          }
        } catch (error) {
          console.error('Camera error:', error);
          Alert.alert('Error', 'Failed to capture photo');
        }
      }
    };

  const handleLogin = async () => {
    if (!nidImage) {
      Alert.alert('Missing Information', 'Please scan your NID card first');
      return;
    }
    if (!faceImage) {
      Alert.alert('Missing Information', 'Please capture your face photo');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('nidImage', {
        uri: nidImage.uri,
        name: 'nid.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('faceImage', {
        uri: faceImage.uri,
        name: 'face.jpg',
        type: 'image/jpeg',
      } as any);

      // Send POST request to backend login endpoint
      const response = await axios.post('http://192.168.0.241:3000/api/v1/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle success
      Alert.alert('Login Successful', 'Face and NID verification completed!', [
        {
          text: 'Continue',
          onPress: () => {
            console.log('Login successful with biometric data:', response.data);
            // Navigate to main app here
          },
        },
      ]);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };



  const resetCapture = (type: 'nid' | 'face') => {
    if (type === 'nid') {
      setNidImage(null);
    } else {
      setFaceImage(null);
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>
                {currentCapture === 'nid' ? 'Scan Your NID Card' : 'Capture Your Face'}
              </Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.cameraFrame}>
              {currentCapture === 'nid' ? (
                <View style={styles.nidFrame}>
                  
                </View>
              ) : (
                <View style={styles.faceFrame}>
                  
                </View>
              )}
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Login</Text>
        <Text style={styles.subtitle}>Verify your identity with biometric authentication</Text>
      </View>

      <View style={styles.authContainer}>
        {/* NID Scanning Section */}
        <View style={styles.authSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Scan NID Card</Text>
              <Text style={styles.sectionDescription}>Use back camera to scan your National ID</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.scanBox, nidImage && styles.scanBoxCompleted]}
            onPress={() => openCamera('nid')}
          >
            {nidImage ? (
              <View style={styles.completedContent}>
                <Image source={{ uri: nidImage.uri }} style={styles.previewImage} />
                <View style={styles.completedOverlay}>
                  <Text style={styles.completedText}>✓ NID Scanned</Text>
                </View>
              </View>
            ) : (
              <View style={styles.scanContent}>
                <Text style={styles.scanText}>Tap to Scan NID</Text>
                <Text style={styles.scanSubtext}>Back Camera</Text>
              </View>
            )}
          </TouchableOpacity>

          {nidImage && (
            <TouchableOpacity style={styles.rescanButton} onPress={() => resetCapture('nid')}>
              <Text style={styles.rescanButtonText}>Rescan NID</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Face Verification Section */}
        <View style={styles.authSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Face Verification</Text>
              <Text style={styles.sectionDescription}>Use front camera for face authentication</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.scanBox, faceImage && styles.scanBoxCompleted]}
            onPress={() => openCamera('face')}
          >
            {faceImage ? (
              <View style={styles.completedContent}>
                <Image source={{ uri: faceImage.uri }} style={styles.previewImageFace} />
                <View style={styles.completedOverlay}>
                  <Text style={styles.completedText}>✓ Face Verified</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.scanContent]}>
                <Text style={styles.scanText}>
                  {'Tap for Face Scan'}
                </Text>
                <Text style={styles.scanSubtext}>Front Camera</Text>
              </View>
            )}
          </TouchableOpacity>

          {faceImage && (
            <TouchableOpacity style={styles.rescanButton} onPress={() => resetCapture('face')}>
              <Text style={styles.rescanButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            (!nidImage || !faceImage) && styles.loginButtonDisabled,
            isLoading && styles.loginButtonLoading
          ]}
          onPress={handleLogin}
          disabled={!nidImage || !faceImage || isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Verifying Identity...' : 'Login with Biometrics'}
          </Text>
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your biometric data is encrypted and processed securely
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={navigateToRegister}>
          <Text style={styles.registerLink}>Register Here</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    marginBottom : 40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  authContainer: {
    padding: 20,
  },
  authSection: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 15,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  scanBox: {
    width: '100%',
    height: 180,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  scanBoxCompleted: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
    borderStyle: 'solid',
  },
  scanContent: {
    alignItems: 'center',
  },
  disabledContent: {
    opacity: 0.5,
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scanSubtext: {
    fontSize: 12,
    color: '#666',
  },
  completedContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    resizeMode: 'cover',
  },
  previewImageFace: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    resizeMode: 'cover',
  },
  completedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rescanButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#ff9800',
    borderRadius: 20,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  loginButtonLoading: {
    backgroundColor: '#81C784',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  registerLink: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Camera Styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 44,
  },
  cameraFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  nidFrame: {
    width: width * 0.9,
    height: width * 0.6,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  faceFrame: {
    width: width * 0.9,
    height: width* 1.4,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: width * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  frameText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    maxWidth: width * 0.7,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cameraControls: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop : 40,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});