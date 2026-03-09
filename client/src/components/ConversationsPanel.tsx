import { useCallback, useEffect, useMemo, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList
} from '@cometchat/chat-uikit-react';
import { http } from '../api/http';
import { useCometChat } from '../hooks/useCometChat';
import type { User } from '../types/api';

export function ConversationsPanel() {
  const { ready, error } = useCometChat();
  const [selectedUser, setSelectedUser] = useState<CometChat.User | undefined>();
  const [friends, setFriends] = useState<User[]>([]);
  const [activeConversations, setActiveConversations] = useState<CometChat.Conversation[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [panelError, setPanelError] = useState<string | null>(null);

  const friendMap = useMemo(() => new Map(friends.map((friend) => [friend.uid, friend])), [friends]);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    setPanelError(null);
    try {
      const response = await http.get<User[]>('/users/friends');
      setFriends(response.data);
    } catch {
      setPanelError('Failed to load friends.');
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (!ready) {
      return;
    }

    setLoadingConversations(true);
    try {
      const request = new CometChat.ConversationsRequestBuilder()
        .setConversationType(CometChat.RECEIVER_TYPE.USER)
        .setLimit(50)
        .build();

      const allConversations = await request.fetchNext();
      const friendUidSet = new Set(friends.map((friend) => friend.uid));
      const allowedConversations = allConversations.filter((conversation) => {
        const withUser = conversation.getConversationWith();
        if (!(withUser instanceof CometChat.User)) {
          return false;
        }
        return friendUidSet.has(withUser.getUid());
      });

      setActiveConversations(allowedConversations);
    } catch {
      setPanelError('Failed to load conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }, [friends, ready]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!ready) {
    return <p className="text-sm text-slate-500">Connecting to CometChat...</p>;
  }

  const selectFriend = async (friend: User) => {
    try {
      const response = await http.get<{ allowed: boolean }>(`/chat/can-message/${friend.id}`);
      if (!response.data.allowed) {
        setPanelError('This user is no longer available for messaging.');
        await loadFriends();
        await loadConversations();
        return;
      }
    } catch {
      setPanelError('Failed to verify messaging permissions.');
      return;
    }

    const user = new CometChat.User(friend.uid);
    user.setName(friend.name);
    setSelectedUser(user);
  };

  const formatLastMessage = (conversation: CometChat.Conversation): string => {
    const lastMessage = conversation.getLastMessage() as
      | (CometChat.BaseMessage & { getText?: () => string; type?: string })
      | undefined;

    if (!lastMessage) {
      return 'No messages yet';
    }

    if (typeof lastMessage.getText === 'function') {
      const text = lastMessage.getText().trim();
      return text.length > 0 ? text : 'Sent a message';
    }

    if ((lastMessage as { type?: string }).type === 'image') {
      return 'Sent an image';
    }

    if ((lastMessage as { type?: string }).type === 'video') {
      return 'Sent a video';
    }

    if ((lastMessage as { type?: string }).type === 'audio') {
      return 'Sent an audio message';
    }

    if ((lastMessage as { type?: string }).type === 'file') {
      return 'Sent a file';
    }

    return 'Sent a message';
  };

  return (
    <div className="grid h-[72vh] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[320px_1fr]">
      <div className="border-r border-slate-200">
        <div className="h-full overflow-y-auto p-3">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Active Conversations</h3>
          {loadingConversations && <p className="mb-3 text-sm text-slate-500">Loading conversations...</p>}
          {!loadingConversations && activeConversations.length === 0 && (
            <p className="mb-3 text-sm text-slate-500">No active conversations yet.</p>
          )}
          <div className="mb-4 space-y-2">
            {activeConversations.map((conversation) => {
              const withUser = conversation.getConversationWith();
              if (!(withUser instanceof CometChat.User)) {
                return null;
              }

              const friend = friendMap.get(withUser.getUid());
              if (!friend) {
                return null;
              }

              const selected = selectedUser?.getUid() === friend.uid;
              return (
                <button
                  key={conversation.getConversationId()}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                  onClick={() => selectFriend(friend)}
                >
                  <p className="font-semibold">{friend.name}</p>
                  <p className={`truncate text-xs ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
                    {formatLastMessage(conversation)}
                  </p>
                </button>
              );
            })}
          </div>

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Friends</h3>
          {loadingFriends && <p className="text-sm text-slate-500">Loading friends...</p>}
          {!loadingFriends && friends.length === 0 && (
            <p className="text-sm text-slate-500">No friends yet. Accept a friend request to chat.</p>
          )}
          {panelError && <p className="mb-2 text-sm text-rose-600">{panelError}</p>}
          <div className="space-y-2">
            {friends.map((friend) => (
              <button
                key={friend.id}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedUser?.getUid() === friend.uid ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
                onClick={() => selectFriend(friend)}
              >
                <p className="font-semibold">{friend.name}</p>
                <p className={`text-xs ${selectedUser?.getUid() === friend.uid ? 'text-slate-200' : 'text-slate-500'}`}>
                  {friend.email}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col">
        {selectedUser ? (
          <>
            <CometChatMessageHeader user={selectedUser} />
            <CometChatMessageList user={selectedUser} />
            <CometChatMessageComposer user={selectedUser} />
          </>
        ) : (
          <div className="grid h-full place-items-center p-6 text-sm text-slate-500">
            Select a conversation to start messaging your friend.
          </div>
        )}
      </div>
    </div>
  );
}
