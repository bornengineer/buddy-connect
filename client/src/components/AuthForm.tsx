import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { AxiosError } from "axios";
import { http } from "../api/http";
import { useAuth } from "../hooks/useAuth";
import type { AuthResponse } from "../types/api";

type Mode = "login" | "register";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (mode === "register") {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        errs.name = "Name must be at least 2 characters.";
      } else if (EMAIL_RE.test(trimmed)) {
        errs.name = "Please enter a valid name, not an email address.";
      }
    }

    if (!EMAIL_RE.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login" ? { email, password } : { name, email, password };
      const response = await http.post<AuthResponse>(path, payload);
      login(response.data, mode === "register");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-[10px] border bg-white px-4 py-2.5 text-[15px] outline-none transition-colors focus:ring-1 ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
        : "border-[#e2e8f0] focus:border-[#5E54D4] focus:ring-[#5E54D4]"
    }`;

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
                setFieldErrors({});
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
                setFieldErrors({});
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
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name)
                      setFieldErrors((p) => ({ ...p, name: "" }));
                  }}
                  className={inputClass("name")}
                  placeholder="John Doe"
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-[12px] text-red-500">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email)
                    setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                className={inputClass("email")}
                placeholder="you@example.com"
                type="email"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-[12px] text-red-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((p) => ({ ...p, password: "" }));
                }}
                className={`${inputClass("password")} tracking-widest`}
                placeholder="••••••••"
                type="password"
                required
              />
              {fieldErrors.password && (
                <p className="mt-1 text-[12px] text-red-500">
                  {fieldErrors.password}
                </p>
              )}
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
