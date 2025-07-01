import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Heart, Star } from 'lucide-react-native';

interface CardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  price?: string;
  rating?: number;
  reviewCount?: number;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  imageUrl,
  title,
  subtitle,
  price,
  rating,
  reviewCount,
  isFavorite = false,
  onPress,
  onFavoritePress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onFavoritePress}
          >
            <Heart
              size={20}
              color={isFavorite ? '#EF4444' : '#FFFFFF'}
              fill={isFavorite ? '#EF4444' : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <View style={styles.bottomRow}>
          {rating && (
            <View style={styles.ratingContainer}>
              <Star size={14} color="#4ADE80" fill="#4ADE80" />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              {reviewCount && (
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              )}
            </View>
          )}
          {price && <Text style={styles.price}>{price}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#374151',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewCount: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});