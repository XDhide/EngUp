import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

export interface ReviewCard {
  id: string;
  word: {
    word: string;
    phonetic: string;
    pos: string;
    meaning: string;
    example: string;
  };
  dueAt: string;
  interval: number;
}

interface FlashCardProps {
  card: ReviewCard;
  onFlip?: () => void;
}

export const FlashCard: React.FC<FlashCardProps> = ({ card, onFlip }) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
    if (!flipped && onFlip) {
      onFlip();
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <Pressable onPress={handleFlip} style={styles.container}>
      <Animated.View style={[styles.card, styles.front, frontAnimatedStyle]}>
        <Text style={styles.label}>TỪ VỮNG HÔM NAY</Text>
        <View style={styles.content}>
          <Text style={styles.word}>{card.word.word}</Text>
          <Text style={styles.phonetic}>{card.word.phonetic}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.card, styles.back, backAnimatedStyle]}>
        <Text style={styles.label}>TỪ VỮNG HÔM NAY</Text>
        <View style={styles.content}>
          <Text style={styles.word}>{card.word.word}</Text>
          <Text style={styles.meaning}>{card.word.meaning}</Text>
          <Text style={styles.example}>{card.word.example}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    perspective: 1000,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.secondaryContainer,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  front: {
    zIndex: 2,
  },
  back: {
    zIndex: 1,
  },
  label: {
    position: 'absolute',
    top: Spacing.lg,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    opacity: 0.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    alignItems: 'center',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  phonetic: {
    fontSize: 16,
    color: Colors.onSurface,
    opacity: 0.7,
  },
  meaning: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  example: {
    fontSize: 18,
    color: Colors.onSurface,
    textAlign: 'center',
  },
});
