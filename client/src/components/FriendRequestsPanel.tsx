import { useEffect, useMemo, useRef, useState } from 'react';
import { http } from '../api/http';
import type { IncomingFriendRequest } from '../types/api';

type Props = {
  onChanged: () => void;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export function FriendRequestsPanel({ onChanged }: Props) {
  const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const retryTimer = useRef<number | null>(null);

  const token = useMemo(() => {
    const raw = localStorage.getItem('comet-social-auth');
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
    const response = await http.get<IncomingFriendRequest[]>('/friend-requests/incoming');
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

    const stream = new EventSource(`${API_URL}/api/friend-requests/stream?token=${token}`);
    const refresh = () => load();

    stream.addEventListener('friend_request_received', refresh);
    stream.addEventListener('friendship_updated', refresh);
    stream.addEventListener('connected', () => undefined);

    stream.onerror = () => {
      stream.close();
      retryTimer.current = window.setTimeout(() => {
        load();
      }, 1500);
    };

    return () => {
      stream.removeEventListener('friend_request_received', refresh);
      stream.removeEventListener('friendship_updated', refresh);
      stream.close();
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
      }
    };
  }, [token]);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    await http.patch(`/friend-requests/${id}`, { action });
    await load();
    onChanged();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading requests...</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{request.sender_name}</p>
              <p className="text-sm text-slate-500">{request.sender_email}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white" onClick={() => respond(request.id, 'accept')}>
                Accept
              </button>
              <button className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => respond(request.id, 'reject')}>
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
      {requests.length === 0 && <p className="text-sm text-slate-500">No pending friend requests.</p>}
    </div>
  );
}
