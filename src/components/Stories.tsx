import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, TouchableOpacity, Image, Text } from '@/components/ui';
import { AnimatedBox } from '@/components/ui/animated';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  cancelAnimation,
  SharedValue,
} from 'react-native-reanimated';

export interface Story {
  id: string;
  content: React.ReactNode;
  imageUrl?: string;
  duration?: number; // in milliseconds, default 5000
}

interface StoriesProps {
  stories: Story[];
  onComplete?: () => void;
  onStoryChange?: (index: number) => void;
  autoPlay?: boolean;
  pauseOnPress?: boolean;
}

export default function Stories({
  stories,
  onComplete,
  onStoryChange,
  autoPlay = true,
  pauseOnPress = false,
}: StoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use a single SharedValue for the current story's progress
  const currentProgress = useSharedValue(0);

  // Track progress for all stories (for completed/incomplete indicators)
  const [completedStories, setCompletedStories] = useState<boolean[]>(
    new Array(stories.length).fill(false)
  );

  const currentStory = stories[currentIndex];
  const duration = currentStory?.duration || 5000;

  // Reset completed stories when story count changes
  useEffect(() => {
    setCompletedStories(new Array(stories.length).fill(false));
  }, [stories.length]);

  // Handle story progression
  const startProgress = () => {
    if (!autoPlay || isPaused) return;

    // Reset progress to 0 and animate to 1
    currentProgress.value = 0;
    currentProgress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    });

    // Set timer for moving to next story
    timerRef.current = setTimeout(() => {
      goToNext();
    }, duration);
  };

  const stopProgress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    cancelAnimation(currentProgress);
  };

  const resetProgress = () => {
    currentProgress.value = 0;
  };

  const goToNext = () => {
    stopProgress();

    if (currentIndex < stories.length - 1) {
      // Mark current story as completed
      setCompletedStories(prev => {
        const updated = [...prev];
        updated[currentIndex] = true;
        return updated;
      });
      setCurrentIndex(currentIndex + 1);
      onStoryChange?.(currentIndex + 1);
    } else {
      // Mark last story as completed
      setCompletedStories(prev => {
        const updated = [...prev];
        updated[currentIndex] = true;
        return updated;
      });
      onComplete?.();
    }
  };

  const goToPrevious = () => {
    stopProgress();

    if (currentIndex > 0) {
      // Mark current story as incomplete
      setCompletedStories(prev => {
        const updated = [...prev];
        updated[currentIndex] = false;
        return updated;
      });
      setCurrentIndex(currentIndex - 1);
      onStoryChange?.(currentIndex - 1);
    } else {
      resetProgress();
    }
  };

  // Start progress when index changes
  useEffect(() => {
    if (!isPaused) {
      startProgress();
    }

    return () => {
      stopProgress();
    };
  }, [currentIndex, isPaused, autoPlay]);

  const handlePressIn = () => {
    if (pauseOnPress) {
      setIsPaused(true);
      stopProgress();
    }
  };

  const handlePressOut = () => {
    if (pauseOnPress) {
      setIsPaused(false);
    }
  };

  return (
    <View sx={{ flex: 1, backgroundColor: '#000000', width: '100%', height: '100%' }}>
      {/* Progress Bars */}
      <View sx={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, flexDirection: 'row', gap: 1, paddingHorizontal: 2 }}>
        {stories.map((story, index) => (
          <ProgressBar
            key={story.id}
            progress={index === currentIndex ? currentProgress : null}
            isActive={index === currentIndex}
            isCompleted={completedStories[index]}
          />
        ))}
      </View>

      {/* Story Content */}
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {currentStory?.imageUrl ? (
          <Image
            source={{ uri: currentStory.imageUrl }}
            sx={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          currentStory?.content
        )}
      </View>

      {/* Navigation Areas */}
      <View sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
        {/* Left - Previous */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={goToPrevious}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          sx={{ flex: 1 }}
        />

        {/* Right - Next */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={goToNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          sx={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

interface ProgressBarProps {
  progress: SharedValue<number> | null;
  isActive: boolean;
  isCompleted: boolean;
}

function ProgressBar({ progress, isActive, isCompleted }: ProgressBarProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (isCompleted) {
      return { width: '100%' };
    }
    if (isActive && progress) {
      return { width: `${progress.value * 100}%` };
    }
    return { width: '0%' };
  });

  return (
    <View sx={{ flex: 1, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 'full', overflow: 'hidden' }}>
      <AnimatedBox
        style={animatedStyle}
        sx={{ height: '100%', backgroundColor: '#ffffff', borderRadius: 'full' }}
      />
    </View>
  );
}
