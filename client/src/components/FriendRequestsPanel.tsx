import { useEffect, useMemo, useRef, useState } from "react";
import { UserPlus, MailOpen, Check, X } from "lucide-react";
import * as Avatar from "@radix-ui/react-avatar";
import { http } from "../api/http";
import type { IncomingFriendRequest } from "../types/api";

type Props = {
  onChanged: () => void;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function SkeletonRequestCard() {
  return (
    <div className="request-card request-card--skeleton">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-lines" style={{ flex: 1 }}>
        <div className="skeleton skeleton-name" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-btn-sm" />
      <div className="skeleton skeleton-btn-sm" />
    </div>
  );
}

export function FriendRequestsPanel({ onChanged }: Props) {
  const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const retryTimer = useRef<number | null>(null);

  const token = useMemo(() => {
    const raw = localStorage.getItem("comet-social-auth");
    if (!raw) {
      return null;
    }
    try {
      return (JSON.parse(raw) as { token: string }).token;
    } catch {
      return null;
    }
  }, []);

  const load = async () => {
    setLoading(true);
    const response = await http.get<IncomingFriendRequest[]>(
      "/friend-requests/incoming",
    );
    setRequests(response.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const stream = new EventSource(
      `${API_URL}/api/friend-requests/stream?token=${token}`,
    );
    const refresh = () => load();

    stream.addEventListener("friend_request_received", refresh);
    stream.addEventListener("friendship_updated", refresh);
    stream.addEventListener("connected", () => undefined);

    stream.onerror = () => {
      stream.close();
      retryTimer.current = window.setTimeout(() => {
        load();
      }, 1500);
    };

    return () => {
      stream.removeEventListener("friend_request_received", refresh);
      stream.removeEventListener("friendship_updated", refresh);
      stream.close();
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
      }
    };
  }, [token]);

  const respond = async (id: number, action: "accept" | "reject") => {
    await http.patch(`/friend-requests/${id}`, { action });
    await load();
    onChanged();
  };

  return (
    <div className="panel-page">
      {/* Page header */}
      <div className="panel-page-header">
        <div className="panel-page-header-icon">
          <UserPlus size={24} />
        </div>
        <div>
          <h2 className="panel-page-title">Friend Requests</h2>
          <p className="panel-page-subtitle">
            Manage your incoming friend requests.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="request-cards-list">
          <SkeletonRequestCard />
          <SkeletonRequestCard />
          <SkeletonRequestCard />
        </div>
      ) : requests.length === 0 ? (
        <div className="panel-empty-state">
          <MailOpen size={40} strokeWidth={1.5} className="panel-empty-icon" />
          <p className="panel-empty-title">No pending requests</p>
          <p className="panel-empty-subtitle">
            When someone sends you a friend request, it will appear here.
          </p>
        </div>
      ) : (
        <div className="request-cards-list">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <Avatar.Root className="user-card-avatar">
                <Avatar.Fallback className="user-card-avatar-fallback">
                  {request.sender_name?.charAt(0)?.toUpperCase() || "?"}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="request-card-info">
                <p className="request-card-name">{request.sender_name}</p>
                <p className="request-card-email">{request.sender_email}</p>
              </div>
              <div className="request-card-actions">
                <button
                  className="request-action-btn request-action-btn--accept"
                  onClick={() => respond(request.id, "accept")}
                  title="Accept"
                >
                  <Check size={16} />
                  Accept
                </button>
                <button
                  className="request-action-btn request-action-btn--reject"
                  onClick={() => respond(request.id, "reject")}
                  title="Reject"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
