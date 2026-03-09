import { useEffect, useMemo, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import {
  CometChatConversations,
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList,
} from "@cometchat/chat-uikit-react";
import { http } from "../api/http";
import { useCometChat } from "../hooks/useCometChat";

type MessageTarget = {
  user: CometChat.User;
};

export function ConversationsPanel() {
  const { ready, error } = useCometChat();
  const [target, setTarget] = useState<MessageTarget | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [friendUidSet, setFriendUidSet] = useState<Set<string>>(new Set());

  const conversationsRequestBuilder = useMemo(
    () =>
      new CometChat.ConversationsRequestBuilder()
        .setConversationType(CometChat.RECEIVER_TYPE.USER)
        .setLimit(50),
    [],
  );

  useEffect(() => {
    const loadFriendUids = async () => {
      try {
        const response =
          await http.get<Array<{ uid: string }>>("/users/friends");
        setFriendUidSet(new Set(response.data.map((friend) => friend.uid)));
      } catch {
        setPanelError("Failed to load friends.");
      }
    };

    void loadFriendUids();
  }, []);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!ready) {
    return <p className="text-sm text-slate-500">Connecting to CometChat...</p>;
  }

  const onConversationClick = (conversation: CometChat.Conversation) => {
    const withUser = conversation.getConversationWith();
    if (!(withUser instanceof CometChat.User)) {
      return;
    }

    setPanelError(null);

    if (!friendUidSet.has(withUser.getUid())) {
      setPanelError("Messaging is only allowed with friends.");
      return;
    }

    setTarget({
      user: withUser,
    });
  };

  return (
    <div className="conversations-panel-grid">
      <aside className="conversations-sidebar">
        <div className="px-3 pb-2 pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Active Conversations
          </h3>
        </div>
        <div className="conversations-list-wrapper">
          <CometChatConversations
            conversationsRequestBuilder={conversationsRequestBuilder}
            onItemClick={onConversationClick}
            showScrollbar
            hideGroupType
          />
        </div>
      </aside>

      <section className="conversations-chat-section">
        {target ? (
          <>
            <CometChatMessageHeader user={target.user} />
            <div className="conversations-message-list-wrapper">
              <CometChatMessageList user={target.user} showScrollbar />
            </div>
            <CometChatMessageComposer user={target.user} />
          </>
        ) : (
          <div className="grid h-full place-items-center p-6 text-sm text-slate-500">
            Select an active conversation to start messaging.
          </div>
        )}

        {panelError && (
          <div className="border-t border-slate-200 px-4 py-2 text-sm text-rose-600">
            {panelError}
          </div>
        )}
      </section>
    </div>
  );
}
