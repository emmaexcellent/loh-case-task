import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { VideoView } from "expo-video";
import { useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { uploadVideoToCloudinary } from "@/utils/cloudinary";
import { useRouter } from "expo-router";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

export default function CameraViewScreen() {
  const router = useRouter();
  // Camera state
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Recording state
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false)
  // const [uploadProgress, setUploadProgress] = useState(0)

  // Check camera permissions
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted) {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerInterval.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRecording]);

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  const startRecording = async () => {
    if (!isRecording && cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
        });

        if (video) {
          setVideoUri(video.uri);
        }
      } catch (error) {
        console.error("Error recording video:", error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const discardVideo = () => {
    setVideoUri(null);
    setShowPreview(false);
  };

  const handleVideoUpload = async () => {
    if(!videoUri) return;
    try {
      setIsUploading(true)  
      await uploadVideoToCloudinary(videoUri) 
      Alert.alert("Success", "Upload saved successfully!")   
      discardVideo()
      router.push("/")
    } catch (error) {
      console.log(error)
      Alert.alert("Error", "Upload failed");      
    } finally{
      setIsUploading(false)      
    }
  }

  // Video player setup
  const player = useVideoPlayer(videoUri || "", (player) => {
    player.play();
    player.loop = true;
  });

  if (!cameraPermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to access the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videoUri && showPreview) {
    return (
      <View style={styles.previewContainer}>
        <VideoView
          player={player}
          style={styles.videoPreview}
          contentFit="cover"
          allowsFullscreen
          showsTimecodes
        />

        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.uploadingText}>Saving...</Text>
          </View>
        )}

        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.previewButton} onPress={discardVideo}>
            <Ionicons name="trash-outline" size={30} color="white" />
            <Text style={styles.previewButtonText}>Discard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.previewButton}
            onPress={handleVideoUpload}
            disabled={isUploading}
          >
            <Ionicons name="save-outline" size={30} color="white" />
            <Text style={styles.previewButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.previewButton}
            onPress={togglePreview}
          >
            <Ionicons name="camera-outline" size={30} color="white" />
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
        mode="video"
        videoQuality="720p"
      />

      {/* Recording timer */}
      {isRecording && (
        <View style={styles.timerContainer}>
          <View style={styles.recordingDot} />
          <Text style={styles.timerText}>{formatTime(recordDuration)}</Text>
        </View>
      )}

      {/* Camera controls */}
      <View style={styles.controlsContainer}>
        <View>
          {!isRecording && (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => router.push("/livestream")}
            >
              <View>
                <Text className="text-white">Go Live</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.recordButton}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View
              style={[
                styles.recordButtonInner,
                isRecording && styles.recordingActive,
              ]}
            >
              {isRecording ? (
                <FontAwesome5 name="stop" size={24} color="white" />
              ) : (
                <FontAwesome5 name="video" size={24} color="white" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {videoUri && !isRecording && (
          <TouchableOpacity
            style={styles.previewThumbnail}
            onPress={togglePreview}
          >
            <VideoView
              player={player}
              style={styles.thumbnailVideo}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.flipButton}
          onPress={toggleCameraFacing}
        >
          <MaterialCommunityIcons
            name="camera-flip-outline"
            size={30}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  recordButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  recordButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  recordingActive: {
    backgroundColor: "red",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  flipButton: {
    position: "absolute",
    right: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 15,
    borderRadius: 30,
  },
  timerContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 8,
  },
  timerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  videoPreview: {
    flex: 1,
  },
  previewControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  previewButton: {
    alignItems: "center",
    padding: 15,
  },
  previewButtonText: {
    color: "white",
    marginTop: 5,
    fontSize: 14,
  },
  previewThumbnail: {
    position: "absolute",
    left: 30,
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "white",
  },
  thumbnailVideo: {
    width: "100%",
    height: "100%",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  uploadingText: {
    color: "white",
    marginTop: 15,
    fontSize: 18,
    fontWeight: "bold",
  },
});
