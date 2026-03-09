import { useEffect, useState } from 'react';
import { http } from '../api/http';
import type { User } from '../types/api';

type Props = {
  refreshKey: number;
};

export function UsersPanel({ refreshKey }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const response = await http.get<User[]>('/users');
    setUsers(response.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const sendRequest = async (userId: number) => {
    await http.post('/friend-requests', { receiverId: userId });
    await load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading users...</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            {user.is_friend ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Friends</span>
            ) : user.request_sent ? (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Requested</span>
            ) : user.request_received ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Sent you a request</span>
            ) : (
              <button className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white" onClick={() => sendRequest(user.id)}>
                Add Friend
              </button>
            )}
          </div>
        </div>
      ))}
      {users.length === 0 && <p className="text-sm text-slate-500">No users found.</p>}
    </div>
  );
}
