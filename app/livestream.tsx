import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import {
  createLiveStream,
  endLiveStream,
  getLiveStream,
} from "../utils/mux";
import { createDailyRoom, getDailyRoomToken } from "../utils/daily";
import DailyIframe from "@daily-co/daily-js";

const DAILY_API_KEY =
  "9b8bd636db40a1e0c08c348a602dc8907e46599e7e71ca4f1fb1fff2386e20da";

const StreamerScreen = () => {
  const [isLive, setIsLive] = useState(false);
  const [streamInfo, setStreamInfo] = useState<{
    streamId: string;
    playbackId: string;
    streamKey: string;
    dailyRoomUrl: string;
  } | null>(null);
  const dailyCallRef = useRef<any>(null);

  const startStreaming = async () => {
    try {
      // Create Mux live stream
      // const liveStream = await createLiveStream();
      // Create Daily.co room
      // const dailyRoomUrl = await createDailyRoom(DAILY_API_KEY);
      const dailyRoomUrl = "https://lohapp.daily.co/wsjJ2oXbfEMbwsE1RxeH"
      const token = await getDailyRoomToken(dailyRoomUrl, DAILY_API_KEY, true);
      console.log("Room token:", token)

      // Initialize Daily.co call
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true
      });
      dailyCallRef.current = call;

      await call.join({
        url: dailyRoomUrl,
        token,
        subscribeToTracksAutomatically: true,
      });

      // For Web - would need different approach for mobile
      // if (Platform.OS === "web") {
      //   const stream = await call.startLiveStreaming();
      //   // Here you would send this stream to Mux via RTMP
      //   // This requires additional WebRTC to RTMP bridging
      //   console.log("Stream ready to send to Mux RTMP endpoint");
      // }

      // setStreamInfo({
      //   streamId: liveStream.id,
      //   playbackId: liveStream.playback_ids[0].id,
      //   streamKey: liveStream.stream_key,
      //   dailyRoomUrl,
      // });
      setStreamInfo({
        streamId: "dOFvIjvXuCOWYPjqoLz01CQLnVuLaH5s01beCpK1eByRc",
        playbackId: "j1INRv00CZEb73KQEPTJDNSJeT00wWbyr5NHjEvEJU66w",
        streamKey: "1879f18c-7272-6f52-bc74-19b969a3f19c",
        dailyRoomUrl,
      })
      setIsLive(true);
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const stopStreaming = async () => {
    try {
      if (dailyCallRef.current) {
        await dailyCallRef.current.leave();
      }

      if (streamInfo?.streamId) {
        await endLiveStream(streamInfo.streamId);
      }

      setIsLive(false);
      setStreamInfo(null);
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  return (
    <View style={styles.container}>
      {!isLive ? (
        <TouchableOpacity style={styles.button} onPress={startStreaming}>
          <Text style={styles.buttonText}>Go Live</Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* <DailyWebViewComponent roomUrl={streamInfo?.dailyRoomUrl} /> */}
          <View style={styles.streamStatus}>
            <Text style={styles.statusText}>LIVE</Text>
            <View style={styles.redDot} />
          </View>
          <TouchableOpacity style={styles.stopButton} onPress={stopStreaming}>
            <Text style={styles.buttonText}>End Stream</Text>
          </TouchableOpacity>
          {streamInfo && (
            <>
              <Text style={styles.streamInfo}>
                Playback URL: https://stream.mux.com/{streamInfo.playbackId}
                .m3u8
              </Text>
              <Text style={styles.streamInfo}>
                Daily.co Room: {streamInfo.dailyRoomUrl}
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  button: {
    backgroundColor: "#ff0000",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  streamStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "red",
  },
  streamInfo: {
    marginTop: 10,
    fontFamily: "monospace",
    fontSize: 12,
  },
});


export default StreamerScreen;
