import { AppKitButton } from "@reown/appkit-ethers5-react-native";
import axios from 'axios';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
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

export default function RegisterScreen() {
  const [nidImage, setNidImage] = useState<CapturedImage | null>(null);
  const [faceImage, setFaceImage] = useState<CapturedImage | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [currentCapture, setCurrentCapture] = useState<'nid' | 'face' | ''>('');
  const [loading, setLoading] = useState(false);
  
  // Use the new Expo Camera hook for permissions
  const [permission, requestPermission] = useCameraPermissions();

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

  // Function to crop image based on frame dimensions
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

  const pickImageFromGallery = async (type: 'nid' | 'face') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant gallery permission to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'nid' ? [16, 10] : [1, 1],
      quality: 0.7,
      base64: false, // We'll get base64 from cropping if needed
    });

    if (!result.canceled && result.assets?.[0]) {
      const selected = result.assets[0];
      
      // Crop the selected image based on the frame
      const croppedImage = await cropImage(selected.uri, type);

      if (type === 'nid') {
        setNidImage(croppedImage);
      } else {
        setFaceImage(croppedImage);
      }
    }
  };

  const handleSubmit = async () => {
    if (!nidImage) {
      Alert.alert('Missing Information', 'Please capture your NID card photo');
      return;
    }
    if (!faceImage) {
      Alert.alert('Missing Information', 'Please capture your face photo');
      return;
    }

    setLoading(true); // Start loading

    try {
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

      const response = await axios.post('http://192.168.0.241:3000/api/v1/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Registration submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            console.log('Submitted data:', response.data);
          },
        },
      ]);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Something went wrong while uploading.');
    } finally {
      setLoading(false); // Stop loading
    }
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
                {currentCapture === 'nid' ? 'Capture NID Card' : 'Capture Face Photo'}
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registration</Text>
        <Text style={styles.subtitle}>Complete your profile verification</Text>
      </View>

      {/* NID Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NID Card Photo</Text>
        <Text style={styles.sectionDescription}>Capture a clear photo of your National ID card (will be cropped to frame size)</Text>

        <TouchableOpacity
          style={[styles.uploadBox, nidImage && styles.uploadBoxFilled]}
          onPress={() => openCamera('nid')}
        >
          {nidImage ? (
            <Image source={{ uri: nidImage.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadContent}>
              <Text style={styles.uploadText}>Capture NID Card</Text>
              <Text style={styles.uploadSubtext}>Use back camera</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          {nidImage && (
            <TouchableOpacity style={styles.retakeButton} onPress={() => openCamera('nid')}>
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.galleryButton} onPress={() => pickImageFromGallery('nid')}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Face Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Face Verification</Text>
        <Text style={styles.sectionDescription}>Capture a clear photo of your face (will be cropped to frame size)</Text>

        <TouchableOpacity
          style={[styles.uploadBox, faceImage && styles.uploadBoxFilled]}
          onPress={() => openCamera('face')}
        >
          {faceImage ? (
            <Image source={{ uri: faceImage.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadContent}>
              <Text style={styles.uploadText}>Capture Face Photo</Text>
              <Text style={styles.uploadSubtext}>Use front camera</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          {faceImage && (
            <TouchableOpacity style={styles.retakeButton} onPress={() => openCamera('face')}>
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.galleryButton} onPress={() => pickImageFromGallery('face')}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connect Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Connection</Text>
        <Text style={styles.sectionDescription}>Connect your wallet to complete the registration process</Text>

        <View style={[styles.uploadBox, styles.walletBox]}>
          <View style={styles.uploadContent}>
            <AppKitButton />
          </View>
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          loading && { backgroundColor: 'gray' }  // override color when loading
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Complete Registration'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginBottom : 40,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  uploadBox: {
    width: '100%',
    height: 100,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  uploadBoxFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#db1425',
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop : 7,
  },
  galleryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  cameraFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  nidFrame: {
    width: width * 0.9,
    height: width * 0.6,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  faceFrame: {
    width: width * 0.9,
    height: width* 1.4,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: width * 0.3,
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
  },
  cameraControls: {
    paddingBottom: 60,
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
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  walletBox: {
    borderColor: '#2196F3',
    backgroundColor: '#f8f9ff',
    padding: 20,
  },
});