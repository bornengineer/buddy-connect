import { env } from "../config/env.js";

const baseUrl = `https://${env.COMETCHAT_APP_ID}.api-${env.COMETCHAT_REGION}.cometchat.io/v3`;

type CometChatUser = {
  uid: string;
  name: string;
};

async function cometChatRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apiKey: env.COMETCHAT_REST_API_KEY,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(
      `CometChat API ${path} failed (${response.status}): ${raw}`,
    );
  }

  return (await response.json()) as T;
}

export async function ensureCometChatUser(user: CometChatUser): Promise<void> {
  try {
    await cometChatRequest("/users", {
      method: "POST",
      body: JSON.stringify({
        uid: user.uid,
        name: user.name,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ERR_UID_ALREADY_EXISTS")) {
      await cometChatRequest(`/users/${user.uid}`, {
        method: "PUT",
        body: JSON.stringify({ name: user.name }),
      });
      return;
    }
    throw error;
  }
}

export async function createCometChatAuthToken(uid: string): Promise<string> {
  const payload = await cometChatRequest<{
    data?:
      | {
          token?: string;
          authToken?: string;
        }
      | Array<{
          token?: string;
          authToken?: string;
        }>;
    token?: string;
    authToken?: string;
  }>(`/users/${uid}/auth_tokens`, {
    method: "POST",
  });

  const firstData = Array.isArray(payload.data)
    ? payload.data[0]
    : payload.data;
  const token =
    firstData?.authToken ??
    firstData?.token ??
    payload.authToken ??
    payload.token;
  if (!token) {
    throw new Error(
      `CometChat auth token not returned for uid=${uid}. Payload: ${JSON.stringify(payload)}`,
    );
  }

  return token;
}

export async function addFriendsBidirectional(
  uidA: string,
  uidB: string,
): Promise<void> {
  await Promise.all([
    cometChatRequest(`/users/${uidA}/friends`, {
      method: "POST",
      body: JSON.stringify({ accepted: [uidB] }),
    }),
    cometChatRequest(`/users/${uidB}/friends`, {
      method: "POST",
      body: JSON.stringify({ accepted: [uidA] }),
    }),
  ]);
}
