import React from 'react';
import { View, Text, TouchableOpacity, Linking, Image, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const PhotoGallery = ({ photos }) => {
  const validPhotos = photos?.filter(p => p?.url) || [];
  const screenWidth = Dimensions.get('window').width;
  const photoSize = (screenWidth - (Spacing.lg * 2) - (Spacing.sm * 3)) / 4; // 4 photos per row with spacing

  const openPhoto = (url) => {
    Linking.openURL(url).catch((err) => {
      console.error('Error opening photo:', err);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>📸</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Team Photos</Text>
              <Text style={styles.subtitle}>
                {validPhotos.length} {validPhotos.length === 1 ? 'photo' : 'photos'} uploaded
              </Text>
            </View>
          </View>
          
          <View style={styles.photoCount}>
            <Text style={styles.countNumber}>{validPhotos.length}</Text>
            <Text style={styles.countLabel}>Photos</Text>
          </View>
        </View>
        
        {/* Photos Grid */}
        {validPhotos.length > 0 ? (
          <View style={styles.photosGrid}>
            {validPhotos.slice(0, 8).map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={[styles.photoItem, { width: photoSize, height: photoSize }]}
                onPress={() => openPhoto(photo.url)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                
                {/* Overlay */}
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoNumber}>#{index + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Show more indicator if there are more than 8 photos */}
            {validPhotos.length > 8 && (
              <View style={[styles.morePhotos, { width: photoSize, height: photoSize }]}>
                <Text style={styles.morePhotosText}>+{validPhotos.length - 8}</Text>
                <Text style={styles.morePhotosLabel}>more</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptySubtext}>Upload photos to share your team's journey</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899', // Pink gradient
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.md,
  },
  iconText: {
    fontSize: 20,
    color: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },
  photoCount: {
    alignItems: 'center',
  },
  countNumber: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  countLabel: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  photoItem: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.secondary + '4D', // 30% opacity
    position: 'relative',
    ...Shadows.sm,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.xs,
  },
  photoNumber: {
    fontSize: FontSizes.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  morePhotos: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  morePhotosText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },
  morePhotosLabel: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
};

export default PhotoGallery;
