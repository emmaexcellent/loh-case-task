import React, { useEffect, useState, useRef } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import DailyIframe, { DailyCall, DailyEventObjectFatalError } from "@daily-co/react-native-daily-js";

const CALL_URL = "https://your-subdomain.daily.co/your-room-name";

export default function VideoCallScreen() {
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("user");
  const callFrameRef = useRef<DailyCall>(null);

  useEffect(() => {
    const joinCall = async () => {
      callFrameRef.current = DailyIframe.createCallObject();
      await callFrameRef.current.join({ url: CALL_URL });

      callFrameRef.current.on("error", handleError);
      callFrameRef.current.on("load-attempt-failed", handleDisconnect);
      callFrameRef.current.on("joined-meeting", handleReconnect);
    };

    joinCall();

    return () => {
      callFrameRef.current?.leave();
    };
  }, []);

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    callFrameRef.current?.setLocalAudio(!nextState);
  };

  const switchCamera = () => {
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    callFrameRef.current?.setCamera(nextFacing)
  };

  const handleError = (e: DailyEventObjectFatalError) => {
    console.log("Error:", e);
  };

  const handleDisconnect = () => {
    console.log("Disconnected. Attempting reconnect...");
  };

  const handleReconnect = () => {
    console.log("Reconnected");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Video Call</Text>

      {/* Daily iframe frame (native module) */}
      <View style={styles.callFrame} />

      <View style={styles.controls}>
        <Button title={isMuted ? "Unmute" : "Mute"} onPress={toggleMute} />
        <Button title="Switch Camera" onPress={switchCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  title: { color: "#fff", fontSize: 18, textAlign: "center", marginBottom: 10 },
  callFrame: { flex: 1, margin: 10 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 20,
  },
});
