import { useEffect, useMemo, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import {
  CometChatConversations,
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList,
} from "@cometchat/chat-uikit-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import { UserPlus, X, MessageCircle, RefreshCw } from "lucide-react";
import { http } from "../api/http";
import { useCometChat } from "../hooks/useCometChat";

type MessageTarget = {
  user: CometChat.User;
};

type Friend = {
  id: number;
  uid: string;
  name: string;
  email: string;
};

export function ConversationsPanel() {
  const { ready, error, retry } = useCometChat();
  const [target, setTarget] = useState<MessageTarget | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [friendUidSet, setFriendUidSet] = useState<Set<string>>(new Set());

  // New Chat dialog state
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

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

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const response = await http.get<Friend[]>("/users/friends");
      setFriends(response.data);
    } catch {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const startChatWithFriend = async (uid: string) => {
    try {
      const user = await CometChat.getUser(uid);
      setTarget({ user });
      setNewChatOpen(false);
      setPanelError(null);
    } catch {
      setPanelError("Could not start chat with this user.");
    }
  };

  // ─── Error / Retry ───
  if (error) {
    return (
      <div className="cometchat-error-card">
        <RefreshCw size={32} className="cometchat-error-icon" />
        <p className="cometchat-error-text">{error}</p>
        <button className="cometchat-retry-btn" onClick={retry}>
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="cometchat-loading">
        <div className="cometchat-loading-spinner" />
        <p>Connecting to CometChat...</p>
      </div>
    );
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
        {/* Header: "Chats" + New Chat button */}
        <div className="conversations-header">
          <h3 className="conversations-header-title">Chats</h3>
          <Dialog.Root
            open={newChatOpen}
            onOpenChange={(open) => {
              setNewChatOpen(open);
              if (open) fetchFriends();
            }}
          >
            <Dialog.Trigger asChild>
              <button className="new-chat-btn" title="New Chat">
                <UserPlus size={18} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="dialog-content">
                <div className="dialog-header">
                  <Dialog.Title className="dialog-title">
                    Start a new chat
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="dialog-close-btn">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="dialog-body">
                  {friendsLoading ? (
                    <p className="dialog-empty">Loading friends...</p>
                  ) : friends.length === 0 ? (
                    <p className="dialog-empty">
                      No friends yet. Add friends first!
                    </p>
                  ) : (
                    <div className="dialog-friends-list">
                      {friends.map((f) => (
                        <button
                          key={f.id}
                          className="dialog-friend-item"
                          onClick={() => startChatWithFriend(f.uid)}
                        >
                          <Avatar.Root className="friend-avatar">
                            <Avatar.Fallback className="friend-avatar-fallback">
                              {f.name?.charAt(0)?.toUpperCase() || "?"}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <span className="friend-name">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Conversations list */}
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
          <div className="conversations-empty-state">
            <MessageCircle
              size={48}
              strokeWidth={1.5}
              className="conversations-empty-icon"
            />
            <p className="conversations-empty-title">Select a conversation</p>
            <p className="conversations-empty-subtitle">
              Choose a friend to start chatting
            </p>
          </div>
        )}

        {panelError && (
          <div className="conversations-error-bar">{panelError}</div>
        )}
      </section>
    </div>
  );
}
