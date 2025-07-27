import * as FileSystem from "expo-file-system";
import axios from "axios";

const CLOUD_NAME = "dno2nlhon";
const UPLOAD_PRESET = "loh-app";
const API_KEY = "552229876132941";
const API_SECRET = "BWJfzXPgpzLgXI28nV_DHwrHqxk";

export const uploadVideoToCloudinary = async (uri: string) => {
  try {
    // 1. Read the video file
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // 2. Prepare form data
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: `video_${Date.now()}.mp4`,
      type: "video/mp4",
    } as any);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("resource_type", "video");
    let uploadProgressLoaded = 0

    // 3. Upload to Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progress) => {
          uploadProgressLoaded = Math.round((progress.loaded * 100) / progress.total!)
        },
      }
    );

    // 4. Return the HLS URL (Cloudinary auto-generates this)
    return {
      uploadProgressLoaded,
      originalUrl: response.data.secure_url,
      hlsUrl: response.data.secure_url.replace(".mp4", ".m3u8"), // Cloudinary auto-converts
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const fetchVideosFromCloudinary = async (nextCursor?: string) => {
  console.log("fetching videos....")
  try {
    const response = await axios.get(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/video`,
      {
        params: {
          max_results: 10,
          next_cursor: nextCursor, // For pagination
        },
        auth: {
          username: API_KEY,
          password: API_SECRET,
        },
      }
    );
    return {
      videos: response.data.resources.map(
        (resource: any) => resource.secure_url.replace(".mov", ".m3u8")
      ),
      nextCursor: response.data.next_cursor,
    };
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
};
