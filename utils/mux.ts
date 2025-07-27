import axios from "axios";

const MUX_TOKEN_ID = "0b53beb3-1565-4875-9b5f-241d02f332fe";
const MUX_TOKEN_SECRET =
  "YKRYNDObiQvmH7mqwIccPReVmxZKTLWP3GBSgASREzPfByFE1ZWErCfoRR2qysXm3mAix0zOVth";


const muxApi = axios.create({
  baseURL: "https://api.mux.com",
  auth: {
    username: MUX_TOKEN_ID,
    password: MUX_TOKEN_SECRET,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LiveStream {
  id: string;
  stream_key: string;
  status: "active" | "idle";
  playback_ids: { id: string }[];
}

export const createLiveStream = async (): Promise<LiveStream> => {
  const response = await muxApi.post("/video/v1/live-streams", {
    playback_policy: "public",
    latency_mode: "low",
    reconnect_window: 30,
    new_asset_settings: {
      playback_policy: "public",
    },
  });
  return response.data.data;
};

export const getLiveStream = async (streamId: string): Promise<LiveStream> => {
  const response = await muxApi.get(`/video/v1/live-streams/${streamId}`);
  return response.data.data;
};

export const endLiveStream = async (streamId: string): Promise<void> => {
  await muxApi.delete(`/video/v1/live-streams/${streamId}`);
};

export const getViewerCount = async (playbackId: string): Promise<number> => {
  try {
    const response = await muxApi.get(
      `/data/v1/metrics/current-concurrent-viewers?filters[]=playback_id:${playbackId}`
    );
    return response.data.data.value || 0;
  } catch (error) {
    console.error("Error getting viewer count:", error);
    return 0;
  }
};