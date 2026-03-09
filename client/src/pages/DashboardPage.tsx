import { useState } from 'react';
import { CometChatUIKit } from '@cometchat/chat-uikit-react';
import { FriendRequestsPanel } from '../components/FriendRequestsPanel';
import { UsersPanel } from '../components/UsersPanel';
import { ConversationsPanel } from '../components/ConversationsPanel';
import { useAuth } from '../hooks/useAuth';

type Tab = 'users' | 'friend-requests' | 'conversations';

export function DashboardPage() {
  const { auth, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [refreshKey, setRefreshKey] = useState(0);

  const onLogout = async () => {
    await CometChatUIKit.logout();
    logout();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <header className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Friend-Only Messaging App</h1>
            <p className="text-sm text-slate-600">Signed in as {auth?.user.name}</p>
          </div>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {(['users', 'friend-requests', 'conversations'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab ? 'bg-ink text-white' : 'bg-white text-slate-700'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm">
        {activeTab === 'users' && <UsersPanel refreshKey={refreshKey} />}
        {activeTab === 'friend-requests' && (
          <FriendRequestsPanel
            onChanged={() => {
              setRefreshKey((key) => key + 1);
            }}
          />
        )}
        {activeTab === 'conversations' && <ConversationsPanel />}
      </section>
    </main>
  );
}
