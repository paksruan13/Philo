import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

const PhotoUpload = ({ value, onChange, required = false }) => {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select images!'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
      return false;
    }
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error in pickImage:', error);
      Alert.alert('Error', `Failed to open image picker: ${error.message}`);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error in takePhoto:', error);
      Alert.alert('Error', `Failed to open camera: ${error.message}`);
    }
  };

  const uploadImage = async (imageAsset) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || 'image/jpeg',
        name: imageAsset.fileName || 'image.jpg',
      });

      const response = await fetch(API_ROUTES.photos.productUpload, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }

      if (response.ok) {
        onChange(result.url);
      } else {
        setError(result.error || 'Failed to upload image');
        Alert.alert('Upload Error', result.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Error uploading image: ${err.message}`);
      Alert.alert('Upload Error', `Error uploading image: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeImage = () => {
    onChange('');
    setError('');
  };

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: value }} 
            style={styles.image}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeImage}
          >
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={showImageOptions}
          >
            <Text style={styles.changeButtonText}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={showImageOptions}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#7c3aed" />
          ) : (
            <>
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text style={styles.uploadText}>Add Product Image</Text>
              <Text style={styles.uploadSubText}>
                Tap to select from camera or gallery
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {required && !value && (
        <Text style={styles.requiredText}>Product image is required</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  changeButton: {
    marginTop: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  uploadSubText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  requiredText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});

export default PhotoUpload;