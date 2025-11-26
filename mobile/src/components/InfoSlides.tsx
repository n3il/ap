import { Animated, View, Text, Card} from '@/components/ui';
import { useMemo, useRef, useState, useEffect } from 'react';
import useInfoSlides from '@/hooks/useInfoSlides';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Image from './ui/Image';
import { useColors } from '@/theme';

const { width } = Dimensions.get('window');

export default function InfoSlides({ onSlideChange }) {
  const slides = useInfoSlides();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const activeIndexRef = useRef(0);
  const {
    colors: palette,
    accent,
    primary,
    withOpacity,
  } = useColors();
  const brandColor = palette.brand500 ?? primary;
  const foreground = palette.foreground ?? palette.textPrimary;
  const background = palette.background ?? palette.surface ?? palette.input;

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
          outputRange: [-50, 0, -50],
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
          <View key={slide.id} style={{ width, paddingHorizontal: 32, flex: 1 }}>
            <Animated.View
              style={{
                opacity: slideAnimations[index]?.opacity,
                transform: [
                  { translateY: slideAnimations[index]?.translateY },
                  { scale: slideAnimations[index]?.scale },
                ],
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {slide.titleSlide ? (
                // Title Slide
                <View sx={{ paddingVertical: 12, alignSelf: 'flex-start', marginBottom: 'auto' }}>


                  <View
                    style={{
                      display: 'none',
                      flex: 1,
                      justifyContent: 'flex-end',
                      alignItems: 'flex-end',
                      marginBottom: 0,
                      width: '100%',
                      zIndex: -1,
                      position: 'fixed',
                      bottom: 30,
                      height: '100%',
                    }}
                  >
                   <Image
                    source={require('@assets/puppet-bare-icon.png')}
                    style={{
                      width: 120,
                      height: 120,
                      opacity: .9,
                      position: 'relative',
                      transform: [{ translateX: -40 }, { scale: 4 }],
                    }}
                   />
                   <Image
                    source={require('@assets/puppet-bare-icon-w.png')}
                    style={{
                      width: 120,
                      height: 120,
                      opacity: .4,
                      position: 'relative',
                      transform: [{ translateX: 0 }, { scale: 4 }],
                    }}
                   />
                   <Image
                    source={require('@assets/puppet-bare-icon.png')}
                    style={{
                      width: 120,
                      height: 120,
                      opacity: .3,
                      position: 'relative',
                      transform: [{ translateX: 40 }, { scale: 4 }],
                    }}
                   />
                  </View>
                </View>
              ) : (
                // Feature Slides
                <Card
                  variant="glass"
                  glassEffectStyle="clear"
                  style={{
                    borderRadius: 24,
                    padding: 32,
                    margin: 'auto',
                    alignItems: 'center',
                  }}
                >

                  {slide.icon && (
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        backgroundColor: withOpacity(brandColor, 0.2),
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24,
                      }}
                    >
                      <Ionicons name={slide.icon} size={32} color={brandColor} />
                    </View>
                  )}

                  <Text
                    variant="h2"
                    style={{
                      fontSize: 32,
                      fontWeight: '700',
                      color: foreground,
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
                      color: withOpacity(foreground, 0.8),
                      lineHeight: 26,
                      marginBottom: 24,
                    }}
                  >
                    {slide.description}
                  </Text>


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
                              backgroundColor: accent,
                            }}
                          />
                          <Text
                            variant="body"
                            style={{
                              fontSize: 15,
                              fontWeight: '500',
                              color: withOpacity(foreground, 0.9),
                            }}
                          >
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
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
          opacity: activeSlide > 0 ? 1 : 0,
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
                backgroundColor: isActive ? "#fff" : "#fff",
                transform: [{ scale: isActive ? 1 : 0.8 }],
                opacity: 0.3,
              }}
            />
          );
        })}
      </View>
    </>
  )
}
