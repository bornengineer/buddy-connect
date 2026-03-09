import { useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../hooks/useAuth';
import type { AuthResponse } from '../types/api';

type Mode = 'login' | 'register';

export function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email, password } : { name, email, password };
      const response = await http.post<AuthResponse>(path, payload);
      login(response.data);
    } catch (err) {
      setError('Authentication failed. Verify credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl">
      <h1 className="text-2xl font-bold">Comet Social Messenger</h1>
      <p className="mt-1 text-sm text-slate-600">Friend-only social chat powered by CometChat.</p>

      <div className="mt-6 flex gap-2 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-white shadow' : ''}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === 'register' ? 'bg-white shadow' : ''}`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Full name"
            required
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Password"
          type="password"
          required
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-ink px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
