

const DAILY_API_KEY =
  "Ya60675c1fd1ba63cc4d5124a9076b2b4b9a210e0d4be0ebad31a15398f860776";
  
export const createDailyRoom = async (apiKey: string): Promise<string> => {
  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      properties: {
        enable_knocking: true,
        enable_prejoin_ui: false,
        enable_new_call_ui: true,
      },
    }),
  });

  const data = await response.json();
  console.log("Daily Room Created:", data)
  return data.url;
};

export const getDailyRoomToken = async (
  roomUrl: string,
  apiKey: string,
  isOwner: boolean
): Promise<string> => {
  const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomUrl.split("/").pop(),
        is_owner: isOwner,
      },
    }),
  });

  const data = await response.json();
  return data.token;
};
