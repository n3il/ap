import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from '@/components/ui';
import type { ViewStyle } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import Stories, { Story } from './Stories';
import { useColors } from '@/theme';

const PEXELS_API_KEY = 'u03eDyG6T1Lj7b5POx7yRurFAhmL0A2Vkvqp0BIAr3phL9if54SXweIg';
const SEARCH_TERM = 'aerial view travel destinations';

// Fallback videos in case API fetch fails
const FALLBACK_VIDEOS = [
  'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4',
  'https://videos.pexels.com/video-files/2699494/2699494-hd_1920_1080_30fps.mp4',
  'https://videos.pexels.com/video-files/3048039/3048039-hd_1920_1080_24fps.mp4',
  'https://videos.pexels.com/video-files/2519382/2519382-hd_1920_1080_25fps.mp4',
  'https://videos.pexels.com/video-files/1448735/1448735-hd_1920_1080_24fps.mp4',
];

interface PexelsVideo {
  id: number;
  video_files: Array<{
    link: string;
    width: number;
    height: number;
    quality: string;
  }>;
}

/**
 * Individual video story component
 */
const absoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function VideoStory({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  const { colors: palette, withOpacity } = useColors();

  return (
    <View style={absoluteFill}>
      <VideoView
        player={player}
        style={absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View
        style={absoluteFill}
        sx={{ backgroundColor: withOpacity(palette.background ?? palette.surface, 0.2) }}
      />
    </View>
  );
}

/**
 * Stories component with dynamic Pexels video content
 */
export default function StoriesExample() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors: palette } = useColors();

  useEffect(() => {
    fetchPexelsVideos();
  }, []);

  const fetchPexelsVideos = async () => {
    try {
      setLoading(true);

      // Try to fetch from Pexels API
      try {
        const response = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(SEARCH_TERM)}&per_page=5&orientation=portrait`,
          {
            headers: {
              Authorization: PEXELS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          console.log(response)
          throw new Error(`Pexels API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.videos && data.videos.length > 0) {
          // Create stories from Pexels API videos
          const videoStories: Story[] = data.videos.map((video: PexelsVideo) => {
            // Find the best quality HD video file
            const videoFile = video.video_files.find(
              (file) => file.quality === 'hd' && file.width <= 1920
            ) || video.video_files[0];

            return {
              id: video.id.toString(),
              content: <VideoStory videoUrl={videoFile.link} />,
              duration: 5000,
            };
          });

          setStories(videoStories);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('Pexels API fetch failed, using fallback videos:', apiError);
      }

      // Use fallback videos if API fails or returns no results
      console.log('Using fallback videos');
      const fallbackStories: Story[] = FALLBACK_VIDEOS.map((url, index) => ({
        id: `fallback-${index}`,
        content: <VideoStory videoUrl={url} />,
        duration: 5000,
      }));

      setStories(fallbackStories);
      setError(null);
    } catch (err) {
      console.error('Error setting up videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    console.log('All stories completed!');
    // Navigate away, close modal, etc.
  };

  const handleStoryChange = (index: number) => {
    console.log(`Viewing story ${index + 1} of ${stories.length}`);
  };

  if (loading) {
    return (
      <View sx={{ flex: 1, backgroundColor: 'surface', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={palette.foreground} />
        <Text sx={{ color: 'foreground', marginTop: 4, opacity: 0.7 }}>Loading...</Text>
      </View>
    );
  }

  if (error || stories.length === 0) {
    return (
      <View sx={{ flex: 1, backgroundColor: 'surface', justifyContent: 'center', alignItems: 'center', padding: 8 }}>
        <Text sx={{ color: 'foreground', fontSize: 18, textAlign: 'center', opacity: 0.7 }}>
          Unable to load content
        </Text>
      </View>
    );
  }

  return (
    <Stories
      stories={stories}
      onComplete={handleComplete}
      onStoryChange={handleStoryChange}
      autoPlay={true}
      pauseOnPress={true}
    />
  );
}

/**
 * Usage in a screen (fixed position example):
 *
 * import StoriesExample from '@/components/StoriesExample';
 *
 * export default function MyScreen() {
 *   const [showStories, setShowStories] = useState(false);
 *
 *   return (
 *     <View className="flex-1">
 *       <Button onPress={() => setShowStories(true)}>Show Stories</Button>
 *
 *       {showStories && (
 *         <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 999 }}>
 *           <StoriesExample />
 *         </View>
 *       )}
 *     </View>
 *   );
 * }
 *
 * Or use it directly in a full-screen route/modal for better experience.
 */
