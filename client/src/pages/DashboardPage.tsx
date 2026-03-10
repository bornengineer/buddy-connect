import { useEffect, useMemo, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUIKit } from "@cometchat/chat-uikit-react";
import {
  Users,
  UserPlus,
  MessageCircle,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { FriendRequestsPanel } from "../components/FriendRequestsPanel";
import { UsersPanel } from "../components/UsersPanel";
import { ConversationsPanel } from "../components/ConversationsPanel";
import { useAuth } from "../hooks/useAuth";

type Tab = "users" | "friend-requests" | "conversations";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function DashboardPage() {
  const { auth, logout, isNewUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(
    isNewUser ? "users" : "conversations",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messageTargetUid, setMessageTargetUid] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Badge counts ───
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const retryTimer = useRef<number | null>(null);

  // ─── SSE for friend requests ───
  const token = useMemo(() => {
    const raw = localStorage.getItem("comet-social-auth");
    if (!raw) return null;
    try {
      return (JSON.parse(raw) as { token: string }).token;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const stream = new EventSource(
      `${API_URL}/api/friend-requests/stream?token=${token}`,
    );

    stream.addEventListener("friend_request_received", () => {
      if (activeTab !== "friend-requests") {
        setUnreadRequests((c) => c + 1);
      }
      // Refresh UsersPanel to show "Sent you a request" badge
      setRefreshKey((k) => k + 1);
    });

    stream.addEventListener("friend_request_accepted", () => {
      // Sent request was accepted → refresh UsersPanel to show "Friends" badge
      setRefreshKey((k) => k + 1);
    });

    stream.addEventListener("friendship_updated", () => {
      // Friendship changed → refresh UsersPanel
      setRefreshKey((k) => k + 1);
    });

    stream.addEventListener("friend_request_rejected", () => {
      // Sent request was rejected → refresh UsersPanel to remove "Pending" badge
      setRefreshKey((k) => k + 1);
    });

    stream.addEventListener("connected", () => undefined);

    stream.onerror = () => {
      stream.close();
      retryTimer.current = window.setTimeout(() => {
        // Will re-establish on next render via useEffect deps
      }, 3000);
    };

    return () => {
      stream.close();
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
      }
    };
  }, [token, activeTab]);

  // ─── CometChat message listener for unread badge ───
  useEffect(() => {
    const listenerId = "dashboard_message_listener";

    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: () => {
          if (activeTab !== "conversations") {
            setUnreadMessages((c) => c + 1);
          }
        },
        onMediaMessageReceived: () => {
          if (activeTab !== "conversations") {
            setUnreadMessages((c) => c + 1);
          }
        },
        onCustomMessageReceived: () => {
          if (activeTab !== "conversations") {
            setUnreadMessages((c) => c + 1);
          }
        },
      }),
    );

    return () => {
      CometChat.removeMessageListener(listenerId);
    };
  }, [activeTab]);

  // ─── Clear badges when switching tabs ───
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "friend-requests") setUnreadRequests(0);
    if (tab === "conversations") setUnreadMessages(0);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const onLogout = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      await CometChatUIKit.logout();
    } catch {
      // SDK may throw if auth token was already cleared (e.g. HMR) — safe to ignore
    }
    logout();
  };

  const handleMessageUser = (uid: string) => {
    setMessageTargetUid(uid);
    setActiveTab("conversations");
    setUnreadMessages(0);
  };

  // ─── Nav items with badge counts ───
  const NAV_ITEMS: {
    key: Tab;
    label: string;
    icon: typeof Users;
    badge: number;
  }[] = [
    { key: "users", label: "Discover Users", icon: Users, badge: 0 },
    {
      key: "friend-requests",
      label: "Friend Requests",
      icon: UserPlus,
      badge: unreadRequests,
    },
    {
      key: "conversations",
      label: "Conversations",
      icon: MessageCircle,
      badge: unreadMessages,
    },
  ];

  return (
    <div
      className={`dashboard-layout ${sidebarOpen ? "" : "dashboard-layout--collapsed"}`}
    >
      {/* ─── Mobile header ─── */}
      <header className="mobile-header">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <span className="sidebar-brand-text">BUDDYCONNECT</span>
      </header>

      {/* ─── Sidebar ─── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`dashboard-sidebar ${sidebarOpen ? "" : "dashboard-sidebar--collapsed"}`}
      >
        <div className="sidebar-top-row">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-6" />
              <span className="sidebar-brand-text">BUDDYCONNECT</span>
            </div>
          )}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeft size={18} />
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`sidebar-nav-item ${activeTab === key ? "sidebar-nav-item--active" : ""}`}
              title={sidebarOpen ? undefined : label}
            >
              <div className="sidebar-nav-icon-wrap">
                <Icon size={18} strokeWidth={2} />
                {badge > 0 && (
                  <span className="sidebar-badge">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {auth?.user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          {sidebarOpen && (
            <span className="sidebar-user-name">{auth?.user.name}</span>
          )}
          <button
            className="sidebar-logout-btn"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="dashboard-main">
        {activeTab === "users" && (
          <UsersPanel
            refreshKey={refreshKey}
            onMessageUser={handleMessageUser}
            onGoToRequests={() => {
              setActiveTab("friend-requests");
              setUnreadRequests(0);
            }}
          />
        )}
        {activeTab === "friend-requests" && (
          <FriendRequestsPanel
            onChanged={() => {
              setRefreshKey((key) => key + 1);
            }}
          />
        )}
        {activeTab === "conversations" && !loggingOut && (
          <ConversationsPanel
            initialChatUid={messageTargetUid}
            onChatOpened={() => setMessageTargetUid(null)}
          />
        )}
      </main>
    </div>
  );
}
