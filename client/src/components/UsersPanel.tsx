import { useEffect, useState } from "react";
import { Users, Search, MessageCircle, UserPlus } from "lucide-react";
import { AxiosError } from "axios";
import * as Avatar from "@radix-ui/react-avatar";
import { http } from "../api/http";
import type { User } from "../types/api";

type Props = {
  refreshKey: number;
  onMessageUser: (uid: string) => void;
  onGoToRequests: () => void;
};

function SkeletonCard() {
  return (
    <div className="user-card user-card--skeleton">
      <div className="user-card-top">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton skeleton-name" />
          <div className="skeleton skeleton-badge" />
        </div>
      </div>
      <div className="skeleton skeleton-btn" />
    </div>
  );
}

export function UsersPanel({
  refreshKey,
  onMessageUser,
  onGoToRequests,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await http.get<User[]>("/users");
      setUsers(response.data);
    } catch {
      setActionError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const sendRequest = async (userId: number) => {
    setActionError(null);
    setSendingTo(userId);
    try {
      await http.post("/friend-requests", { receiverId: userId });
      await load();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.error) {
        setActionError(err.response.data.error);
      } else {
        setActionError("Failed to send friend request. Please try again.");
      }
    } finally {
      setSendingTo(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="panel-page">
      {/* Page header */}
      <div className="panel-page-header">
        <div className="panel-page-header-icon">
          <Users size={24} />
        </div>
        <div>
          <h2 className="panel-page-title">Discover Users</h2>
          <p className="panel-page-subtitle">
            Find and connect with people on the platform.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="panel-error-banner">
          <p>{actionError}</p>
          <button onClick={() => setActionError(null)}>✕</button>
        </div>
      )}

      {/* Search bar */}
      <div className="search-bar">
        <Search size={16} className="search-bar-icon" />
        <input
          type="text"
          className="search-bar-input"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="user-cards-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel-empty-state">
          <Users size={40} strokeWidth={1.5} className="panel-empty-icon" />
          <p className="panel-empty-title">No users found</p>
          <p className="panel-empty-subtitle">
            {searchQuery
              ? "Try a different search term."
              : "There are no other users on the platform yet."}
          </p>
        </div>
      ) : (
        <div className="user-cards-grid">
          {filtered.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-top">
                <Avatar.Root className="user-card-avatar">
                  <Avatar.Fallback className="user-card-avatar-fallback">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div className="user-card-info">
                  <p className="user-card-name">{user.name}</p>
                  {user.is_friend ? (
                    <span className="user-card-badge user-card-badge--friend">
                      ✓ Friends
                    </span>
                  ) : user.request_sent ? (
                    <span className="user-card-badge user-card-badge--pending">
                      Requested
                    </span>
                  ) : user.request_received ? (
                    <span className="user-card-badge user-card-badge--received">
                      Sent you a request
                    </span>
                  ) : null}
                </div>
              </div>

              {user.is_friend ? (
                <button
                  className="user-card-action user-card-action--message"
                  onClick={() => onMessageUser(user.uid)}
                >
                  <MessageCircle size={14} />
                  Message
                </button>
              ) : user.request_sent ? (
                <button
                  className="user-card-action user-card-action--disabled"
                  disabled
                >
                  Pending
                </button>
              ) : user.request_received ? (
                <button
                  className="user-card-action user-card-action--add"
                  onClick={onGoToRequests}
                >
                  Check Requests
                </button>
              ) : (
                <button
                  className="user-card-action user-card-action--add"
                  onClick={() => sendRequest(user.id)}
                  disabled={sendingTo === user.id}
                >
                  <UserPlus size={14} />
                  {sendingTo === user.id ? "Sending..." : "Add Friend"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
