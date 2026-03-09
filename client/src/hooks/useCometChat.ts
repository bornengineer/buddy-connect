import { useCallback, useEffect, useRef, useState } from "react";
import {
  CometChatUIKit,
  UIKitSettingsBuilder,
} from "@cometchat/chat-uikit-react";
import { http } from "../api/http";
import { useAuth } from "./useAuth";

const appId = import.meta.env.VITE_COMETCHAT_APP_ID ?? "";
const region = import.meta.env.VITE_COMETCHAT_REGION ?? "";
const authKey = import.meta.env.VITE_COMETCHAT_AUTH_KEY ?? "";

let initialized = false;

export function useCometChat() {
  const { auth } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);

  const init = useCallback(async () => {
    if (!auth || running.current) {
      if (!auth) setReady(false);
      return;
    }

    running.current = true;

    try {
      setError(null);
      setReady(false);

      if (!initialized) {
        const settings = new UIKitSettingsBuilder()
          .setAppId(appId)
          .setRegion(region)
          .setAuthKey(authKey)
          .subscribePresenceForFriends()
          .build();
        await CometChatUIKit.init(settings);
        initialized = true;
      }

      const existing = await CometChatUIKit.getLoggedinUser();
      if (!existing || existing.getUid() !== auth.user.uid) {
        if (existing) {
          await CometChatUIKit.logout();
        }
        const tokenResponse = await http.get<{ authToken: string }>(
          "/chat/token",
        );
        await CometChatUIKit.loginWithAuthToken(tokenResponse.data.authToken);
      }
      setReady(true);
    } catch (err) {
      console.error(err);
      // If init failed, reset the flag so retry can re-init
      initialized = false;
      setError("Failed to initialize CometChat");
    } finally {
      running.current = false;
    }
  }, [auth]);

  useEffect(() => {
    init();
  }, [init, attempt]);

  const retry = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  return { ready, error, retry };
}
