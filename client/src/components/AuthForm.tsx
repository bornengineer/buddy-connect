import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { http } from "../api/http";
import { useAuth } from "../hooks/useAuth";
import type { AuthResponse } from "../types/api";

type Mode = "login" | "register";

export function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login" ? { email, password } : { name, email, password };
      const response = await http.post<AuthResponse>(path, payload);
      login(response.data);
    } catch (err) {
      setError("Authentication failed. Verify credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden items-center justify-center bg-[#f8f9fb] p-4 text-slate-900 font-sans">
      <div className="w-full min-w-[440px]">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5E54D4] shadow-sm">
            <MessageCircle size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="mb-2 text-[28px] font-bold tracking-tight text-[#0f172a]">
            BuddyConnect
          </h1>
          <p className="text-[15px] text-[#64748b]">
            Chat with your friends, securely.
          </p>
          <p className="text-[13px] font-medium text-[#94a3b8] mt-1">
            Powered by CometChat
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-[#f1f5f9] p-1.5">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-[14px] font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-[14px] font-semibold transition-all ${
                mode === "register"
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-[#5E54D4] focus:ring-1 focus:ring-[#5E54D4]"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-[#5E54D4] focus:ring-1 focus:ring-[#5E54D4]"
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-2.5 text-[15px] tracking-widest outline-none transition-colors focus:border-[#5E54D4] focus:ring-1 focus:ring-[#5E54D4]"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>

            {error && (
              <p className="text-[13px] font-medium text-red-500">{error}</p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-[10px] bg-[#5E54D4] py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
