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
  const { auth, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("conversations");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const onLogout = async () => {
    await CometChatUIKit.logout();
    logout();
  };

  return (
    <div
      className={`dashboard-layout ${sidebarOpen ? "" : "dashboard-layout--collapsed"}`}
    >
      {/* ─── Sidebar ─── */}
      <aside
        className={`dashboard-sidebar ${sidebarOpen ? "" : "dashboard-sidebar--collapsed"}`}
      >
        <div className="sidebar-top-row">
          {sidebarOpen && (
            <span className="sidebar-brand-text">BUDDYCONNECT</span>
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
              onClick={() => setActiveTab(key)}
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
        {activeTab === "users" && <UsersPanel refreshKey={refreshKey} />}
        {activeTab === "friend-requests" && (
          <FriendRequestsPanel
            onChanged={() => {
              setRefreshKey((key) => key + 1);
            }}
          />
        )}
        {activeTab === "conversations" && <ConversationsPanel />}
      </main>
    </div>
  );
}
