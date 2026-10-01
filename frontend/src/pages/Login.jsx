import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor, canOpen } from "../roles";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  // Go back to the page they asked for if their role may open it, otherwise to their own dashboard
  const destinationFor = (u) => (from && canOpen(u.role, from) ? from : homeFor(u.role));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already logged in -> go straight to the dashboard
  if (!loading && user) return <Navigate to={destinationFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await login(email.trim(), password);
      navigate(destinationFor(data), { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#FFFBF5] min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-lg border p-8">
        <h1 className="font-serif text-3xl text-[#1F3B2D] text-center">Staff Login</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Staff sign in (Super Admin, Manager and other departments)</p>

        {error && (
          <div role="alert" className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <label className="block mt-6 text-sm font-semibold text-[#1F3B2D]" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8893C]"
        />

        <label className="block mt-4 text-sm font-semibold text-[#1F3B2D]" htmlFor="password">Password</label>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full border rounded-lg px-4 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8893C]"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#B8893C]"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full mt-6 py-3 rounded-full bg-[#1F3B2D] text-white text-sm font-bold hover:bg-[#2b5240] disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
