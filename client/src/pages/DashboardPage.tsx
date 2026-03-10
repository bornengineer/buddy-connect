import { useState } from "react";
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

const NAV_ITEMS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "users", label: "Discover Users", icon: Users },
  { key: "friend-requests", label: "Friend Requests", icon: UserPlus },
  { key: "conversations", label: "Conversations", icon: MessageCircle },
];

export function DashboardPage() {
  const { auth, logout, isNewUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(
    isNewUser ? "users" : "conversations",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messageTargetUid, setMessageTargetUid] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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
  };

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
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                // Close sidebar on mobile after selecting
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`sidebar-nav-item ${activeTab === key ? "sidebar-nav-item--active" : ""}`}
              title={sidebarOpen ? undefined : label}
            >
              <Icon size={18} strokeWidth={2} />
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
