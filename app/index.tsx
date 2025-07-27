import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState, useCallback } from "react";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import { fetchVideosFromCloudinary } from "@/utils/cloudinary";
import { videos2 } from "@/data";

const { height, width } = Dimensions.get("window");

interface VideoItemProps {
  data: ListRenderItemInfo<string>;
  isActive: boolean;
}

const VideoItem = ({ data, isActive }: VideoItemProps) => {
  const { item } = data;
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const player = useVideoPlayer(item, (player) => {
    player.loop = true;
    player.play();
  });

  // Handle network retries
  useEffect(() => {
    if (hasError && retryCount < 3) {
      const timer = setTimeout(() => {  
        player.replaceAsync(item);      
        setRetryCount((prev) => prev + 1);
      }, 2000 * retryCount); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount]);

  useEffect(() => {
    player.addListener("sourceLoad", () => {
      setIsVideoLoading(false);
      setHasError(false);
    });
  }, [player]);

  // Auto-play when active
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive]);

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setHasError(false);
    setIsVideoLoading(true);
    player.replaceAsync(item);
  };

  return (
    <View style={{ height, width }}>
      <VideoView
        player={player}
        style={{ height, width }}
        contentFit="cover"
        nativeControls={false}
      />

      {(isVideoLoading || hasError) && (
        <View className="w-full h-full absolute top-0 flex-row items-center justify-center bg-black/70">
          {isVideoLoading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <TouchableOpacity
              onPress={handleRetry}
              className="items-center justify-center p-4 rounded-full bg-white/20"
            >
              <FontAwesome6 name="rotate-right" size={30} color="white" />
              <Text className="text-white mt-2">Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isVideoLoading && !hasError && !isPlaying && (
        <TouchableOpacity
          onPress={handlePlayPause}
          className="w-full h-full absolute top-0 items-center justify-center"
        >
          <FontAwesome6 name="play" size={50} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function Index() {
  const router = useRouter();
  const [videos, setVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch initial videos
  const fetchVideos = useCallback(async (cursor?: string) => {
    try {
      setLoading(true);
      const { videos: newVideos, nextCursor: newCursor } =
        await fetchVideosFromCloudinary(cursor);

      setVideos((prev) => (cursor ? [...prev, ...newVideos] : newVideos));
      setNextCursor(newCursor);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Network status listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      if (state.isConnected && videos.length === 0) {
        fetchVideos();
      }
    });

    return () => unsubscribe();
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      if (isConnected && videos.length === 0) {
        fetchVideos();
      }
    }, [isConnected])
  );

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (nextCursor && !loading) {
      fetchVideos(nextCursor);
    }
  }, [nextCursor, loading]);

  // Track visible video
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  return (
    <View className="relative flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 pt-16 px-5 flex-row justify-center items-center gap-4">
        <Feather name="video" size={24} color="white" />
        <Text className="text-2xl font-semibold text-white">Video Feed</Text>
      </View>

      {!isConnected && (
        <View className="absolute top-20 left-0 right-0 z-20 bg-red-500 p-2 items-center">
          <Text className="text-white">No internet connection</Text>
        </View>
      )}

      <FlatList
        data={videos}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={(data) => (
          <VideoItem data={data} isActive={activeIndex === data.index} />
        )}
        pagingEnabled
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 90 }}
        ListFooterComponent={
          loading && videos.length > 0 ? (
            <View className="h-20 items-center justify-center">
              <ActivityIndicator size="large" color="white" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 mt-[20rem] items-center justify-center">
              <Text className="text-white text-lg">No videos found</Text>
              <TouchableOpacity
                onPress={() => fetchVideos()}
                className="mt-4 p-3 bg-white rounded-lg"
              >
                <Text>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Camera Button */}
      <View className="absolute bottom-10 right-10 rounded-full bg-black shadow-xl">
        <TouchableOpacity onPress={() => router.push("/camera")}>
          <AntDesign name="pluscircle" size={50} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
