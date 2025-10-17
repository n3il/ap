import { BlurView } from 'expo-blur';
import { Animated, View, Text} from '@/components/ui';
import { useMemo, useRef, useState, useEffect } from 'react';
import useInfoSlides from '@/hooks/useInfoSlides';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function InfoSlides({ onSlideChange }) {
  const slides = useInfoSlides();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const activeIndexRef = useRef(0);

  // Notify parent when slide changes
  useEffect(() => {
    if (onSlideChange && slides[activeSlide]) {
      onSlideChange(slides[activeSlide]);
    }
  }, [activeSlide, onSlideChange, slides]);

  const slideAnimations = useMemo(() => {
    return slides.map((_, index) => {
      return {
        opacity: scrollX.interpolate({
          inputRange: [
            width * (index - 1),
            width * index,
            width * (index + 1),
          ],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        }),
        translateY: scrollX.interpolate({
          inputRange: [
            width * (index - 1),
            width * index,
            width * (index + 1),
          ],
          outputRange: [50, 0, -50],
          extrapolate: 'clamp',
        }),
        scale: scrollX.interpolate({
          inputRange: [
            width * (index - 1),
            width * index,
            width * (index + 1),
          ],
          outputRange: [0.9, 1, 0.9],
          extrapolate: 'clamp',
        }),
      };
    });
  }, [scrollX]);

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false },
      ),
    [scrollX],
  );

  const handleMomentumEnd = event => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const settledIndex = Math.round(offsetX / width);
    if (settledIndex !== activeIndexRef.current) {
      activeIndexRef.current = settledIndex;
      setActiveSlide(settledIndex);
    }
  };

  return (
    <>
      <Animated.ScrollView
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        bounces={false}
        decelerationRate="fast"
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={{ width, justifyContent: 'center', paddingHorizontal: 32 }}>
            <Animated.View
              style={{
                opacity: slideAnimations[index]?.opacity,
                transform: [
                  { translateY: slideAnimations[index]?.translateY },
                  { scale: slideAnimations[index]?.scale },
                ],
              }}
            >
              {slide.titleSlide ? (
                // Title Slide
                <View sx={{ alignItems: 'center', paddingVertical: 12 }}>
                  {/* Logo/Icon */}
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 32,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 32,
                      shadowColor: '#6366f1',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 24,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 64,
                        fontWeight: '700',
                        color: '#6366f1',
                      }}
                    >
                     {'[]'}
                    </Text>
                  </View>

                  <Text
                    variant="display"
                    style={{
                      fontSize: 56,
                      fontWeight: '800',
                      color: '#ffffff',
                      textAlign: 'center',
                      marginBottom: 16,
                      letterSpacing: -1,
                    }}
                  >
                    {slide.title}
                  </Text>

                  <Text
                    variant="xl"
                    style={{
                      fontSize: 24,
                      fontWeight: '600',
                      color: '#7CFFAA',
                      textAlign: 'center',
                      marginBottom: 24,
                      letterSpacing: 0.5,
                    }}
                  >
                    {slide.subtitle}
                  </Text>

                  <Text
                    variant="lg"
                    style={{
                      fontSize: 18,
                      fontWeight: '400',
                      color: 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'center',
                      lineHeight: 28,
                      maxWidth: 320,
                    }}
                  >
                    {slide.description}
                  </Text>
                </View>
              ) : (
                // Feature Slides
                <BlurView
                  intensity={20}
                  tint="dark"
                  style={{
                    borderRadius: 24,
                    padding: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Icon */}
                  {slide.icon && (
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24,
                      }}
                    >
                      <Ionicons name={slide.icon} size={32} color="#6366f1" />
                    </View>
                  )}

                  <Text
                    variant="h2"
                    style={{
                      fontSize: 32,
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: 16,
                      letterSpacing: -0.5,
                    }}
                  >
                    {slide.title}
                  </Text>

                  <Text
                    variant="lg"
                    style={{
                      fontSize: 17,
                      fontWeight: '400',
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 26,
                      marginBottom: 24,
                    }}
                  >
                    {slide.description}
                  </Text>

                  {/* Features List */}
                  {slide.features && (
                    <View sx={{ gap: 3 }}>
                      {slide.features.map((feature, idx) => (
                        <View
                          key={idx}
                          sx={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#7CFFAA',
                            }}
                          />
                          <Text
                            variant="body"
                            style={{
                              fontSize: 15,
                              fontWeight: '500',
                              color: 'rgba(255, 255, 255, 0.9)',
                            }}
                          >
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </BlurView>
              )}
            </Animated.View>
          </View>
        ))}
      </Animated.ScrollView>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 6,
          gap: 2,
        }}
      >
        {slides.map((item, index) => {
          const isActive = index === activeSlide;
          return (
            <Animated.View
              key={item.id}
              style={{
                width: isActive ? 32 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isActive ? '#7CFFAA' : 'rgba(255, 255, 255, 0.3)',
                transform: [{ scale: isActive ? 1 : 0.8 }],
              }}
            />
          );
        })}
      </View>
    </>
  )
}